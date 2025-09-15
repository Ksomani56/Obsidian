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
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${process.env.FINNHUB_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch historical data');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return null;
  }
}

async function fetchRiskFreeRate() {
  try {
    // Using FRED API for 10-year Treasury rate
    const response = await fetch(
      `https://api.stlouisfed.org/fred/series/observations/DGS10?api_key=${process.env.FRED_API_KEY}&file_type=json&limit=1`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch risk-free rate');
    }
    
    const data = await response.json();
    return parseFloat(data.observations[0].value) / 100; // Convert percentage to decimal
  } catch (error) {
    console.error('Error fetching risk-free rate:', error);
    return 0.035; // Default to 3.5% if API fails
  }
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
