interface MarketData {
  name: string;
  price: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
}

interface QuickStat {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  details?: {
    title: string;
    value: string;
    trend?: 'up' | 'down' | 'neutral';
  }[];
}

export async function getMarketData(): Promise<MarketData[]> {
  const apiKey = process.env.FINNHUB_API_KEY;
  const indices = [
    { symbol: '^NSEI', name: 'NIFTY 50' },
    { symbol: '^GSPC', name: 'S&P 500' },
    { symbol: '^IXIC', name: 'NASDAQ' },
    { symbol: '^DJI', name: 'DOW JONES' },
    { symbol: '^FTSE', name: 'FTSE 100' }
  ];

  try {
    const quotes = await Promise.all(
      indices.map(async (index) => {
        const response = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${index.symbol}&token=${apiKey}`,
          { next: { revalidate: 60 } }
        );
        if (!response.ok) throw new Error(`Error fetching ${index.name}`);
        return { ...(await response.json()), name: index.name };
      })
    );

    return quotes.map(quote => ({
      name: quote.name,
      price: quote.c,
      change: quote.d,
      changePercent: quote.dp,
      isPositive: quote.d >= 0
    }));
  } catch (error) {
    console.error('Error fetching market data:', error);
    return [];
  }
}
