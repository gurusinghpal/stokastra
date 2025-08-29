// Alpha Vantage API service - more reliable than Yahoo Finance
// Get free API key at: https://www.alphavantage.co/support/#api-key

const API_KEY = 'TA8ZF3KX5HODVR1N' // Replace with your free API key from alphavantage.co
const BASE_URL = 'https://www.alphavantage.co/query'

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

// Fetch real-time quotes from Alpha Vantage
export async function fetchQuotes(symbols) {
  if (API_KEY === 'demo') {
    console.log('Using demo data (Alpha Vantage)')
    return DEMO_QUOTES
  }

  console.log('Fetching live quotes from Alpha Vantage for symbols:', symbols)
  
  try {
    const results = []
    
    for (const symbol of symbols) {
      const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`
      console.log(`Fetching quote for ${symbol} from:`, url)
      
      const response = await fetch(url)
      console.log(`Response for ${symbol}:`, response.status, response.statusText)
      
      if (!response.ok) {
        console.warn(`Failed to fetch ${symbol}: ${response.status} - ${response.statusText}`)
        continue
      }
      
      const data = await response.json()
      console.log(`Data for ${symbol}:`, data)
      
      const quote = data['Global Quote']
      
      if (quote && quote['01. symbol']) {
        results.push({
          symbol: quote['01. symbol'],
          name: quote['01. symbol'], // Alpha Vantage doesn't provide company names in this endpoint
          price: quote['05. price'],
          change: quote['09. change'],
          changePercent: quote['10. change percent']?.replace('%', ''),
          volume: quote['06. volume']
        })
        console.log(`Successfully processed ${symbol}:`, results[results.length - 1])
      } else {
        console.warn(`No valid quote data for ${symbol}:`, data)
      }
    }
    
    console.log('Final quotes results:', results)
    return results
  } catch (error) {
    console.error('Error fetching Alpha Vantage quotes:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return DEMO_QUOTES // Fallback to demo data
  }
}

// Fetch intraday chart data from Alpha Vantage
export async function fetchCharts(symbols, interval = '5min') {
  if (API_KEY === 'demo') {
    console.log('Using demo chart data (Alpha Vantage)')
    return DEMO_CHARTS
  }

  try {
    const results = {}
    
    for (const symbol of symbols) {
      const url = `${BASE_URL}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&apikey=${API_KEY}`
      const response = await fetch(url)
      
      if (!response.ok) {
        console.warn(`Failed to fetch chart for ${symbol}: ${response.status}`)
        continue
      }
      
      const data = await response.json()
      const timeSeries = data[`Time Series (${interval})`]
      
      if (timeSeries) {
        const chartData = []
        const timestamps = Object.keys(timeSeries).sort().slice(-20) // Last 20 data points
        
        for (const timestamp of timestamps) {
          const entry = timeSeries[timestamp]
          chartData.push({
            time: new Date(timestamp).getTime() / 1000,
            close: parseFloat(entry['4. close'])
          })
        }
        
        results[symbol] = chartData
      }
    }
    
    return results
  } catch (error) {
    console.error('Error fetching Alpha Vantage charts:', error)
    return DEMO_CHARTS // Fallback to demo data
  }
}

// Test API connectivity
export async function testAPI() {
  try {
    console.log('Testing Alpha Vantage API with key:', API_KEY)
    
    // First test: simple API call to validate key
    const testUrl = `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=AAPL&apikey=${API_KEY}`
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
    if (testData['Note'] || testData['Error Message']) {
      console.error('API limit or error:', testData)
      return null
    }
    
    // Now test the actual functions
    const quotes = await fetchQuotes(['AAPL', 'MSFT'])
    const charts = await fetchCharts(['AAPL', 'MSFT'])
    
    console.log('Alpha Vantage Test - Quotes:', quotes)
    console.log('Alpha Vantage Test - Charts:', charts)
    
    return { quotes, charts }
  } catch (error) {
    console.error('Alpha Vantage API Test failed:', error)
    return null
  }
}

// Get API key info
export function getAPIInfo() {
  if (API_KEY === 'demo') {
    return {
      status: 'demo',
      message: 'Using demo data. Get free API key at alphavantage.co',
      url: 'https://www.alphavantage.co/support/#api-key'
    }
  }
  return {
    status: 'live',
    message: 'Using live Alpha Vantage API',
    url: 'https://www.alphavantage.co/'
  }
}
