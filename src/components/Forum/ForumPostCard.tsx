import React from 'react';
import { MessageSquare, ThumbsUp, TrendingUp, Edit2, Trash2 } from 'lucide-react';
import { ForumPost } from '../../types';

interface ForumPostCardProps {
  post: ForumPost;
  user: any;
  isTrending: boolean;
  isLiked: boolean;
  onSelect: (post: ForumPost) => void;
  onLike: (e: React.MouseEvent, postId: string | number) => void;
  onEdit: (post: ForumPost) => void;
  onDelete: (e: React.MouseEvent, postId: string | number) => void;
  onShare: (e: React.MouseEvent, title: string, text: string) => void;
}

export const ForumPostCard: React.FC<ForumPostCardProps> = ({
  post,
  user,
  isTrending,
  isLiked,
  onSelect,
  onLike,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      onClick={() => onSelect(post)}
      className="group cursor-pointer p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 hover:border-brand-green/20 dark:hover:border-brand-green/20 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-300"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] font-display font-bold text-brand-green bg-brand-green/5 dark:bg-brand-green/10 px-3 py-1 rounded-full uppercase tracking-widest border border-brand-green/10">
          {post.category}
        </span>
        {isTrending && (
          <span className="flex items-center gap-1 text-[10px] font-display font-bold text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-3 py-1 rounded-full uppercase tracking-widest border border-orange-500/10">
            <TrendingUp size={10} /> Trending
          </span>
        )}
      </div>

      <h4 className="text-lg font-display font-bold text-slate-800 dark:text-white group-hover:text-brand-green transition-colors mb-2.5 leading-snug">
        {post.title}
      </h4>

      <p className="text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 text-sm leading-relaxed">
        {post.content}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
            <img src={`https://picsum.photos/seed/${post.username}/32/32`} alt="" referrerPolicy="no-referrer" />
          </div>
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-300">{post.username}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500">
          {user?.uid === post.user_id && (
            <div className="flex items-center gap-1 mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(post); }}
                className="p-2 hover:text-brand-green rounded-lg transition-colors"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={(e) => onDelete(e, post.id)}
                className="p-2 hover:text-rose-500 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}

          <button
            onClick={(e) => onLike(e, post.id)}
            className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${isLiked ? 'text-brand-green' : 'hover:text-brand-green'}`}
          >
            <ThumbsUp size={15} fill={isLiked ? 'currentColor' : 'none'} /> {post.likes?.length || 0}
          </button>

          <span className="flex items-center gap-1.5 text-xs font-bold">
            <MessageSquare size={15} /> {post.comment_count || 0}
          </span>
        </div>
      </div>
    </div>
  );
};
