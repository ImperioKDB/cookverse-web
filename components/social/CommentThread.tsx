'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ErrorMessage } from '@/components/ui/error-message';
import { CommentRowSkeleton } from '@/components/ui/skeleton';
import { relativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  author: { username: string; avatar_url: string | null } | null;
  replies: Comment[];
}

interface CommentThreadProps {
  commentableType: 'recipe' | 'video' | 'post';
  commentableId: string;
}

export function CommentThread({ commentableType, commentableId }: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  async function loadComments() {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        commentable_type: commentableType,
        commentable_id: commentableId,
      });
      const data = await apiFetch<{ comments: Comment[] }>(`/v1/social/comments?${params.toString()}`);
      setComments(data.comments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load comments');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentableType, commentableId]);

  async function postComment(body: string, parentCommentId?: string) {
    if (!body.trim() || isPosting) return;
    setIsPosting(true);
    setError(null);
    try {
      await apiFetch('/v1/social/comments', {
        method: 'POST',
        body: JSON.stringify({
          commentable_type: commentableType,
          commentable_id: commentableId,
          parent_comment_id: parentCommentId,
          body,
        }),
      });
      setNewComment('');
      setReplyBody('');
      setReplyingTo(null);
      await loadComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post — try again');
    } finally {
      setIsPosting(false);
    }
  }

  async function deleteComment(id: string) {
    try {
      await apiFetch(`/v1/social/comments/${id}`, { method: 'DELETE' });
      await loadComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete');
    }
  }

  return (
    <div className="mt-6">
      <h2 className="font-display text-xl">Comments</h2>

      <CommentComposer
        value={newComment}
        onChange={setNewComment}
        onSubmit={() => postComment(newComment)}
        isPosting={isPosting}
        placeholder="Add a comment..."
        submitLabel="Post"
        className="mt-3"
      />

      <ErrorMessage className="mt-2">{error}</ErrorMessage>

      {isLoading && (
        <ul className="mt-4 space-y-4" aria-busy="true" aria-label="Loading comments">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i}>
              <CommentRowSkeleton />
            </li>
          ))}
        </ul>
      )}

      {!isLoading && comments.length === 0 && (
        <p className="mt-4 text-sm text-[#241E1A]/60 dark:text-flour/60">
          No comments yet — be the first to say something.
        </p>
      )}

      <ul className="mt-4 space-y-4">
        {comments.map((comment) => (
          <li key={comment.id}>
            <CommentRow
              comment={comment}
              currentUserId={currentUserId}
              onDelete={() => deleteComment(comment.id)}
              onReply={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            />

            {replyingTo === comment.id && (
              <div className="mt-2 ml-8">
                <CommentComposer
                  value={replyBody}
                  onChange={setReplyBody}
                  onSubmit={() => postComment(replyBody, comment.id)}
                  isPosting={isPosting}
                  placeholder={`Reply to @${comment.author?.username ?? 'them'}...`}
                  submitLabel="Reply"
                  autoFocus
                />
              </div>
            )}

            {comment.replies.length > 0 && (
              <ul className="ml-8 mt-2 space-y-2 border-l border-copper/20 pl-4">
                {comment.replies.map((reply) => (
                  <li key={reply.id}>
                    <CommentRow
                      comment={reply}
                      currentUserId={currentUserId}
                      onDelete={() => deleteComment(reply.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CommentComposer({
  value,
  onChange,
  onSubmit,
  isPosting,
  placeholder,
  submitLabel,
  autoFocus,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isPosting: boolean;
  placeholder: string;
  submitLabel: string;
  autoFocus?: boolean;
  className?: string;
}) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Comments are short-form but occasionally multi-line, so this is a
    // textarea rather than a single-line input — Enter submits (matching
    // what a single-line input would have done), Shift+Enter adds a line.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className={cn('flex gap-2', className)}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isPosting}
        autoFocus={autoFocus}
        rows={1}
        className="flex-1 resize-none rounded-sm border border-copper/30 bg-transparent px-3 py-2 text-sm disabled:opacity-60"
      />
      <Button size="sm" isLoading={isPosting} onClick={onSubmit}>
        {submitLabel}
      </Button>
    </div>
  );
}

function CommentRow({
  comment,
  currentUserId,
  onDelete,
  onReply,
}: {
  comment: Comment;
  currentUserId: string | null;
  onDelete: () => void;
  onReply?: () => void;
}) {
  return (
    <div className="text-sm">
      <div className="flex items-baseline gap-2">
        <span className="font-medium">@{comment.author?.username ?? 'unknown'}</span>
        <span className="font-mono text-xs text-[#241E1A]/50 dark:text-flour/50">
          {relativeTime(comment.created_at)}
        </span>
      </div>
      <p className="mt-0.5">{comment.body}</p>
      <div className="mt-1 flex gap-3 text-xs">
        {onReply && (
          <button onClick={onReply} className="text-[#241E1A]/60 dark:text-flour/60">
            Reply
          </button>
        )}
        {currentUserId === comment.author_id && (
          <button onClick={onDelete} className="text-chili">
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
