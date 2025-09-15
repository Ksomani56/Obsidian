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
    <div className="px-4 py-3 border-b border-primary bg-primary">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl font-bold text-primary">{ticker}</h1>
            <p className="text-sm text-secondary">{name}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">
            ${price.toFixed(2)}
          </div>
          <div className={`text-sm font-medium ${isPositive ? 'metric-positive' : 'metric-negative'}`}>
            {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
          </div>
        </div>
      </div>
    </div>
  )
}
