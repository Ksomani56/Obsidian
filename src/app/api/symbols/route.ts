import { NextResponse } from 'next/server';

interface StockSymbol {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
  exchange: string;
}

const mockSymbols: StockSymbol[] = [
  // US Stocks
  { description: 'APPLE INC', displaySymbol: 'AAPL', symbol: 'AAPL', type: 'Common Stock', exchange: 'US' },
  { description: 'MICROSOFT CORP', displaySymbol: 'MSFT', symbol: 'MSFT', type: 'Common Stock', exchange: 'US' },
  { description: 'ALPHABET INC-CL A', displaySymbol: 'GOOGL', symbol: 'GOOGL', type: 'Common Stock', exchange: 'US' },
  // Indian Stocks
  { description: 'RELIANCE INDUSTRIES', displaySymbol: 'RELIANCE.NS', symbol: 'RELIANCE.NS', type: 'Common Stock', exchange: 'NSE' },
  { description: 'TATA CONSULTANCY', displaySymbol: 'TCS.NS', symbol: 'TCS.NS', type: 'Common Stock', exchange: 'NSE' },
  { description: 'HDFC BANK LTD', displaySymbol: 'HDFCBANK.NS', symbol: 'HDFCBANK.NS', type: 'Common Stock', exchange: 'NSE' },
  { description: 'INFOSYS LTD', displaySymbol: 'INFY.NS', symbol: 'INFY.NS', type: 'Common Stock', exchange: 'NSE' },
  { description: 'ICICI BANK LTD', displaySymbol: 'ICICIBANK.NS', symbol: 'ICICIBANK.NS', type: 'Common Stock', exchange: 'NSE' },
  { description: 'HINDUSTAN UNILEVER', displaySymbol: 'HINDUNILVR.NS', symbol: 'HINDUNILVR.NS', type: 'Common Stock', exchange: 'NSE' },
  { description: 'STATE BANK OF INDIA', displaySymbol: 'SBIN.NS', symbol: 'SBIN.NS', type: 'Common Stock', exchange: 'NSE' },
];

export async function GET() {
  console.log('Fetching stock symbols...');
  
  if (!process.env.FINNHUB_API_KEY) {
    console.warn('FINNHUB_API_KEY not found, using mock data');
    return NextResponse.json({ symbols: mockSymbols, isMock: true });
  }
  
  try {

    // Fetch both US and Indian stocks
    const exchanges = [
      { code: 'US', name: 'US' },
      { code: 'NSE', name: 'NSE' }
    ];

    const responses = await Promise.all(
      exchanges.map(exchange => 
        fetch(
          `https://finnhub.io/api/v1/stock/symbol?exchange=${exchange.code}&token=${process.env.FINNHUB_API_KEY}`,
          { next: { revalidate: 86400 } }
        )
      )
    );

    const results = await Promise.all(
      responses.map(async (response, index) => {
        if (!response.ok) {
          console.error(`Error fetching ${exchanges[index].name} stocks:`, response.statusText);
          return { ok: false, data: [] as any[], exchange: exchanges[index].name };
        }
        const data = await response.json();
        const normalized = Array.isArray(data) ? data.map(stock => ({
          ...stock,
          exchange: exchanges[index].name
        })) : [];
        return { ok: true, data: normalized, exchange: exchanges[index].name };
      })
    );

    let allStocks = results.flatMap(r => r.data);

    // If NSE failed or returned 0, append a small mock NSE list so Indian symbols always appear
    const nseOk = results.find(r => r.exchange === 'NSE')?.ok;
    const hasNSE = allStocks.some((s: any) => (s.exchange || '').toUpperCase() === 'NSE');
    if (!nseOk || !hasNSE) {
      console.warn('NSE symbols unavailable from API, appending mock NSE list');
      allStocks = allStocks.concat(
        mockSymbols
          .filter(s => (s.exchange || '') === 'NSE')
          .map(s => ({ description: s.description, displaySymbol: s.displaySymbol, symbol: s.symbol, type: s.type, exchange: s.exchange }))
      );
    }
    
    if (allStocks.length === 0) {
      console.log('No stocks found from API, using mock data');
      return NextResponse.json({ symbols: mockSymbols, isMock: true });
    }

    // Filter out non-common stocks and format the response
    // Return all stock types but normalize fields; client can filter by type if desired
    const normalized = allStocks.map((stock: any) => ({
      description: stock.description,
      displaySymbol: stock.displaySymbol,
      symbol: stock.symbol,
      type: stock.type,
      exchange: stock.exchange
    }));

    if (normalized.length === 0) {
      console.log('No stocks found after normalization, using mock data');
      return NextResponse.json({ symbols: mockSymbols, isMock: true });
    }

  console.log(`Found ${normalized.length} stocks`);
  return NextResponse.json({ symbols: normalized, isMock: false });
  } catch (error) {
    console.error('Error fetching stock symbols:', error);
    console.log('Falling back to mock data due to error');
    return NextResponse.json(mockSymbols);
  }
}
