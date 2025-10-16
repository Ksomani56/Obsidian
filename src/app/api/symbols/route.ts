import { NextResponse } from 'next/server';

interface StockSymbol {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
  exchange: string;
}

const mockSymbols: StockSymbol[] = [
  // US Stocks
  { description: 'APPLE INC', displaySymbol: 'AAPL', symbol: 'AAPL', type: 'Common Stock', exchange: 'US' },
  { description: 'MICROSOFT CORP', displaySymbol: 'MSFT', symbol: 'MSFT', type: 'Common Stock', exchange: 'US' },
  { description: 'ALPHABET INC-CL A', displaySymbol: 'GOOGL', symbol: 'GOOGL', type: 'Common Stock', exchange: 'US' },
  // Indian Stocks
  { description: 'RELIANCE INDUSTRIES', displaySymbol: 'RELIANCE.NS', symbol: 'RELIANCE.NS', type: 'Common Stock', exchange: 'NSE' },
  { description: 'TATA CONSULTANCY', displaySymbol: 'TCS.NS', symbol: 'TCS.NS', type: 'Common Stock', exchange: 'NSE' },
  { description: 'HDFC BANK LTD', displaySymbol: 'HDFCBANK.NS', symbol: 'HDFCBANK.NS', type: 'Common Stock', exchange: 'NSE' },
  { description: 'INFOSYS LTD', displaySymbol: 'INFY.NS', symbol: 'INFY.NS', type: 'Common Stock', exchange: 'NSE' },
  { description: 'ICICI BANK LTD', displaySymbol: 'ICICIBANK.NS', symbol: 'ICICIBANK.NS', type: 'Common Stock', exchange: 'NSE' },
  { description: 'HINDUSTAN UNILEVER', displaySymbol: 'HINDUNILVR.NS', symbol: 'HINDUNILVR.NS', type: 'Common Stock', exchange: 'NSE' },
  { description: 'STATE BANK OF INDIA', displaySymbol: 'SBIN.NS', symbol: 'SBIN.NS', type: 'Common Stock', exchange: 'NSE' },
];

export async function GET() {
  // Free-tier mode: always return a curated mock symbol list and never call upstream.
  return NextResponse.json({ symbols: mockSymbols, isMock: true });
}
