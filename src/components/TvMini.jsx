import React, { useEffect, useRef } from 'react';

export default function TvMini({ symbol, range = '1D', height = 80, width = 180 }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = '';
    const s = document.createElement('script');
    s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    s.async = true;
    s.innerHTML = JSON.stringify({
      symbol,
      locale: 'en',
      dateRange: range,
      colorTheme: 'dark',
      isTransparent: true,
      autosize: false,
      width,
      height,
      trendLineColor: '#2962FF',
      underLineColor: 'rgba(41,98,255,0.15)',
      underLineBottomColor: 'rgba(41,98,255,0.00)',
      noTimeScale: false,
    });
    ref.current.appendChild(s);
    return () => { if (ref.current) ref.current.innerHTML = ''; };
  }, [symbol, range, height, width]);

  return (
    <div className="tradingview-widget-container" ref={ref} style={{ width, height }}>
      <div className="tradingview-widget-container__widget" />
    </div>
  );
}
