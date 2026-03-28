export interface Expense {
  id: string;
  amount: number;
  category: 'Food' | 'Travel' | 'Shopping' | 'Bills' | 'Health' | 'Entertainment' | 'Education' | 'Other';
  date: string;
  description?: string;
  user_id: string;
  created_at: string;
}

export interface UserIncome {
  id: string;
  user_id: string;
  monthly_income: number;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface AIInsight {
  type: 'warning' | 'success' | 'info' | 'tip';
  title: string;
  message: string;
}
