import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Plus, Search, TrendingUp } from 'lucide-react';
import { ForumPostCard } from '../components/Forum/ForumPostCard';
import { ForumPostDetail } from '../components/Forum/ForumPostDetail';
import { ForumPost, ForumComment } from '../types';

interface ForumPageProps {
  user: any;
  forumPosts: ForumPost[];
  isFetchingPosts: boolean;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  setShowCreatePostModal: (s: boolean) => void;
  setEditingPost: (p: ForumPost | null) => void;
  selectedPost: ForumPost | null;
  setSelectedPost: (p: ForumPost | null) => void;
  comments: ForumComment[];
  newComment: string;
  setNewComment: (c: string) => void;
  quotedComment: ForumComment | null;
  setQuotedComment: (c: ForumComment | null) => void;
  handleLikePost: (e: React.MouseEvent, id: string | number) => void;
  handleDeletePost: (e: React.MouseEvent, id: string | number) => void;
  handleShare: (e: React.MouseEvent, title: string, text: string) => void;
  handleAddComment: (e: React.FormEvent) => void;
  handleDeleteComment: (id: string | number) => void;
  setEditingComment: (c: ForumComment | null) => void;
  trendingPosts: ForumPost[];
}

export const ForumPage: React.FC<ForumPageProps> = (props) => {
  const { 
    selectedPost, setSelectedPost, forumPosts, isFetchingPosts, 
    selectedCategory, setSelectedCategory, searchQuery, setSearchQuery,
    setShowCreatePostModal, user, trendingPosts
  } = props;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-5xl mx-auto space-y-8"
    >
      <section className="premium-card p-8 md:p-12 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-brand-green/10 dark:bg-brand-green/20 rounded-3xl flex items-center justify-center text-brand-green shadow-inner">
              <Users size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold text-slate-800 dark:text-white">Community</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Insights and debates from top Nigerian investors.</p>
            </div>
          </div>
          {!selectedPost && (
            <button 
              onClick={() => setShowCreatePostModal(true)}
              className="glow-button flex items-center gap-2"
            >
              <Plus size={20} /> Start Discussion
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {!selectedPost ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">
                <div className="md:col-span-5 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text"
                    placeholder="Search discussions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-green/10 text-base transition-all text-slate-800 dark:text-white"
                  />
                </div>
                <div className="md:col-span-7 flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide items-center">
                  {['All', 'Stock Talk', 'Investment Strategies', 'Market Rumours'].map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => setSelectedCategory(cat)}
                      className={`whitespace-nowrap px-6 py-3 rounded-xl text-sm font-display font-bold transition-all ${
                        selectedCategory === cat 
                          ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' 
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                {isFetchingPosts ? (
                  <div className="space-y-8">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 animate-pulse bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4" />
                        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4" />
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                      </div>
                    ))}
                  </div>
                ) : forumPosts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-8">
                    {forumPosts.map(post => (
                      <ForumPostCard 
                        key={post.id}
                        post={post}
                        user={user}
                        isTrending={trendingPosts.some(tp => tp.id === post.id)}
                        isLiked={post.likes?.includes(user?.uid || '')}
                        onSelect={setSelectedPost}
                        onLike={props.handleLikePost}
                        onEdit={props.setEditingPost}
                        onDelete={props.handleDeletePost}
                        onShare={props.handleShare}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-24 text-center">
                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-300 dark:text-slate-700">
                      <Search size={48} />
                    </div>
                    <p className="text-xl font-display font-bold text-slate-400 dark:text-slate-600">No discussions found matching your criteria.</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              <ForumPostDetail 
                post={selectedPost}
                comments={props.comments}
                user={user}
                newComment={props.newComment}
                setNewComment={props.setNewComment}
                quotedComment={props.quotedComment}
                setQuotedComment={props.setQuotedComment}
                onBack={() => setSelectedPost(null)}
                onAddComment={props.handleAddComment}
                onDeleteComment={props.handleDeleteComment}
                setEditingComment={props.setEditingComment}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </motion.div>
  );
};
