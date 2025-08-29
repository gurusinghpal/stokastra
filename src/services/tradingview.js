// TradingView API service for comprehensive market data
const BASE_URL = '/tvapi/global/scan';

export async function fetchTradingViewData(symbols) {
  try {
    const results = [];
    // Debug: log the symbols being sent
    console.log('TradingView fetchTradingViewData symbols:', symbols);
    // Hardcoded test for a single known-good symbol
    const testSymbols = ['NASDAQ:AAPL'];
    for (const symbol of (symbols.length ? symbols : testSymbols)) {
      try {
        const body = {
          symbols: { tickers: [symbol], query: { types: [] } },
          columns: [
            'symbol', 'name', 'price', 'change', 'change_abs', 'change_1h', 'change_24h', 'change_7d',
            'market_cap_basic', 'volume_24h', 'circulating_supply', 'sector', 'country'
          ],
          range: [0, 1],
          sort: [{ sortBy: 'market_cap_basic', sortOrder: 'desc' }]
        };
        // Debug: log the request body
        console.log('TradingView request body:', body);
        const response = await fetch(BASE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        // Debug: log the response status
        console.log('TradingView response status:', response.status);
        if (!response.ok) continue;
        const data = await response.json();
        // Debug: log the response data
        console.log('TradingView response data:', data);
        if (data.data && data.data.length > 0) {
          const d = data.data[0].d;
          results.push({
            symbol,
            name: d[1] || symbol.split(':')[1] || symbol,
            price: d[2] || 0,
            change: d[3] || 0,
            changeAbs: d[4] || 0,
            change1h: d[5] || 0,
            change24h: d[6] || 0,
            change7d: d[7] || 0,
            marketCap: d[8] || 0,
            volume24h: d[9] || 0,
            circulatingSupply: d[10] || 0,
            sector: d[11] || '',
            country: d[12] || ''
          });
        }
      } catch (error) { console.error('TradingView fetch error:', error); continue; }
    }
    return results;
  } catch (error) { console.error('TradingView fetch outer error:', error); return []; }
}

export async function fetchTradingViewCharts(symbols, limit = 100) {
  try {
    const results = {};
    for (const symbol of symbols) {
      try {
        const response = await fetch(BASE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbols: { tickers: [symbol], query: { types: [] } },
            columns: ['close', 'high', 'low', 'open', 'volume', 'time'],
            range: [0, limit],
            sort: [{ sortBy: 'time', sortOrder: 'desc' }]
          })
        });
        if (!response.ok) continue;
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          const chartData = data.data.map(item => {
            const d = item.d;
            return {
              time: d[5] || Date.now() / 1000,
              open: d[3] || 0,
              high: d[1] || 0,
              low: d[2] || 0,
              close: d[0] || 0,
              volume: d[4] || 0
            };
          }).reverse();
          results[symbol] = chartData;
        }
      } catch (error) { continue; }
    }
    return results;
  } catch (error) { return {}; }
}

export function getTradingViewInfo() {
  return {
    status: 'live',
    message: 'Using live TradingView API',
    url: 'https://www.tradingview.com/'
  };
}

// Add a test function for compatibility
export async function testTradingViewAPI() {
  const testSymbols = ['NASDAQ:AAPL', 'NASDAQ:MSFT'];
  const quotes = await fetchTradingViewData(testSymbols);
  const charts = await fetchTradingViewCharts(testSymbols);
  console.log('TradingView Test - Quotes:', quotes);
  console.log('TradingView Test - Charts:', charts);
  return { quotes, charts };
}
