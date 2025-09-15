export interface Transaction {
  id: string;
  stock: {
    ticker: string;
    name: string;
  };
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  date: string;
}

export interface Holding {
  ticker: string;
  name: string;
  quantity: number;
  avgPrice: number;
  investedAmount: number;
  currentPrice: number;
  currentValue: number;
  totalPL: number;
  totalPLPercent: number;
}

// Deterministic aggregator: compute holdings only from authoritative transactions array.
export function computeHoldingsFromTransactions(transactions: Transaction[]): Holding[] {
  const buySums: Record<string, { qty: number; amount: number; name: string }> = {}

  transactions.forEach(tx => {
    const symbol = tx.stock.ticker
    if (!buySums[symbol]) buySums[symbol] = { qty: 0, amount: 0, name: tx.stock.name }
    if (tx.type === 'BUY') {
      buySums[symbol].qty += tx.quantity
      buySums[symbol].amount += tx.quantity * tx.price
    }
    if (tx.type === 'SELL') {
      buySums[symbol].name = tx.stock.name
    }
  })

  const netQty: Record<string, number> = {}
  transactions.forEach(tx => {
    netQty[tx.stock.ticker] = (netQty[tx.stock.ticker] || 0) + (tx.type === 'BUY' ? tx.quantity : -tx.quantity)
  })

  const holdings: Holding[] = Object.keys(netQty).map(symbol => {
    const quantity = Math.max(0, netQty[symbol])
    const buy = buySums[symbol] || { qty: 0, amount: 0, name: symbol }
    const avgPrice = buy.qty > 0 ? buy.amount / buy.qty : 0
    const investedAmount = quantity * avgPrice

    return {
      ticker: symbol,
      name: buy.name || symbol,
      quantity,
      avgPrice,
      investedAmount,
      currentPrice: 0,
      currentValue: 0,
      totalPL: 0,
      totalPLPercent: 0
    }
  })

  return holdings
}
