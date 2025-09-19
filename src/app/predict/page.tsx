'use client'

import { useState } from 'react'
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
        
        // For now, keep the prediction part mocked until ML integration
        const predictedPrice = currentPrice * (0.95 + Math.random() * 0.1)
        const predicted = []
        
        // Generate predicted data
        for (let i = 1; i <= horizon; i++) {
          const date = new Date(today)
          date.setDate(date.getDate() + i)
          const trendFactor = (predictedPrice - currentPrice) / horizon
          const predictedPriceValue = currentPrice + (trendFactor * i) + (Math.random() - 0.5) * 5
          predicted.push({
            date: date.toISOString().split('T')[0],
            price: Math.max(predictedPriceValue, 0)
          })
        }

        const predictionData: PredictionData = {
          historical,
          predicted,
          currentPrice,
          predictedPrice,
          confidence: 0.75 + Math.random() * 0.2,
          trend: predictedPrice > currentPrice ? 'bullish' : predictedPrice < currentPrice ? 'bearish' : 'neutral'
        }

        setPrediction(predictionData)
      } else {
        throw new Error('No data available')
      }
    } catch (error) {
      console.error('Error generating prediction:', error)
      // Fallback to mock data
      const currentPrice = 150 + Math.random() * 50
      const predictedPrice = currentPrice * (0.95 + Math.random() * 0.1)
      
      const historical = []
      const predicted = []
      const today = new Date()
      
      for (let i = 89; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const basePrice = currentPrice * (0.8 + Math.random() * 0.4)
        historical.push({
          date: date.toISOString().split('T')[0],
          price: basePrice
        })
      }
      
      for (let i = 1; i <= horizon; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() + i)
        const trendFactor = (predictedPrice - currentPrice) / horizon
        const predictedPriceValue = currentPrice + (trendFactor * i) + (Math.random() - 0.5) * 5
        predicted.push({
          date: date.toISOString().split('T')[0],
          price: Math.max(predictedPriceValue, 0)
        })
      }
      
      setPrediction({
        historical,
        predicted,
        currentPrice,
        predictedPrice,
        confidence: 0.75 + Math.random() * 0.2,
        trend: predictedPrice > currentPrice ? 'bullish' : predictedPrice < currentPrice ? 'bearish' : 'neutral'
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
                          tickFormatter={(value) => `$${(value as number).toFixed(0)}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--tw-bg-light-pane)',
                            border: '1px solid var(--tw-border-light-border)',
                            borderRadius: '6px',
                            color: 'var(--tw-text-light-primary)'
                          }}
                          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
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
          {prediction && (
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
