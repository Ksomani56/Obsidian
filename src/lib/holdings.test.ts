import { describe, test, expect } from 'vitest'
import { computeHoldingsFromTransactions } from './holdings'

describe('computeHoldingsFromTransactions', () => {
  test('single buy creates holding', () => {
    const txs = [
      { id: '1', stock: { ticker: 'A', name: 'A Inc' }, type: 'BUY', quantity: 10, price: 100, date: '2024-01-01' }
    ]
    const holdings = computeHoldingsFromTransactions(txs as any)
    expect(holdings.length).toBe(1)
    expect(holdings[0].ticker).toBe('A')
    expect(holdings[0].quantity).toBe(10)
    expect(holdings[0].avgPrice).toBe(100)
  })

  test('buys and sells compute net quantity and avgPrice from buys only', () => {
    const txs = [
      { id: '1', stock: { ticker: 'A', name: 'A Inc' }, type: 'BUY', quantity: 10, price: 100, date: '2024-01-01' },
      { id: '2', stock: { ticker: 'A', name: 'A Inc' }, type: 'BUY', quantity: 5, price: 120, date: '2024-02-01' },
      { id: '3', stock: { ticker: 'A', name: 'A Inc' }, type: 'SELL', quantity: 8, price: 130, date: '2024-03-01' }
    ]
    const holdings = computeHoldingsFromTransactions(txs as any)
    expect(holdings.length).toBe(1)
    expect(holdings[0].quantity).toBe(7) // 15 - 8
    // avgPrice from buys = (10*100 + 5*120)/15 = 106.666...
    expect(holdings[0].avgPrice).toBeCloseTo((10*100 + 5*120)/15, 6)
  })

  test('sell more than buy results in zero quantity', () => {
    const txs = [
      { id: '1', stock: { ticker: 'B', name: 'B Inc' }, type: 'BUY', quantity: 5, price: 50, date: '2024-01-01' },
      { id: '2', stock: { ticker: 'B', name: 'B Inc' }, type: 'SELL', quantity: 10, price: 60, date: '2024-02-01' }
    ]
    const holdings = computeHoldingsFromTransactions(txs as any)
    expect(holdings.length).toBe(1)
    expect(holdings[0].quantity).toBe(0)
    expect(holdings[0].avgPrice).toBe(50)
  })
})
