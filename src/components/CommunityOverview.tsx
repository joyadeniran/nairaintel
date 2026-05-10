import React from 'react';
import { MessageSquare, ThumbsUp, TrendingUp, ArrowRight } from 'lucide-react';
import { ForumPost } from '../types';

interface CommunityOverviewProps {
  trendingPosts: ForumPost[];
  setActiveTab: (tab: string) => void;
  setSelectedPost: (post: ForumPost) => void;
}

export const CommunityOverview: React.FC<CommunityOverviewProps> = ({ 
  trendingPosts, 
  setActiveTab, 
  setSelectedPost 
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Community Intelligence</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trending Discussions</p>
          </div>
        </div>
        <button 
          onClick={() => setActiveTab('forum')}
          className="text-sm font-bold text-naira-green hover:underline flex items-center gap-1"
        >
          View All <ArrowRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trendingPosts.length > 0 ? (
          trendingPosts.slice(0, 2).map((post) => (
            <div 
              key={post.id}
              onClick={() => {
                setSelectedPost(post);
                setActiveTab('forum');
              }}
              className="group cursor-pointer p-6 rounded-[2rem] bg-slate-50 border border-slate-100/50 hover:bg-white hover:border-naira-green/30 hover:shadow-xl hover:shadow-slate-200/30 transition-all"
            >
              <span className="text-[10px] font-bold text-naira-green bg-naira-green/5 px-2.5 py-1 rounded-md uppercase tracking-wider mb-3 inline-block">
                {post.category}
              </span>
              <h4 className="text-sm font-extrabold text-slate-800 group-hover:text-naira-green transition-colors mb-3 line-clamp-2 leading-snug">
                {post.title}
              </h4>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100/50">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden">
                    <img src={`https://picsum.photos/seed/${post.username}/24/24`} alt="" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">{post.username}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <span className="flex items-center gap-1 text-[10px] font-bold">
                    <ThumbsUp size={12} /> {post.likes?.length || 0}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold">
                    <MessageSquare size={12} /> {post.comment_count || 0}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 py-8 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
            <p className="text-sm text-slate-400 font-medium italic">No trending discussions yet. Start one!</p>
          </div>
        )}
      </div>
    </div>
  );
};
