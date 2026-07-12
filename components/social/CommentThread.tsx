'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

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
    if (!body.trim()) return;
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

      <div className="mt-3 flex gap-2">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 rounded-sm border border-copper/30 bg-transparent px-3 py-2 text-sm"
        />
        <Button size="sm" isLoading={isPosting} onClick={() => postComment(newComment)}>
          Post
        </Button>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-chili">
          {error}
        </p>
      )}

      {isLoading && <p className="mt-4 text-sm">Loading comments…</p>}

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
              <div className="mt-2 ml-8 flex gap-2">
                <input
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder={`Reply to @${comment.author?.username ?? 'them'}...`}
                  className="flex-1 rounded-sm border border-copper/30 bg-transparent px-3 py-2 text-sm"
                />
                <Button size="sm" isLoading={isPosting} onClick={() => postComment(replyBody, comment.id)}>
                  Reply
                </Button>
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
          {new Date(comment.created_at).toLocaleDateString()}
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
