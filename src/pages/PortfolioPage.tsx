import React from 'react';
import { motion } from 'motion/react';
import { PortfolioSummary } from '../components/PortfolioSummary';
import { InvestmentList } from '../components/InvestmentList';
import { CommunityOverview } from '../components/CommunityOverview';
import { Investment, ForumPost } from '../types';

interface PortfolioPageProps {
  investments: Investment[];
  livePrices: Record<string, number>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setShowAddModal: (s: boolean) => void;
  setEditingInvestment: (i: Investment | null) => void;
  handleDeleteInvestment: (id: string | number) => void;
  totalValue: number;
  mockGain: number;
  trendingPosts: ForumPost[];
  setActiveTab: (tab: string) => void;
  setSelectedPost: (post: ForumPost) => void;
}

export const PortfolioPage: React.FC<PortfolioPageProps> = (props) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-12"
    >
      <PortfolioSummary 
        totalValue={props.totalValue}
        mockGain={props.mockGain}
        mockTotalReturn={13.4}
      />
      
      <div className="premium-card p-8 md:p-12 overflow-hidden">
        <InvestmentList {...props} />
        
        <div className="mt-16 pt-12 border-t border-slate-100 dark:border-slate-800">
          <CommunityOverview 
            trendingPosts={props.trendingPosts} 
            setActiveTab={props.setActiveTab}
            setSelectedPost={props.setSelectedPost}
          />
        </div>
      </div>
    </motion.div>
  );
};
