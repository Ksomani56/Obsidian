'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '@/context/CurrencyContext';
import { useCurrency } from '@/context/CurrencyContext';

interface MarketRowProps {
  name: string;
  price?: number | null;
  change?: number | null;
  changePercent?: number | null;
  isPositive: boolean;
}

export function MarketRow({ name, price, change, changePercent, isPositive }: MarketRowProps) {
  const { currency, fxRate } = useCurrency();
  
  return (
    <div className="flex justify-between items-center py-2">
      <div>
        <div className="text-primary text-sm font-medium">{name}</div>
        <div className="text-secondary text-xs">
          {price === null || price === undefined || isNaN(Number(price)) || Number(price) <= 0
            ? 'Data unavailable'
            : formatCurrency(Number(price), currency, fxRate)}
        </div>
      </div>
      <div className="text-right">
        {change === null || change === undefined ? (
          <div className="text-xs text-secondary">—</div>
        ) : (
          <>
            <div className={`text-sm font-medium ${isPositive ? 'metric-positive' : 'metric-negative'}`}>
              {formatCurrency(change, currency, fxRate)}
            </div>
            <div className={`text-xs ${isPositive ? 'metric-positive' : 'metric-negative'}`}>
              {typeof changePercent === 'number' ? `${changePercent.toFixed(2)}%` : '—'}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface QuickStatProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  details?: {
    title: string;
    value: string;
    trend?: 'up' | 'down' | 'neutral';
  }[];
}

export function QuickStat({ icon, label, value, details }: QuickStatProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { currency, fxRate } = useCurrency();

  const formattedValue = typeof value === 'number' 
    ? formatCurrency(value, currency, fxRate)
    : value;

  return (
    <div className="space-y-2">
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          {icon}
          <span className="text-secondary text-sm ml-2">{label}</span>
        </div>
        <div className="flex items-center">
          <span className="text-primary font-semibold mr-2">{formattedValue}</span>
          {details && (
            isExpanded ? <ChevronUp className="h-4 w-4 text-secondary" /> 
                      : <ChevronDown className="h-4 w-4 text-secondary" />
          )}
        </div>
      </div>

      {isExpanded && details && (
        <div className="pl-6 space-y-2 animate-fadeIn">
          {details.map((detail, index) => (
            <div key={index} className="flex justify-between items-center text-xs">
              <span className="text-secondary">{detail.title}</span>
              <span className={`font-medium ${
                detail.trend === 'up' ? 'metric-positive' :
                detail.trend === 'down' ? 'metric-negative' :
                'text-secondary'
              }`}>
                {detail.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
