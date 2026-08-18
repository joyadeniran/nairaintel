import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Plus, Search, MessageSquare } from 'lucide-react';
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
  editingComment: ForumComment | null;
  trendingPosts: ForumPost[];
}

const FORUM_CATEGORIES = [
  'All',
  'Stock Analysis',
  'Investment Strategies',
  'Fixed Income',
  'Market Rumours',
  'Personal Finance',
  'Beginner Questions',
  'Portfolio Reviews',
];

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
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-brand-green/10 dark:bg-brand-green/15 rounded-2xl flex items-center justify-center text-brand-green">
              <Users size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold text-slate-800 dark:text-white">Community</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Insights and debates from Nigerian investors.</p>
            </div>
          </div>
          {!selectedPost && (
            <button
              onClick={() => setShowCreatePostModal(true)}
              className="glow-button flex items-center gap-2"
            >
              <Plus size={18} /> Start Discussion
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
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row gap-4">
                <div className="md:w-72 relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search discussions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green/30 text-sm transition-all text-slate-800 dark:text-white"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide items-center flex-1">
                  {FORUM_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-display font-bold transition-all ${
                        selectedCategory === cat
                          ? 'bg-brand-green text-white shadow-md shadow-brand-green/20'
                          : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {isFetchingPosts ? (
                  [1, 2, 3].map(i => (
                    <div key={i} className="p-7 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                      <div className="flex gap-2 mb-4">
                        <div className="h-5 w-24 bg-slate-100 dark:bg-slate-800 rounded-full shimmer" />
                      </div>
                      <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-lg w-3/4 mb-3 shimmer" />
                      <div className="h-4 bg-slate-50 dark:bg-slate-800/50 rounded w-full shimmer" />
                      <div className="h-4 bg-slate-50 dark:bg-slate-800/50 rounded w-2/3 mt-2 shimmer" />
                    </div>
                  ))
                ) : forumPosts.length > 0 ? (
                  forumPosts.map(post => (
                    <ForumPostCard
                      key={post.id}
                      post={post}
                      user={user}
                      isTrending={trendingPosts.some(tp => tp.id === post.id)}
                      isLiked={post.likes?.includes(user?.uid || '')}
                      onSelect={setSelectedPost}
                      onLike={props.handleLikePost}
                      onEdit={(post) => { props.setEditingPost(post); props.setShowCreatePostModal(true); }}
                      onDelete={props.handleDeletePost}
                      onShare={props.handleShare}
                    />
                  ))
                ) : (
                  <div className="py-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-6">
                      <MessageSquare size={36} className="text-slate-300 dark:text-slate-600 -rotate-6" />
                    </div>
                    <h3 className="text-xl font-display font-bold text-slate-400 dark:text-slate-500 mb-2">No discussions found</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500">Try a different search or category.</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
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
                editingComment={props.editingComment}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </motion.div>
  );
};
