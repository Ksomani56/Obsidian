'use client'

import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { TrendingUp, Calendar, BarChart3, Activity, Target, AlertTriangle } from 'lucide-react'
import Widget from '@/components/Widget'
import ChartHeader from '@/components/ChartHeader'
  
import { useCurrency, formatCurrency } from '@/context/CurrencyContext'

interface PredictionData {
  historical: { date: string; price: number }[]
  predicted: { date: string; price: number }[]
  currentPrice: number
  predictedPrice: number
  confidence: number
  trend: 'bullish' | 'bearish' | 'neutral'
  technicalIndicators?: {
    rsi: number
    sma20: number
    sma50: number
    volatility: number
    momentum: number
  }
  predictionMethod?: string
}

// Technical Analysis Functions
function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = []
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
    sma.push(sum / period)
  }
  return sma
}

function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50
  
  const gains: number[] = []
  const losses: number[] = []
  
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1]
    gains.push(change > 0 ? change : 0)
    losses.push(change < 0 ? Math.abs(change) : 0)
  }
  
  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period
  
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - (100 / (1 + rs))
}

function calculateVolatility(prices: number[], period: number = 20): number {
  if (prices.length < period + 1) return 0
  
  const returns: number[] = []
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1])
  }
  
  const recentReturns = returns.slice(-period)
  const mean = recentReturns.reduce((a, b) => a + b, 0) / recentReturns.length
  const variance = recentReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / recentReturns.length
  
  return Math.sqrt(variance * 252) // Annualized volatility
}

function calculateMomentum(prices: number[], period: number = 10): number {
  if (prices.length < period + 1) return 0
  return (prices[prices.length - 1] - prices[prices.length - 1 - period]) / prices[prices.length - 1 - period]
}

// ML Prediction Functions
function predictWithLinearRegression(prices: number[], horizon: number): { predicted: number[], confidence: number } {
  if (prices.length < 10) {
    return { predicted: Array(horizon).fill(prices[prices.length - 1]), confidence: 0.3 }
  }
  
  // Simple linear regression
  const n = prices.length
  const x = Array.from({ length: n }, (_, i) => i)
  const y = prices
  
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  // Calculate R-squared for confidence
  const yMean = sumY / n
  const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2), 0)
  const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0)
  const rSquared = 1 - (ssRes / ssTot)
  
  const predicted: number[] = []
  for (let i = 1; i <= horizon; i++) {
    predicted.push(Math.max(slope * (n + i - 1) + intercept, 0))
  }
  
  return { predicted, confidence: Math.max(0.3, Math.min(0.9, rSquared)) }
}

function predictWithMovingAverage(prices: number[], horizon: number): { predicted: number[], confidence: number } {
  if (prices.length < 20) {
    return { predicted: Array(horizon).fill(prices[prices.length - 1]), confidence: 0.4 }
  }
  
  const sma20 = calculateSMA(prices, 20)
  const sma50 = calculateSMA(prices, Math.min(50, prices.length))
  
  const currentSMA20 = sma20[sma20.length - 1]
  const currentSMA50 = sma50[sma50.length - 1]
  const currentPrice = prices[prices.length - 1]
  
  // Trend analysis
  const trend = currentSMA20 > currentSMA50 ? 1 : -1
  const momentum = (currentPrice - currentSMA20) / currentSMA20
  
  const predicted: number[] = []
  for (let i = 1; i <= horizon; i++) {
    const trendFactor = trend * momentum * 0.1 // Conservative trend continuation
    const predictedPrice = currentPrice * (1 + trendFactor * i)
    predicted.push(Math.max(predictedPrice, 0))
  }
  
  // Confidence based on trend consistency
  const confidence = Math.max(0.4, Math.min(0.8, Math.abs(momentum) * 2 + 0.4))
  
  return { predicted, confidence }
}

function predictWithTechnicalAnalysis(prices: number[], horizon: number): { predicted: number[], confidence: number, indicators: any } {
  const rsi = calculateRSI(prices)
  const volatility = calculateVolatility(prices)
  const momentum = calculateMomentum(prices)
  const sma20 = calculateSMA(prices, 20)
  const sma50 = calculateSMA(prices, Math.min(50, prices.length))
  
  const currentPrice = prices[prices.length - 1]
  const currentSMA20 = sma20[sma20.length - 1]
  const currentSMA50 = sma50[sma50.length - 1]
  
  // Technical signals
  const isOversold = rsi < 30
  const isOverbought = rsi > 70
  const isBullishTrend = currentPrice > currentSMA20 && currentSMA20 > currentSMA50
  const isBearishTrend = currentPrice < currentSMA20 && currentSMA20 < currentSMA50
  
  let trendSignal = 0
  let confidence = 0.5
  
  // RSI signals
  if (isOversold) {
    trendSignal += 0.3
    confidence += 0.1
  } else if (isOverbought) {
    trendSignal -= 0.3
    confidence += 0.1
  }
  
  // Moving average signals
  if (isBullishTrend) {
    trendSignal += 0.4
    confidence += 0.15
  } else if (isBearishTrend) {
    trendSignal -= 0.4
    confidence += 0.15
  }
  
  // Momentum signals
  if (momentum > 0.05) {
    trendSignal += 0.2
    confidence += 0.1
  } else if (momentum < -0.05) {
    trendSignal -= 0.2
    confidence += 0.1
  }
  
  // Volatility adjustment
  const volatilityAdjustment = Math.min(volatility * 0.5, 0.3)
  confidence = Math.max(0.3, Math.min(0.9, confidence - volatilityAdjustment))
  
  const predicted: number[] = []
  const allowRandomness = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DEBUG === '1'
  for (let i = 1; i <= horizon; i++) {
    const trendFactor = trendSignal * (1 - i / horizon) // Diminishing trend over time
    const volatilityFactor = allowRandomness ? (Math.random() - 0.5) * volatility * 0.1 : 0
    const predictedPrice = currentPrice * (1 + trendFactor + volatilityFactor)
    predicted.push(Math.max(predictedPrice, 0))
  }
  
  return {
    predicted,
    confidence,
    indicators: {
      rsi,
      sma20: currentSMA20,
      sma50: currentSMA50,
      volatility,
      momentum
    }
  }
}

function ensemblePrediction(prices: number[], horizon: number): { predicted: number[], confidence: number, method: string, indicators: any } {
  const lrResult = predictWithLinearRegression(prices, horizon)
  const maResult = predictWithMovingAverage(prices, horizon)
  const taResult = predictWithTechnicalAnalysis(prices, horizon)
  
  // Weighted ensemble (technical analysis gets higher weight)
  const weights = { lr: 0.2, ma: 0.3, ta: 0.5 }
  
  const predicted: number[] = []
  for (let i = 0; i < horizon; i++) {
    const ensemblePrice = 
      lrResult.predicted[i] * weights.lr +
      maResult.predicted[i] * weights.ma +
      taResult.predicted[i] * weights.ta
    
    predicted.push(ensemblePrice)
  }
  
  const confidence = Math.max(
    lrResult.confidence * weights.lr +
    maResult.confidence * weights.ma +
    taResult.confidence * weights.ta,
    0.3
  )
  
  return {
    predicted,
    confidence,
    method: 'Ensemble (Linear Regression + Moving Average + Technical Analysis)',
    indicators: taResult.indicators
  }
}

export default function PredictPage() {
  const { currency, fxRate } = useCurrency()
  const [ticker, setTicker] = useState('AAPL')
  const [horizon, setHorizon] = useState(30)
  const [prediction, setPrediction] = useState<PredictionData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const generatePrediction = async () => {
    setIsLoading(true)
    try {
      // Get historical data from real API
      const today = new Date()
      const ninetyDaysAgo = new Date(today)
      ninetyDaysAgo.setDate(today.getDate() - 90)

      const [candleRes, quoteRes] = await Promise.all([
        fetch(`/api/candle?symbol=${ticker}&from=${Math.floor(ninetyDaysAgo.getTime() / 1000)}&to=${Math.floor(today.getTime() / 1000)}`),
        fetch(`/api/quote?symbol=${ticker}`)
      ])

      const [candleData, quoteData] = await Promise.all([
        candleRes.json(),
        quoteRes.json()
      ])

      if (candleData.s === 'ok' && candleData.t.length > 0 && quoteData.c) {
        const historical = candleData.t.map((timestamp: number, index: number) => ({
          date: new Date(timestamp * 1000).toISOString().split('T')[0],
          price: candleData.c[index]
        }))

        const currentPrice = quoteData.c
  const prices = historical.map((h: { date: string; price: number }) => h.price)
        
        console.log(`Generating ML prediction for ${ticker} with ${prices.length} data points`)
        
        // Use ensemble ML prediction
        const mlResult = ensemblePrediction(prices, horizon)
        
        const predicted = []
        for (let i = 1; i <= horizon; i++) {
          const date = new Date(today)
          date.setDate(date.getDate() + i)
          predicted.push({
            date: date.toISOString().split('T')[0],
            price: mlResult.predicted[i - 1]
          })
        }

        const predictedPrice = mlResult.predicted[mlResult.predicted.length - 1]
        const priceChange = predictedPrice - currentPrice
        const trend: 'bullish' | 'bearish' | 'neutral' = 
          priceChange > currentPrice * 0.02 ? 'bullish' : 
          priceChange < -currentPrice * 0.02 ? 'bearish' : 'neutral'

        const predictionData: PredictionData = {
          historical,
          predicted,
          currentPrice,
          predictedPrice,
          confidence: mlResult.confidence,
          trend,
          technicalIndicators: mlResult.indicators,
          predictionMethod: mlResult.method
        }
        
        console.log(`ML Prediction completed:`, {
          currentPrice: currentPrice.toFixed(2),
          predictedPrice: predictedPrice.toFixed(2),
          confidence: (mlResult.confidence * 100).toFixed(1) + '%',
          trend,
          rsi: mlResult.indicators.rsi.toFixed(1),
          volatility: (mlResult.indicators.volatility * 100).toFixed(1) + '%'
        })

        setPrediction(predictionData)
      } else {
        throw new Error('No data available')
      }
    } catch (error) {
      console.error('Error generating prediction:', error)
      
      // Fallback: Show error message instead of fake data
      setPrediction({
        historical: [],
        predicted: [],
        currentPrice: 0,
        predictedPrice: 0,
        confidence: 0,
        trend: 'neutral',
        predictionMethod: 'Error: Unable to fetch data'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'bullish': return 'metric-positive'
      case 'bearish': return 'metric-negative'
      default: return 'text-tv-secondary-text'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish': return '📈'
      case 'bearish': return '📉'
      default: return '➡️'
    }
  }

  const getCompanyName = (ticker: string) => {
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
    return companies[ticker] || `${ticker} Corporation`
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex">
      {/* Main Chart Panel */}
      <div className="flex-grow flex flex-col">
        {/* Chart Header */}
        {prediction ? (
          <ChartHeader
            ticker={ticker}
            name={getCompanyName(ticker)}
            price={prediction.currentPrice}
            change={prediction.predictedPrice - prediction.currentPrice}
            changePercent={((prediction.predictedPrice - prediction.currentPrice) / prediction.currentPrice) * 100}
          />
        ) : (
          <div className="px-4 py-3 border-b border-primary bg-primary">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-primary">{ticker}</h1>
                <p className="text-sm text-secondary">{getCompanyName(ticker)}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">--</div>
                <div className="text-sm text-secondary">--</div>
              </div>
            </div>
          </div>
        )}

        {/* Chart Container */}
        <div className="flex-grow bg-secondary">
          {prediction ? (
            <div className="h-full p-4">
              <ResponsiveContainer width="100%" height="100%">
                {
                  (() => {
                    // Build combined data where historical points populate `hist` and predicted populate `pred`.
                    const combined: { date: string; hist?: number | null; pred?: number | null }[] = []
                    const hist = prediction.historical || []
                    const pred = prediction.predicted || []

                    // Add historical points
                    for (const h of hist) combined.push({ date: h.date, hist: h.price, pred: null })
                    // Add predicted points (they are future dates, append)
                    for (const p of pred) combined.push({ date: p.date, hist: null, pred: p.price })

                    return (
                      <LineChart data={combined}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => formatCurrency(value as number, currency, fxRate)}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--tw-bg-light-pane)',
                            border: '1px solid var(--tw-border-light-border)',
                            borderRadius: '6px',
                            color: 'var(--tw-text-light-primary)'
                          }}
                          formatter={(value: number) => [formatCurrency(value, currency, fxRate), 'Price']}
                          labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Legend />

                        {/* Historical series (hist) */}
                        <Line
                          type="monotone"
                          dataKey="hist"
                          stroke="#8B5CF6"
                          strokeWidth={2}
                          dot={false}
                          name="Historical Prices"
                          connectNulls={false}
                        />

                        {/* Predicted series (pred) */}
                        <Line
                          type="monotone"
                          dataKey="pred"
                          stroke="#10B981"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                          name="Predicted Prices"
                          connectNulls={false}
                        />

                        {/* Vertical marker at prediction start */}
                        {prediction.predicted && prediction.predicted.length > 0 && (
                          <ReferenceLine x={prediction.predicted[0].date} stroke="#6B7280" strokeDasharray="3 3" label={{ value: 'Prediction starts', position: 'top', fill: '#6B7280' }} />
                        )}
                      </LineChart>
                    )
                  })()
                }
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 text-secondary mx-auto mb-4" />
                <p className="text-secondary">Generate a prediction to view the chart</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 flex-shrink-0 border-l border-primary bg-primary overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Predict Widget */}
          <Widget title="Predict">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-tv-secondary-text mb-2">
                  Stock Ticker
                </label>
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="AAPL"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-tv-secondary-text mb-2">
                  Prediction Horizon (Days)
                </label>
                <input
                  type="number"
                  value={horizon}
                  onChange={(e) => setHorizon(parseInt(e.target.value) || 30)}
                  min="1"
                  max="365"
                  className="input-field"
                />
              </div>

              <button
                onClick={generatePrediction}
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4 mr-2" />
                    Generate Prediction
                  </>
                )}
              </button>
            </div>
          </Widget>

          {/* Key Statistics Widget */}
          {prediction && prediction.currentPrice > 0 && (
            <Widget title="Key Statistics">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-tv-secondary-text text-sm">Current Price</span>
                  <span className="text-tv-primary-text font-semibold">
                    {formatCurrency(prediction.currentPrice, currency, fxRate)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-tv-secondary-text text-sm">Predicted Price</span>
                  <span className="text-tv-primary-text font-semibold">
                    {formatCurrency(prediction.predictedPrice, currency, fxRate)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-tv-secondary-text text-sm">Expected Change</span>
                  <span className={`font-semibold ${getTrendColor(prediction.trend)}`}>
                    {getTrendIcon(prediction.trend)} {((prediction.predictedPrice - prediction.currentPrice) / prediction.currentPrice * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-tv-secondary-text text-sm">Confidence</span>
                  <span className="text-tv-blue font-semibold">
                    {(prediction.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-tv-secondary-text text-sm">Trend</span>
                  <span className={`font-semibold capitalize ${getTrendColor(prediction.trend)}`}>
                    {prediction.trend}
                  </span>
                </div>
                {prediction.predictionMethod && (
                  <div className="pt-2 border-t border-tv-border">
                    <div className="text-xs text-tv-secondary-text">
                      <strong>Method:</strong> {prediction.predictionMethod}
                    </div>
                  </div>
                )}
              </div>
            </Widget>
          )}

          {/* Technical Indicators Widget */}
          {prediction && prediction.technicalIndicators && (
            <Widget title="Technical Analysis">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-tv-secondary-text text-sm">RSI (14)</span>
                  <span className={`font-semibold ${
                    prediction.technicalIndicators.rsi > 70 ? 'text-red-500' :
                    prediction.technicalIndicators.rsi < 30 ? 'text-green-500' :
                    'text-tv-primary-text'
                  }`}>
                    {prediction.technicalIndicators.rsi.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-tv-secondary-text text-sm">Volatility</span>
                  <span className="text-tv-primary-text font-semibold">
                    {(prediction.technicalIndicators.volatility * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-tv-secondary-text text-sm">Momentum (10d)</span>
                  <span className={`font-semibold ${
                    prediction.technicalIndicators.momentum > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {(prediction.technicalIndicators.momentum * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-tv-secondary-text text-sm">SMA 20</span>
                  <span className="text-tv-primary-text font-semibold">
                    {formatCurrency(prediction.technicalIndicators.sma20, currency, fxRate)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-tv-secondary-text text-sm">SMA 50</span>
                  <span className="text-tv-primary-text font-semibold">
                    {formatCurrency(prediction.technicalIndicators.sma50, currency, fxRate)}
                  </span>
                </div>
              </div>
            </Widget>
          )}

          {/* Error State */}
          {prediction && prediction.predictionMethod?.includes('Error') && (
            <Widget title="Prediction Error">
              <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-md">
                <div className="flex items-center">
                  <div className="text-red-600 dark:text-red-400 mr-2">❌</div>
                  <div className="text-sm text-red-800 dark:text-red-200">
                    <strong>Unable to generate prediction:</strong> {prediction.predictionMethod}
                  </div>
                </div>
              </div>
            </Widget>
          )}

          {/* Market Overview Widget */}
          <Widget title="Market Overview">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-tv-secondary-text text-sm">Market Cap</span>
                <span className="text-tv-primary-text font-semibold">{formatCurrency(2800000000000, currency, fxRate)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-tv-secondary-text text-sm">P/E Ratio</span>
                <span className="text-tv-primary-text font-semibold">28.5</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-tv-secondary-text text-sm">52W High</span>
                <span className="text-tv-primary-text font-semibold">{formatCurrency(182.94, currency, fxRate)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-tv-secondary-text text-sm">52W Low</span>
                <span className="text-tv-primary-text font-semibold">{formatCurrency(124.17, currency, fxRate)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-tv-secondary-text text-sm">Volume</span>
                <span className="text-tv-primary-text font-semibold">45.2M</span>
              </div>
            </div>
          </Widget>
        </div>
      </div>
    </div>
  )
}
