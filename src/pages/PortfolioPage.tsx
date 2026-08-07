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
  totalCost: number;
  mockGain: number;
  stockValue: number;
  fixedIncomeValue: number;
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
      className="space-y-8"
    >
      <PortfolioSummary
        totalValue={props.totalValue}
        totalCost={props.totalCost}
        mockGain={props.mockGain}
        stockValue={props.stockValue}
        fixedIncomeValue={props.fixedIncomeValue}
      />

      <div className="premium-card p-6 md:p-10 overflow-hidden">
        <InvestmentList {...props} />

        {props.trendingPosts.length > 0 && (
          <div className="mt-12 pt-10 border-t border-slate-100 dark:border-slate-800">
            <CommunityOverview
              trendingPosts={props.trendingPosts}
              setActiveTab={props.setActiveTab}
              setSelectedPost={props.setSelectedPost}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};
