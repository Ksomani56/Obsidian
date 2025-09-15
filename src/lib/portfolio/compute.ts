import { PortfolioPoint, Transaction } from './types';

export function computeDailyPortfolioValue(transactions: Transaction[]): PortfolioPoint[] {
  const dates = Array.from(new Set(transactions.map(t => t.date))).sort((a, b) => a.localeCompare(b));
  const positions: Record<string, { qty: number; lastPrice: number }> = {};
  const points: PortfolioPoint[] = [];

  for (const date of dates) {
    const todays = transactions.filter(t => t.date === date);
    for (const t of todays) {
      if (!positions[t.assetId]) positions[t.assetId] = { qty: 0, lastPrice: t.price };
      positions[t.assetId].qty += t.type === 'BUY' ? t.quantity : -t.quantity;
      positions[t.assetId].lastPrice = t.price > 0 ? t.price : positions[t.assetId].lastPrice;
    }
    let total = 0;
    Object.values(positions).forEach(p => {
      if (p.qty > 0) total += p.qty * p.lastPrice;
    });
    points.push({ date, value: Math.max(0, total) });
  }
  return points;
}

export function computeAllocation(transactions: Transaction[]): { name: string; value: number }[] {
  if (!transactions.length) return [];
  const positions: Record<string, { qty: number; price: number }> = {};
  transactions.forEach(t => {
    if (!positions[t.assetId]) positions[t.assetId] = { qty: 0, price: t.price };
    positions[t.assetId].qty += t.type === 'BUY' ? t.quantity : -t.quantity;
    positions[t.assetId].price = t.price || positions[t.assetId].price;
  });
  const rows = Object.entries(positions)
    .filter(([, p]) => p.qty > 0)
    .map(([assetId, p]) => ({ name: assetId, value: p.qty * p.price }));
  return rows;
}

export function computePerformanceByAsset(transactions: Transaction[]): { name: string; value: number }[] {
  const byAsset: Record<string, { buyQty: number; buyAmount: number; sellQty: number; lastPrice: number }> = {};
  for (const t of transactions) {
    if (!byAsset[t.assetId]) byAsset[t.assetId] = { buyQty: 0, buyAmount: 0, sellQty: 0, lastPrice: t.price };
    const rec = byAsset[t.assetId];
    if (t.type === 'BUY') {
      rec.buyQty += t.quantity;
      rec.buyAmount += t.quantity * t.price + (t.fees || 0);
    } else {
      rec.sellQty += t.quantity;
    }
    rec.lastPrice = t.price || rec.lastPrice;
  }
  const out: { name: string; value: number }[] = [];
  for (const [asset, r] of Object.entries(byAsset)) {
    const netQty = r.buyQty - r.sellQty;
    if (netQty <= 0) continue;
    const avgCost = r.buyQty > 0 ? r.buyAmount / r.buyQty : 0;
    const current = netQty * r.lastPrice;
    const invested = netQty * avgCost;
    const retPct = invested > 0 ? ((current - invested) / invested) * 100 : 0;
    out.push({ name: asset, value: retPct });
  }
  return out.sort((a, b) => b.value - a.value);
}


