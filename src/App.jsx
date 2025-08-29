import React, { useEffect, useMemo, useState } from 'react'
import { FiSearch } from 'react-icons/fi'
import Sparkline from './components/Sparkline'
import TvMini from './components/TvMini'
import { fetchQuotes, fetchCharts, testAPI, getAPIInfo } from './services/finnhub'
import { fetchTradingViewData, fetchTradingViewCharts, testTradingViewAPI, getTradingViewInfo } from './services/tradingview'

const DEFAULT_MARKETS = [
  'NASDAQ:AAPL','NASDAQ:MSFT','NASDAQ:TSLA','NASDAQ:NVDA',
  'CME_MINI:ES1!','TVC:SPX','AMEX:SPY','NASDAQ:QQQ',
  'OANDA:EURUSD','OANDA:USDJPY','TVC:GOLD','NYMEX:CL1!'
]

const YMAP = {
  'NASDAQ:AAPL':'AAPL',
  'NASDAQ:MSFT':'MSFT',
  'NASDAQ:TSLA':'TSLA',
  'NASDAQ:NVDA':'NVDA',
  'CME_MINI:ES1!':'ES=F',
  'TVC:SPX':'^GSPC',
  'AMEX:SPY':'SPY',
  'NASDAQ:QQQ':'QQQ',
  'OANDA:EURUSD':'EURUSD=X',
  'OANDA:USDJPY':'USDJPY=X',
  'TVC:GOLD':'GC=F',
  'NYMEX:CL1!':'CL=F',
}

function tvToYahoo(sym){ return YMAP[sym] || sym }

export default function App(){
  console.log('App component rendering')
  
  const [activeTab, setActiveTab] = useState('market')
  const [watch, setWatch] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem('stok_watch')) || DEFAULT_MARKETS }catch{return DEFAULT_MARKETS}
  })
  const [quotes, setQuotes] = useState([])
  const [charts, setCharts] = useState({})
  const [isLoadingCharts, setIsLoadingCharts] = useState(false)
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false)
  const [apiStatus, setApiStatus] = useState('idle')
  const [apiInfo, setApiInfo] = useState(getAPIInfo())
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [useTradingView, setUseTradingView] = useState(true)
  const [tradingViewQuotes, setTradingViewQuotes] = useState([])
  const [tradingViewCharts, setTradingViewCharts] = useState({})

  // User authentication state
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('stok_current_user')) || null
    } catch {
      return null
    }
  })
  const [users, setUsers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('stok_users')) || [
        {
          id: 'demo1',
          username: 'trader_jane',
          email: 'jane@example.com',
          password: 'jane@example.com',
          bio: 'Professional trader | Tech stocks enthusiast | $AAPL $TSLA',
          avatar: null,
          followers: ['demo2', 'demo3'],
          following: ['demo2'],
          createdAt: new Date('2024-01-01').toISOString()
        },
        {
          id: 'demo2',
          username: 'market_wizard',
          email: 'wizard@example.com',
          password: 'wizard@example.com',
          bio: 'Market analyst | Crypto & traditional markets | $BTC $ETH',
          avatar: null,
          followers: ['demo1'],
          following: ['demo1'],
          createdAt: new Date('2024-01-15').toISOString()
        },
        {
          id: 'demo3',
          username: 'stock_guru',
          email: 'guru@example.com',
          password: 'guru@example.com',
          bio: 'Investment advisor | Long-term value investing | $MSFT $GOOGL',
          avatar: null,
          followers: [],
          following: ['demo1'],
          createdAt: new Date('2024-02-01').toISOString()
        }
      ]
    } catch {
      return []
    }
  })
  const [notifications, setNotifications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('stok_notifications')) || [
        {
          id: 1,
          type: 'like',
          userId: 'demo2',
          targetUserId: 'demo1',
          postId: 1,
          message: 'market_wizard liked your post',
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          read: false
        },
        {
          id: 2,
          type: 'comment',
          userId: 'demo3',
          targetUserId: 'demo1',
          postId: 1,
          message: 'stock_guru commented on your post',
          createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          read: false
        },
        {
          id: 3,
          type: 'follow',
          userId: 'demo2',
          targetUserId: 'demo1',
          message: 'market_wizard started following you',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read: true
        }
      ]
    } catch {
      return []
    }
  })

  useEffect(()=>{ localStorage.setItem('stok_watch', JSON.stringify(watch)) }, [watch])
  useEffect(() => {
    localStorage.setItem('stok_users', JSON.stringify(users))
  }, [users])
  useEffect(() => {
    localStorage.setItem('stok_current_user', JSON.stringify(currentUser))
  }, [currentUser])
  useEffect(() => {
    localStorage.setItem('stok_notifications', JSON.stringify(notifications))
  }, [notifications])

  useEffect(() => {
    console.log('App component mounted')
    console.log('Current activeTab:', activeTab)
    console.log('Current user:', currentUser)
    
    // Reset demo data to ensure passwords are set
    if (!localStorage.getItem('stok_users')) {
      console.log('Initializing demo users with passwords')
    }
  }, [])

  const loadData = async (isRefresh = false) => {
    try{
      setIsLoadingQuotes(true)
      setIsLoadingCharts(true)
      
      // Only show "Connecting..." on initial load, not on refreshes
      if (isInitialLoad) {
        setApiStatus('loading')
      }
      
        const ys = watch.map(tvToYahoo)
      let q, chartData
      
      q = await fetchQuotes(ys)
      console.log('Quotes response:', q) // Debug: see quotes response
      
      // Check if we got real data or empty array (API failed)
      if (q && q.length > 0) {
        setApiStatus('success')
        setApiInfo(getAPIInfo())
      } else {
        console.log('Live API failed, switching to demo mode automatically')
        setApiStatus('mock')
        // Auto-fallback to demo data
        q = [
          { symbol: 'AAPL', name: 'Apple Inc.', price: '175.43', change: '2.15', changePercent: '1.24', volume: '45678900' },
          { symbol: 'MSFT', name: 'Microsoft Corporation', price: '378.85', change: '-1.23', changePercent: '-0.32', volume: '23456700' },
          { symbol: 'TSLA', name: 'Tesla, Inc.', price: '248.50', change: '5.67', changePercent: '2.34', volume: '78901200' },
          { symbol: 'NVDA', name: 'NVIDIA Corporation', price: '485.09', change: '3.45', changePercent: '0.72', volume: '34567800' }
        ]
      }
      const chartSymbols = ys.slice(0,8)
      chartData = await fetchCharts(chartSymbols)
      if (!chartData || Object.keys(chartData).length === 0) {
        chartData = {}
        for (const symbol of chartSymbols) {
          chartData[symbol] = Array.from({length: 20}, (_, i) => ({ time: Date.now()/1000 - (20-i)*300, close: 100 + Math.random() * 200 + Math.sin(i/3)*10 }))
        }
      }
        setQuotes(q)
      setIsLoadingQuotes(false)
      setCharts(chartData)
      setIsLoadingCharts(false)
      
      // Mark initial load as complete and update timestamp
      if (isInitialLoad) {
        setIsInitialLoad(false)
      }
      setLastUpdated(new Date())
      
      // Also fetch TradingView data for All Markets section
      if (useTradingView) {
        try {
          const tvQuotes = await fetchTradingViewData(ys)
          const tvCharts = await fetchTradingViewCharts(ys)
          setTradingViewQuotes(tvQuotes)
          setTradingViewCharts(tvCharts)
          console.log('TradingView data loaded:', tvQuotes.length, 'quotes,', Object.keys(tvCharts).length, 'charts')
        } catch (error) {
          console.error('Error loading TradingView data:', error)
        }
      }
    }catch(e){ 
      console.error(e)
      setIsLoadingQuotes(false)
      setIsLoadingCharts(false)
      setApiStatus('error')
    }
  }

  useEffect(()=>{
    loadData()
    const id=setInterval(() => loadData(true), 30_000)
    return ()=>{ clearInterval(id) }
  }, [watch])

  const trending = useMemo(()=>{
    let arr=[...quotes]
    
    // Filter by search query if provided
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      arr = arr.filter(item => 
        item.symbol.toLowerCase().includes(query) || 
        (item.name && item.name.toLowerCase().includes(query))
      )
    }
    
    arr.sort((a,b)=>Math.abs(parseFloat(b.changePercent)||0)-Math.abs(parseFloat(a.changePercent)||0))
    return arr.slice(0,6)
  }, [quotes, searchQuery])

  // Filter watchlist symbols based on search query
  const filteredWatchlist = useMemo(() => {
    if (!searchQuery.trim()) return watch
    
    const query = searchQuery.toLowerCase()
    return watch.filter(symbol => {
      // Check if symbol contains search query
      if (symbol.toLowerCase().includes(query)) return true
      
      // Check if the mapped Yahoo symbol contains search query
      const yahooSymbol = tvToYahoo(symbol)
      if (yahooSymbol.toLowerCase().includes(query)) return true
      
      // Check if any quote data matches
      const matchingQuote = quotes.find(q => 
        q.symbol.toLowerCase().includes(query) || 
        (q.name && q.name.toLowerCase().includes(query))
      )
      return matchingQuote !== undefined
    })
  }, [watch, searchQuery, quotes])

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Header 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          useTradingView={useTradingView}
          setUseTradingView={setUseTradingView}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          users={users}
          setUsers={setUsers}
          notifications={notifications}
          setNotifications={setNotifications}
        />
        {activeTab==='market'? (
          <>
            <TrendingRow 
              items={trending} 
              charts={charts} 
              isLoadingCharts={isLoadingCharts} 
              isLoadingQuotes={isLoadingQuotes} 
              apiStatus={apiStatus}
              lastUpdated={lastUpdated}
              searchQuery={searchQuery}
            />
            <AllMarkets 
              symbols={filteredWatchlist} 
              totalSymbols={watch} 
              charts={useTradingView ? tradingViewCharts : charts} 
              quotes={useTradingView ? tradingViewQuotes : quotes}
              useTradingView={useTradingView}
            />
          </>
        ) : (
          <Community 
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            users={users}
            setUsers={setUsers}
            notifications={notifications}
            setNotifications={setNotifications}
          />
        )}
        <footer className="mt-10 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Stokastra — Markets dashboard.
        </footer>
      </div>
    </div>
  )
}

function Header({ activeTab, setActiveTab, searchQuery, setSearchQuery, useTradingView, setUseTradingView, currentUser, setCurrentUser, users, setUsers, notifications, setNotifications }){
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  
  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // For now, just log the search query
      console.log('Searching for:', searchQuery.trim())
      // You can implement actual search functionality here later
    }
  }

  const getUnreadNotificationsCount = () => {
    return notifications.filter(notif => !notif.read && notif.targetUserId === currentUser?.id).length
  }

  const markAllNotificationsAsRead = () => {
    setNotifications(notifications.map(notif => 
      notif.targetUserId === currentUser?.id ? { ...notif, read: true } : notif
    ))
  }

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notifications-container')) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications])

  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-fuchsia-600 grid place-items-center text-white font-bold">S</div>
        <div>
          <div className="text-lg font-semibold">Stokastra</div>
          <div className="text-xs text-slate-400">Minimal markets & community</div>
        </div>
        <nav className="ml-6 flex gap-2">
          <Tab label="Market" active={activeTab==='market'} onClick={()=>setActiveTab('market')} />
          <Tab label="Community" active={activeTab==='community'} onClick={()=>setActiveTab('community')} />
        </nav>
      </div>
      <div className="hidden md:flex items-center gap-2">
        <form onSubmit={handleSearch} className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg" />
          <input 
            type="text"
            placeholder="Search markets..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 pr-10 w-72 focus:pl-10 focus:pr-10" 
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
            >
              ✕
            </button>
          )}
        </form>
        
        {/* Notifications */}
        {currentUser && (
          <div className="relative notifications-container">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
              {getUnreadNotificationsCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getUnreadNotificationsCount()}
                </span>
              )}
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-lg z-50">
                <div className="p-4 border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Notifications</h3>
                    <button 
                      onClick={markAllNotificationsAsRead}
                      className="text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      Mark all read
                    </button>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.filter(notif => notif.targetUserId === currentUser?.id).length > 0 ? (
                    notifications
                      .filter(notif => notif.targetUserId === currentUser?.id)
                      .map(notification => (
                        <div 
                          key={notification.id} 
                          className={`p-4 border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer ${!notification.read ? 'bg-slate-700/20' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                              {notification.type === 'like' ? '❤️' : notification.type === 'comment' ? '💬' : '👤'}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-slate-200">{notification.message}</p>
                              <p className="text-xs text-slate-400 mt-1">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="p-4 text-center text-slate-400">
                      No notifications yet
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-2">
          {currentUser ? (
            <>
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm">{currentUser.username}</span>
              <button onClick={() => setCurrentUser(null)} className="btn btn-ghost btn-sm">Logout</button>
            </>
          ) : (
            <button onClick={() => setIsLoginModalOpen(true)} className="btn btn-primary">
              Login
            </button>
          )}
        </div>
        <button 
          onClick={() => setUseTradingView(!useTradingView)} 
          className={`btn ${useTradingView ? 'btn-secondary' : 'btn-ghost'}`}
        >
          {useTradingView ? 'TradingView' : 'Finnhub'}
        </button>
      </div>

      {/* Login Modal */}
      {isLoginModalOpen && (
        <LoginModal 
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          users={users}
          setUsers={setUsers}
          setCurrentUser={setCurrentUser}
        />
      )}
    </header>
  )
}

function Tab({ label, active, onClick }){
  return <button onClick={onClick} className={`px-3 py-1 rounded-xl ${active?'bg-slate-800 text-white':'text-slate-300 hover:text-white hover:bg-slate-800/60'}`}>{label}</button>
}

function TrendingRow({ items, charts, isLoadingCharts, isLoadingQuotes, apiStatus, lastUpdated, searchQuery }){
  const getStatusColor = () => {
    switch(apiStatus) {
      case 'success': return 'text-emerald-400'
      case 'error': return 'text-rose-400'
      case 'mock': return 'text-yellow-400'
      case 'loading': return 'text-blue-400'
      default: return 'text-slate-400'
    }
  }
  
  const getStatusText = () => {
    switch(apiStatus) {
      case 'success': return 'Live Data'
      case 'error': return 'API Error'
      case 'mock': return 'Mock Data'
      case 'loading': return 'Connecting...'
      default: return 'Idle'
    }
  }

  return (
    <section className="card p-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Trending Markets</h2>
          <p className="text-xs text-slate-400">Top movers by % change</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`text-xs ${getStatusColor()} flex items-center gap-2`}>
            <div className={`w-2 h-2 rounded-full ${apiStatus === 'loading' ? 'animate-pulse' : ''} ${
              apiStatus === 'success' ? 'bg-emerald-400' :
              apiStatus === 'error' ? 'bg-rose-400' :
              apiStatus === 'mock' ? 'bg-yellow-400' :
              apiStatus === 'loading' ? 'bg-blue-400' : 'bg-slate-400'
            }`}></div>
            {getStatusText()}
          </div>
          {lastUpdated && apiStatus !== 'loading' && (
            <div className="text-xs text-slate-400">
              Updated {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          {apiStatus === 'success' && (
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
              Auto-refresh every 30s
            </div>
          )}
          {(isLoadingCharts || isLoadingQuotes) && apiStatus !== 'loading' && (
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
              Refreshing...
            </div>
          )}
        </div>
      </div>
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex gap-4 min-w-max">
          {items.length > 0 ? (
            items.map(it=> <TrendingCard key={it.symbol} q={it} kdata={charts[it.symbol]} />)
          ) : isLoadingQuotes ? (
            <div className="text-slate-400 text-sm">Loading market data...</div>
          ) : searchQuery.trim() ? (
            <div className="text-slate-400 text-sm">No markets found for "{searchQuery}"</div>
          ) : (
            <div className="text-slate-400 text-sm">No market data available</div>
          )}
        </div>
      </div>
    </section>
  )
}

function TrendingCard({ q, kdata }){
  const up = parseFloat(q.changePercent) >= 0
  const title = q.name || q.symbol
  return (
    <div className="card p-4 w-[320px]">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-semibold text-sm">{title}</div>
          <div className="text-xs text-slate-400">{q.symbol}</div>
        </div>
        <div className={`text-sm ${up?'text-emerald-400':'text-rose-400'}`}>
          {up?'+':''}{q.changePercent}%
        </div>ī
      </div>
      <div className="flex items-end justify-between">
        <div className="text-lg font-semibold">${parseFloat(q.price).toLocaleString()}</div>
        <div className="text-xs text-slate-400">Vol {fmt(q.volume)}</div>
      </div>
      <div className="mt-2">
        {kdata ? (
          <Sparkline data={kdata.map(d=>({time:d.time, close:d.close}))} up={up} />
        ) : (
          <div className="h-16 rounded-xl bg-gradient-to-r from-slate-800/50 to-slate-700/50 animate-pulse">
            <div className="h-full w-full bg-gradient-to-r from-transparent via-slate-600/20 to-transparent animate-shimmer"></div>
          </div>
        )}
      </div>
    </div>
  )
}

function AllMarkets({ symbols, totalSymbols, charts, quotes, useTradingView }) {
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-200">All Markets</h2>
          <p className="text-xs text-slate-400">
            {symbols.length === totalSymbols.length ? 
              `Mini charts via ${useTradingView ? 'TradingView' : 'Finnhub'} API` : 
              `${symbols.length} of ${totalSymbols.length} markets found`
            }
          </p>
        </div>
      </div>
      
      {/* Market Charts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {symbols.map((sym) => {
          const yahooSymbol = tvToYahoo(sym)
          const quote = quotes.find(q => q.symbol === sym || q.symbol === yahooSymbol)
          const change = quote?.changePercent || 0
          const up = parseFloat(change) >= 0
          
          return (
            <div key={sym} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold text-sm">{sym.split(':')[1] || sym}</div>
                  <div className="text-xs text-slate-400">{useTradingView ? (quote?.name || sym) : yahooSymbol}</div>
                </div>
                {quote && (
                  <div className={`text-sm ${up?'text-emerald-400':'text-rose-400'}`}>
                    {up?'+':''}{change}%
                  </div>
                )}
              </div>
              <div className="flex items-end justify-between mb-2">
                {quote ? (
                  <>
                    <div className="text-lg font-semibold">${parseFloat(quote.price).toLocaleString()}</div>
                    <div className="text-xs text-slate-400">Vol {fmt(quote.volume)}</div>
                  </>
                ) : (
                  <div className="text-sm text-slate-400">Loading...</div>
                )}
              </div>
              <div className="h-32">
                <TvMini symbol={sym} height={120} width="100%" />
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Table View (optional) */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/60">
                <th className="text-left p-4 text-xs font-medium text-slate-400">#</th>
                <th className="text-left p-4 text-xs font-medium text-slate-400">Name</th>
                <th className="text-right p-4 text-xs font-medium text-slate-400">Price</th>
                <th className="text-right p-4 text-xs font-medium text-slate-400">Change</th>
                <th className="text-right p-4 text-xs font-medium text-slate-400">Volume</th>
              </tr>
            </thead>
            <tbody>
              {symbols.map((sym, index) => {
                const yahooSymbol = tvToYahoo(sym)
                const quote = quotes.find(q => q.symbol === sym || q.symbol === yahooSymbol)
                const change = quote?.changePercent || 0
                const up = parseFloat(change) >= 0
                
                return (
                  <tr key={sym} className="border-b border-slate-700/30 hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 text-sm text-slate-300 font-medium">{index + 1}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {sym.split(':')[1]?.charAt(0) || sym.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-200">{sym.split(':')[1] || sym}</div>
                          <div className="text-xs text-slate-400">{useTradingView ? (quote?.name || sym) : yahooSymbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-slate-200 font-medium">
                        {quote ? `$${parseFloat(quote.price).toLocaleString()}` : '-'}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className={`text-sm ${up?'text-emerald-400':'text-rose-400'}`}>
                        {quote ? `${up?'+':''}${change}%` : '-'}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-sm text-slate-300">
                        {quote ? `$${fmt(quote.volume)}` : '-'}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function Community({ currentUser, setCurrentUser, users, setUsers, notifications, setNotifications }) {
  // Posts and community state
  const [posts, setPosts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('stok_posts')) || [
        {
          id: 1,
          userId: 'demo1',
          username: 'trader_jane',
          text: 'Just finished analyzing $AAPL earnings. The iPhone 15 sales are exceeding expectations! 📈\n\nKey takeaways:\n• Revenue up 8% YoY\n• Services growth strong\n• China market recovery\n\nWhat do you think about the stock at current levels?',
          image: null,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          likes: 24,
          comments: [
            {
              id: 101,
              userId: 'demo2',
              username: 'market_wizard',
              text: 'Great analysis! I think AAPL is still undervalued given their services growth.',
              createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 102,
              userId: 'demo3',
              username: 'stock_guru',
              text: 'Agreed! The services segment is becoming a major revenue driver.',
              createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
            }
          ],
          shares: 5,
          symbols: ['AAPL'],
          liked: false,
          saved: false
        },
        {
          id: 2,
          userId: 'demo2',
          username: 'market_wizard',
          text: '$TSLA breaking out of the consolidation pattern! 🚀\n\nVolume is picking up and we\'re seeing institutional buying. The Cybertruck production ramp could be the catalyst we\'ve been waiting for.\n\nAnyone else bullish on this move?',
          image: null,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
          likes: 18,
          comments: [
            {
              id: 201,
              userId: 'demo1',
              username: 'trader_jane',
              text: 'Love the technical analysis! The volume confirmation is key.',
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            }
          ],
          shares: 3,
          symbols: ['TSLA'],
          liked: false,
          saved: false
        },
        {
          id: 3,
          userId: 'demo3',
          username: 'stock_guru',
          text: 'Market update: $NVDA continues its AI dominance. The data center revenue growth is incredible.\n\nI\'m adding to my position on any pullbacks. The AI revolution is just getting started! 💪',
          image: null,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          likes: 31,
          comments: [],
          shares: 8,
          symbols: ['NVDA'],
          liked: false,
          saved: false
        },
        {
          id: 4,
          userId: 'demo1',
          username: 'trader_jane',
          text: 'Quick trade idea: $MSFT looks ready for a breakout above resistance. The cloud business is firing on all cylinders and the AI integration is driving growth.\n\nStop loss below $370, target $400+',
          image: null,
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
          likes: 15,
          comments: [
            {
              id: 401,
              userId: 'demo2',
              username: 'market_wizard',
              text: 'Solid technical setup! The volume profile looks good too.',
              createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString()
            }
          ],
          shares: 2,
          symbols: ['MSFT'],
          liked: false,
          saved: false
        }
      ]
    } catch {
      return []
    }
  })

  // Post creation state
  const [text, setText] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [activeTab, setActiveTab] = useState('all') // 'all', 'popular', 'following'
  const [selectedUser, setSelectedUser] = useState(null) // For user profile view

  useEffect(() => {
    localStorage.setItem('stok_posts', JSON.stringify(posts))
  }, [posts])

  const followUser = (userId) => {
    if (!currentUser) return

    setUsers(users.map(user => {
      if (user.id === currentUser.id) {
        const isFollowing = user.following.includes(userId)
        return {
          ...user,
          following: isFollowing 
            ? user.following.filter(id => id !== userId)
            : [...user.following, userId]
        }
      }
      if (user.id === userId) {
        const isFollowed = user.followers.includes(currentUser.id)
        return {
          ...user,
          followers: isFollowed
            ? user.followers.filter(id => id !== currentUser.id)
            : [...user.followers, currentUser.id]
        }
      }
      return user
    }))

    // Update current user
    setCurrentUser(prev => {
      if (!prev) return prev
      const isFollowing = prev.following.includes(userId)
      return {
        ...prev,
        following: isFollowing 
          ? prev.following.filter(id => id !== userId)
          : [...prev.following, userId]
      }
    })

    // Add notification
    if (!currentUser.following.includes(userId)) {
      const targetUser = users.find(u => u.id === userId)
      addNotification({
        id: Date.now(),
        type: 'follow',
        userId: currentUser.id,
        targetUserId: userId,
        message: `${currentUser.username} started following you`,
        createdAt: new Date().toISOString(),
        read: false
      })
    }
  }

  const addNotification = (notification) => {
    setNotifications([notification, ...notifications])
  }

  // Post functions
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const submit = (e) => {
    e.preventDefault()
    if (!currentUser) {
      alert('Please login to create a post!')
      return
    }
    if (!text.trim() && !image) return
    
    const newPost = {
      id: Date.now(),
      userId: currentUser.id,
      username: currentUser.username,
      text: text.trim(),
      image: imagePreview,
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: [],
      shares: 0,
      symbols: extractSymbols(text),
      liked: false,
      saved: false
    }
    
    setPosts([newPost, ...posts])
    setText('')
    setImage(null)
    setImagePreview(null)
  }

  const extractSymbols = (text) => {
    const symbolRegex = /\$[A-Z]{1,5}\b/g
    const matches = text.match(symbolRegex)
    return matches ? matches.map(s => s.substring(1)) : []
  }

  const likePost = (postId) => {
    if (!currentUser) {
      alert('Please login to like posts!')
      return
    }

    setPosts(posts.map(post => {
      if (post.id === postId) {
        const wasLiked = post.liked
        const newLikes = wasLiked ? post.likes - 1 : post.likes + 1
        
        // Add notification for like
        if (!wasLiked && post.userId !== currentUser.id) {
          addNotification({
            id: Date.now(),
            type: 'like',
            userId: currentUser.id,
            targetUserId: post.userId,
            postId: postId,
            message: `${currentUser.username} liked your post`,
            createdAt: new Date().toISOString(),
            read: false
          })
        }

        return {
          ...post,
          likes: newLikes,
          liked: !wasLiked
        }
      }
      return post
    }))
  }

  const savePost = (postId) => {
    if (!currentUser) {
      alert('Please login to save posts!')
      return
    }

    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          saved: !post.saved
        }
      }
      return post
    }))
  }

  const sharePost = (postId) => {
    if (!currentUser) {
      alert('Please login to share posts!')
      return
    }

    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          shares: post.shares + 1
        }
      }
      return post
    }))

    // Add notification for share
    const post = posts.find(p => p.id === postId)
    if (post && post.userId !== currentUser.id) {
      addNotification({
        id: Date.now(),
        type: 'share',
        userId: currentUser.id,
        targetUserId: post.userId,
        postId: postId,
        message: `${currentUser.username} shared your post`,
        createdAt: new Date().toISOString(),
        read: false
      })
    }

    alert('Post shared!')
  }

  const addComment = (postId, commentText) => {
    if (!currentUser) {
      alert('Please login to comment!')
      return
    }

    setPosts(posts.map(post => {
      if (post.id === postId) {
        const newComment = {
          id: Date.now(),
          userId: currentUser.id,
          username: currentUser.username,
          text: commentText,
          createdAt: new Date().toISOString()
        }

        // Add notification for comment
        if (post.userId !== currentUser.id) {
          addNotification({
            id: Date.now(),
            type: 'comment',
            userId: currentUser.id,
            targetUserId: post.userId,
            postId: postId,
            message: `${currentUser.username} commented on your post`,
            createdAt: new Date().toISOString(),
            read: false
          })
        }

        return {
          ...post,
          comments: [...post.comments, newComment]
        }
      }
      return post
    }))
  }

  // Filter posts based on active tab
  const getFilteredPosts = () => {
    let filteredPosts = posts

    if (activeTab === 'following' && currentUser) {
      filteredPosts = posts.filter(post => 
        currentUser.following.includes(post.userId) || post.userId === currentUser.id
      )
    } else if (activeTab === 'popular') {
      filteredPosts = [...posts].sort((a, b) => 
        (b.likes + b.comments.length + b.shares) - 
        (a.likes + a.comments.length + a.shares)
      )
    }

    return filteredPosts
  }

  // Get user by ID
  const getUserById = (userId) => {
    return users.find(u => u.id === userId)
  }

  // Check if current user is following another user
  const isFollowing = (userId) => {
    return currentUser?.following.includes(userId) || false
  }

  // Get user's posts
  const getUserPosts = (userId) => {
    return posts.filter(post => post.userId === userId)
  }

  return (
    <div className="mt-6">
      {/* User Profile View */}
      {selectedUser && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => setSelectedUser(null)}
              className="btn btn-ghost"
            >
              ← Back to Feed
            </button>
          </div>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
              {selectedUser.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{selectedUser.username}</h2>
              <p className="text-slate-400">{selectedUser.bio || 'No bio yet'}</p>
              <div className="flex gap-4 mt-2 text-sm text-slate-400">
                <span>{selectedUser.followers.length} followers</span>
                <span>{selectedUser.following.length} following</span>
                <span>{getUserPosts(selectedUser.id).length} posts</span>
              </div>
            </div>
            {currentUser && currentUser.id !== selectedUser.id && (
              <button 
                onClick={() => followUser(selectedUser.id)}
                className={`btn ${isFollowing(selectedUser.id) ? 'btn-ghost' : 'btn-primary'}`}
              >
                {isFollowing(selectedUser.id) ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          <div className="space-y-4">
            {getUserPosts(selectedUser.id).map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                currentUser={currentUser}
                onLike={likePost}
                onSave={savePost}
                onShare={sharePost}
                onComment={addComment}
                getUserById={getUserById}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Community Feed */}
      {!selectedUser && (
        <section className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Trading Community</h2>
              <p className="text-sm text-slate-400">Share your market insights and analysis.</p>
            </div>
          </div>
          
          {/* Community Tabs */}
          <div className="flex border-b border-slate-700 mb-4">
            <button 
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 ${activeTab === 'all' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-slate-400'}`}
            >
              All Posts
            </button>
            <button 
              onClick={() => setActiveTab('popular')}
              className={`px-4 py-2 ${activeTab === 'popular' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-slate-400'}`}
            >
              Popular
            </button>
            <button 
              onClick={() => setActiveTab('following')}
              className={`px-4 py-2 ${activeTab === 'following' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-slate-400'}`}
            >
              Following
            </button>
          </div>
          
          {/* Create Post Form */}
          <form onSubmit={submit} className="mb-6 grid gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                {currentUser ? currentUser.username.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="flex-1">
                <textarea 
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={3}
                  className="input w-full"
                  placeholder={currentUser ? "Share your market analysis, trade ideas, or questions. Use $SYMBOL to tag stocks (e.g. $AAPL)" : "Login to post"}
                  disabled={!currentUser}
                />
              </div>
            </div>
            
            {/* Image Upload */}
            <div className="flex items-center gap-3">
              <label className="cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={!currentUser}
                />
                <span className={`flex items-center gap-1 ${currentUser ? 'text-slate-400 hover:text-indigo-400' : 'text-slate-600'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  Add Image
                </span>
              </label>
              {imagePreview && (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="h-16 rounded-md" />
                  <button 
                    type="button"
                    onClick={() => {
                      setImage(null)
                      setImagePreview(null)
                    }}
                    className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => {
                  setText('')
                  setImage(null)
                  setImagePreview(null)
                }}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={!text.trim() && !image}
                className="btn btn-primary"
              >
                Post
              </button>
            </div>
          </form>
          
          {/* Posts Feed */}
          <div className="space-y-4">
            {getFilteredPosts().map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                currentUser={currentUser}
                onLike={likePost}
                onSave={savePost}
                onShare={sharePost}
                onComment={addComment}
                getUserById={getUserById}
                onUserClick={setSelectedUser}
              />
            ))}
            
            {getFilteredPosts().length === 0 && (
              <div className="text-center py-8 text-slate-400">
                {activeTab === 'following' 
                  ? 'No posts from people you follow yet. Follow some users to see their posts here!'
                  : 'No posts yet. Be the first to share your trading insights!'
                }
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
function fmt(n, d=2){
  const x = Number(n)
  if(!Number.isFinite(x)) return '-'
  if (Math.abs(x) >= 1e9) return (x/1e9).toFixed(d)+'B'
  if (Math.abs(x) >= 1e6) return (x/1e6).toFixed(d)+'M'
  if (Math.abs(x) >= 1e3) return (x/1e3).toFixed(d)+'K'
  return x.toLocaleString(undefined, { maximumFractionDigits: d })
}

// Simple mini chart for table rows
function MiniChart({ data, up }) {
  if (!data || data.length === 0) return null
  
  const color = up ? '#22c55e' : '#f43f5e'
  const points = data.slice(-10) // Take last 10 points for mini chart
  
  // Simple SVG line chart
  const width = 80
  const height = 48
  const padding = 4
  
  const values = points.map(d => parseFloat(d.close))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  
  const xStep = (width - padding * 2) / (points.length - 1)
  const yStep = (height - padding * 2) / range
  
  const pathData = points.map((point, i) => {
    const x = padding + i * xStep
    const y = height - padding - ((point - min) * yStep)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
  
  return (
    <svg width={width} height={height} className="w-full h-full">
      <path
        d={pathData}
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Separate PostCard component for better organization
function PostCard({ post, currentUser, onLike, onSave, onShare, onComment, getUserById, onUserClick }) {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const user = getUserById(post.userId)
  
  // Handle both old posts (with 'name') and new posts (with 'username')
  const username = post.username || post.name || 'Anonymous'

  return (
    <article className="rounded-xl border border-slate-700/60 bg-slate-900/40 overflow-hidden">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold cursor-pointer hover:opacity-80"
            onClick={() => onUserClick && onUserClick(user)}
          >
            {username.charAt(0).toUpperCase()}
          </div>
          <div>
            <div 
              className="font-medium cursor-pointer hover:text-indigo-400"
              onClick={() => onUserClick && onUserClick(user)}
            >
              {username}
            </div>
            <div className="text-xs text-slate-400">
              {new Date(post.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
        <button className="text-slate-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        </button>
      </div>
      
      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="whitespace-pre-wrap">
          {post.text.split(/(\$[A-Z]{1,5}\b)/g).map((part, i) => 
            part.match(/^\$[A-Z]{1,5}$/) ? (
              <a 
                key={i} 
                href={`#${part.substring(1)}`}
                className="text-indigo-400 hover:underline"
              >
                {part}
              </a>
            ) : (
              part
            )
          )}
        </p>
        {post.image && (
          <div className="mt-3 rounded-lg overflow-hidden">
            <img 
              src={post.image} 
              alt="Post content" 
              className="w-full max-h-80 object-contain"
            />
          </div>
        )}
      </div>
      
      {/* Stock Tags */}
      {post.symbols.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {post.symbols.map(symbol => (
            <a 
              key={symbol}
              href={`#${symbol}`}
              className="px-2 py-1 bg-slate-800 rounded-md text-xs text-indigo-400 hover:bg-slate-700"
            >
              ${symbol}
            </a>
          ))}
        </div>
      )}
      
      {/* Post Actions */}
      <div className="px-4 py-2 border-t border-slate-700/60 flex justify-between">
        <button 
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1 ${post.liked ? 'text-rose-400' : 'text-slate-400 hover:text-rose-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
          {post.likes}
        </button>
        
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 text-slate-400 hover:text-indigo-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
          {post.comments.length}
        </button>
        
        <button 
          onClick={() => onShare(post.id)}
          className="flex items-center gap-1 text-slate-400 hover:text-emerald-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
          {post.shares}
        </button>
        
        <button 
          onClick={() => onSave(post.id)}
          className={`flex items-center gap-1 ${post.saved ? 'text-yellow-400' : 'text-slate-400 hover:text-yellow-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
          </svg>
          Save
        </button>
      </div>
      
      {/* Comments Section */}
      {showComments && (
        <>
          {post.comments.length > 0 && (
            <div className="border-t border-slate-700/60 p-4 bg-slate-900/20">
              {post.comments.map(comment => (
                <div key={comment.id} className="mb-3 last:mb-0">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-600/50 flex items-center justify-center text-xs text-white">
                      {(comment.username || comment.name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className="text-sm font-medium">{comment.username || comment.name || 'Anonymous'}</div>
                    <div className="text-xs text-slate-400">
                      {new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                  <p className="mt-1 ml-8 text-sm text-slate-200">{comment.text}</p>
                </div>
              ))}
            </div>
          )}
          
          {/* Add Comment */}
          <div className="p-4 border-t border-slate-700/60">
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                if (commentText.trim()) {
                  onComment(post.id, commentText)
                  setCommentText('')
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="input flex-1 text-sm"
              />
              <button 
                type="submit"
                disabled={!commentText.trim()}
                className="btn btn-primary btn-sm"
              >
                Post
              </button>
            </form>
          </div>
        </>
      )}
    </article>
  )
}

// Login Modal Component
function LoginModal({ isOpen, onClose, users, setUsers, setCurrentUser }) {
  const [isLogin, setIsLogin] = useState(true)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    bio: '',
    avatar: null
  })

  const loginUser = (e) => {
    e.preventDefault()
    const user = users.find(u => u.email === loginForm.email && u.password === loginForm.password)
    if (user) {
      setCurrentUser(user)
      onClose()
      setLoginForm({ email: '', password: '' })
    } else {
      alert('Invalid credentials!')
    }
  }

  const registerUser = (e) => {
    e.preventDefault()
    if (registerForm.password !== registerForm.confirmPassword) {
      alert('Passwords do not match!')
      return
    }

    const existingUser = users.find(u => u.email === registerForm.email || u.username === registerForm.username)
    if (existingUser) {
      alert('User already exists!')
      return
    }

    const newUser = {
      id: Date.now().toString(),
      username: registerForm.username,
      email: registerForm.email,
      password: registerForm.password, // In a real app, this would be hashed
      bio: registerForm.bio,
      avatar: registerForm.avatar,
      followers: [],
      following: [],
      createdAt: new Date().toISOString()
    }

    setUsers([...users, newUser])
    setCurrentUser(newUser)
    onClose()
    setRegisterForm({ username: '', email: '', password: '', confirmPassword: '', bio: '', avatar: null })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="card p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{isLogin ? 'Login' : 'Create Account'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ×
          </button>
        </div>
        
        {isLogin ? (
          <form onSubmit={loginUser} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={loginForm.email}
              onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
              className="input w-full"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
              className="input w-full"
              required
            />
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary flex-1">Login</button>
              <button 
                type="button" 
                onClick={() => setIsLogin(false)}
                className="btn btn-ghost"
              >
                Register
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={registerUser} className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={registerForm.username}
              onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
              className="input w-full"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={registerForm.email}
              onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
              className="input w-full"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={registerForm.password}
              onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
              className="input w-full"
              required
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={registerForm.confirmPassword}
              onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
              className="input w-full"
              required
            />
            <textarea
              placeholder="Bio (optional)"
              value={registerForm.bio}
              onChange={(e) => setRegisterForm({...registerForm, bio: e.target.value})}
              className="input w-full"
              rows={3}
            />
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary flex-1">Register</button>
              <button 
                type="button" 
                onClick={() => setIsLogin(true)}
                className="btn btn-ghost"
              >
                Login
              </button>
            </div>
          </form>
        )}
        
        {/* Demo Users Info */}
        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
          <p className="text-xs text-slate-400 mb-2">Demo accounts:</p>
          <div className="text-xs text-slate-300 space-y-1">
            <div>trader_jane / jane@example.com</div>
            <div>market_wizard / wizard@example.com</div>
            <div>stock_guru / guru@example.com</div>
            <div className="text-slate-400 mt-1">Password: same as email</div>
          </div>
        </div>
      </div>
    </div>
  )
}
