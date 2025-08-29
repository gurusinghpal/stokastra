import React, { useEffect, useRef } from 'react'
import { createChart } from 'lightweight-charts'

export default function Sparkline({ data, up=true, height=70 }) {
  const ref = useRef(null)
  
  useEffect(()=>{
    if(!ref.current || !data || data.length === 0) return
    
    const chart = createChart(ref.current, {
      height,
      width: ref.current.clientWidth,
      layout: { 
        background: { color: 'transparent' }, 
        textColor: '#94a3b8' 
      },
      grid: { 
        vertLines: { color: 'transparent' }, 
        horzLines: { color: 'transparent' } 
      },
      rightPriceScale: { visible: false },
      timeScale: { visible: false, secondsVisible: false },
      crosshair: { 
        vertLine: { visible: false }, 
        horzLine: { visible: false } 
      },
      watermark: { visible: false },
      leftPriceScale: { visible: false },
    })
    
    const color = up ? '#22c55e' : '#f43f5e'
    const series = chart.addAreaSeries({ 
      lineWidth: 2, 
      topColor: color+'33', 
      bottomColor: color+'11', 
      lineColor: color 
    })
    
    // Ensure data is properly formatted for lightweight-charts
    const chartData = data.map(d => ({
      time: typeof d.time === 'number' ? d.time : new Date(d.time).getTime() / 1000,
      value: parseFloat(d.close) || 0
    }))
    
    series.setData(chartData)
    
    const ro = new ResizeObserver(entries => {
      for(const entry of entries){ 
        chart.applyOptions({ width: entry.contentRect.width }) 
      }
    })
    ro.observe(ref.current)
    
    return ()=>{ 
      ro.disconnect()
      chart.remove() 
    }
  }, [data, up, height])
  
  return (
    <div className="w-full relative">
      <div ref={ref} className="w-full" />
      {/* Ensure no external branding */}
      <div className="absolute inset-0 pointer-events-none" />
    </div>
  )
}
