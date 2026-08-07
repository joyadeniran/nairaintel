export interface Investment {
  id: string | number;
  user_id?: string;
  type: 'stock' | 'tbill';
  symbol: string;
  name: string;
  entry_price: number;
  quantity: number;
  date_acquired: string;
  current_price?: number; // Mocked for now
}

export interface ForumPost {
  id: string | number;
  user_id: string;
  username: string;
  category: string;
  title: string;
  content: string;
  created_at: string;
  likes?: string[];
  comment_count?: number;
}

export interface ForumComment {
  id: string | number;
  post_id: string | number;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
  likes?: string[];
  quoted_comment?: string;
}

export interface MarketNews {
  headline: string;
  summary: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  impact: string;
  /** Emitted by the news API (src/server/services/ai.ts); defaults to "#". */
  source_url?: string;
}

export interface LearningContent {
  id: string;
  title: string;
  description: string;
  content?: string;
  category: string;
  image: string;
  url: string;
}
