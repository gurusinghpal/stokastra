// Finnhub API service - more reliable and faster than Alpha Vantage
// Get free API key at: https://finnhub.io/register

const API_KEY = 'd2e9qe9r01qr1ro8spf0d2e9qe9r01qr1ro8spfg' // Replace with your Finnhub API key
const BASE_URL = 'https://finnhub.io/api/v1'

// Sample data for demo mode
const DEMO_QUOTES = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: '175.43',
    change: '2.15',
    changePercent: '1.24',
    volume: '45678900'
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    price: '378.85',
    change: '-1.23',
    changePercent: '-0.32',
    volume: '23456700'
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    price: '248.50',
    change: '5.67',
    changePercent: '2.34',
    volume: '78901200'
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    price: '485.09',
    change: '3.45',
    changePercent: '0.72',
    volume: '34567800'
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: '142.56',
    change: '1.89',
    changePercent: '1.34',
    volume: '12345600'
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com, Inc.',
    price: '145.80',
    change: '-2.10',
    changePercent: '-1.42',
    volume: '56789000'
  }
]

const DEMO_CHARTS = {
  'AAPL': Array.from({length: 20}, (_, i) => ({ 
    time: Date.now()/1000 - (20-i)*300, 
    close: 175 + Math.sin(i/3)*5 + Math.random()*2 
  })),
  'MSFT': Array.from({length: 20}, (_, i) => ({ 
    time: Date.now()/1000 - (20-i)*300, 
    close: 378 + Math.sin(i/2)*8 + Math.random()*3 
  })),
  'TSLA': Array.from({length: 20}, (_, i) => ({ 
    time: Date.now()/1000 - (20-i)*300, 
    close: 248 + Math.sin(i/4)*12 + Math.random()*4 
  })),
  'NVDA': Array.from({length: 20}, (_, i) => ({ 
    time: Date.now()/1000 - (20-i)*300, 
    close: 485 + Math.sin(i/3)*15 + Math.random()*5 
  })),
  'GOOGL': Array.from({length: 20}, (_, i) => ({ 
    time: Date.now()/1000 - (20-i)*300, 
    close: 142 + Math.sin(i/2)*6 + Math.random()*2 
  })),
  'AMZN': Array.from({length: 20}, (_, i) => ({ 
    time: Date.now()/1000 - (20-i)*300, 
    close: 145 + Math.sin(i/3)*8 + Math.random()*3 
  }))
}

// Fetch real-time quotes from Finnhub
export async function fetchQuotes(symbols) {
  if (API_KEY === 'YOUR_FINNHUB_API_KEY') {
    console.log('Using demo data (Finnhub) - Add your API key for live data')
    return DEMO_QUOTES
  }

  console.log('Fetching live quotes from Finnhub for symbols:', symbols)
  
  try {
    const results = []
    
    for (const symbol of symbols) {
      const url = `${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`
      console.log(`Fetching quote for ${symbol} from:`, url)
      
      const response = await fetch(url)
      console.log(`Response for ${symbol}:`, response.status, response.statusText)
      
      if (!response.ok) {
        console.warn(`Failed to fetch ${symbol}: ${response.status} - ${response.statusText}`)
        continue
      }
      
      const data = await response.json()
      console.log(`Data for ${symbol}:`, data)
      
      if (data.c && data.d && data.dp) {
        results.push({
          symbol: symbol,
          name: symbol, // Finnhub doesn't provide company names in quote endpoint
          price: data.c.toString(),
          change: data.d.toString(),
          changePercent: data.dp.toString(),
          volume: data.v ? data.v.toString() : '0'
        })
        console.log(`Successfully processed ${symbol}:`, results[results.length - 1])
      } else {
        console.warn(`No valid quote data for ${symbol}:`, data)
      }
    }
    
    console.log('Final quotes results:', results)
    return results
  } catch (error) {
    console.error('Error fetching Finnhub quotes:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return DEMO_QUOTES // Fallback to demo data
  }
}

// Fetch intraday chart data from Finnhub (much faster than Alpha Vantage)
export async function fetchCharts(symbols, interval = '5') {
  if (API_KEY === 'YOUR_FINNHUB_API_KEY') {
    console.log('Using demo chart data (Finnhub) - Add your API key for live data')
    return DEMO_CHARTS
  }

  console.log('Fetching live charts from Finnhub for symbols:', symbols)
  
  try {
    const results = {}
    
    for (const symbol of symbols) {
      const now = Math.floor(Date.now() / 1000)
      const oneDayAgo = now - (24 * 60 * 60) // 24 hours ago
      
      const url = `${BASE_URL}/stock/candle?symbol=${symbol}&resolution=${interval}&from=${oneDayAgo}&to=${now}&token=${API_KEY}`
      console.log(`Fetching chart for ${symbol} from:`, url)
      
      const response = await fetch(url)
      console.log(`Chart response for ${symbol}:`, response.status, response.statusText)
      
      if (!response.ok) {
        console.warn(`Failed to fetch chart for ${symbol}: ${response.status}`)
        continue
      }
      
      const data = await response.json()
      console.log(`Chart data for ${symbol}:`, data)
      
      if (data.s === 'ok' && data.t && data.c) {
        const chartData = []
        for (let i = 0; i < data.t.length; i++) {
          chartData.push({
            time: data.t[i],
            close: data.c[i]
          })
        }
        
        // Take last 20 data points for sparkline
        results[symbol] = chartData.slice(-20)
        console.log(`Successfully processed chart for ${symbol}:`, results[symbol].length, 'points')
      } else {
        console.warn(`No valid chart data for ${symbol}:`, data)
      }
    }
    
    console.log('Final charts results:', results)
    return results
  } catch (error) {
    console.error('Error fetching Finnhub charts:', error)
    return DEMO_CHARTS // Fallback to demo data
  }
}

// Test API connectivity
export async function testAPI() {
  try {
    console.log('Testing Finnhub API with key:', API_KEY)
    
    if (API_KEY === 'YOUR_FINNHUB_API_KEY') {
      console.log('Demo mode - no API key provided')
      return { quotes: DEMO_QUOTES.slice(0, 2), charts: DEMO_CHARTS }
    }
    
    // First test: simple API call to validate key
    const testUrl = `${BASE_URL}/quote?symbol=AAPL&token=${API_KEY}`
    console.log('Testing API key with URL:', testUrl)
    
    const testResponse = await fetch(testUrl)
    console.log('Test response status:', testResponse.status, testResponse.statusText)
    
    if (!testResponse.ok) {
      console.error('API key test failed:', testResponse.status, testResponse.statusText)
      return null
    }
    
    const testData = await testResponse.json()
    console.log('Test response data:', testData)
    
    // Check for API limit messages
    if (testData.error) {
      console.error('API error:', testData.error)
      return null
    }
    
    // Now test the actual functions
    const quotes = await fetchQuotes(['AAPL', 'MSFT'])
    const charts = await fetchCharts(['AAPL', 'MSFT'])
    
    console.log('Finnhub Test - Quotes:', quotes)
    console.log('Finnhub Test - Charts:', charts)
    
    return { quotes, charts }
  } catch (error) {
    console.error('Finnhub API Test failed:', error)
    return null
  }
}

// Get API key info
export function getAPIInfo() {
  if (API_KEY === 'YOUR_FINNHUB_API_KEY') {
    return {
      status: 'demo',
      message: 'Using demo data. Add your Finnhub API key for live data',
      url: 'https://finnhub.io/register'
    }
  }
  return {
    status: 'live',
    message: 'Using live Finnhub API',
    url: 'https://finnhub.io/'
  }
}
