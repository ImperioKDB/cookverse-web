'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ErrorMessage } from '@/components/ui/error-message';
import { relativeTime } from '@/lib/format';

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
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; avatar_url: string | null } | null>(
    null
  );

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (!data.user) return;
        apiFetch<{ username: string; avatar_url: string | null }>('/v1/profiles/me')
          .then((profile) => setCurrentUser({ id: data.user!.id, ...profile }))
          .catch(() => setCurrentUser({ id: data.user!.id, username: 'you', avatar_url: null }));
      });
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
    if (!body.trim() || !currentUser) return;

    // Optimistic: show the comment immediately with a temporary id, swap in
    // the real one on success, remove it if the request actually fails —
    // no more "post and wait for a full reload" round trip.
    const tempId = `temp-${Date.now()}`;
    const optimisticComment: Comment = {
      id: tempId,
      author_id: currentUser.id,
      body,
      created_at: new Date().toISOString(),
      author: { username: currentUser.username, avatar_url: currentUser.avatar_url },
      replies: [],
    };

    if (parentCommentId) {
      setComments((current) =>
        current.map((c) =>
          c.id === parentCommentId ? { ...c, replies: [...c.replies, optimisticComment] } : c
        )
      );
    } else {
      setComments((current) => [optimisticComment, ...current]);
    }

    setNewComment('');
    setReplyBody('');
    setReplyingTo(null);
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
      await loadComments(); // reconcile temp id / ordering with the server's real state
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post — try again');
      // Roll back the optimistic insert.
      setComments((current) =>
        current
          .filter((c) => c.id !== tempId)
          .map((c) => ({ ...c, replies: c.replies.filter((r) => r.id !== tempId) }))
      );
    }
  }

  async function deleteComment(id: string, parentId?: string) {
    // Optimistic removal, restored on failure by just re-fetching — deletes
    // are rare enough that a full reload-on-failure is simpler than hand
    // -rolling the exact row back into state.
    const previous = comments;
    if (parentId) {
      setComments((current) =>
        current.map((c) => (c.id === parentId ? { ...c, replies: c.replies.filter((r) => r.id !== id) } : c))
      );
    } else {
      setComments((current) => current.filter((c) => c.id !== id));
    }

    try {
      await apiFetch(`/v1/social/comments/${id}`, { method: 'DELETE' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete');
      setComments(previous);
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
        <Button size="sm" onClick={() => postComment(newComment)}>
          Post
        </Button>
      </div>

      <ErrorMessage className="mt-2">{error}</ErrorMessage>

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
              currentUserId={currentUser?.id ?? null}
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
                <Button size="sm" onClick={() => postComment(replyBody, comment.id)}>
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
                      currentUserId={currentUser?.id ?? null}
                      onDelete={() => deleteComment(reply.id, comment.id)}
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
