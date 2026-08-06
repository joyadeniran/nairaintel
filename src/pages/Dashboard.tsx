import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { Navigation } from '../components/Navigation';
import { MarketIntelligence } from '../components/MarketIntelligence';
import { MarketNews, Investment, ForumPost, ForumComment, LearningContent } from '../types';
import { fetchLatestMarketNews, fetchLivePrices } from '../services/geminiService';
import { apiFetch } from '../lib/api';
import { PortfolioPage } from './PortfolioPage';
import { ForumPage } from './ForumPage';
import { NewsPage } from './NewsPage';
import { LearningPage } from './LearningPage';
import { AddInvestmentModal } from '../components/AddInvestmentModal';
import { CreatePostModal } from '../components/CreatePostModal';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  
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
    apiFetch('/api/portfolio')
      .then(res => res.ok ? res.json() : [])
      .then(setInvestments)
      .catch(() => setInvestments([]));
  };

  const fetchForumPosts = (page = 1, category = selectedCategory, search = searchQuery) => {
    setIsFetchingPosts(true);
    apiFetch(`/api/forum?page=${page}&limit=5&category=${encodeURIComponent(category)}&search=${encodeURIComponent(search)}`)
      .then(res => res.json())
      .then(data => {
        setForumPosts(data.posts || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.page || 1);
        setIsFetchingPosts(false);
      })
      .catch(() => {
        setForumPosts([]);
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
    apiFetch('/api/learning')
      .then(res => res.json())
      .then(data => {
        setLearningContent(Array.isArray(data) ? data : []);
        setLoadingLearn(false);
      })
      .catch(() => setLoadingLearn(false));
    apiFetch('/api/forum/trending')
      .then(res => res.json())
      .then(setTrendingPosts)
      .catch(() => setTrendingPosts([]));
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
      apiFetch(`/api/forum/${selectedPost.id}/comments`)
        .then(res => res.json())
        .then(setComments)
        .catch(() => setComments([]));
    }
  }, [selectedPost]);

  const handleLikePost = async (e: React.MouseEvent, postId: string | number) => {
    e.stopPropagation();
    if (!user) return;
    
    const updateLikes = (p: ForumPost) => {
      const likes = [...(p.likes || [])];
      const idx = likes.indexOf(user.uid);
      if (idx === -1) likes.push(user.uid);
      else likes.splice(idx, 1);
      return { ...p, likes };
    };

    setForumPosts(posts => posts.map(p => p.id === postId ? updateLikes(p) : p));
    
    try {
      await apiFetch(`/api/forum/${postId}/like`, { method: 'POST', body: '{}' });
      apiFetch('/api/forum/trending').then(r => r.json()).then(setTrendingPosts);
    } catch {
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
      await apiFetch(`/api/forum/comments/${editingComment.id}`, {
        method: 'PUT',
        body: JSON.stringify({ content: newComment })
      });
      setEditingComment(null);
    } else {
      await apiFetch(`/api/forum/${selectedPost.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ 
          content: newComment,
          quoted_comment: quotedComment ? `${quotedComment.username} posted:\n\n"${quotedComment.content}"` : null
        })
      });
    }

    setNewComment('');
    setQuotedComment(null);
    apiFetch(`/api/forum/${selectedPost.id}/comments`).then(res => res.json()).then(setComments);
  };

  const handleDeleteComment = async (commentId: string | number) => {
    if (!selectedPost || !user) return;
    if (window.confirm('Delete this comment?')) {
      await apiFetch(`/api/forum/comments/${commentId}?post_id=${selectedPost.id}`, { method: 'DELETE' });
      apiFetch(`/api/forum/${selectedPost.id}/comments`).then(res => res.json()).then(setComments);
    }
  };

  const handleDeleteInvestment = async (id: string | number) => {
    if (window.confirm('Delete this investment?')) {
      await apiFetch(`/api/portfolio/${id}`, { method: 'DELETE' });
      fetchPortfolio();
    }
  };

  const handleDeletePost = async (e: React.MouseEvent, postId: string | number) => {
    e.stopPropagation();
    if (window.confirm('Delete this discussion?')) {
      await apiFetch(`/api/forum/${postId}`, { method: 'DELETE' });
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

    await apiFetch(url, {
      method,
      body: JSON.stringify(data)
    });

    setShowCreatePostModal(false);
    setEditingPost(null);
    fetchForumPosts();
  };

  const handleAddInvestment = async (data: any) => {
    if (!user) return;
    const url = editingInvestment ? `/api/portfolio/${editingInvestment.id}` : '/api/portfolio';
    const method = editingInvestment ? 'PUT' : 'POST';
    
    await apiFetch(url, {
      method,
      body: JSON.stringify({
        ...data,
        entry_price: Number(data.entry_price),
        quantity: Number(data.quantity),
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
  
  const stockValue = investments
    .filter(i => i.type === 'stock')
    .reduce((acc, inv) => {
      const cp = livePrices[inv.symbol] || inv.entry_price;
      return acc + (cp * inv.quantity);
    }, 0);
    
  const fixedIncomeValue = investments
    .filter(i => i.type === 'tbill')
    .reduce((acc, inv) => acc + (inv.entry_price * inv.quantity), 0);

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
                  totalCost={totalCost}
                  mockGain={mockGain}
                  stockValue={stockValue}
                  fixedIncomeValue={fixedIncomeValue}
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
