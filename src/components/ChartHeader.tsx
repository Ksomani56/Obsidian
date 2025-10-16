interface ChartHeaderProps {
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
}

export default function ChartHeader({ ticker, name, price, change, changePercent }: ChartHeaderProps) {
  // Currency-aware formatting
  // Use global currency context to display amounts in selected currency
  // without changing the underlying price math.
  // changePercent is unitless and should remain unchanged.
  const { currency, fxRate } = require('@/context/CurrencyContext')
    .useCurrency?.() || { currency: 'USD', fxRate: 1 }
  const isPositive = change >= 0

  return (
    <div className="px-4 py-3 border border-primary rounded-md bg-secondary">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-lg font-semibold text-primary">{ticker} – {name}</h1>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">
            {Number.isFinite(price)
              ? require('@/context/CurrencyContext').formatCurrency(price, currency, fxRate)
              : '—'}
          </div>
          {Number.isFinite(change) && Number.isFinite(changePercent) ? (
            <div className={`text-sm font-medium ${isPositive ? 'metric-positive' : 'metric-negative'}`}>
              {isPositive ? '+' : ''}{require('@/context/CurrencyContext').formatCurrency(change, currency, fxRate)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
            </div>
          ) : (
            <div className="text-sm text-secondary">—</div>
          )}
        </div>
      </div>
    </div>
  )
}
