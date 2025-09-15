export function calculateReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  return returns;
}

export function calculateVolatility(returns: number[]): number {
  if (returns.length === 0) return 0;
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(252); // Annualized
}

export function calculateExpectedReturn(returns: number[]): number {
  if (returns.length === 0) return 0;
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  return mean * 252; // Annualized
}

export function calculateBeta(portfolioReturns: number[], marketReturns: number[]): number {
  if (portfolioReturns.length !== marketReturns.length || portfolioReturns.length === 0) return 0;
  
  const portfolioMean = portfolioReturns.reduce((sum, r) => sum + r, 0) / portfolioReturns.length;
  const marketMean = marketReturns.reduce((sum, r) => sum + r, 0) / marketReturns.length;
  
  let covariance = 0;
  let marketVariance = 0;
  
  for (let i = 0; i < portfolioReturns.length; i++) {
    covariance += (portfolioReturns[i] - portfolioMean) * (marketReturns[i] - marketMean);
    marketVariance += Math.pow(marketReturns[i] - marketMean, 2);
  }
  
  covariance /= portfolioReturns.length;
  marketVariance /= marketReturns.length;
  
  return covariance / marketVariance;
}

export function calculateAlpha(
  portfolioReturn: number,
  beta: number,
  marketReturn: number,
  riskFreeRate: number
): number {
  return portfolioReturn - (riskFreeRate + beta * (marketReturn - riskFreeRate));
}

export function calculateSharpeRatio(
  portfolioReturn: number,
  volatility: number,
  riskFreeRate: number
): number {
  return (portfolioReturn - riskFreeRate) / volatility;
}

export function calculateMaxDrawdown(prices: number[]): number {
  if (prices.length === 0) return 0;
  
  let maxDrawdown = 0;
  let peak = prices[0];
  
  for (const price of prices) {
    if (price > peak) {
      peak = price;
    } else {
      const drawdown = (peak - price) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }
  
  return maxDrawdown;
}

export function calculatePortfolioValue(stocks: { shares: number; currentPrice: number }[]): number {
  return stocks.reduce((total, stock) => total + stock.shares * stock.currentPrice, 0);
}

export function calculateWeights(stocks: { shares: number; currentPrice: number }[]): number[] {
  const totalValue = calculatePortfolioValue(stocks);
  return stocks.map(stock => (stock.shares * stock.currentPrice) / totalValue);
}

export function calculatePortfolioReturn(
  returns: number[][],
  weights: number[]
): number[] {
  if (returns.length === 0 || weights.length === 0) return [];
  
  const numPeriods = returns[0].length;
  const portfolioReturns = new Array(numPeriods).fill(0);
  
  for (let i = 0; i < returns.length; i++) {
    for (let j = 0; j < numPeriods; j++) {
      portfolioReturns[j] += returns[i][j] * weights[i];
    }
  }
  
  return portfolioReturns;
}

export function calculatePortfolioMetrics(
  stocks: { symbol: string; shares: number; currentPrice: number; weight: number }[],
  historicalData: { [symbol: string]: { returns: number[] } },
  benchmarkReturns: number[],
  riskFreeRate: number
) {
  // Calculate portfolio returns
  const portfolioReturns: number[] = [];
  const numPeriods = benchmarkReturns.length;

  for (let i = 0; i < numPeriods; i++) {
    let periodReturn = 0;
    stocks.forEach(stock => {
      if (historicalData[stock.symbol]?.returns[i] !== undefined) {
        periodReturn += stock.weight * historicalData[stock.symbol].returns[i];
      }
    });
    portfolioReturns.push(periodReturn);
  }

  // Calculate metrics
  const volatility = calculateVolatility(portfolioReturns);
  const expectedReturn = calculateExpectedReturn(portfolioReturns);
  const beta = calculateBeta(portfolioReturns, benchmarkReturns);
  const marketReturn = calculateExpectedReturn(benchmarkReturns);
  const alpha = calculateAlpha(expectedReturn, beta, marketReturn, riskFreeRate);
  const sharpeRatio = calculateSharpeRatio(expectedReturn, volatility, riskFreeRate);
  const maxDrawdown = calculateMaxDrawdown(portfolioReturns);
  const totalValue = calculatePortfolioValue(stocks);

  return {
    expectedReturn,
    volatility,
    sharpeRatio,
    beta,
    alpha,
    maxDrawdown,
    totalValue,
    dailyReturns: portfolioReturns,
    riskFreeRate
  };
}

export function generateRiskReturnScatter(
  stocks: { symbol: string; risk: number; return: number }[]
) {
  return stocks.map(stock => ({
    symbol: stock.symbol,
    risk: stock.risk,
    return: stock.return
  }));
}

export function calculateHistoricalValues(
  initialValue: number,
  returns: number[]
): number[] {
  const values = [initialValue];
  let currentValue = initialValue;

  for (const ret of returns) {
    currentValue = currentValue * (1 + ret);
    values.push(currentValue);
  }

  return values;
}
