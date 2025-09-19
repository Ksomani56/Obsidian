'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, Shield, BarChart3, Activity, ArrowRight, Globe, DollarSign, Search } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Widget from '@/components/Widget'
import { MarketRow, QuickStat } from '@/components/MarketComponents'
import { useCurrency, formatCurrency } from '@/context/CurrencyContext'
import ChartHeader from '@/components/ChartHeader'

export default function Home() {
  const { currency, fxRate } = useCurrency()
  const [selectedStock, setSelectedStock] = useState('AAPL')
  const [stockData, setStockData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoadingSymbols, setIsLoadingSymbols] = useState(false)
  const [symbols, setSymbols] = useState<{
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
    exchange?: string;
  }[]>([])
  const [symbolsAreMock, setSymbolsAreMock] = useState(false)
  const [filteredSymbols, setFilteredSymbols] = useState<typeof symbols>([])
  const [showSymbols, setShowSymbols] = useState(false)
  const [symbolError, setSymbolError] = useState<string | null>(null)
  const [liveMarketData, setLiveMarketData] = useState<any[]>([])
  const [searchSubmitError, setSearchSubmitError] = useState<string | null>(null)
  const [selectedName, setSelectedName] = useState<string>('')
  const [selectedQuote, setSelectedQuote] = useState<{ c?: number; d?: number; dp?: number } | null>(null)

  const marketIndices = ['^GSPC', '^IXIC', '^DJI', '^NSEI', '^FTSE']

  // Fetch stock symbols on mount
  useEffect(() => {
    const fetchSymbols = async () => {
      setIsLoadingSymbols(true);
      setSymbolError(null);
      try {
        const res = await fetch('/api/symbols');
          const data = await res.json();
        
          if (!res.ok) {
            throw new Error(data.error || 'Failed to fetch symbols');
          }

          // Support new payload { symbols, isMock } or legacy array
          if (Array.isArray(data)) {
            console.log(`Loaded ${data.length} symbols (legacy)`); // Debug log
            setSymbols(data);
            setSymbolsAreMock(false)
          } else if (data && Array.isArray(data.symbols)) {
            console.log(`Loaded ${data.symbols.length} symbols`); // Debug log
            setSymbols(data.symbols);
            setSymbolsAreMock(Boolean(data.isMock));
          } else {
            throw new Error('Invalid response format');
          }
          // Initialize selectedName based on default selectedStock if present
          const found = (Array.isArray(data) ? data : data.symbols || []).find((s: any) => (s.symbol || s.displaySymbol) === selectedStock)
          if (found) {
            setSelectedName(found.description || found.symbol || selectedStock)
          } else {
            setSelectedName(selectedStock)
          }
      } catch (error) {
        console.error('Error fetching symbols:', error);
        setSymbolError(error instanceof Error ? error.message : 'Failed to load symbols');
      } finally {
        setIsLoadingSymbols(false);
      }
    };
    
    fetchSymbols();
  }, [])
  
  // Update filtered symbols based on search query
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    console.log(`Filtering symbols for query: ${searchQuery}`); // Debug log
    console.log(`Total symbols available: ${symbols.length}`); // Debug log

    if (q.length > 0) {
      const filtered = symbols
        .filter(s => {
          const matchesSymbol = s.symbol?.toLowerCase().includes(q);
          const matchesDisplay = s.displaySymbol?.toLowerCase().includes(q);
          const matchesDescription = s.description?.toLowerCase().includes(q);
          return matchesSymbol || matchesDisplay || matchesDescription;
        })
        .slice(0, 50);

      console.log(`Found ${filtered.length} matches`); // Debug log
      setFilteredSymbols(filtered);
      // keep showSymbols controlled by focus/click
    } else {
      // Default dropdown: non-US symbols sorted alphabetically by displaySymbol then symbol
      const defaults = symbols
        .filter(s => (s.exchange || '').toUpperCase() !== 'US')
        .sort((a, b) => ((a.displaySymbol || a.symbol) .toLowerCase()).localeCompare(((b.displaySymbol || b.symbol).toLowerCase())))
        .slice(0, 200);

      // If no non-US symbols, fall back to all symbols alphabetically
      const finalDefaults = defaults.length > 0
        ? defaults
        : symbols
            .sort((a, b) => ((a.displaySymbol || a.symbol).toLowerCase()).localeCompare(((b.displaySymbol || b.symbol).toLowerCase())))
            .slice(0, 200);

      setFilteredSymbols(finalDefaults);
    }
  }, [searchQuery, symbols])

  // Show dropdown when input is focused
  const handleSearchFocus = () => {
    setShowSymbols(true)
  }

  // Hide dropdown on blur after a short delay to allow click handlers to run
  const handleSearchBlur = () => {
    setTimeout(() => setShowSymbols(false), 150)
  }
  
  const handleSearchKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const input = searchQuery.trim()
      if (!input) return
      const best = filteredSymbols[0]
      const symbolToTry = best ? best.symbol : input.toUpperCase()
      await validateAndSelectSymbol(symbolToTry)
    }
  }


  // Fetch market data
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const promises = marketIndices.map(async (symbol) => {
          try {
            const response = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`)
            if (!response.ok) throw new Error('Quote unavailable')
            const data = await response.json()
            if (typeof data.c !== 'number' || data.c <= 0) throw new Error('No quote')
            return {
              name: symbol.replace('^', ''),
              price: data.c,
              change: typeof data.d === 'number' ? data.d : null,
              changePercent: typeof data.dp === 'number' ? data.dp : null,
              isPositive: typeof data.d === 'number' ? data.d > 0 : false,
            }
          } catch {
            return {
              name: symbol.replace('^', ''),
              price: null,
              change: null,
              changePercent: null,
              isPositive: false,
            }
          }
        })
        
        const marketData = await Promise.all(promises)
        setLiveMarketData(marketData)
      } catch (error) {
        console.error('Error fetching market data:', error)
      }
    }

    fetchMarketData()
    const interval = setInterval(fetchMarketData, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const generateStockData = async (ticker: string) => {
    setIsLoading(true)
    try {
      const today = new Date()
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 30)

      const [candleRes, quoteRes] = await Promise.all([
        fetch(`/api/candle?symbol=${encodeURIComponent(ticker)}&from=${Math.floor(thirtyDaysAgo.getTime() / 1000)}&to=${Math.floor(today.getTime() / 1000)}`),
        fetch(`/api/quote?symbol=${encodeURIComponent(ticker)}`)
      ])

      const [candleData, quoteData] = await Promise.all([
        candleRes.json(),
        quoteRes.ok ? quoteRes.json() : Promise.resolve({})
      ])

      if (candleData.s === 'ok' && candleData.t.length > 0) {
        const data = candleData.t.map((timestamp: number, index: number) => ({
          date: new Date(timestamp * 1000).toISOString().split('T')[0],
          price: candleData.c[index]
        }))

        // Add current price from quote if it's newer
        const lastDate = new Date(candleData.t[candleData.t.length - 1] * 1000).toISOString().split('T')[0]
        const today = new Date().toISOString().split('T')[0]
        
        if (lastDate !== today && quoteData && quoteData.c) {
          data.push({
            date: today,
            price: quoteData.c
          })
        }

        setStockData(data)
        setSelectedQuote({ c: quoteData?.c, d: quoteData?.d, dp: quoteData?.dp })
      } else {
        throw new Error('No data available')
      }
    } catch (error) {
      console.error('Error fetching stock data:', error)
      // Fallback to mock data
      const data = []
      const basePrice = 100 + Math.random() * 200
      const today = new Date()
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const price = basePrice * (0.8 + Math.random() * 0.4)
        data.push({
          date: date.toISOString().split('T')[0],
          price: Math.max(price, 1)
        })
      }
      
      setStockData(data)
      setSelectedQuote(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStockChange = (ticker: string) => {
    setSelectedStock(ticker)
    generateStockData(ticker)
  }

  const handleStockSelect = async (symbol: string) => {
    await validateAndSelectSymbol(symbol)
  };

  const validateAndSelectSymbol = async (symbol: string) => {
    try {
      setSearchSubmitError(null)
      const res = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`)
      if (!res.ok) throw new Error('Stock not found')
      const quote = await res.json()
      if (!quote || typeof quote.c !== 'number' || quote.c <= 0) throw new Error('Stock not found')

      setSelectedStock(symbol)
      setSelectedQuote({ c: quote.c, d: quote.d, dp: quote.dp })
      const match = symbols.find(s => s.symbol === symbol || s.displaySymbol === symbol)
      setSelectedName(match ? (match.description || symbol) : symbol)
      setSearchQuery('')
      setShowSymbols(false)
      await generateStockData(symbol)
    } catch (err) {
      setSearchSubmitError('Stock not found')
    }
  }

  // Generate initial data on component mount
  useEffect(() => {
    generateStockData(selectedStock)
  }, [])

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Portfolio Risk & Stock Prediction Widgets */}
          <div className="grid md:grid-cols-2 gap-6">
            <Link href="/risk" className="group">
              <Widget className="hover:bg-light-hover dark:hover:bg-dark-hover transition-colors duration-200 cursor-pointer">
                <div className="flex items-center mb-4">
                  <Shield className="h-6 w-6 text-light-accent dark:text-dark-accent mr-3" />
                  <h2 className="text-lg font-semibold text-primary">
                    Portfolio Risk
                  </h2>
                </div>
                <p className="text-secondary text-sm mb-4">
                  Analyze your portfolio's risk metrics including expected return, volatility, and Sharpe ratio
                </p>
                <div className="flex items-center text-light-accent dark:text-dark-accent font-medium text-sm group-hover:opacity-80">
                  Analyze Portfolio
                  <ArrowRight className="h-4 w-4 ml-2" />
                </div>
              </Widget>
            </Link>

            <Link href="/predict" className="group">
              <Widget className="hover:bg-light-hover dark:hover:bg-dark-hover transition-colors duration-200 cursor-pointer">
                <div className="flex items-center mb-4">
                  <BarChart3 className="h-6 w-6 text-light-green dark:text-dark-green mr-3" />
                  <h2 className="text-lg font-semibold text-primary">
                    Stock Prediction
                  </h2>
                </div>
                <p className="text-secondary text-sm mb-4">
                  Get AI-powered predictions for stock prices with historical analysis and trend forecasting
                </p>
                <div className="flex items-center text-light-green dark:text-dark-green font-medium text-sm group-hover:opacity-80">
                  Predict Prices
                  <Activity className="h-4 w-4 ml-2" />
                </div>
              </Widget>
            </Link>
          </div>

          {/* Interactive Stock Chart Widget */}
          <Widget title="Live Stock Chart">
            <div className="space-y-4">
              {/* Stock Search */}
              <div className="relative">
                {symbolsAreMock && (
                  <div className="mb-2 text-xs text-yellow-400">Using mock symbol list (FINNHUB_API_KEY missing or API unavailable)</div>
                )}
                {searchSubmitError && (
                  <div className="mb-2 text-xs text-red-500">{searchSubmitError}</div>
                )}
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-secondary" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                    onKeyDown={handleSearchKeyDown}
                    placeholder={isLoadingSymbols ? "Loading symbols..." : "Search stocks..."}
                    className="flex-1 px-3 py-2 border border-primary rounded-md bg-secondary text-primary focus:outline-none focus:border-light-accent dark:focus:border-dark-accent"
                    disabled={isLoadingSymbols}
                  />
                </div>
                
                {/* Symbol Suggestions */}
                {showSymbols && (
                  <div className="absolute z-10 w-full mt-1 bg-secondary border border-primary rounded-md shadow-lg">
                    {isLoadingSymbols ? (
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-light-accent dark:border-dark-accent mx-auto mb-2"></div>
                        <p className="text-secondary">Loading stock symbols...</p>
                      </div>
                    ) : symbolError ? (
                      <div className="p-4 text-center text-red-500">
                        <p>{symbolError}</p>
                      </div>
                    ) : filteredSymbols.length > 0 ? (
                      <div className="max-h-96 overflow-y-auto">
                        {filteredSymbols.map((symbol) => (
                          <div
                            key={symbol.symbol}
                            onClick={() => handleStockSelect(symbol.symbol)}
                            className="px-4 py-2 hover:bg-light-hover dark:hover:bg-dark-hover cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-primary font-medium">{symbol.symbol}</div>
                              <div className="text-xs px-2 py-0.5 rounded bg-light-hover dark:bg-dark-hover text-secondary">
                                {symbol.exchange || 'US'}
                              </div>
                            </div>
                            <div className="text-secondary text-sm">{symbol.description}</div>
                          </div>
                        ))}
                      </div>
                    ) : searchQuery.length > 0 ? (
                      <div className="p-4 text-center">
                        <span className="text-secondary">No matching stocks found</span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
              
              {/* Dynamic Header */}
              <div>
                <ChartHeader
                  ticker={selectedStock}
                  name={selectedName || selectedStock}
                  price={selectedQuote?.c || (stockData.length > 0 ? stockData[stockData.length - 1]?.price : 0)}
                  change={selectedQuote?.d ?? 0}
                  changePercent={selectedQuote?.dp ?? 0}
                />
              </div>

              {/* Stock Chart */}
              <div className="h-64">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-light-accent dark:border-dark-accent mx-auto mb-2"></div>
                      <p className="text-secondary">Loading chart...</p>
                    </div>
                  </div>
                ) : stockData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stockData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#666666" opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10, fill: '#666666' }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        stroke="#666666"
                      />
                      <YAxis 
                        tick={{ fontSize: 10, fill: '#666666' }}
                        tickFormatter={(value) => formatCurrency(value, currency, fxRate)}
                        stroke="#666666"
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#1E222D',
                          border: '1px solid #2A2E39',
                          borderRadius: '6px',
                          color: '#D1D4DC'
                        }}
                        formatter={(value: number) => [formatCurrency(value, currency, fxRate), 'Price']}
                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#2962FF" 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#2962FF' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-secondary mx-auto mb-2" />
                      <p className="text-secondary">No data available</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Stock Info */}
              <div className="flex justify-between items-center text-sm">
                <div>
                  <span className="text-secondary">Current Price: </span>
                  <span className="text-primary font-semibold">
                    {stockData.length > 0 ? formatCurrency(stockData[stockData.length - 1]?.price, currency, fxRate) : '--'}
                  </span>
                </div>
                <div>
                  <span className="text-secondary">30-Day Change: </span>
                  <span className={`font-semibold ${
                    stockData.length > 1 && stockData[stockData.length - 1]?.price > stockData[0]?.price 
                      ? 'metric-positive' 
                      : 'metric-negative'
                  }`}>
                    {stockData.length > 1 
                      ? `${((stockData[stockData.length - 1]?.price - stockData[0]?.price) / stockData[0]?.price * 100).toFixed(1)}%`
                      : '--'
                    }
                  </span>
                </div>
              </div>
            </div>
          </Widget>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Markets Widget */}
          <Widget title="Markets">
            <div className="space-y-3">
              {liveMarketData.map((market, index) => (
                <MarketRow
                  key={index}
                  name={market.name}
                  price={market.price}
                  change={market.change}
                  changePercent={market.changePercent}
                  isPositive={market.isPositive}
                />
              ))}
            </div>
          </Widget>

          {/* Quick Stats Widget */}
          <Widget title="Quick Stats">
            <div className="space-y-4">
              <QuickStat
                icon={<Globe className="h-4 w-4 text-secondary" />}
                label="Active Markets"
                value="24"
                details={[
                  { title: "Asia Pacific", value: "8 Markets", trend: "up" },
                  { title: "Europe", value: "7 Markets", trend: "neutral" },
                  { title: "Americas", value: "9 Markets", trend: "down" }
                ]}
              />
              <QuickStat
                icon={<DollarSign className="h-4 w-4 text-secondary" />}
                label="Total Volume"
                value={2400000000}
                details={[
                  { title: "24h Change", value: "+12.5%", trend: "up" },
                  { title: "7d Average", value: formatCurrency(2100000000, currency, fxRate), trend: "neutral" },
                  { title: "Market Share", value: "15.2%", trend: "up" }
                ]}
              />
              <QuickStat
                icon={<TrendingUp className="h-4 w-4 text-secondary" />}
                label="Gainers"
                value="1,247"
                details={[
                  { title: "Top Sector", value: "Technology", trend: "up" },
                  { title: "Avg Gain", value: "2.8%", trend: "up" },
                  { title: "New 52w Highs", value: "156", trend: "up" }
                ]}
              />
            </div>
          </Widget>
        </div>
      </div>
    </div>
  )
}
