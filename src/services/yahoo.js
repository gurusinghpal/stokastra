const isDev = typeof window !== 'undefined' && window.location?.hostname === 'localhost'
const baseUrl = isDev ? '/yapi' : 'https://query1.finance.yahoo.com'

// Mock data fallback for testing when API is blocked
const MOCK_QUOTES = [
  {
    symbol: 'AAPL',
    shortName: 'Apple Inc.',
    regularMarketPrice: 175.43,
    regularMarketChangePercent: 2.15,
    regularMarketVolume: 45678900
  },
  {
    symbol: 'MSFT',
    shortName: 'Microsoft Corporation',
    regularMarketPrice: 378.85,
    regularMarketChangePercent: -1.23,
    regularMarketVolume: 23456700
  },
  {
    symbol: 'TSLA',
    shortName: 'Tesla, Inc.',
    regularMarketPrice: 248.50,
    regularMarketChangePercent: 5.67,
    regularMarketVolume: 78901200
  },
  {
    symbol: 'NVDA',
    shortName: 'NVIDIA Corporation',
    regularMarketPrice: 485.09,
    regularMarketChangePercent: 3.45,
    regularMarketVolume: 34567800
  }
]

const MOCK_CHARTS = {
  'AAPL': Array.from({length: 20}, (_, i) => ({ time: Date.now()/1000 - (20-i)*300, close: 175 + Math.sin(i/3)*5 })),
  'MSFT': Array.from({length: 20}, (_, i) => ({ time: Date.now()/1000 - (20-i)*300, close: 378 + Math.sin(i/2)*8 })),
  'TSLA': Array.from({length: 20}, (_, i) => ({ time: Date.now()/1000 - (20-i)*300, close: 248 + Math.sin(i/4)*12 })),
  'NVDA': Array.from({length: 20}, (_, i) => ({ time: Date.now()/1000 - (20-i)*300, close: 485 + Math.sin(i/3)*15 }))
}

// Test function to verify API connectivity
export async function testAPI() {
  try {
    const testSymbols = ['AAPL', 'MSFT']
    const quotes = await fetchQuotes(testSymbols)
    console.log('API Test - Quotes:', quotes)
    
    const charts = await fetchCharts(testSymbols)
    console.log('API Test - Charts:', charts)
    
    return { quotes, charts }
  } catch (error) {
    console.error('API Test failed:', error)
    return null
  }
}

// Quotes via dev proxy in development
export async function fetchQuotes(symbols) {
  if (!symbols || symbols.length === 0) return []
  const list = Array.isArray(symbols) ? symbols.join(',') : symbols
  const url = `${baseUrl}/v7/finance/quote?symbols=${encodeURIComponent(list)}`
  
  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    const result = json?.quoteResponse?.result || []
    return result
  } catch (error) {
    console.error('Error fetching quotes:', error)
    return []
  }
}

// Fetch charts per-symbol in parallel (Yahoo's batch chart endpoint is not supported)
export async function fetchCharts(symbols, range='1d', interval='5m') {
  if (!symbols || symbols.length === 0) return {}
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 20000)
  try {
    const entries = await Promise.all(symbols.map(async (symbol) => {
      const url = `${baseUrl}/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`
      try {
        const res = await fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const r = json?.chart?.result?.[0]
        if (!r) return [symbol, []]
        const times = r.timestamp || []
        const closes = r.indicators?.quote?.[0]?.close || []
        const data = times.map((t,i)=>({ time: t, close: closes[i] })).filter(p=>Number.isFinite(p.close))
        return [symbol, data]
      } catch (e) {
        console.error(`Chart fetch failed for ${symbol}:`, e)
        return [symbol, []]
      }
    }))
    clearTimeout(timeoutId)
    const out = {}
    for (const [s, d] of entries) out[s] = d
    return out
  } catch (e) {
    clearTimeout(timeoutId)
    console.error('fetchCharts failed:', e)
    return {}
  }
}

// Single symbol chart (kept for compatibility)
export async function fetchChart(symbol, range='1d', interval='5m') {
  const map = await fetchCharts([symbol], range, interval)
  return map[symbol] || []
}
