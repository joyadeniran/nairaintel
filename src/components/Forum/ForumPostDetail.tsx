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
    <div className="space-y-8">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 font-bold hover:text-naira-green transition-colors"
      >
        <ArrowLeft size={20} /> Back to Community
      </button>

      <div className="p-10 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[10px] font-bold text-naira-green bg-naira-green/5 px-3 py-1 rounded-full uppercase tracking-widest border border-naira-green/10">
            {post.category || 'Discussion'}
          </span>
          <span className="text-xs text-slate-400 font-medium">{safeDate(post.created_at)}</span>
        </div>
        
        <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-6 leading-tight">{post.title}</h2>
        
        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-50 dark:border-slate-800">
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shadow-sm">
            <img src={`https://picsum.photos/seed/${encodeURIComponent(post.username || 'user')}/40/40`} alt="" />
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-white">{post.username || 'Investor'}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Discussion Starter</p>
          </div>
        </div>

        <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <MessageSquare size={24} className="text-naira-green" /> 
          Member Responses ({list.length})
        </h3>
        
        <div className="space-y-4">
          {list.length === 0 && (
            <p className="text-sm text-slate-400">No replies yet. Be the first to share a view.</p>
          )}
          {list.map((comment, idx) => {
            const id = comment?.id ?? `tmp-${idx}`;
            const username = comment?.username || 'Investor';
            return (
              <div key={id} className="p-6 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100/50 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 hover:shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
                      <img src={`https://picsum.photos/seed/${encodeURIComponent(username)}/32/32`} alt="" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">{username}</span>
                      <span className="text-[10px] text-slate-400 font-bold ml-2 uppercase tracking-widest">
                        {safeDate(comment?.created_at)}
                      </span>
                    </div>
                  </div>
                  {user?.uid && comment?.user_id && user.uid === comment.user_id && (
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => { setEditingComment(comment); setNewComment(comment.content || ''); }}
                        className="p-2 text-slate-400 hover:text-naira-green hover:bg-white rounded-lg transition-all"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => onDeleteComment(comment.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                
                {comment?.quoted_comment && (
                  <div className="mb-4 p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border-l-4 border-naira-green/30 italic text-sm text-slate-400 flex gap-3">
                    <Quote size={16} className="text-naira-green/30 shrink-0" />
                    <p className="line-clamp-2">{comment.quoted_comment}</p>
                  </div>
                )}
                
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{comment?.content || ''}</p>
                
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button 
                    type="button"
                    onClick={() => setQuotedComment(comment)}
                    className="text-[10px] font-bold text-naira-green uppercase tracking-widest hover:underline flex items-center gap-1"
                  >
                    <Quote size={10} /> Reply to this
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
          <form onSubmit={onAddComment} className="space-y-4">
            {quotedComment && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <Quote size={12} className="text-naira-green" />
                  Replying to <span className="font-bold text-slate-800 dark:text-white">{quotedComment.username || 'Investor'}</span>
                </div>
                <button type="button" onClick={() => setQuotedComment(null)} className="text-xs font-bold text-rose-500 hover:underline">Cancel</button>
              </div>
            )}
            <textarea 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your perspective..."
              className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-naira-green/20 min-h-[120px] text-sm resize-none transition-all text-slate-800 dark:text-white"
              required
            />
            <div className="flex justify-end">
              <button 
                type="submit"
                className="bg-naira-green text-white px-8 py-3 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-naira-green/20"
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
