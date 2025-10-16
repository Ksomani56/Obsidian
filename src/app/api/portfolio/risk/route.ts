import { NextResponse } from 'next/server';
import {
  calculatePortfolioMetrics,
  calculateReturns,
  generateRiskReturnScatter,
  calculateHistoricalValues,
  calculateWeights
} from '@/lib/utils/riskCalculations';

interface StockHistory {
  symbol: string;
  dates: string[];
  prices: number[];
}

async function fetchHistoricalData(symbol: string, from: number, to: number) {
  // Free-tier mode: do not call upstream; return a minimal mock candle set
  const days = Math.max(2, Math.floor((to - from) / (24 * 60 * 60)))
  const t: number[] = []
  const c: number[] = []
  let price = 100
  for (let i = 0; i < days; i++) {
    t.push(from + i * 24 * 60 * 60)
    price = price * (0.99 + 0.02 * (i % 10 === 0 ? 0.5 : 0.1))
    c.push(price)
  }
  return { s: 'ok', t, c }
}

async function fetchRiskFreeRate() {
  // Free-tier mode: fixed default risk-free rate
  return 0.035
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { stocks } = body;

    if (!Array.isArray(stocks) || stocks.length === 0) {
      return NextResponse.json({ error: 'Invalid stocks data' }, { status: 400 });
    }

    const to = Math.floor(Date.now() / 1000);
    const from = to - (5 * 365 * 24 * 60 * 60); // 5 years of data
    
    // Calculate portfolio weights if not provided
    if (!stocks[0].weight) {
      const weights = calculateWeights(stocks);
      stocks.forEach((stock, i) => {
        stock.weight = weights[i];
      });
    }

    // Fetch historical data for all stocks and benchmark
    const symbols = [...stocks.map(s => s.symbol), '^GSPC']; // Include S&P 500 as benchmark
    const historicalData: { [key: string]: StockHistory } = {};

    const promises = symbols.map(async (symbol: string) => {
      const data = await fetchHistoricalData(symbol, from, to);
      if (data && data.s === 'ok') {
        historicalData[symbol] = {
          symbol,
          dates: data.t.map((t: number) => new Date(t * 1000).toISOString()),
          prices: data.c
        };
      }
    });

    await Promise.all(promises);
    
    // Get risk-free rate
    const riskFreeRate = await fetchRiskFreeRate();

    // Calculate returns for each stock and the benchmark
    const stocksData: { [key: string]: { returns: number[] } } = {};
    for (const stock of stocks) {
      if (historicalData[stock.symbol]) {
        stocksData[stock.symbol] = {
          returns: calculateReturns(historicalData[stock.symbol].prices)
        };
      }
    }

    const benchmarkReturns = historicalData['^GSPC'] 
      ? calculateReturns(historicalData['^GSPC'].prices)
      : [];
    
    // Calculate portfolio metrics
    const metrics = calculatePortfolioMetrics(
      stocks,
      stocksData,
      benchmarkReturns,
      riskFreeRate
    );

    // Calculate historical values for visualization
    const initialValue = 100000; // Start with $100,000
    const portfolioValues = calculateHistoricalValues(initialValue, metrics.dailyReturns);
    const benchmarkValues = calculateHistoricalValues(initialValue, benchmarkReturns);

    // Prepare chart data
    const chartData = {
      dates: historicalData['^GSPC']?.dates || [],
      portfolioValues,
      benchmarkValues
    };

    // Generate risk-return scatter plot data
    const scatterData = generateRiskReturnScatter(stocks);

    return NextResponse.json({
      metrics,
      chartData,
      scatterData,
      riskFreeRate
    });
  } catch (error) {
    console.error('Error in portfolio risk analysis:', error);
    return NextResponse.json({ error: 'Failed to analyze portfolio risk' }, { status: 500 });
  }
}
