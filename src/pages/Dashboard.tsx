import React, { useState, useEffect, useCallback } from 'react';
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

function livePriceFor(inv: Investment, livePrices: Record<string, number>): number {
  const sym = String(inv.symbol || '').toUpperCase();
  const live = livePrices[sym];
  if (typeof live === 'number' && live > 0) return live;
  return Number(inv.entry_price) || 0;
}

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
  const [commentError, setCommentError] = useState<string | null>(null);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);

  const refreshLivePrices = useCallback(async (list: Investment[]) => {
    const symbols = list
      .filter((i) => i.type === 'stock')
      .map((i) => String(i.symbol || '').toUpperCase())
      .filter(Boolean);
    if (symbols.length === 0) return;
    const prices = await fetchLivePrices([...new Set(symbols)]);
    if (prices && Object.keys(prices).length > 0) {
      setLivePrices((prev) => ({ ...prev, ...prices }));
    }
  }, []);

  const loadComments = async (postId: string | number) => {
    try {
      const res = await apiFetch(`/api/forum/${postId}/comments`);
      const data = await res.json().catch(() => []);
      setComments(Array.isArray(data) ? data : []);
    } catch {
      setComments([]);
    }
  };

  const fetchPortfolio = useCallback(() => {
    if (!user) return;
    setPortfolioError(null);
    apiFetch('/api/portfolio')
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setPortfolioError(body?.error || `Portfolio load failed (${res.status})`);
          setInvestments([]);
          return;
        }
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setInvestments(list);
        refreshLivePrices(list);
      })
      .catch(() => {
        setPortfolioError('Could not reach portfolio API');
        setInvestments([]);
      });
  }, [user, refreshLivePrices]);

  const fetchForumPosts = (page = 1, category = selectedCategory, search = searchQuery) => {
    setIsFetchingPosts(true);
    apiFetch(`/api/forum?page=${page}&limit=5&category=${encodeURIComponent(category)}&search=${encodeURIComponent(search)}`)
      .then(res => res.json())
      .then(data => {
        setForumPosts(Array.isArray(data?.posts) ? data.posts : []);
        setTotalPages(data?.totalPages || 1);
        setCurrentPage(data?.page || 1);
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
      setMarketNews(Array.isArray(news) ? news : []);
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
      .then(data => setTrendingPosts(Array.isArray(data) ? data : []))
      .catch(() => setTrendingPosts([]));
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchForumPosts(1, selectedCategory, searchQuery);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    if (investments.length > 0) {
      refreshLivePrices(investments);
    }
  }, [investments, refreshLivePrices]);

  useEffect(() => {
    if (selectedPost?.id != null) {
      loadComments(selectedPost.id);
    } else {
      setComments([]);
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
      apiFetch('/api/forum/trending').then(r => r.json()).then(d => setTrendingPosts(Array.isArray(d) ? d : []));
    } catch {
      fetchForumPosts();
    }
  };

  const handleShare = async (e: React.MouseEvent, title: string, text: string) => {
    e.stopPropagation();
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(`${title}\n${text}\n${window.location.href}`);
        alert("Link copied to clipboard!");
      }
    } catch {
      // User cancelled share dialog or clipboard access denied
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !newComment.trim() || !user) return;
    setCommentError(null);

    try {
      if (editingComment) {
        const res = await apiFetch(`/api/forum/comments/${editingComment.id}`, {
          method: 'PUT',
          body: JSON.stringify({ content: newComment })
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setCommentError(body?.error || `Could not update reply (${res.status})`);
          return;
        }
        setEditingComment(null);
        setNewComment('');
        setQuotedComment(null);
        await loadComments(selectedPost.id);
        return;
      }

      const res = await apiFetch(`/api/forum/${selectedPost.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ 
          content: newComment,
          quoted_comment: quotedComment ? `${quotedComment.username || 'Investor'} posted:\n\n"${quotedComment.content}"` : null
        })
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setCommentError(
          body?.error
            ? `${body.error}${body.detail ? ` — ${body.detail}` : ''}${body.hint ? ` (${body.hint})` : ''}`
            : `Could not post reply (${res.status})`
        );
        return;
      }

      if (body?.id) {
        setComments((prev) => [...prev, body as ForumComment]);
      }

      setNewComment('');
      setQuotedComment(null);
      loadComments(selectedPost.id);
    } catch (err: any) {
      console.error('Comment error:', err);
      setCommentError(err?.message || 'Could not post reply. Please try again.');
    }
  };

  const handleDeleteComment = async (commentId: string | number) => {
    if (!selectedPost || !user) return;
    if (window.confirm('Delete this comment?')) {
      try {
        await apiFetch(`/api/forum/comments/${commentId}?post_id=${selectedPost.id}`, { method: 'DELETE' });
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        await loadComments(selectedPost.id);
      } catch {
        setCommentError('Could not delete comment');
      }
    }
  };

  const handleDeleteInvestment = async (id: string | number) => {
    if (window.confirm('Delete this investment?')) {
      try {
        const res = await apiFetch(`/api/portfolio/${id}`, { method: 'DELETE' });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setPortfolioError(body?.error || `Delete failed (${res.status})`);
        }
        fetchPortfolio();
      } catch {
        setPortfolioError('Could not reach server');
      }
    }
  };

  const handleDeletePost = async (e: React.MouseEvent, postId: string | number) => {
    e.stopPropagation();
    if (window.confirm('Delete this discussion?')) {
      try {
        await apiFetch(`/api/forum/${postId}`, { method: 'DELETE' });
        fetchForumPosts();
        if (selectedPost?.id === postId) setSelectedPost(null);
      } catch {
        setCommentError('Could not delete discussion');
      }
    }
  };

  const handleCreatePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const url = editingPost ? `/api/forum/${editingPost.id}` : '/api/forum';
    const method = editingPost ? 'PUT' : 'POST';

    try {
      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setCommentError(body?.error || 'Failed to save discussion');
        return;
      }

      setShowCreatePostModal(false);
      setEditingPost(null);
      fetchForumPosts();
    } catch {
      setCommentError('Could not reach server');
    }
  };

  const handleAddInvestment = async (data: any) => {
    if (!user) return;
    const url = editingInvestment ? `/api/portfolio/${editingInvestment.id}` : '/api/portfolio';
    const method = editingInvestment ? 'PUT' : 'POST';

    try {
      const res = await apiFetch(url, {
        method,
        body: JSON.stringify({
          ...data,
          symbol: String(data.symbol || '').toUpperCase(),
          entry_price: Number(data.entry_price),
          quantity: Number(data.quantity),
        })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setPortfolioError(body?.error || 'Failed to save investment');
        return;
      }

      setShowAddInvestmentModal(false);
      setEditingInvestment(null);
      fetchPortfolio();
    } catch {
      setPortfolioError('Could not reach server');
    }
  };

  const totalValue = investments.reduce((acc, inv) => {
    const cp = inv.type === 'stock' ? livePriceFor(inv, livePrices) : Number(inv.entry_price) || 0;
    return acc + (cp * Number(inv.quantity));
  }, 0);
  
  const totalCost = investments.reduce((acc, inv) => acc + (Number(inv.entry_price) * Number(inv.quantity)), 0);
  const mockGain = totalValue - totalCost;
  
  const stockValue = investments
    .filter(i => i.type === 'stock')
    .reduce((acc, inv) => acc + (livePriceFor(inv, livePrices) * Number(inv.quantity)), 0);
    
  const fixedIncomeValue = investments
    .filter(i => i.type === 'tbill')
    .reduce((acc, inv) => acc + (Number(inv.entry_price) * Number(inv.quantity)), 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1a] transition-colors duration-300">
      <Navigation 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        logout={logout}
        setShowProfileModal={setShowProfileModal}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-4 md:pt-8 pb-6">
        {(commentError || portfolioError) && (
          <div className="mb-4 rounded-2xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 px-4 py-3 text-sm flex justify-between gap-4">
            <span>{commentError || portfolioError}</span>
            <button type="button" className="font-bold" onClick={() => { setCommentError(null); setPortfolioError(null); }}>Dismiss</button>
          </div>
        )}
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

            <section className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-7 group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 dark:bg-brand-green/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-500" />
              <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-1.5 relative z-10">Learning Path</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 relative z-10">Master the markets with curated guides.</p>
              <button
                onClick={() => setActiveTab('learn')}
                className="w-full py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-display font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-700 transition-all relative z-10"
              >
                Go to Hub
              </button>
            </section>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 md:px-8 pb-24 md:pb-8 pt-12">
        <div className="border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-green rounded-lg flex items-center justify-center text-white font-display font-bold text-sm">N</div>
            <span className="text-sm font-display font-bold text-slate-400 dark:text-slate-500">NairaIntel</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-600">Intelligence for your Naira. Not financial advice.</p>
        </div>
      </footer>

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
