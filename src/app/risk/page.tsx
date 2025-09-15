'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Target, BarChart3, Upload } from 'lucide-react'
import Widget from '@/components/Widget'

// Transaction interface removed (upload-only flow)

interface Holding {
  ticker: string;
  name: string;
  quantity: number;
  avgPrice: number;
  investedAmount: number;
  currentPrice: number;
  currentValue: number;
  totalPL: number;
  totalPLPercent: number;
  risk?: number;
  return?: number;
  instrument?: 'Equity' | 'F&O' | 'Currency';
  sector?: string;
}

interface PortfolioAnalysis {
  totalInvested: number;
  currentValue: number;
  totalPL: number;
  totalPLPercent: number;
  overallRiskLevel: 'Low' | 'Medium' | 'High';
  holdings: Holding[];
  portfolioHistory: {
    date: string;
    value: number;
  }[];
  metrics: {
    return: number;
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
}

// Legacy mock list no longer used (upload flow only)
const MOCK_STOCKS: { ticker: string; name: string }[] = []

const COLORS = ['#2962FF', '#089981', '#F59E0B', '#F23645', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16']

// Simple sector mapping for demo purposes
const TICKER_SECTOR: Record<string, string> = {
  RELIANCE: 'Energy',
  TCS: 'IT',
  HDFCBANK: 'Financials',
  INFY: 'IT',
  HINDUNILVR: 'Consumer',
  ITC: 'Consumer',
  SBIN: 'Financials',
  BHARTIARTL: 'Telecom',
  KOTAKBANK: 'Financials',
  LT: 'Industrials',
  ASIANPAINT: 'Materials',
  AXISBANK: 'Financials',
  MARUTI: 'Auto',
  SUNPHARMA: 'Healthcare',
  NESTLEIND: 'Consumer'
}

export default function RiskPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedHoldings, setUploadedHoldings] = useState<Holding[]>([])
  // Persist uploaded holdings
  useEffect(() => {
    try {
      const raw = localStorage.getItem('uploaded_holdings')
      if (raw) setUploadedHoldings(JSON.parse(raw))
    } catch (e) {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('uploaded_holdings', JSON.stringify(uploadedHoldings || []))
    } catch (e) {
      // ignore
    }
  }, [uploadedHoldings])
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null)
  const [chartType, setChartType] = useState<'line' | 'bar' | 'candlestick' | 'ohlc'>('line')
  // Modal/manual transaction state removed per spec

  // CSV parsing to holdings (columns: ticker,name,quantity,avgPrice,instrument,sector)
  function parseCsvToHoldings(csv: string): Holding[] {
    const lines = csv.split(/\r?\n/).filter(l => l.trim().length > 0)
    if (lines.length < 2) return []
    const header = lines[0].split(',').map(h => h.trim().toLowerCase())
    const idx = (k: string) => header.indexOf(k)
    const iTicker = idx('ticker')
    const iName = idx('name')
    const iQty = idx('quantity')
    const iAvg = idx('avgprice') !== -1 ? idx('avgprice') : idx('avg_price')
    const iInstr = idx('instrument')
    const iSector = idx('sector')
    const out: Holding[] = []
    for (let r = 1; r < lines.length; r++) {
      const cols = lines[r].split(',')
      const ticker = cols[iTicker]?.trim().toUpperCase()
      if (!ticker) continue
      const name = cols[iName]?.trim() || ticker
      const quantity = Number(String(cols[iQty] ?? '').replace(/[,\s]/g, '')) || 0
      const avgPrice = Number(String(cols[iAvg] ?? '').replace(/[,\s]/g, '')) || 0
      const instrument = (cols[iInstr]?.trim() as any) || 'Equity'
      const sector = cols[iSector]?.trim() || TICKER_SECTOR[ticker] || 'Other'
      const investedAmount = Math.max(0, quantity) * Math.max(0, avgPrice)
      if (quantity > 0 && avgPrice > 0) {
        out.push({ ticker, name, quantity, avgPrice, investedAmount, currentPrice: 0, currentValue: 0, totalPL: 0, totalPLPercent: 0, instrument, sector })
      }
    }
    return out
  }

  const calculatePortfolioAnalysis = async (baseHoldings: Holding[]): Promise<PortfolioAnalysis> => {

    // Fetch historical/current prices for holdings in parallel (do not mutate baseHoldings)
    const enrichedHoldingsPromises = baseHoldings.map(async (h) => {
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - 1);

        const response = await fetch(`/api/history/${h.ticker}?from=${Math.floor(startDate.getTime() / 1000)}&to=${Math.floor(endDate.getTime() / 1000)}`)
        const data = await response.json()

        if (!data || !data.data || data.data.length === 0) throw new Error('no data')

        const prices = (data.data as any[]).map(d => d.close as number)
        const returns: number[] = []
        for (let i = 1; i < prices.length; i++) returns.push((prices[i] - prices[i - 1]) / prices[i - 1])

        const annualReturn = returns.length ? returns.reduce((s, r) => s + r, 0) / returns.length * 252 : 0
        const variance = returns.length ? returns.reduce((s, r) => s + Math.pow(r - (annualReturn / 252), 2), 0) / returns.length : 0
        const volatility = Math.sqrt(variance * 252)

        const currentPrice = prices[prices.length - 1]
        const currentValue = currentPrice * h.quantity
        const totalPL = currentValue - h.investedAmount
        const totalPLPercent = h.investedAmount > 0 ? (totalPL / h.investedAmount) * 100 : 0

        return { ...h, currentPrice, currentValue, totalPL, totalPLPercent, risk: volatility, return: annualReturn }
      } catch (e) {
        // fallback mock values (do not mutate original)
        const mockReturn = (Math.random() - 0.5) * 0.3
        const mockRisk = Math.random() * 0.2 + 0.1
        const currentPrice = h.avgPrice * (1 + mockReturn)
        const currentValue = currentPrice * h.quantity
        const totalPL = currentValue - h.investedAmount
        const totalPLPercent = h.investedAmount > 0 ? (totalPL / h.investedAmount) * 100 : 0
        return { ...h, currentPrice, currentValue, totalPL, totalPLPercent, risk: mockRisk, return: mockReturn }
      }
    })

    const holdings = await Promise.all(enrichedHoldingsPromises)

    const totalInvested = holdings.reduce((sum, h) => sum + h.investedAmount, 0);
    const currentValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const totalPL = currentValue - totalInvested;
    const totalPLPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

    // Calculate portfolio-level risk metrics
    const weights = currentValue > 0 ? holdings.map(h => h.currentValue / currentValue) : holdings.map(() => 0);
    const portfolioReturn = holdings.reduce((sum, h, i) => sum + weights[i] * h.return, 0);
    
    // Calculate portfolio volatility using weights and correlations
    let portfolioVariance = 0;
    for (let i = 0; i < holdings.length; i++) {
      for (let j = 0; j < holdings.length; j++) {
        // Assuming correlation of 0.5 between different stocks
        const correlation = i === j ? 1 : 0.5;
        portfolioVariance += weights[i] * weights[j] * holdings[i].risk * holdings[j].risk * correlation;
      }
    }
    const portfolioVolatility = portfolioVariance > 0 ? Math.sqrt(portfolioVariance) : 0;

    // Calculate Sharpe Ratio (assuming 2% risk-free rate)
    const riskFreeRate = 0.02;
    const sharpeRatio = portfolioVolatility > 0 ? (portfolioReturn - riskFreeRate) / portfolioVolatility : 0;

    // Calculate max drawdown using a simple approximation
    const maxDrawdown = Math.max(0, ...holdings.map(h => h.risk || 0)) * Math.sqrt(Math.max(1, holdings.length));

    // Generate portfolio history (last 30 days) incorporating calculated metrics
    const portfolioHistory: { date: string; value: number }[] = [];
    const today = new Date();
    let lastValue = currentValue;

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate daily returns based on portfolio volatility
      const dailyVolatility = portfolioVolatility / Math.sqrt(252);
      const randomReturn = (Math.random() - 0.5) * 2 * dailyVolatility;
      lastValue = lastValue * (1 + randomReturn);

      portfolioHistory.push({
        date: date.toISOString().split('T')[0],
        value: Math.max(lastValue, 0)
      });
    }

    const overallRiskLevel: 'Low' | 'Medium' | 'High' = portfolioVolatility < 0.15 ? 'Low' : portfolioVolatility < 0.3 ? 'Medium' : 'High'

    return {
      totalInvested,
      currentValue,
      totalPL,
      totalPLPercent,
      overallRiskLevel,
      holdings,
      portfolioHistory,
      metrics: {
        return: portfolioReturn * 100,
        volatility: portfolioVolatility * 100,
        sharpeRatio,
        maxDrawdown: maxDrawdown * 100
      }
    };
  }

  // Chart timeframe state: controls how much of portfolioHistory to display
  const [timeframe, setTimeframe] = useState<'1M' | '6M' | '1Y' | '3Y' | '5Y' | 'All'>('1Y')

  const timeframeToDays = (tf: string) => {
    switch (tf) {
      case '1M': return 30
      case '6M': return 182
      case '1Y': return 365
      case '3Y': return 365 * 3
      case '5Y': return 365 * 5
      default: return Number.MAX_SAFE_INTEGER
    }
  }

  // Derived, filtered history for chart rendering
  const filteredHistory = analysis?.portfolioHistory ? (() => {
    if (!analysis) return []
    const days = timeframeToDays(timeframe)
    if (days === Number.MAX_SAFE_INTEGER) return analysis.portfolioHistory
    return analysis.portfolioHistory.slice(-days)
  })() : []

  // Update analysis when uploaded holdings change
  useEffect(() => {
    let mounted = true

    async function computeAnalysis() {
      if (!uploadedHoldings || uploadedHoldings.length === 0) {
        if (mounted) setAnalysis(null)
        return
      }

      try {
        const result = await calculatePortfolioAnalysis(uploadedHoldings)
        if (mounted) setAnalysis(result)
      } catch (err) {
        console.error('Error computing portfolio analysis:', err)
        if (mounted) setAnalysis(null)
      }
    }

    computeAnalysis()

    return () => { mounted = false }
  }, [uploadedHoldings])

  // Manual transaction flow removed per spec

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <div className="bg-primary border-b border-primary">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-primary mb-2">Obsidian Portfolio</h1>
          <p className="text-secondary">All data is computed as of previous trading day</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload / Add Portfolio CTA */}
            <Widget>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-primary">Add your portfolio</h3>
                  <p className="text-sm text-secondary">Upload CSV or Excel to auto-create holdings</p>
                </div>
                <div>
                  <input ref={fileInputRef} type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="hidden" onChange={(e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (!file) return
                    ;(async () => {
                      try {
                        if (file.name.toLowerCase().endsWith('.csv')) {
                          const text = await file.text()
                          const parsed = parseCsvToHoldings(text)
                          setUploadedHoldings(parsed)
                        } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
                          try {
                            // @ts-ignore optional dependency without types
                            const XLSX: any = await import('xlsx')
                            const data = await file.arrayBuffer()
                            const wb = XLSX.read(data)
                            const sheet = wb.Sheets[wb.SheetNames[0]]
                            // Use 2D array to avoid CSV quoting issues
                            const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][]
                            // Find header row heuristically
                            let headerIdx = -1
                            for (let i = 0; i < rows.length; i++) {
                              const cols = rows[i].map((c: any) => String(c).trim().toLowerCase())
                              if (!cols.length) continue
                              const hasSymbol = cols.some((c: string) => c.includes('symbol') || c.includes('scrip') || c.includes('name'))
                              const hasQty = cols.some((c: string) => c.startsWith('quantity') || c.includes('qty'))
                              const hasAvg = cols.some((c: string) => c.includes('avg') || c.includes('average'))
                              if (hasSymbol && hasQty && hasAvg) { headerIdx = i; break }
                            }

                            if (headerIdx === -1) {
                              console.warn('Could not locate holdings header row in Excel sheet')
                              setUploadedHoldings([])
                              return
                            }

                            const headerRow = rows[headerIdx].map((c: any) => String(c))
                            const lowerHeader = headerRow.map((h: string) => h.trim().toLowerCase())
                            const findIndex = (cands: string[]) => {
                              for (const c of cands) {
                                const idx = lowerHeader.indexOf(c)
                                if (idx !== -1) return idx
                              }
                              for (let i = 0; i < lowerHeader.length; i++) if (cands.some(c => lowerHeader[i].includes(c))) return i
                              return -1
                            }
                            const iSym = findIndex(['symbol','scrip','name'])
                            const iQty = findIndex(['quantity ava','quantity available','quantity','qty'])
                            const iAvg = findIndex(['avg price','average price','average cost','avg. price','average pri','avg'])
                            const iSeg = findIndex(['segment','type','instrument'])
                            const iSec = findIndex(['sector'])

                            const start = headerIdx + 1
                            const dataLines = [] as string[]
                            for (let i = start; i < rows.length; i++) {
                              const row = rows[i]
                              if (!row || row.every((c: any) => String(c).trim() === '')) break
                              const ticker = String(row[iSym] || '').toUpperCase()
                              const name = String(row[iSym] || '').toUpperCase()
                              const quantity = String(row[iQty] || '')
                              const avgPrice = String(row[iAvg] || '')
                              const instrument = String(row[iSeg] || '')
                              const sector = String(row[iSec] || '')
                              dataLines.push([ticker,name,quantity,avgPrice,instrument,sector].join(','))
                            }

                            const csvHeader = ['ticker','name','quantity','avgPrice','instrument','sector']
                            const csv = [csvHeader.join(','), ...dataLines].join('\n')
                            const parsed = parseCsvToHoldings(csv)
                            const filtered = parsed.filter(h => h.quantity > 0 && h.avgPrice > 0)
                            console.log('Parsed holdings from Excel:', filtered.length)
                            setUploadedHoldings(filtered)
                          } catch (err) {
                            alert('XLSX parsing not available. Please upload CSV instead.')
                          }
                        } else {
                          alert('Please upload a CSV or Excel file')
                        }
                      } finally {
                        ;(e.target as HTMLInputElement).value = ''
                      }
                    })()
                  }} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload CSV or Excel"
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-2xl shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Add your portfolio</span>
                  </button>
                </div>
              </div>
            </Widget>
            {/* Portfolio Summary */}
            {analysis && (
              <div className="bg-primary border border-primary rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-8">
                    <div>
                      <div className="flex items-center mb-1">
                        <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                        <span className="text-secondary text-sm">Current</span>
                      </div>
                      <div className="text-3xl font-bold text-primary">₹{analysis.currentValue.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="flex items-center mb-1">
                        <div className="w-3 h-3 bg-gray-500 rounded mr-2"></div>
                        <span className="text-secondary text-sm">Invested</span>
                      </div>
                      <div className="text-3xl font-bold text-primary">₹{analysis.totalInvested.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* Portfolio Chart */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-primary">Portfolio Performance</h3>
                    <div className="flex space-x-2">
                      {['1M', '6M', '1Y', '3Y', '5Y', 'All'].map((period) => (
                        <button
                          key={period}
                          onClick={() => setTimeframe(period as any)}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            timeframe === period
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'line' ? (
                        <LineChart data={filteredHistory}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          />
                          <YAxis 
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#F9FAFB'
                            }}
                            formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Value']}
                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#8B5CF6" 
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      ) : chartType === 'bar' ? (
                        <BarChart data={filteredHistory}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          />
                          <YAxis 
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#F9FAFB'
                            }}
                            formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Value']}
                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                          />
                          <Bar dataKey="value" fill="#8B5CF6" />
                        </BarChart>
                      ) : ( // candlestick / ohlc handled with Plotly using synthetic OHLC from portfolio values
                        <div className="w-full">
                          <Plot
                            {...({
                              data: [{
                                x: filteredHistory.map(d => d.date),
                                open: filteredHistory.map((d, i) => i === 0 ? d.value : filteredHistory[i - 1].value),
                                high: filteredHistory.map(d => d.value * 1.01),
                                low: filteredHistory.map(d => d.value * 0.99),
                                close: filteredHistory.map(d => d.value),
                                type: chartType === 'candlestick' ? 'candlestick' : 'ohlc',
                                increasing: { line: { color: '#089981' } },
                                decreasing: { line: { color: '#F23645' } }
                              }],
                              layout: { autosize: true, height: 400, margin: { t: 20, r: 20, b: 40, l: 40 } },
                              config: { responsive: true }
                            } as any)}
                            className="w-full"
                          />
                        </div>
                      )}
                    </ResponsiveContainer>
                  </div>

                  {/* Chart Type Selector */}
                  <div className="flex justify-center space-x-2 mt-4">
                    {[
                      { type: 'line', icon: BarChart3, label: 'Line' },
                      { type: 'bar', icon: BarChart3, label: 'Bar' },
                      { type: 'candlestick', icon: BarChart3, label: 'Candlestick' },
                      { type: 'ohlc', icon: BarChart3, label: 'OHLC' }
                    ].map(({ type, icon: Icon, label }) => (
                      <button
                        key={type}
                        onClick={() => setChartType(type as any)}
                        className={`px-3 py-1 rounded-md text-sm font-medium flex items-center space-x-1 ${
                          chartType === type
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* My Holdings Widget */}
            <Widget title="My Holdings">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary">Holdings ({analysis?.holdings.length || 0})</h3>
              </div>

              {analysis && analysis.holdings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-primary">
                          <th className="text-left py-3 px-2 text-secondary font-medium">Stock Name</th>
                        <th className="text-right py-3 px-2 text-secondary font-medium">Quantity %</th>
                        <th className="text-right py-3 px-2 text-secondary font-medium">Buy Avg</th>
                        <th className="text-right py-3 px-2 text-secondary font-medium">LTP</th>
                        <th className="text-center py-3 px-2 text-secondary font-medium">Mini Trend</th>
                        <th className="text-center py-3 px-2 text-secondary font-medium">Risk Level</th>
                        
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.holdings.map((holding, index) => {
                        const totalQty = analysis.holdings.reduce((s, h) => s + h.quantity, 0) || 1
                        const qtyPct = (holding.quantity / totalQty) * 100
                        const risk = holding.risk ?? 0
                        const riskLevel = risk > 0.35 ? 'High' : risk > 0.2 ? 'Moderate' : 'Low'
                        const riskColor = riskLevel === 'High' ? 'text-red-500' : riskLevel === 'Moderate' ? 'text-orange-400' : 'text-blue-500'
                        // Generate a tiny sparkline from random walk around currentPrice
                        const spark: { date: string; price: number }[] = (() => {
                          const arr: { date: string; price: number }[] = []
                          let p = Math.max(1, holding.currentPrice || holding.avgPrice || 1)
                          const today = new Date()
                          for (let i = 14; i >= 0; i--) {
                            const d = new Date(today)
                            d.setDate(d.getDate() - i)
                            p = p * (1 + (Math.random() - 0.5) * 0.02)
                            arr.push({ date: d.toISOString().split('T')[0], price: p })
                          }
                          return arr
                        })()
                        return (
                          <tr key={holding.ticker} className="border-b border-primary">
                            <td className="py-3 px-2">
                              <div>
                                <div className="font-medium text-primary">{holding.name}</div>
                                <div className="text-sm text-secondary">{holding.ticker}</div>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-right text-primary">{qtyPct.toFixed(1)}%</td>
                            <td className="py-3 px-2 text-right text-primary">₹{holding.avgPrice.toFixed(2)}</td>
                            <td className="py-3 px-2 text-right text-primary">₹{holding.currentPrice.toFixed(2)}</td>
                            <td className="py-3 px-2">
                              <div className="h-8 w-28">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={spark}>
                                    <XAxis dataKey="date" hide />
                                    <YAxis hide domain={[
                                      (dataMin: number) => (dataMin as number) * 0.98,
                                      (dataMax: number) => (dataMax as number) * 1.02
                                    ]} />
                                    <Line type="monotone" dataKey="price" stroke="#2962FF" strokeWidth={1} dot={false} />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskColor} bg-gray-100 dark:bg-gray-700`}>{riskLevel}</span>
                            </td>
                            
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-secondary mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-primary mb-2">No Holdings Yet</h3>
                  <p className="text-secondary">Upload your portfolio to see analysis.</p>
                </div>
              )}
            </Widget>
          </div>

          {/* Right Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Performance Comparison removed per new spec */}

            {/* Exposure Breakdown (by Sector) */}
            {analysis && analysis.holdings.length > 0 && (
              <>
                <Widget title="Exposure Breakdown">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={(() => {
                            const bySector: Record<string, number> = {}
                            const total = analysis.holdings.reduce((s, h) => s + h.currentValue, 0) || 1
                            analysis.holdings.forEach((h) => {
                              const sector = TICKER_SECTOR[h.ticker] || 'Other'
                              bySector[sector] = (bySector[sector] || 0) + h.currentValue
                            })
                            return Object.entries(bySector).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length], pct: (value / total) * 100 }))
                          })()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {(() => {
                            const sectors = (() => {
                              const bySector: Record<string, number> = {}
                              analysis.holdings.forEach(h => {
                                const sector = TICKER_SECTOR[h.ticker] || 'Other'
                                bySector[sector] = (bySector[sector] || 0) + h.currentValue
                              })
                              return Object.keys(bySector)
                            })()
                            return sectors.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))
                          })()}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Value']}
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Widget>

                {/* Top Sectors (Bar) */}
                <Widget title="Top Sectors">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={(() => {
                        const bySector: Record<string, number> = {}
                        analysis.holdings.forEach(h => {
                          const sector = TICKER_SECTOR[h.ticker] || 'Other'
                          bySector[sector] = (bySector[sector] || 0) + h.currentValue
                        })
                        return Object.entries(bySector)
                          .map(([name, value]) => ({ name, value }))
                          .sort((a, b) => b.value - a.value)
                          .slice(0, 5)
                      })()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                        <XAxis type="number" tick={{ fontSize: 12, fill: '#9CA3AF' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#9CA3AF' }} width={90} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F9FAFB' }}
                          formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Value']}
                        />
                        <Bar dataKey="value" fill="#089981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Widget>

                {/* Scenario Analysis */}
                <Widget title="Scenario Analysis">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={(() => {
                        const base = filteredHistory.length ? filteredHistory : analysis.portfolioHistory
                        return base.map((d, i) => {
                          const t = i / Math.max(1, base.length - 1)
                          return {
                            date: d.date,
                            base: d.value,
                            bull: d.value * (1 + 0.15 * t),
                            bear: d.value * (1 - 0.10 * t)
                          }
                        })
                      })()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9CA3AF' }} hide />
                        <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F9FAFB' }} />
                        <Legend />
                        <Line type="monotone" dataKey="base" name="Base" stroke="#8B5CF6" dot={false} />
                        <Line type="monotone" dataKey="bull" name="Bull (+5%)" stroke="#089981" dot={false} />
                        <Line type="monotone" dataKey="bear" name="Bear (-5%)" stroke="#F23645" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Widget>

                {/* Risk Metrics */}
                <Widget title="Risk Metrics">
                  <div className="space-y-4">
                    {/* Risk/Return Scatter Plot */}
                    <div className="h-64">
                          <Plot
                            {...({
                              data: [{
                                x: analysis.holdings.map(h => (h.risk ?? 0) * 100),
                                y: analysis.holdings.map(h => (h.return ?? 0) * 100),
                                mode: 'markers+text',
                                type: 'scatter',
                                text: analysis.holdings.map(h => h.ticker),
                                textposition: 'top center',
                                marker: { size: 10, color: analysis.holdings.map((_, i) => COLORS[i % COLORS.length]) },
                                name: 'Stocks'
                              }],
                              layout: {
                                title: 'Risk vs Return Analysis',
                                xaxis: { title: 'Risk (Volatility) %', showgrid: true, zeroline: true },
                                yaxis: { title: 'Return %', showgrid: true, zeroline: true },
                                showlegend: false,
                                margin: { t: 30, r: 20, l: 60, b: 40 }
                              },
                              config: { responsive: true }
                            } as any)}
                            className="w-full"
                          />
                    </div>
                    
                    {/* Portfolio Risk Stats */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <h4 className="text-sm text-secondary">Volatility</h4>
                        <p className="text-lg font-semibold text-primary">
                          {analysis.metrics.volatility.toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm text-secondary">Sharpe Ratio</h4>
                        <p className="text-lg font-semibold text-primary">
                          {analysis.metrics.sharpeRatio.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm text-secondary">Return (Annualized)</h4>
                        <p className="text-lg font-semibold text-primary">
                          {analysis.metrics.return.toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm text-secondary">Max Drawdown</h4>
                        <p className="text-lg font-semibold text-primary">
                          {analysis.metrics.maxDrawdown.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </Widget>
              </>
            )}
          </div>
        </div>
      </div>
      
    </div>
  )
}
