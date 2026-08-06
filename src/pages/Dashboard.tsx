import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { Navigation } from '../components/Navigation';
import { MarketIntelligence } from '../components/MarketIntelligence';
import { MarketNews, Investment, ForumPost, ForumComment, LearningContent } from '../types';
import { fetchLatestMarketNews, fetchLivePrices } from '../services/geminiService';
import { PortfolioPage } from './PortfolioPage';
import { ForumPage } from './ForumPage';
import { NewsPage } from './NewsPage';
import { LearningPage } from './LearningPage';
import { AddInvestmentModal } from '../components/AddInvestmentModal';
import { CreatePostModal } from '../components/CreatePostModal';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Separate modal states
  const [showAddInvestmentModal, setShowAddInvestmentModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  
  const [activeTab, setActiveTab] = useState('portfolio');
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [marketNews, setMarketNews] = useState<MarketNews[]>([]);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [learningContent, setLearningContent] = useState<LearningContent[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingLearn, setLoadingLearn] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [selectedLesson, setSelectedLesson] = useState<LearningContent | null>(null);

  // Forum States
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [quotedComment, setQuotedComment] = useState<ForumComment | null>(null);
  const [trendingPosts, setTrendingPosts] = useState<ForumPost[]>([]);
  const [isFetchingPosts, setIsFetchingPosts] = useState(false);
  const [editingComment, setEditingComment] = useState<ForumComment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPortfolio = () => {
    if (!user) return;
    fetch(`/api/portfolio?user_id=${user.uid}`).then(res => res.json()).then(setInvestments);
  };

  const fetchForumPosts = (page = 1, category = selectedCategory, search = searchQuery) => {
    setIsFetchingPosts(true);
    fetch(`/api/forum?page=${page}&limit=5&category=${category}&search=${search}`)
      .then(res => res.json())
      .then(data => {
        setForumPosts(data.posts);
        setTotalPages(data.totalPages);
        setCurrentPage(data.page);
        setIsFetchingPosts(false);
      });
  };

  useEffect(() => {
    if (!user) return;
    fetchPortfolio();
    fetchForumPosts(1, selectedCategory, searchQuery);
    fetchLatestMarketNews().then(news => {
      setMarketNews(news);
      setLoadingNews(false);
    });
    fetch('/api/learning')
      .then(res => res.json())
      .then(data => {
        setLearningContent(data);
        setLoadingLearn(false);
      });
    fetch('/api/forum/trending')
      .then(res => res.json())
      .then(setTrendingPosts);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchForumPosts(1, selectedCategory, searchQuery);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    const symbols = investments.filter(i => i.type === 'stock').map(i => i.symbol);
    if (symbols.length > 0) {
      fetchLivePrices(Array.from(new Set(symbols))).then(prices => {
        if (Object.keys(prices).length > 0) {
          setLivePrices(prices);
        }
      });
    }
  }, [investments]);

  useEffect(() => {
    if (selectedPost) {
      fetch(`/api/forum/${selectedPost.id}/comments`)
        .then(res => res.json())
        .then(setComments);
    }
  }, [selectedPost]);

  const handleLikePost = async (e: React.MouseEvent, postId: string | number) => {
    e.stopPropagation();
    if (!user) return;
    
    // Optimistic update
    const updateLikes = (p: ForumPost) => {
      const likes = [...(p.likes || [])];
      const idx = likes.indexOf(user.uid);
      if (idx === -1) likes.push(user.uid);
      else likes.splice(idx, 1);
      return { ...p, likes };
    };

    setForumPosts(posts => posts.map(p => p.id === postId ? updateLikes(p) : p));
    
    try {
      await fetch(`/api/forum/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.uid })
      });
      fetch('/api/forum/trending').then(r => r.json()).then(setTrendingPosts);
    } catch (e) {
      fetchForumPosts();
    }
  };

  const handleShare = async (e: React.MouseEvent, title: string, text: string) => {
    e.stopPropagation();
    if (navigator.share) {
      await navigator.share({ title, text, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(`${title}\n${text}\n${window.location.href}`);
      alert("Link copied to clipboard!");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !newComment.trim() || !user) return;

    if (editingComment) {
      await fetch(`/api/forum/comments/${editingComment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment, user_id: user.uid })
      });
      setEditingComment(null);
    } else {
      await fetch(`/api/forum/${selectedPost.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: newComment,
          username: user.displayName || user.email?.split('@')[0],
          user_id: user.uid,
          quoted_comment: quotedComment ? `${quotedComment.username} posted:\n\n"${quotedComment.content}"` : null
        })
      });
    }

    setNewComment('');
    setQuotedComment(null);
    fetch(`/api/forum/${selectedPost.id}/comments`).then(res => res.json()).then(setComments);
  };

  const handleDeleteComment = async (commentId: string | number) => {
    if (!selectedPost || !user) return;
    if (window.confirm('Delete this comment?')) {
      await fetch(`/api/forum/comments/${commentId}?user_id=${user.uid}&post_id=${selectedPost.id}`, { method: 'DELETE' });
      fetch(`/api/forum/${selectedPost.id}/comments`).then(res => res.json()).then(setComments);
    }
  };

  const handleDeleteInvestment = async (id: string | number) => {
    if (window.confirm('Delete this investment?')) {
      await fetch(`/api/investments/${id}?user_id=${user?.uid}`, { method: 'DELETE' });
      fetchPortfolio();
    }
  };

  const handleDeletePost = async (e: React.MouseEvent, postId: string | number) => {
    e.stopPropagation();
    if (window.confirm('Delete this discussion?')) {
      await fetch(`/api/forum/${postId}?user_id=${user?.uid}`, { method: 'DELETE' });
      fetchForumPosts();
      if (selectedPost?.id === postId) setSelectedPost(null);
    }
  };

  const handleCreatePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const url = editingPost ? `/api/forum/${editingPost.id}` : '/api/forum';
    const method = editingPost ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        username: user.displayName || user.email?.split('@')[0],
        user_id: user.uid
      })
    });

    setShowCreatePostModal(false);
    setEditingPost(null);
    fetchForumPosts();
  };

  const handleAddInvestment = async (data: any) => {
    if (!user) return;
    const url = editingInvestment ? `/api/investments/${editingInvestment.id}` : '/api/investments';
    const method = editingInvestment ? 'PUT' : 'POST';
    
    await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        entry_price: Number(data.entry_price),
        quantity: Number(data.quantity),
        user_id: user.uid
      })
    });

    setShowAddInvestmentModal(false);
    setEditingInvestment(null);
    fetchPortfolio();
  };

  const totalValue = investments.reduce((acc, inv) => {
    const cp = inv.type === 'stock' ? (livePrices[inv.symbol] || inv.entry_price) : inv.entry_price;
    return acc + (cp * inv.quantity);
  }, 0);
  const totalCost = investments.reduce((acc, inv) => acc + (inv.entry_price * inv.quantity), 0);
  const mockGain = totalValue - totalCost;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black transition-colors duration-500">
      <Navigation 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        logout={logout}
        setShowProfileModal={setShowProfileModal}
      />

      <main className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {activeTab === 'portfolio' && (
                <PortfolioPage 
                  key="portfolio"
                  investments={investments}
                  livePrices={livePrices}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  setShowAddModal={setShowAddInvestmentModal}
                  setEditingInvestment={setEditingInvestment}
                  handleDeleteInvestment={handleDeleteInvestment}
                  totalValue={totalValue}
                  mockGain={mockGain}
                  trendingPosts={trendingPosts}
                  setActiveTab={setActiveTab}
                  setSelectedPost={setSelectedPost}
                />
              )}
              {activeTab === 'forum' && (
                <ForumPage 
                  key="forum"
                  user={user}
                  forumPosts={forumPosts}
                  isFetchingPosts={isFetchingPosts}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  setShowCreatePostModal={setShowCreatePostModal}
                  setEditingPost={setEditingPost}
                  selectedPost={selectedPost}
                  setSelectedPost={setSelectedPost}
                  comments={comments}
                  newComment={newComment}
                  setNewComment={setNewComment}
                  quotedComment={quotedComment}
                  setQuotedComment={setQuotedComment}
                  handleLikePost={handleLikePost}
                  handleDeletePost={handleDeletePost}
                  handleShare={handleShare}
                  handleAddComment={handleAddComment}
                  handleDeleteComment={handleDeleteComment}
                  setEditingComment={setEditingComment}
                  trendingPosts={trendingPosts}
                />
              )}
              {activeTab === 'news' && (
                <NewsPage 
                  key="news"
                  marketNews={marketNews}
                  loadingNews={loadingNews}
                />
              )}
              {activeTab === 'learn' && (
                <LearningPage 
                  key="learn"
                   learningContent={learningContent}
                   loadingLearn={loadingLearn}
                   selectedLesson={selectedLesson}
                   setSelectedLesson={setSelectedLesson}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <MarketIntelligence 
              marketNews={marketNews}
              loadingNews={loadingNews}
              currentNewsIndex={currentNewsIndex}
              setCurrentNewsIndex={setCurrentNewsIndex}
              setActiveTab={setActiveTab}
            />

            <section className="premium-card p-8 group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 dark:bg-brand-green/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
              <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-2 relative z-10">Learning Path</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 relative z-10 font-medium">Master the markets with our curated guides.</p>
              <button 
                onClick={() => setActiveTab('learn')}
                className="w-full py-4 bg-slate-900 dark:bg-brand-green text-white rounded-2xl font-display font-bold text-sm hover:bg-brand-green transition-all shadow-lg shadow-slate-900/20 relative z-10"
              >
                Go to Hub
              </button>
            </section>
          </div>
        </div>
      </main>

      <AddInvestmentModal 
        isOpen={showAddInvestmentModal}
        onClose={() => { setShowAddInvestmentModal(false); setEditingInvestment(null); }}
        editingInvestment={editingInvestment}
        onConfirm={handleAddInvestment}
      />

      <CreatePostModal 
        isOpen={showCreatePostModal}
        onClose={() => { setShowCreatePostModal(false); setEditingPost(null); }}
        editingPost={editingPost}
        onConfirm={handleCreatePost}
      />
    </div>
  );
};
