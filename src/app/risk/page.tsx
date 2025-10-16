'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
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
  error?: string; // Add error field for failed data fetches
}

interface SectorAnalysis {
  sector: string;
  totalValue: number;
  percentage: number;
  totalPL: number;
  totalPLPercent: number;
  avgReturn: number;
  avgVolatility: number;
  holdings: Holding[];
  color: string;
}

interface CorrelationData {
  ticker1: string;
  ticker2: string;
  correlation: number;
  significance: 'High' | 'Medium' | 'Low';
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
  sectorAnalysis: SectorAnalysis[];
  correlationMatrix: CorrelationData[];
  diversificationScore: number;
}

// Legacy mock list no longer used (upload flow only)
const MOCK_STOCKS: { ticker: string; name: string }[] = []

const COLORS = ['#2962FF', '#089981', '#F59E0B', '#F23645', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16']

  // Enhanced sector mapping for comprehensive analysis
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
  NESTLEIND: 'Consumer',
  // Add more comprehensive mapping
  WIPRO: 'IT',
  HCLTECH: 'IT',
  TECHM: 'IT',
  ICICIBANK: 'Financials',
  BAJFINANCE: 'Financials',
  HDFC: 'Financials',
  INDUSINDBK: 'Financials',
  BAJAJFINSV: 'Financials',
  TITAN: 'Consumer',
  UPL: 'Materials',
  GRASIM: 'Materials',
  JSWSTEEL: 'Materials',
  COALINDIA: 'Energy',
  ONGC: 'Energy',
  BPCL: 'Energy',
  IOC: 'Energy',
  DRREDDY: 'Healthcare',
  CIPLA: 'Healthcare',
  BIOCON: 'Healthcare',
  DIVISLAB: 'Healthcare',
  APOLLOHOSP: 'Healthcare',
  MCDOWELL: 'Consumer',
  GODREJCP: 'Consumer',
  DABUR: 'Consumer',
  BRITANNIA: 'Consumer',
  TATAMOTORS: 'Auto',
  'BAJAJ-AUTO': 'Auto',
  EICHERMOT: 'Auto',
  'M&M': 'Auto',
  HEROMOTOCO: 'Auto',
  BHEL: 'Industrials',
  SIEMENS: 'Industrials',
  ABB: 'Industrials',
  LALPATHLAB: 'Healthcare',
  ZOMATO: 'Consumer',
  PAYTM: 'Financials',
  ADANIPORTS: 'Industrials',
  ADANIGREEN: 'Energy',
  ADANITRANS: 'Utilities',
  ADANIPOWER: 'Energy',
  ADANIENT: 'Materials',
  EIEL: 'Industrials',
  IRFC: 'Financials',
  TATASTEEL: 'Materials',
  // Common Groww stocks (with spaces)
  'HDFC BANK': 'Financials',
  'ICICI BANK': 'Financials',
  'KOTAK BANK': 'Financials',
  'AXIS BANK': 'Financials',
  'SBI': 'Financials',
  'BHARTI AIRTEL': 'Telecom',
  'EICHER MOTORS': 'Auto',
  'HERO MOTOCORP': 'Auto',
  'DIVIS LAB': 'Healthcare',
  'APOLLO HOSPITALS': 'Healthcare',
  'ASIAN PAINTS': 'Materials',
  'ULTRATECH CEMENT': 'Materials',
  'JSW STEEL': 'Materials',
  'COAL INDIA': 'Energy',
  'ADANI PORTS': 'Industrials',
  'ADANI GREEN': 'Energy',
  'ADANI TRANSMISSION': 'Utilities',
  'ADANI ENTERPRISES': 'Materials',
  'LARSEN & TOUBRO': 'Industrials'
}

// Sector color mapping for consistent visualization
const SECTOR_COLORS: Record<string, string> = {
  'IT': '#2962FF',
  'Financials': '#089981',
  'Consumer': '#F59E0B',
  'Healthcare': '#F23645',
  'Energy': '#8B5CF6',
  'Materials': '#06B6D4',
  'Industrials': '#F97316',
  'Auto': '#84CC16',
  'Telecom': '#EC4899',
  'Utilities': '#10B981',
  'Other': '#6B7280'
}

// Heuristic sector inference from name/ticker when explicit sector is missing
function inferSectorFromName(nameOrTicker: string): string {
  const s = (nameOrTicker || '').toUpperCase()
  const has = (k: string) => s.includes(k)
  if (has('BANK') || has('FINANCE') || has('NBFC') || has('INSURANCE') || has('FINANCIAL')) return 'Financials'
  if (has('OIL') || has('GAS') || has('POWER') || has('ENERGY') || has('COAL')) return 'Energy'
  if (has('PHARMA') || has('HEALTH') || has('HOSPITAL') || has('LIFE SCIENCE')) return 'Healthcare'
  if (has('TECH') || has('SOFTWARE') || has('IT') || has('INFOSYS') || has('TCS')) return 'IT'
  if (has('TELECOM') || has('COMMUNICATION') || has('AIRTEL') || has('VODAFONE')) return 'Telecom'
  if (has('AUTO') || has('MOTOR') || has('MARUTI') || has('TATA MOTORS') || has('ASHOK LEYLAND')) return 'Auto'
  if (has('STEEL') || has('METAL') || has('ALUMIN') || has('COPPER') || has('ZINC')) return 'Materials'
  if (has('CEMENT') || has('ENGINEER') || has('INFRA') || has('CONSTRUCT') || has('LARSEN') || has('LT')) return 'Industrials'
  if (has('CHEM') || has('FERTILIZER') || has('AGRI') || has('AGRO')) return 'Materials'
  if (has('FOOD') || has('BEVERAGE') || has('CONSUMER') || has('FMCG') || has('HINDUSTAN UNILEVER') || has('NESTLE')) return 'Consumer'
  if (has('REALTY') || has('REAL ESTATE') || has('DLF') || has('LODHA')) return 'Real Estate'
  if (has('PAINT') || has('ASIAN PAINTS')) return 'Materials'
  return 'Other'
}

// Calculate sector analysis from holdings
function calculateSectorAnalysis(holdings: Holding[]): SectorAnalysis[] {
  const sectorMap = new Map<string, Holding[]>()
  
  // Group holdings by sector
  holdings.forEach(holding => {
    const sector = holding.sector || inferSectorFromName(holding.ticker)
    if (!sectorMap.has(sector)) {
      sectorMap.set(sector, [])
    }
    sectorMap.get(sector)!.push(holding)
  })
  
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0)
  const sectorAnalysis: SectorAnalysis[] = []
  
  sectorMap.forEach((sectorHoldings, sector) => {
    const sectorValue = sectorHoldings.reduce((sum, h) => sum + h.currentValue, 0)
    const sectorPL = sectorHoldings.reduce((sum, h) => sum + h.totalPL, 0)
    const sectorInvested = sectorHoldings.reduce((sum, h) => sum + h.investedAmount, 0)
    const avgReturn = sectorHoldings.reduce((sum, h) => sum + (h.return || 0), 0) / sectorHoldings.length
    const avgVolatility = sectorHoldings.reduce((sum, h) => sum + (h.risk || 0), 0) / sectorHoldings.length
    
    sectorAnalysis.push({
      sector,
      totalValue: sectorValue,
      percentage: (sectorValue / totalValue) * 100,
      totalPL: sectorPL,
      totalPLPercent: sectorInvested > 0 ? (sectorPL / sectorInvested) * 100 : 0,
      avgReturn: avgReturn * 100, // Convert to percentage
      avgVolatility: avgVolatility * 100, // Convert to percentage
      holdings: sectorHoldings,
      color: SECTOR_COLORS[sector] || SECTOR_COLORS['Other']
    })
  })
  
  // Sort by percentage (largest first)
  return sectorAnalysis.sort((a, b) => b.percentage - a.percentage)
}

// Calculate correlation matrix for holdings
async function calculateCorrelationMatrix(holdings: Holding[]): Promise<CorrelationData[]> {
  const validHoldings = holdings.filter(h => !h.error && h.return !== undefined)
  const correlations: CorrelationData[] = []
  
  // For each pair of holdings, calculate correlation
  for (let i = 0; i < validHoldings.length; i++) {
    for (let j = i + 1; j < validHoldings.length; j++) {
      const holding1 = validHoldings[i]
      const holding2 = validHoldings[j]
      
      try {
        // Get historical data for both holdings
        const endDate = new Date()
        const startDate = new Date()
        startDate.setFullYear(endDate.getFullYear() - 1)
        
        const [res1, res2] = await Promise.all([
          fetch(`/api/history/${holding1.ticker}?from=${Math.floor(startDate.getTime() / 1000)}&to=${Math.floor(endDate.getTime() / 1000)}`),
          fetch(`/api/history/${holding2.ticker}?from=${Math.floor(startDate.getTime() / 1000)}&to=${Math.floor(endDate.getTime() / 1000)}`)
        ])
        
        if (res1.ok && res2.ok) {
          const [data1, data2] = await Promise.all([res1.json(), res2.json()])
          
          if (data1.data && data2.data && data1.data.length > 0 && data2.data.length > 0) {
            const prices1 = data1.data.map((d: any) => d.close).filter((p: number) => p && p > 0)
            const prices2 = data2.data.map((d: any) => d.close).filter((p: number) => p && p > 0)
            
            if (prices1.length > 10 && prices2.length > 10) {
              const correlation = calculateCorrelation(prices1, prices2)
              const significance = Math.abs(correlation) > 0.7 ? 'High' : Math.abs(correlation) > 0.4 ? 'Medium' : 'Low'
              
              correlations.push({
                ticker1: holding1.ticker,
                ticker2: holding2.ticker,
                correlation,
                significance
              })
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to calculate correlation between ${holding1.ticker} and ${holding2.ticker}:`, error)
      }
    }
  }
  
  return correlations
}

// Calculate Pearson correlation coefficient
function calculateCorrelation(prices1: number[], prices2: number[]): number {
  const minLength = Math.min(prices1.length, prices2.length)
  const returns1: number[] = []
  const returns2: number[] = []
  
  // Calculate returns
  for (let i = 1; i < minLength; i++) {
    const ret1 = (prices1[i] - prices1[i - 1]) / prices1[i - 1]
    const ret2 = (prices2[i] - prices2[i - 1]) / prices2[i - 1]
    if (isFinite(ret1) && isFinite(ret2)) {
      returns1.push(ret1)
      returns2.push(ret2)
    }
  }
  
  if (returns1.length < 2) return 0
  
  const mean1 = returns1.reduce((sum, r) => sum + r, 0) / returns1.length
  const mean2 = returns2.reduce((sum, r) => sum + r, 0) / returns2.length
  
  let numerator = 0
  let sumSq1 = 0
  let sumSq2 = 0
  
  for (let i = 0; i < returns1.length; i++) {
    const diff1 = returns1[i] - mean1
    const diff2 = returns2[i] - mean2
    numerator += diff1 * diff2
    sumSq1 += diff1 * diff1
    sumSq2 += diff2 * diff2
  }
  
  const denominator = Math.sqrt(sumSq1 * sumSq2)
  return denominator === 0 ? 0 : numerator / denominator
}

  // Calculate diversification score (0-100, higher is better)
function calculateDiversificationScore(sectorAnalysis: SectorAnalysis[], correlationMatrix: CorrelationData[]): number {
  // Sector diversification (0-50 points)
  const sectorCount = sectorAnalysis.length
  const maxSectorWeight = Math.max(...sectorAnalysis.map(s => s.percentage))
  const sectorScore = Math.min(50, (sectorCount * 5) + (50 - maxSectorWeight * 0.5))
  
  // Correlation diversification (0-50 points)
  const avgCorrelation = correlationMatrix.length > 0 
    ? correlationMatrix.reduce((sum, c) => sum + Math.abs(c.correlation), 0) / correlationMatrix.length
    : 0
  const correlationScore = Math.max(0, 50 - (avgCorrelation * 50))
  
  return Math.round(sectorScore + correlationScore)
}

// File validation constants
const FILE_LIMITS = {
  CSV_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  EXCEL_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_ROWS: 50000,
  MIN_ROWS: 5,
  CHUNK_SIZE: 1000
} as const

const ALLOWED_FILE_TYPES = {
  CSV: ['text/csv', 'application/csv'],
  EXCEL: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel' // .xls
  ]
} as const

const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls'] as const

export default function RiskPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedHoldings, setUploadedHoldings] = useState<Holding[]>([])
  
  // File upload validation states
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadStats, setUploadStats] = useState<{
    fileName: string
    fileSize: number
    rowCount: number
    processingTime: number
  } | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const cancelRef = useRef(false)
  
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
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar' | 'candlestick' | 'ohlc' | 'pie'>('line')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  
  // Real-time updates state
  const [isLiveMode, setIsLiveMode] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [updateInterval, setUpdateInterval] = useState(30000) // 30 seconds
  const [liveUpdateError, setLiveUpdateError] = useState<string | null>(null)
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // News state
  const [news, setNews] = useState<any[]>([])
  const [isLoadingNews, setIsLoadingNews] = useState(false)
  const [newsError, setNewsError] = useState<string | null>(null)
  const [selectedNewsCategory, setSelectedNewsCategory] = useState<string>('all')
  
  // Modal/manual transaction state removed per spec

  // Live price update functions
  const updateLivePrices = async (holdings: Holding[]): Promise<Holding[]> => {
    console.log('Updating live prices for', holdings.length, 'holdings')
    
    const updatedHoldings = await Promise.all(
      holdings.map(async (holding) => {
        try {
          const response = await fetch(`/api/quote?symbol=${encodeURIComponent(holding.ticker)}`)
          
          if (!response.ok) {
            console.warn(`Failed to fetch live price for ${holding.ticker}:`, response.status)
            return holding // Return unchanged holding on error
          }
          
          const quote = await response.json()
          
          if (quote && typeof quote.c === 'number' && quote.c > 0) {
            const newPrice = quote.c
            const newValue = newPrice * holding.quantity
            const newPL = newValue - holding.investedAmount
            const newPLPercent = holding.investedAmount > 0 ? (newPL / holding.investedAmount) * 100 : 0
            
            return {
              ...holding,
              currentPrice: newPrice,
              currentValue: newValue,
              totalPL: newPL,
              totalPLPercent: newPLPercent
            }
          }
          
          return holding
        } catch (error) {
          console.warn(`Error updating live price for ${holding.ticker}:`, error)
          return holding
        }
      })
    )
    
    return updatedHoldings
  }

  // Start live updates
  const startLiveUpdates = () => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current)
    }
    
    if (!analysis || analysis.holdings.length === 0) return
    
    setIsLiveMode(true)
    setLiveUpdateError(null)
    
    const updatePrices = async () => {
      try {
        console.log('Performing live price update...')
        const updatedHoldings = await updateLivePrices(analysis.holdings)
        
        // Recalculate analysis with updated prices
        const updatedAnalysis = await calculatePortfolioAnalysis(updatedHoldings)
        setAnalysis(updatedAnalysis)
        setLastUpdate(new Date())
        setLiveUpdateError(null)
        
        console.log('Live price update completed successfully')
      } catch (error) {
        console.error('Live price update failed:', error)
        setLiveUpdateError(error instanceof Error ? error.message : 'Live update failed')
      }
    }
    
    // Initial update
    updatePrices()
    
    // Set up interval
    updateIntervalRef.current = setInterval(updatePrices, updateInterval)
  }

  // Stop live updates
  const stopLiveUpdates = () => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current)
      updateIntervalRef.current = null
    }
    setIsLiveMode(false)
    setLiveUpdateError(null)
  }

  // News fetching functions
  const fetchNews = async (category: string = 'all', limit: number = 10) => {
    setIsLoadingNews(true)
    setNewsError(null)
    
    try {
      const response = await fetch(`/api/news?category=${category}&limit=${limit}`)
      
      if (!response.ok) {
        throw new Error(`News API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.data) {
        setNews(data.data)
      } else {
        throw new Error(data.error || 'Failed to fetch news')
      }
    } catch (error) {
      console.error('Error fetching news:', error)
      setNewsError(error instanceof Error ? error.message : 'Failed to fetch news')
    } finally {
      setIsLoadingNews(false)
    }
  }

  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  // Get sentiment color
  const getSentimentColor = (sentiment: string): string => {
    switch (sentiment) {
      case 'positive': return 'text-green-500 bg-green-100 dark:bg-green-900/20 dark:text-green-400'
      case 'negative': return 'text-red-500 bg-red-100 dark:bg-red-900/20 dark:text-red-400'
      case 'neutral': return 'text-gray-500 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400'
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
    }
  }, [])

  // Load news on component mount
  useEffect(() => {
    fetchNews(selectedNewsCategory, 10)
  }, [selectedNewsCategory])

  // File validation functions
  function validateFileType(file: File): { isValid: boolean; error?: string } {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    const mimeType = file.type.toLowerCase()
    
    // Check extension
    if (!ALLOWED_EXTENSIONS.includes(extension as any)) {
      return {
        isValid: false,
        error: `Invalid file type. Please upload CSV or Excel files only. Supported formats: ${ALLOWED_EXTENSIONS.join(', ')}`
      }
    }
    
    // Check MIME type
    const isValidMime = 
      (extension === '.csv' && (ALLOWED_FILE_TYPES.CSV.includes(mimeType as any) || mimeType === '')) ||
      (extension === '.xlsx' && (ALLOWED_FILE_TYPES.EXCEL.includes(mimeType as any) || mimeType === '')) ||
      (extension === '.xls' && (ALLOWED_FILE_TYPES.EXCEL.includes(mimeType as any) || mimeType === '')) ||
      mimeType === '' // Some browsers don't set MIME type correctly
    
    if (!isValidMime && mimeType !== '') {
      return {
        isValid: false,
        error: `Invalid file type. Expected CSV or Excel file, got: ${mimeType}`
      }
    }
    
    return { isValid: true }
  }
  
  function validateFileSize(file: File): { isValid: boolean; error?: string } {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    const maxSize = extension === '.csv' ? FILE_LIMITS.CSV_MAX_SIZE : FILE_LIMITS.EXCEL_MAX_SIZE
    const maxSizeMB = maxSize / (1024 * 1024)
    
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File too large. Maximum size: ${maxSizeMB}MB for ${extension.toUpperCase()} files. Your file: ${(file.size / (1024 * 1024)).toFixed(1)}MB`
      }
    }
    
    return { isValid: true }
  }
  
  function validateRowCount(rows: any[][]): { isValid: boolean; error?: string; count: number } {
    const count = rows.length
    
    if (count < FILE_LIMITS.MIN_ROWS) {
      return {
        isValid: false,
        error: `Too few rows. Minimum: ${FILE_LIMITS.MIN_ROWS} transactions. Your file has: ${count} rows`,
        count
      }
    }
    
    if (count > FILE_LIMITS.MAX_ROWS) {
      return {
        isValid: false,
        error: `Too many rows. Maximum: ${FILE_LIMITS.MAX_ROWS} transactions. Your file has: ${count} rows`,
        count
      }
    }
    
    return { isValid: true, count }
  }
  
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }
  
  // Chunked processing for large files
  async function processFileInChunks(
    rows: any[][],
    onProgress: (progress: number) => void,
    onChunk: (chunk: any[][]) => Promise<Holding[]>
  ): Promise<Holding[]> {
    const totalRows = rows.length
    const chunkSize = FILE_LIMITS.CHUNK_SIZE
    const totalChunks = Math.ceil(totalRows / chunkSize)
    const allHoldings: Holding[] = []
    
    for (let i = 0; i < totalChunks; i++) {
      if (cancelRef.current) {
        throw new Error('Processing cancelled by user')
      }
      
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, totalRows)
      const chunk = rows.slice(start, end)
      
      try {
        const chunkHoldings = await onChunk(chunk)
        allHoldings.push(...chunkHoldings)
        
        const progress = Math.round(((i + 1) / totalChunks) * 100)
        onProgress(progress)
        
        // Small delay to prevent blocking the UI
        if (i < totalChunks - 1) {
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      } catch (error) {
        console.error(`Error processing chunk ${i + 1}/${totalChunks}:`, error)
        throw error
      }
    }
    
    return allHoldings
  }
  
  // Enhanced file upload handler with validation and progress
  async function handleFileUpload(file: File): Promise<void> {
    const startTime = Date.now()
    setIsUploading(true)
    setUploadError(null)
    setUploadProgress(0)
    setUploadStats(null)
    cancelRef.current = false
    
    try {
      console.log(`Starting file upload: ${file.name} (${formatFileSize(file.size)})`)
      
      // Step 1: Validate file type
      const typeValidation = validateFileType(file)
      if (!typeValidation.isValid) {
        throw new Error(typeValidation.error)
      }
      
      // Step 2: Validate file size
      const sizeValidation = validateFileSize(file)
      if (!sizeValidation.isValid) {
        throw new Error(sizeValidation.error)
      }
      
      setUploadProgress(10)
      
      // Step 3: Parse file based on type
      let rows: any[][]
      let holdings: Holding[] = []
      
      if (file.name.toLowerCase().endsWith('.csv')) {
        const text = await file.text()
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
        rows = lines.map(line => line.split(',').map(cell => cell.trim()))
        
        // Validate row count
        const rowValidation = validateRowCount(rows)
        if (!rowValidation.isValid) {
          throw new Error(rowValidation.error)
        }
        
        setUploadProgress(30)
        
        // Process CSV in chunks
        holdings = await processFileInChunks(
          rows.slice(1), // Skip header
          (progress) => setUploadProgress(30 + (progress * 0.4)), // 30-70%
          async (chunk) => {
            const csvChunk = [rows[0], ...chunk].map(row => row.join(',')).join('\n')
            return parseCsvToHoldings(csvChunk)
          }
        )
        
      } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        setUploadProgress(20)
        
        try {
          const XLSX: any = await import('xlsx')
          const data = await file.arrayBuffer()
          const wb = XLSX.read(data)
          const sheet = wb.Sheets[wb.SheetNames[0]]
          rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][]
          
          // Validate row count
          const rowValidation = validateRowCount(rows)
          if (!rowValidation.isValid) {
            throw new Error(rowValidation.error)
          }
          
          setUploadProgress(40)
          
          // Try broker statement format first
          console.log('Attempting to parse as broker statement...')
          const brokerHoldings = parseBrokerStatementRows(rows)
          console.log('Broker holdings parsed:', brokerHoldings.length)
          
          if (brokerHoldings.length > 0) {
            holdings = brokerHoldings
            console.log('Using broker statement format')
          } else {
            console.log('Broker statement parsing failed, trying generic format...')
            // Fall back to generic parsing
            holdings = await processFileInChunks(
              rows,
              (progress) => setUploadProgress(40 + (progress * 0.3)), // 40-70%
              async (chunk) => {
                // Process each chunk as a mini Excel file
                const csvHeader = ['ticker','name','quantity','avgPrice','instrument','sector']
                const csvChunk = [csvHeader.join(','), ...chunk.map(row => row.join(','))].join('\n')
                return parseCsvToHoldings(csvChunk)
              }
            )
            console.log('Generic parsing result:', holdings.length)
          }
        } catch (err) {
          throw new Error('Excel parsing failed. Please try uploading a CSV file instead.')
        }
      } else {
        throw new Error('Unsupported file type')
      }
      
      setUploadProgress(80)
      
      // Step 4: Filter and validate holdings
      const validHoldings = holdings.filter(h => h.quantity > 0 && h.avgPrice > 0)
      
      if (validHoldings.length === 0) {
        throw new Error('No valid holdings found in the file. Please check your data format.')
      }
      
      setUploadProgress(90)
      
      // Step 5: Update state
      setUploadedHoldings(validHoldings)
      
      const processingTime = Date.now() - startTime
      setUploadStats({
        fileName: file.name,
        fileSize: file.size,
        rowCount: validHoldings.length,
        processingTime
      })
      
      setUploadProgress(100)
      
      console.log(`File upload completed: ${validHoldings.length} holdings processed in ${formatDuration(processingTime)}`)
      
    } catch (error) {
      console.error('File upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'Unknown error occurred')
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
      setIsCancelling(false)
    }
  }
  
  // Cancel file processing
  function cancelFileProcessing() {
    setIsCancelling(true)
    cancelRef.current = true
  }

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

  // Detect and parse broker statement (Excel converted to 2D array) for both Zerodha and Groww
  // We build holdings from various broker statement formats
  function parseBrokerStatementRows(rows: any[][]): Holding[] {
    const toLower = (v: any) => String(v ?? '').trim().toLowerCase()
    const toUpper = (v: any) => String(v ?? '').trim().toUpperCase()

    // Find all section starts for different broker formats
    const holdings: Holding[] = []
    for (let r = 0; r < rows.length; r++) {
      const line = rows[r].map(toLower)
      if (!line.length) continue
      
      // Check for various broker statement formats
      const isHoldings = line.some(c => 
        c.includes('equity holdings') || 
        c.includes('holdings statement') ||
        c.includes('portfolio holdings') ||
        c.includes('stock holdings') ||
        c === 'unrealised trades' || 
        c === 'unrealized trades' ||
        c.includes('groww') ||
        c.includes('zerodha')
      )
      if (!isHoldings) continue

      // Look for actual column headers (not section titles)
      let headerIdx = -1
      for (let k = r + 1; k < Math.min(rows.length, r + 15); k++) {
        const hdr = rows[k].map(toLower)
        if (!hdr.some(c => c)) continue
        
        // Check if this row looks like column headers (contains common column names)
        const hasColumnHeaders = hdr.some(c => 
          c.includes('symbol') || c.includes('quantity') || c.includes('price') || 
          c.includes('name') || c.includes('shares') || c.includes('cost') ||
          c.includes('average') || c.includes('ltp') || c.includes('value')
        )
        
        if (hasColumnHeaders) {
          headerIdx = k
          break
        }
      }
      if (headerIdx === -1) continue

      const header = rows[headerIdx].map((c: any) => String(c))
      const lowerHeader = header.map(h => h.trim().toLowerCase())
      const findIndex = (cands: string[]) => {
        for (const c of cands) {
          const idx = lowerHeader.indexOf(c)
          if (idx !== -1) return idx
        }
        for (let i = 0; i < lowerHeader.length; i++) if (cands.some(c => lowerHeader[i].includes(c))) return i
        return -1
      }

      // Comprehensive column mapping for both Zerodha and Groww
      const iSymbol = findIndex([
        'symbol', 'stock name', 'name', 'scrip', 'company name',
        'instrument', 'security', 'stock symbol'
      ])
      const iQty = findIndex([
        'quantity availab', 'quantity available', 'quantity', 'qty',
        'shares', 'units', 'balance', 'available quantity'
      ])
      const iAvgPrice = findIndex([
        'average price', 'avg price', 'buy price', 'purchase price',
        'cost price', 'average cost', 'avg cost', 'price'
      ])
      const iSector = findIndex([
        'sector', 'industry', 'category', 'segment'
      ])
      const iIsin = findIndex([
        'isin', 'isin code', 'security code'
      ])
      const iCurrentPrice = findIndex([
        'current price', 'ltp', 'last price', 'market price',
        'closing price', 'previous closing'
      ])
      const iValue = findIndex([
        'current value', 'market value', 'total value', 'value'
      ])

      console.log('Found header row:', header)
      console.log('Column indices:', { iSymbol, iQty, iAvgPrice, iSector, iIsin, iCurrentPrice, iValue })
      
      // Debug: Show first few data rows
      console.log('First few data rows:')
      for (let debugRow = headerIdx + 1; debugRow < Math.min(headerIdx + 5, rows.length); debugRow++) {
        console.log(`Row ${debugRow}:`, rows[debugRow])
      }

      // Data starts after header until blank row or next section title
      for (let i = headerIdx + 1; i < rows.length; i++) {
        const row = rows[i]
        const cellsLower = row.map(toLower)
        const isBlank = row.every(c => String(c).trim() === '')
        const isNextSection = cellsLower.some(c => 
          c.includes('realised trades') || 
          c.includes('realized trades') || 
          c.includes('disclaimer') || 
          c.includes('summary') ||
          c.includes('total') ||
          c.includes('grand total') ||
          c.includes('net total')
        )
        if (isBlank || isNextSection) break

        const symbolRaw = row[iSymbol]
        const qtyRaw = row[iQty]
        const avgPriceRaw = row[iAvgPrice]
        const sectorRaw = row[iSector]
        const currentPriceRaw = row[iCurrentPrice]
        const valueRaw = row[iValue]

        if (symbolRaw == null || symbolRaw === '') continue
        
        const quantity = Number(String(qtyRaw ?? '').replace(/[,\s]/g, '')) || 0
        const avgPrice = Number(String(avgPriceRaw ?? '').replace(/[,\s]/g, '')) || 0
        const currentPrice = Number(String(currentPriceRaw ?? '').replace(/[,\s]/g, '')) || 0
        const currentValue = Number(String(valueRaw ?? '').replace(/[,\s]/g, '')) || 0
        
        if (!(quantity > 0) || !(avgPrice > 0)) continue

        const ticker = toUpper(symbolRaw)
        const name = toUpper(symbolRaw)
        const sector = sectorRaw ? toUpper(sectorRaw) : (TICKER_SECTOR[ticker] || inferSectorFromName(name))
        
          const investedAmount = quantity * avgPrice
        const finalCurrentPrice = currentPrice > 0 ? currentPrice : 0
        const finalCurrentValue = currentValue > 0 ? currentValue : (finalCurrentPrice * quantity)
        const totalPL = finalCurrentValue - investedAmount
        const totalPLPercent = investedAmount > 0 ? (totalPL / investedAmount) * 100 : 0
        
        console.log('Parsed holding:', { 
          ticker, quantity, avgPrice, sector, investedAmount, 
          currentPrice: finalCurrentPrice, currentValue: finalCurrentValue,
          totalPL, totalPLPercent 
        })
        
        holdings.push({ 
          ticker, 
          name, 
          quantity, 
          avgPrice, 
          investedAmount, 
          currentPrice: finalCurrentPrice, 
          currentValue: finalCurrentValue, 
          totalPL, 
          totalPLPercent, 
          instrument: 'Equity', 
          sector 
        })
      }
    }

    // If no holdings found with header-based parsing, try pattern-based parsing
    if (holdings.length === 0) {
      console.log('No holdings found with header parsing, trying pattern-based parsing...')
      
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r]
        if (!row || row.length < 3) continue
        
        // Look for rows that might contain stock data (has numbers in multiple columns)
        const hasNumbers = row.filter(cell => {
          const num = Number(String(cell).replace(/[,\s]/g, ''))
          return !isNaN(num) && num > 0
        }).length >= 2
        
        if (!hasNumbers) continue
        
        // Try to extract data from any column that looks like stock info
        let symbol = ''
        let quantity = 0
        let avgPrice = 0
        
        for (let i = 0; i < row.length; i++) {
          const cell = String(row[i]).trim()
          if (!cell) continue
          
          // Look for symbol (text that's not a number and not empty)
          if (!symbol && cell.length > 0 && isNaN(Number(cell.replace(/[,\s]/g, ''))) && 
              !cell.toLowerCase().includes('total') && !cell.toLowerCase().includes('summary')) {
            symbol = cell
          }
          
          // Look for quantity (positive integer)
          const qty = Number(cell.replace(/[,\s]/g, ''))
          if (qty > 0 && qty < 1000000 && !quantity) {
            quantity = qty
          }
          
          // Look for price (positive number, likely between 1 and 10000)
          const price = Number(cell.replace(/[,\s]/g, ''))
          if (price > 1 && price < 10000 && !avgPrice) {
            avgPrice = price
          }
        }
        
        if (symbol && quantity > 0 && avgPrice > 0) {
          const ticker = toUpper(symbol)
          const name = toUpper(symbol)
          const sector = TICKER_SECTOR[ticker] || inferSectorFromName(name)
          const investedAmount = quantity * avgPrice
          
          console.log('Pattern-based parsed holding:', { ticker, quantity, avgPrice, sector, investedAmount })
          
          holdings.push({
            ticker,
            name,
            quantity,
            avgPrice,
            investedAmount,
            currentPrice: 0,
            currentValue: 0,
            totalPL: 0,
            totalPLPercent: 0,
            instrument: 'Equity',
            sector
          })
        }
      }
    }

    console.log('Total holdings parsed:', holdings.length)
    return holdings
  }

  const calculatePortfolioAnalysis = async (baseHoldings: Holding[]): Promise<PortfolioAnalysis> => {
    console.log('Starting portfolio analysis for', baseHoldings.length, 'holdings')

    // Fetch historical/current prices for holdings in parallel (do not mutate baseHoldings)
    const enrichedHoldingsPromises = baseHoldings.map(async (h) => {
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - 1);

        console.log(`Fetching data for ${h.ticker} from ${startDate.toISOString()} to ${endDate.toISOString()}`)

        const response = await fetch(`/api/history/${h.ticker}?from=${Math.floor(startDate.getTime() / 1000)}&to=${Math.floor(endDate.getTime() / 1000)}`)
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log(`API response for ${h.ticker}:`, { hasData: !!data?.data, dataLength: data?.data?.length, isMock: data?.isMock })

        if (!data || !data.data || data.data.length === 0) {
          throw new Error(`No historical data available for ${h.ticker}`)
        }

        // Check if we got mock data
        if (data.isMock) {
          console.warn(`Using mock data for ${h.ticker} - API may be unavailable`)
        }

        const prices = (data.data as any[]).map(d => d.close as number).filter(p => p && p > 0)
        
        if (prices.length < 2) {
          throw new Error(`Insufficient price data for ${h.ticker} (${prices.length} points)`)
        }

        const returns: number[] = []
        for (let i = 1; i < prices.length; i++) {
          const dailyReturn = (prices[i] - prices[i - 1]) / prices[i - 1]
          if (isFinite(dailyReturn)) {
            returns.push(dailyReturn)
          }
        }

        if (returns.length === 0) {
          throw new Error(`No valid returns calculated for ${h.ticker}`)
        }

        const annualReturn = returns.reduce((s, r) => s + r, 0) / returns.length * 252
        const variance = returns.reduce((s, r) => s + Math.pow(r - (annualReturn / 252), 2), 0) / returns.length
        const volatility = Math.sqrt(variance * 252)

        const currentPrice = prices[prices.length - 1]
        const currentValue = currentPrice * h.quantity
        const totalPL = currentValue - h.investedAmount
        const totalPLPercent = h.investedAmount > 0 ? (totalPL / h.investedAmount) * 100 : 0

        console.log(`Calculated metrics for ${h.ticker}:`, {
          currentPrice: currentPrice.toFixed(2),
          annualReturn: (annualReturn * 100).toFixed(2) + '%',
          volatility: (volatility * 100).toFixed(2) + '%',
          dataPoints: prices.length,
          isMock: data.isMock
        })

        return { ...h, currentPrice, currentValue, totalPL, totalPLPercent, risk: volatility, return: annualReturn }
      } catch (e) {
        console.error(`Error processing ${h.ticker}:`, e)
        
        // Instead of mock data, return the holding with error indicators
        // This allows the portfolio to still be analyzed with available data
        return { 
          ...h, 
          currentPrice: h.avgPrice, // Use average price as fallback
          currentValue: h.avgPrice * h.quantity,
          totalPL: 0, // No P&L calculation without real data
          totalPLPercent: 0,
          risk: 0, // No risk calculation without real data
          return: 0,
          error: `Unable to fetch data for ${h.ticker}: ${e instanceof Error ? e.message : 'Unknown error'}`
        }
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
    const holdingsWithRisk = holdings.filter(h => !h.error && h.risk && h.risk > 0);
    
    if (holdingsWithRisk.length === 0) {
      // No holdings with risk data
      portfolioVariance = 0;
    } else if (holdingsWithRisk.length === 1) {
      // Single stock portfolio
      const weight = holdingsWithRisk[0].currentValue / currentValue;
      portfolioVariance = Math.pow(weight * holdingsWithRisk[0].risk, 2);
    } else {
      // Multi-stock portfolio - use more realistic correlation assumptions
      for (let i = 0; i < holdingsWithRisk.length; i++) {
        for (let j = 0; j < holdingsWithRisk.length; j++) {
          const weightI = holdingsWithRisk[i].currentValue / currentValue;
          const weightJ = holdingsWithRisk[j].currentValue / currentValue;
          
          let correlation = 0.5; // Default correlation
          
          if (i === j) {
            correlation = 1; // Perfect correlation with itself
          } else {
            // More sophisticated correlation based on sectors
            const sectorI = holdingsWithRisk[i].sector || 'Other';
            const sectorJ = holdingsWithRisk[j].sector || 'Other';
            
            if (sectorI === sectorJ) {
              correlation = 0.7; // Higher correlation within same sector
            } else if (['Financials', 'IT', 'Healthcare'].includes(sectorI) && ['Financials', 'IT', 'Healthcare'].includes(sectorJ)) {
              correlation = 0.6; // Moderate correlation for major sectors
            } else {
              correlation = 0.3; // Lower correlation for different sectors
            }
          }
          
          portfolioVariance += weightI * weightJ * holdingsWithRisk[i].risk * holdingsWithRisk[j].risk * correlation;
        }
      }
    }
    
    const portfolioVolatility = portfolioVariance > 0 ? Math.sqrt(portfolioVariance) : 0;

    // Calculate Sharpe Ratio (assuming 2% risk-free rate)
    const riskFreeRate = 0.02;
    const sharpeRatio = portfolioVolatility > 0 ? (portfolioReturn - riskFreeRate) / portfolioVolatility : 0;

    // Calculate max drawdown based on portfolio volatility and diversification
    let maxDrawdown = 0;
    if (portfolioVolatility > 0) {
      // More realistic max drawdown calculation
      // Typical max drawdown is 2-3 times the annual volatility for diversified portfolios
      const diversificationFactor = Math.min(1, Math.sqrt(holdingsWithRisk.length / 10)); // More diversification = lower max drawdown
      maxDrawdown = portfolioVolatility * (2.5 - diversificationFactor); // Range: 1.5x to 2.5x volatility
    }

    // Generate portfolio history using actual stock data when available
    const portfolioHistory: { date: string; value: number }[] = [];
    const today = new Date();
    
    // Try to get actual historical data for portfolio calculation
    const holdingsWithData = holdings.filter(h => !h.error && h.risk && h.risk > 0);
    
    if (holdingsWithData.length > 0) {
      // Use actual historical data if available
      try {
        // Get the most recent 30 days of data from the first stock with data
        const sampleHolding = holdingsWithData[0];
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        
        const response = await fetch(`/api/history/${sampleHolding.ticker}?from=${Math.floor(startDate.getTime() / 1000)}&to=${Math.floor(endDate.getTime() / 1000)}`);
        const data = await response.json();
        
        if (data && data.data && data.data.length > 0 && !data.isMock) {
          // Use actual market data to simulate portfolio performance
          const marketReturns = [];
          for (let i = 1; i < data.data.length; i++) {
            const dailyReturn = (data.data[i].close - data.data[i-1].close) / data.data[i-1].close;
            if (isFinite(dailyReturn)) {
              marketReturns.push(dailyReturn);
            }
          }
          
          let portfolioValue = currentValue;
          for (let i = 0; i < Math.min(30, marketReturns.length); i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - (29 - i));
            
            // Apply market return scaled by portfolio volatility
            const scaledReturn = marketReturns[i] * (portfolioVolatility / 0.2); // Scale relative to market volatility
            portfolioValue = portfolioValue * (1 + scaledReturn);
            
            portfolioHistory.push({
              date: date.toISOString().split('T')[0],
              value: Math.max(portfolioValue, 0)
            });
          }
        } else {
          throw new Error('No real market data available');
        }
      } catch (error) {
        console.warn('Could not generate portfolio history from real data:', error);
        // Fallback: create a simple linear trend based on current P&L
        const dailyReturn = totalPLPercent / 30 / 100; // Distribute P&L over 30 days
        let portfolioValue = totalInvested;

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
          portfolioValue = portfolioValue * (1 + dailyReturn);
          portfolioHistory.push({
            date: date.toISOString().split('T')[0],
            value: Math.max(portfolioValue, 0)
          });
        }
      }
    } else {
      // No holdings with data - create flat line at invested amount
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

      portfolioHistory.push({
        date: date.toISOString().split('T')[0],
          value: totalInvested
      });
      }
    }

    const overallRiskLevel: 'Low' | 'Medium' | 'High' = portfolioVolatility < 0.15 ? 'Low' : portfolioVolatility < 0.3 ? 'Medium' : 'High'

    // Calculate sector analysis and correlation
    console.log('Calculating sector analysis...')
    const sectorAnalysis = calculateSectorAnalysis(holdings)
    
    console.log('Calculating correlation matrix...')
    const correlationMatrix = await calculateCorrelationMatrix(holdings)
    
    console.log('Calculating diversification score...')
    const diversificationScore = calculateDiversificationScore(sectorAnalysis, correlationMatrix)

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
      },
      sectorAnalysis,
      correlationMatrix,
      diversificationScore
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
        if (mounted) {
          setAnalysis(null)
          setAnalysisError(null)
          setIsAnalyzing(false)
        }
        return
      }

      setIsAnalyzing(true)
      setAnalysisError(null)

      try {
        console.log('Starting portfolio analysis...')
        const result = await calculatePortfolioAnalysis(uploadedHoldings)
        if (mounted) {
          setAnalysis(result)
          setAnalysisError(null)
          
          // Check if we have any data quality issues
          const holdingsWithErrors = result.holdings.filter(h => h.error)
          if (holdingsWithErrors.length > 0) {
            console.warn(`${holdingsWithErrors.length} holdings have data issues:`, holdingsWithErrors.map(h => h.ticker))
          }
        }
      } catch (err) {
        console.error('Error computing portfolio analysis:', err)
        if (mounted) {
          setAnalysis(null)
          setAnalysisError(err instanceof Error ? err.message : 'Failed to analyze portfolio')
        }
      } finally {
        if (mounted) setIsAnalyzing(false)
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
                </div>
                <div>
                  <input ref={fileInputRef} type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="hidden" onChange={(e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (!file) return
                    handleFileUpload(file).finally(() => {
                        ;(e.target as HTMLInputElement).value = ''
                    })
                  }} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    title="Upload CSV or Excel"
                    className={`inline-flex items-center space-x-2 px-4 py-2 rounded-2xl shadow-sm transition-all ${
                      isUploading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:shadow-md transform hover:-translate-y-0.5'
                    } text-white`}
                  >
                    <Upload className="h-4 w-4" />
                    <span>{isUploading ? 'Processing...' : 'Add your portfolio'}</span>
                  </button>
                </div>
              </div>
              
              {/* File Upload Progress */}
              {isUploading && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary">Processing file...</span>
                    <span className="text-primary font-medium">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  
                  {/* Processing Steps */}
                  <div className="text-xs text-secondary space-y-1">
                    {uploadProgress < 10 && <div>• Validating file type and size...</div>}
                    {uploadProgress >= 10 && uploadProgress < 30 && <div>• Reading file contents...</div>}
                    {uploadProgress >= 30 && uploadProgress < 70 && <div>• Parsing data in chunks...</div>}
                    {uploadProgress >= 70 && uploadProgress < 90 && <div>• Validating holdings data...</div>}
                    {uploadProgress >= 90 && uploadProgress < 100 && <div>• Finalizing portfolio...</div>}
                    {uploadProgress === 100 && <div className="text-green-500">• Upload completed successfully!</div>}
                  </div>
                  
                  {/* Cancel Button */}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <button
                      onClick={cancelFileProcessing}
                      disabled={isCancelling}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      {isCancelling ? 'Cancelling...' : 'Cancel Upload'}
                    </button>
                  )}
                </div>
              )}
              
              {/* Upload Error */}
              {uploadError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <div className="text-red-500 text-sm">⚠️</div>
                    <div className="text-sm text-red-700">{uploadError}</div>
                  </div>
                </div>
              )}
              
              {/* Upload Success Stats */}
              {uploadStats && !isUploading && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm text-green-700 space-y-1">
                    <div className="font-medium">✅ Upload completed successfully!</div>
                    <div className="text-xs text-green-600 space-y-1">
                      <div>• File: {uploadStats.fileName}</div>
                      <div>• Size: {formatFileSize(uploadStats.fileSize)}</div>
                      <div>• Holdings: {uploadStats.rowCount} transactions</div>
                      <div>• Processing time: {formatDuration(uploadStats.processingTime)}</div>
                    </div>
                  </div>
                </div>
              )}
            </Widget>
            {/* Loading State */}
            {isAnalyzing && (
              <div className="bg-primary border border-primary rounded-lg p-6">
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-secondary">Analyzing portfolio...</p>
                    <p className="text-sm text-secondary mt-2">Fetching market data and calculating risk metrics</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {analysisError && (
              <div className="bg-primary border border-primary rounded-lg p-6">
                <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-md">
                  <div className="flex items-center">
                    <div className="text-red-600 dark:text-red-400 mr-2">❌</div>
                    <div className="text-sm text-red-800 dark:text-red-200">
                      <strong>Analysis Failed:</strong> {analysisError}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Portfolio Summary */}
            {analysis && !isAnalyzing && (
              <div className="bg-primary border border-primary rounded-lg p-6">
                {/* Live Update Controls */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={isLiveMode ? stopLiveUpdates : startLiveUpdates}
                        className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          isLiveMode
                            ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
                            : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full mr-2 ${isLiveMode ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
                        {isLiveMode ? 'Stop Live Updates' : 'Start Live Updates'}
                      </button>
                      
                      {isLiveMode && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Updates every {updateInterval / 1000}s
                        </div>
                      )}
                    </div>
                    
                    {lastUpdate && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Last updated: {lastUpdate.toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                  
                  {/* Update Interval Selector */}
                  {isLiveMode && (
                    <select
                      value={updateInterval}
                      onChange={(e) => {
                        setUpdateInterval(Number(e.target.value))
                        stopLiveUpdates()
                        setTimeout(() => startLiveUpdates(), 100)
                      }}
                      className="text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                    >
                      <option value={10000}>10s</option>
                      <option value={30000}>30s</option>
                      <option value={60000}>1m</option>
                      <option value={300000}>5m</option>
                    </select>
                  )}
                </div>
                
                {/* Live Update Error */}
                {liveUpdateError && (
                  <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-md">
                    <div className="flex items-center">
                      <div className="text-red-500 text-sm mr-2">⚠️</div>
                      <div className="text-sm text-red-800 dark:text-red-200">
                        Live update error: {liveUpdateError}
                      </div>
                    </div>
                  </div>
                )}

                {/* Data Quality Warning */}
                {analysis.holdings.some(h => h.error) && (
                  <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-md">
                    <div className="flex items-center">
                      <div className="text-yellow-600 dark:text-yellow-400 mr-2">⚠️</div>
                      <div className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Data Quality Notice:</strong> Some stocks could not be analyzed due to data unavailability. 
                        Risk calculations may be incomplete. Check the holdings table for details.
                      </div>
                    </div>
                  </div>
                )}
                
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
                  {/* Chart Type Selector (kept above chart to avoid overlap) */}
                  <div className="flex justify-center space-x-2 mt-4 relative z-10">
                    {[
                      { type: 'line', icon: BarChart3, label: 'Line' },
                      { type: 'area', icon: BarChart3, label: 'Area' },
                      { type: 'bar', icon: BarChart3, label: 'Bar' },
                      { type: 'pie', icon: BarChart3, label: 'Pie' },
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
                        style={{ position: 'relative', zIndex: 20 }}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="h-64 mt-3">
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
                      ) : chartType === 'area' ? (
                        <AreaChart data={filteredHistory}>
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
                          <Area type="monotone" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} />
                        </AreaChart>
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
                      ) : chartType === 'pie' ? (
                        <PieChart>
                          <Pie
                            data={(() => {
                              if (!analysis) return []
                              const total = analysis.holdings.reduce((s, h) => s + h.currentValue, 0) || 1
                              return analysis.holdings
                                .map(h => ({ name: h.ticker, value: h.currentValue, pct: (h.currentValue / total) * 100 }))
                                .sort((a, b) => b.value - a.value)
                                .slice(0, 12)
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
                              const n = Math.min(12, analysis?.holdings.length || 0)
                              return new Array(n).fill(0).map((_, i) => (
                                <Cell key={`alloc-${i}`} fill={COLORS[i % COLORS.length]} />
                              ))
                            })()}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Value']}
                            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F9FAFB' }}
                          />
                          <Legend />
                        </PieChart>
                      ) : ( // candlestick / ohlc handled with Plotly using synthetic OHLC from portfolio values
                        <div className="w-full relative z-0">
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
                              layout: { autosize: true, height: 400, margin: { t: 20, r: 20, b: 40, l: 40 }, paper_bgcolor: 'transparent', plot_bgcolor: 'transparent' },
                              config: { responsive: true, displayModeBar: true }
                            } as any)}
                            className="w-full"
                          />
                        </div>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Sector Analysis Widget */}
            {analysis && !isAnalyzing && analysis.sectorAnalysis && analysis.sectorAnalysis.length > 0 && (
              <Widget title="Sector Analysis">
                <div className="space-y-4">
                  {/* Diversification Score */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Diversification Score</h4>
                        <p className="text-2xl font-bold text-primary">{analysis.diversificationScore}/100</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {analysis.diversificationScore >= 80 ? 'Excellent' : 
                           analysis.diversificationScore >= 60 ? 'Good' : 
                           analysis.diversificationScore >= 40 ? 'Fair' : 'Poor'} diversification
                        </p>
                      </div>
                      <div className="w-16 h-16">
                        <div className="relative w-full h-full">
                          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-gray-200 dark:text-gray-700"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="text-blue-500"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              strokeDasharray={`${analysis.diversificationScore}, 100`}
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">{analysis.diversificationScore}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sector Performance Chart */}
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analysis.sectorAnalysis}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                        <XAxis 
                          dataKey="sector" 
                          tick={{ fontSize: 12, fill: '#9CA3AF' }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151', 
                            borderRadius: '8px', 
                            color: '#F9FAFB' 
                          }}
                          formatter={(value: any, name: string) => [
                            name === 'percentage' ? `${value.toFixed(1)}%` : 
                            name === 'avgReturn' ? `${value.toFixed(1)}%` :
                            name === 'avgVolatility' ? `${value.toFixed(1)}%` :
                            value,
                            name === 'percentage' ? 'Allocation' :
                            name === 'avgReturn' ? 'Avg Return' :
                            name === 'avgVolatility' ? 'Avg Volatility' : name
                          ]}
                        />
                        <Bar dataKey="percentage" fill="#8B5CF6" name="Allocation" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Sector Details Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2 text-gray-600 dark:text-gray-400">Sector</th>
                          <th className="text-right py-2 text-gray-600 dark:text-gray-400">Allocation</th>
                          <th className="text-right py-2 text-gray-600 dark:text-gray-400">P&L</th>
                          <th className="text-right py-2 text-gray-600 dark:text-gray-400">Return</th>
                          <th className="text-right py-2 text-gray-600 dark:text-gray-400">Volatility</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.sectorAnalysis.map((sector, index) => (
                          <tr key={sector.sector} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-2">
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: sector.color }}
                                ></div>
                                <span className="font-medium text-primary">{sector.sector}</span>
                              </div>
                            </td>
                            <td className="text-right py-2 text-primary font-medium">
                              {sector.percentage.toFixed(1)}%
                            </td>
                            <td className={`text-right py-2 font-medium ${
                              sector.totalPL >= 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {sector.totalPL >= 0 ? '+' : ''}₹{sector.totalPL.toLocaleString()}
                            </td>
                            <td className={`text-right py-2 ${
                              sector.avgReturn >= 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {sector.avgReturn >= 0 ? '+' : ''}{sector.avgReturn.toFixed(1)}%
                            </td>
                            <td className="text-right py-2 text-gray-500">
                              {sector.avgVolatility.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Widget>
            )}

            {/* Correlation Analysis Widget */}
            {analysis && !isAnalyzing && analysis.correlationMatrix && analysis.correlationMatrix.length > 0 && (
              <Widget title="Correlation Analysis">
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Stock correlations help identify diversification opportunities. Lower correlations indicate better diversification.
                  </p>
                  
                  {/* Correlation Heatmap */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          <th className="text-left py-2 text-gray-600 dark:text-gray-400">Stock 1</th>
                          <th className="text-left py-2 text-gray-600 dark:text-gray-400">Stock 2</th>
                          <th className="text-center py-2 text-gray-600 dark:text-gray-400">Correlation</th>
                          <th className="text-center py-2 text-gray-600 dark:text-gray-400">Significance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.correlationMatrix
                          .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
                          .slice(0, 10) // Show top 10 correlations
                          .map((corr, index) => (
                          <tr key={`${corr.ticker1}-${corr.ticker2}`} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-2 font-medium text-primary">{corr.ticker1}</td>
                            <td className="py-2 font-medium text-primary">{corr.ticker2}</td>
                            <td className="text-center py-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                Math.abs(corr.correlation) > 0.7 
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                  : Math.abs(corr.correlation) > 0.4
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              }`}>
                                {corr.correlation.toFixed(3)}
                              </span>
                            </td>
                            <td className="text-center py-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                corr.significance === 'High'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                  : corr.significance === 'Medium'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              }`}>
                                {corr.significance}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Correlation Insights */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-primary mb-2">Diversification Insights</h4>
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      {analysis.correlationMatrix.filter(c => c.significance === 'High').length > 0 && (
                        <p>• {analysis.correlationMatrix.filter(c => c.significance === 'High').length} high correlation pairs detected - consider diversifying</p>
                      )}
                      {analysis.correlationMatrix.filter(c => c.significance === 'Low').length > 0 && (
                        <p>• {analysis.correlationMatrix.filter(c => c.significance === 'Low').length} low correlation pairs - good diversification</p>
                      )}
                      <p>• Average correlation: {(analysis.correlationMatrix.reduce((sum, c) => sum + Math.abs(c.correlation), 0) / analysis.correlationMatrix.length).toFixed(3)}</p>
                    </div>
                  </div>
                </div>
              </Widget>
            )}

            {/* Market News Widget - moved to end of page per request */}
            {/* Placeholder retained to keep structure clear; real widget appended at bottom. */}
            {/* <Widget title="Market News"> ... </Widget> */}
            {/* My Holdings Widget */}
            <Widget title="My Holdings">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary">
                  Holdings ({analysis?.holdings.length || uploadedHoldings.length || 0})
                </h3>
                {isAnalyzing && (
                  <div className="flex items-center text-sm text-secondary">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                    Analyzing...
                  </div>
                )}
              </div>

              {isAnalyzing ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-secondary">Loading holdings data...</p>
                </div>
              ) : analysis && analysis.holdings.length > 0 ? (
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
                        // Generate sparkline from actual price data if available, otherwise show flat line
                        const spark: { date: string; price: number }[] = (() => {
                          if (holding.error) {
                            // No data available - return empty array
                            return []
                          }
                          
                          // For now, create a simple trend based on P&L
                          // In a real implementation, you'd fetch the last 15 days of price data
                          const arr: { date: string; price: number }[] = []
                          const basePrice = Math.max(1, holding.currentPrice || holding.avgPrice || 1)
                          const today = new Date()
                          
                          // Create a simple trend line based on the stock's performance
                          const trendFactor = holding.totalPLPercent / 15 / 100 // Distribute P&L over 15 days
                          
                          for (let i = 14; i >= 0; i--) {
                            const d = new Date(today)
                            d.setDate(d.getDate() - i)
                            const price = basePrice * (1 + trendFactor * (15 - i))
                            arr.push({ date: d.toISOString().split('T')[0], price: Math.max(price, 0.01) })
                          }
                          return arr
                        })()
                        return (
                          <tr key={holding.ticker} className="border-b border-primary">
                            <td className="py-3 px-2">
                              <div>
                                <div className="font-medium text-primary">{holding.name}</div>
                                <div className="text-sm text-secondary">{holding.ticker}</div>
                                {holding.error && (
                                  <div className="text-xs text-red-500 mt-1" title={holding.error}>
                                    ⚠️ Data unavailable
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-2 text-right text-primary">{qtyPct.toFixed(1)}%</td>
                            <td className="py-3 px-2 text-right text-primary">₹{holding.avgPrice.toFixed(2)}</td>
                            <td className="py-3 px-2 text-right text-primary">
                              {holding.error ? (
                                <span className="text-gray-500">--</span>
                              ) : (
                                `₹${holding.currentPrice.toFixed(2)}`
                              )}
                            </td>
                            <td className="py-3 px-2">
                              {holding.error ? (
                                <div className="h-8 w-28 flex items-center justify-center text-gray-500 text-xs">
                                  No data
                                </div>
                              ) : (
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
                              )}
                            </td>
                            <td className="py-3 px-2 text-center">
                              {holding.error ? (
                                <span className="px-2 py-1 rounded-full text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700">
                                  N/A
                                </span>
                              ) : (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskColor} bg-gray-100 dark:bg-gray-700`}>
                                  {riskLevel}
                                </span>
                              )}
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

            {/* Exposure Breakdown (by Sector Value) */}
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
                              const sector = (h.sector && h.sector.trim()) || TICKER_SECTOR[h.ticker] || inferSectorFromName(h.name || h.ticker)
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
                                const sector = (h.sector && h.sector.trim()) || TICKER_SECTOR[h.ticker] || inferSectorFromName(h.name || h.ticker)
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

                {/* Sector Diversity (by count of holdings) */}
                <Widget title="Sector Diversity">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={(() => {
                            const bySectorCount: Record<string, number> = {}
                            analysis.holdings.forEach(h => {
                              const sector = (h.sector && h.sector.trim()) || TICKER_SECTOR[h.ticker] || inferSectorFromName(h.name || h.ticker)
                              bySectorCount[sector] = (bySectorCount[sector] || 0) + 1
                            })
                            return Object.entries(bySectorCount).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }))
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
                                const sector = (h.sector && h.sector.trim()) || TICKER_SECTOR[h.ticker] || inferSectorFromName(h.name || h.ticker)
                                bySector[sector] = (bySector[sector] || 0) + 1
                              })
                              return Object.keys(bySector)
                            })()
                            return sectors.map((_, index) => (
                              <Cell key={`diversity-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))
                          })()}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [String(value), 'Count']}
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F9FAFB' }}
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
