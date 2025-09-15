export type TransactionType = 'BUY' | 'SELL';

export interface Transaction {
  id: string;
  date: string;            // ISO date (yyyy-mm-dd)
  assetId: string;         // ticker or name
  type: TransactionType;
  quantity: number;
  price: number;
  currency?: string;
  fees?: number;
  tag?: string;
  notes?: string;
}

export interface ColumnMapping {
  date: string;
  assetId: string;
  type: string;
  quantity: string;
  price: string;
  currency?: string;
  fees?: string;
  tag?: string;
  notes?: string;
}

export interface ParsedRow {
  raw: Record<string, any>;
  tx?: Transaction;
  errors: string[];
}

export interface PortfolioPoint {
  date: string;
  value: number;
}

export interface HoldingSnapshot {
  assetId: string;
  quantity: number;
  marketValue: number;
}


