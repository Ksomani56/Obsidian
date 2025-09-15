'use client'
import React from 'react';
import { ColumnMapping } from '@/lib/portfolio/types';

interface Props {
  headers: string[];
  initial: Partial<ColumnMapping>;
  onChange: (mapping: ColumnMapping, isValid: boolean) => void;
}
const REQUIRED: (keyof ColumnMapping)[] = ['date', 'assetId', 'type', 'quantity', 'price'];

export default function ColumnMapper({ headers, initial, onChange }: Props) {
  const [map, setMap] = React.useState<ColumnMapping>({
    date: initial.date || '',
    assetId: initial.assetId || '',
    type: initial.type || '',
    quantity: initial.quantity || '',
    price: initial.price || '',
    currency: initial.currency || '',
    fees: initial.fees || '',
    tag: initial.tag || '',
    notes: initial.notes || '',
  });

  React.useEffect(() => {
    const valid = REQUIRED.every(k => (map as any)[k]);
    onChange(map, valid);
  }, [map, onChange]);

  const Select = (k: keyof ColumnMapping, label: string) => (
    <div className="flex flex-col">
      <label className="text-sm text-secondary mb-1">{label}{REQUIRED.includes(k) && ' *'}</label>
      <select
        className="input-field"
        value={(map as any)[k] || ''}
        onChange={(e) => setMap(prev => ({ ...prev, [k]: e.target.value }))}
      >
        <option value="">Select column</option>
        {headers.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
    </div>
  );

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {Select('date', 'Date')}
      {Select('assetId', 'Ticker/Name')}
      {Select('type', 'Type (BUY/SELL)')}
      {Select('quantity', 'Quantity')}
      {Select('price', 'Price')}
      {Select('currency', 'Currency')}
      {Select('fees', 'Fees')}
      {Select('tag', 'Tag')}
      {Select('notes', 'Notes')}
    </div>
  );
}


