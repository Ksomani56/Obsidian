import { autoMapColumns, parseWithMapping } from '@/lib/portfolio/parser';
import { ColumnMapping } from '@/lib/portfolio/types';

test('autoMapColumns finds common headers', () => {
  const headers = ['Date', 'Ticker', 'Type', 'Qty', 'Avg Price'];
  const m = autoMapColumns(headers);
  expect(m.date).toBe('Date');
  expect(m.assetId).toBe('Ticker');
  expect(m.type).toBe('Type');
});

test('parseWithMapping validates required fields', () => {
  const rows = [{ Date: '2024-01-02', Ticker: 'AAPL', Type: 'BUY', Qty: '10', 'Avg Price': '100.5' }];
  const mapping: ColumnMapping = {
    date: 'Date', assetId: 'Ticker', type: 'Type', quantity: 'Qty', price: 'Avg Price',
    currency: '', fees: '', tag: '', notes: ''
  };
  const parsed = parseWithMapping(rows as any, mapping);
  expect(parsed[0].errors.length).toBe(0);
  expect(parsed[0].tx?.quantity).toBe(10);
});


