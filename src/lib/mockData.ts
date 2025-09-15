// Mock data generators for portfolio risk and stock prediction

export interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
}

export interface PortfolioRiskData {
  expectedReturn: number
  volatility: number
  sharpeRatio: number
  maxDrawdown: number
  var95: number
  weights: { symbol: string; weight: number; color: string }[]
}

export interface PredictionData {
  symbol: string
  currentPrice: number
  predictedPrice: number
  confidence: number
  trend: 'bullish' | 'bearish' | 'neutral'
  historical: { date: string; price: number }[]
  predicted: { date: string; price: number }[]
}

// Generate mock stock data
export function generateStockData(symbol: string): StockData {
  const basePrice = 50 + Math.random() * 200
  const change = (Math.random() - 0.5) * 10
  const changePercent = (change / basePrice) * 100
  
  return {
    symbol,
    name: getCompanyName(symbol),
    price: basePrice,
    change,
    changePercent,
    volume: Math.floor(Math.random() * 10000000) + 1000000,
    marketCap: Math.floor(basePrice * (Math.random() * 1000000000) + 1000000000)
  }
}

// Generate mock portfolio risk data
export function generatePortfolioRisk(tickers: string[], weights: number[]): PortfolioRiskData {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16']
  
  return {
    expectedReturn: 0.08 + Math.random() * 0.12, // 8-20%
    volatility: 0.12 + Math.random() * 0.15, // 12-27%
    sharpeRatio: 0.6 + Math.random() * 0.8, // 0.6-1.4
    maxDrawdown: 0.05 + Math.random() * 0.15, // 5-20%
    var95: 0.02 + Math.random() * 0.08, // 2-10%
    weights: tickers.map((ticker, index) => ({
      symbol: ticker,
      weight: weights[index],
      color: colors[index % colors.length]
    }))
  }
}

// Generate mock prediction data
export function generatePrediction(symbol: string, horizon: number): PredictionData {
  const currentPrice = 50 + Math.random() * 200
  const trendFactor = (Math.random() - 0.5) * 0.2 // -10% to +10% change
  const predictedPrice = currentPrice * (1 + trendFactor)
  const confidence = 0.6 + Math.random() * 0.3 // 60-90% confidence
  
  // Generate historical data (last 90 days)
  const historical = []
  const today = new Date()
  
  for (let i = 89; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const price = currentPrice * (0.8 + Math.random() * 0.4) // ±20% variation
    historical.push({
      date: date.toISOString().split('T')[0],
      price: Math.max(price, 1) // Ensure positive price
    })
  }
  
  // Generate predicted data
  const predicted = []
  for (let i = 1; i <= horizon; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    const progress = i / horizon
    const price = currentPrice + (predictedPrice - currentPrice) * progress + (Math.random() - 0.5) * 5
    predicted.push({
      date: date.toISOString().split('T')[0],
      price: Math.max(price, 1) // Ensure positive price
    })
  }
  
  const trend = predictedPrice > currentPrice ? 'bullish' : 
                predictedPrice < currentPrice ? 'bearish' : 'neutral'
  
  return {
    symbol,
    currentPrice,
    predictedPrice,
    confidence,
    trend,
    historical,
    predicted
  }
}

// Helper function to get company names
function getCompanyName(symbol: string): string {
  const companies: { [key: string]: string } = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'GOOGL': 'Alphabet Inc.',
    'AMZN': 'Amazon.com Inc.',
    'TSLA': 'Tesla Inc.',
    'META': 'Meta Platforms Inc.',
    'NVDA': 'NVIDIA Corporation',
    'NFLX': 'Netflix Inc.',
    'AMD': 'Advanced Micro Devices',
    'INTC': 'Intel Corporation'
  }
  
  return companies[symbol] || `${symbol} Corporation`
}

// Generate random market data for dashboard
export function generateMarketData(): StockData[] {
  const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC']
  return symbols.map(symbol => generateStockData(symbol))
}
