import React from 'react';
import { ArrowLeft, MessageSquare, Quote, Trash2, Edit2 } from 'lucide-react';
import { ForumPost, ForumComment } from '../../types';

interface ForumPostDetailProps {
  post: ForumPost;
  comments: ForumComment[];
  user: any;
  newComment: string;
  setNewComment: (c: string) => void;
  quotedComment: ForumComment | null;
  setQuotedComment: (c: ForumComment | null) => void;
  onBack: () => void;
  onAddComment: (e: React.FormEvent) => void;
  onDeleteComment: (commentId: string | number) => void;
  setEditingComment: (c: ForumComment | null) => void;
}

function safeDate(value?: string) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
}

export const ForumPostDetail: React.FC<ForumPostDetailProps> = ({
  post,
  comments,
  user,
  newComment,
  setNewComment,
  quotedComment,
  setQuotedComment,
  onBack,
  onAddComment,
  onDeleteComment,
  setEditingComment
}) => {
  const list = Array.isArray(comments) ? comments : [];

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-display font-bold hover:text-brand-green transition-colors"
      >
        <ArrowLeft size={18} /> Back to Community
      </button>

      <div className="p-8 md:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[10px] font-display font-bold text-brand-green bg-brand-green/5 dark:bg-brand-green/10 px-3 py-1 rounded-full uppercase tracking-widest border border-brand-green/10">
            {post.category || 'Discussion'}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">{safeDate(post.created_at)}</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-800 dark:text-white mb-6 leading-tight">{post.title}</h2>

        <div className="flex items-center gap-4 mb-8 pb-7 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shadow-sm">
            <img src={`https://picsum.photos/seed/${encodeURIComponent(post.username || 'user')}/40/40`} alt="" />
          </div>
          <div>
            <p className="font-display font-bold text-slate-800 dark:text-white">{post.username || 'Investor'}</p>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Discussion Starter</p>
          </div>
        </div>

        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      <div className="space-y-5">
        <h3 className="text-lg font-display font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <MessageSquare size={20} className="text-brand-green" />
          Responses ({list.length})
        </h3>

        <div className="space-y-3">
          {list.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500 py-4">No replies yet. Be the first to share a view.</p>
          )}
          {list.map((comment, idx) => {
            const id = comment?.id ?? `tmp-${idx}`;
            const username = comment?.username || 'Investor';
            return (
              <div key={id} className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800/50 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
                      <img src={`https://picsum.photos/seed/${encodeURIComponent(username)}/32/32`} alt="" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">{username}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold ml-2">
                        {safeDate(comment?.created_at)}
                      </span>
                    </div>
                  </div>
                  {user?.uid && comment?.user_id && user.uid === comment.user_id && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => { setEditingComment(comment); setNewComment(comment.content || ''); }}
                        className="p-2 text-slate-400 hover:text-brand-green rounded-lg transition-colors"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteComment(comment.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {comment?.quoted_comment && (
                  <div className="mb-3 p-3 rounded-xl bg-white/60 dark:bg-slate-800/50 border-l-3 border-brand-green/25 italic text-sm text-slate-400 dark:text-slate-500 flex gap-2.5">
                    <Quote size={14} className="text-brand-green/30 shrink-0 mt-0.5" />
                    <p className="line-clamp-2">{comment.quoted_comment}</p>
                  </div>
                )}

                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[15px]">{comment?.content || ''}</p>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setQuotedComment(comment)}
                    className="text-[10px] font-bold text-brand-green uppercase tracking-widest hover:text-brand-green-light flex items-center gap-1 transition-colors"
                  >
                    <Quote size={10} /> Reply
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md shadow-slate-200/50 dark:shadow-none">
          <form onSubmit={onAddComment} className="space-y-4">
            {quotedComment && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <Quote size={12} className="text-brand-green" />
                  Replying to <span className="font-bold text-slate-800 dark:text-white">{quotedComment.username || 'Investor'}</span>
                </div>
                <button type="button" onClick={() => setQuotedComment(null)} className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors">Cancel</button>
              </div>
            )}
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your perspective..."
              className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green/30 min-h-[100px] text-sm resize-none transition-all text-slate-800 dark:text-white"
              required
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="glow-button px-6 py-2.5 text-sm"
              >
                Post Reply
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
