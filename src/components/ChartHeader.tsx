interface ChartHeaderProps {
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
}

export default function ChartHeader({ ticker, name, price, change, changePercent }: ChartHeaderProps) {
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
            {Number.isFinite(price) ? `$${price.toFixed(2)}` : '—'}
          </div>
          {Number.isFinite(change) && Number.isFinite(changePercent) ? (
            <div className={`text-sm font-medium ${isPositive ? 'metric-positive' : 'metric-negative'}`}>
              {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
            </div>
          ) : (
            <div className="text-sm text-secondary">—</div>
          )}
        </div>
      </div>
    </div>
  )
}
