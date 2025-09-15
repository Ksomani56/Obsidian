import { ColumnMapping, ParsedRow, Transaction } from './types';

const CANDIDATES: Record<keyof ColumnMapping, string[]> = {
  date: ['date', 'trade date', 'txn date', 'transaction date'],
  assetId: ['ticker', 'symbol', 'name', 'asset', 'scrip', 'stock', 'isin', 'symbol/name'],
  type: ['type', 'side', 'action', 'buy/sell'],
  quantity: ['qty', 'quantity', 'shares', 'units'],
  price: ['price', 'avg price', 'average price', 'rate', 'filled price'],
  currency: ['currency', 'ccy'],
  fees: ['fees', 'brokerage', 'commission', 'charges'],
  tag: ['tag', 'category'],
  notes: ['notes', 'remark', 'remarks', 'description'],
};

export function autoMapColumns(headers: string[]): Partial<ColumnMapping> {
  const result: Partial<ColumnMapping> = {};
  const lower = headers.map(h => h.trim().toLowerCase());
  (Object.keys(CANDIDATES) as (keyof ColumnMapping)[]).forEach((key) => {
    for (const cand of CANDIDATES[key]) {
      const idx = lower.indexOf(cand);
      if (idx !== -1) {
        (result as any)[key] = headers[idx];
        break;
      }
    }
  });
  return result;
}

export function normalizeType(value: string): 'BUY' | 'SELL' | undefined {
  const v = (value || '').toString().trim().toUpperCase();
  if (['BUY', 'B', 'PURCHASE', 'LONG'].includes(v)) return 'BUY';
  if (['SELL', 'S', 'SALE', 'SHORT'].includes(v)) return 'SELL';
  return undefined;
}

export function parseWithMapping(rows: Record<string, any>[], mapping: ColumnMapping): ParsedRow[] {
  return rows.map((raw) => {
    const errors: string[] = [];
    const get = (k?: string) => (k ? raw[k] : undefined);

    const dateValue = get(mapping.date);
    const assetValue = get(mapping.assetId);
    const typeValue = normalizeType(String(get(mapping.type) ?? ''));
    const qtyValue = Number(get(mapping.quantity));
    const priceValue = Number(get(mapping.price));
    const currency = String(get(mapping.currency) ?? '').toUpperCase() || undefined;
    const fees = get(mapping.fees) != null ? Number(get(mapping.fees)) : undefined;
    const tag = get(mapping.tag)?.toString() || undefined;
    const notes = get(mapping.notes)?.toString() || undefined;

    const isoDate = (() => {
      const d = new Date(dateValue);
      if (isNaN(d.getTime())) return undefined;
      return d.toISOString().split('T')[0];
    })();

    if (!isoDate) errors.push('Invalid or missing date');
    if (!assetValue) errors.push('Missing ticker/name');
    if (!typeValue) errors.push('Invalid type (BUY/SELL)');
    if (!(qtyValue > 0)) errors.push('Invalid quantity');
    if (!(priceValue >= 0)) errors.push('Invalid price');

    const tx: Transaction | undefined = errors.length
      ? undefined
      : {
          id: `${assetValue}-${isoDate}-${Math.random().toString(36).slice(2)}`,
          date: isoDate!,
          assetId: String(assetValue).toUpperCase(),
          type: typeValue!,
          quantity: qtyValue,
          price: priceValue,
          currency,
          fees,
          tag,
          notes,
        };

    return { raw, tx, errors };
  });
}

export async function readFileAsRows(file: File): Promise<Record<string, any>[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (!lines.length) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map((line) => {
      const cols = line.split(',');
      const row: Record<string, any> = {};
      headers.forEach((h, i) => (row[h] = cols[i]));
      return row;
    });
  }
  // Excel via SheetJS
  // @ts-ignore optional types
  const XLSX: any = await import('xlsx');
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = (XLSX.utils.sheet_to_json as any)(sheet, { defval: '' }) as any[];
  return data;
}


