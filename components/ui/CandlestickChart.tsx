'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, CandlestickSeries } from 'lightweight-charts';
import { cn } from '@/lib/utils';

interface CandlestickChartProps {
  title?: string;
}

export function CandlestickChart({ title = "BTC Spot Price (5m)" }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const candlesRef = useRef<Map<number, any>>(new Map());
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [lastPrice, setLastPrice] = useState<string>("--");
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 460,
      layout: { background: { color: 'transparent' }, textColor: '#9ca3af' },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.06)' },
        horzLines: { color: 'rgba(255,255,255,0.06)' },
      },
      crosshair: {
        vertLine: { color: 'rgba(255,255,255,0.3)' },
        horzLine: { color: 'rgba(255,255,255,0.3)' },
      },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' },
      timeScale: { borderColor: 'rgba(255,255,255,0.1)', timeVisible: true, secondsVisible: false },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({ width: containerRef.current?.clientWidth ?? 800 });
    });
    resizeObserver.observe(containerRef.current);

    const fetchHistory = async () => {
      try {
        const end = Math.floor(Date.now() / 1000);
        const start = end - 3600;
        const res = await fetch(
          `https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=60&start=${start}&end=${end}`
        );
        const data: [number, number, number, number, number, number][] = await res.json();
        const candles = data
          .map(([time, low, high, open, close]) => ({ time, open, high, low, close }))
          .sort((a, b) => a.time - b.time);

        candles.forEach(c => candlesRef.current.set(c.time, c));
        series.setData(candles as any);
        chart.timeScale().fitContent();
      } catch (err) {
        console.error(err);
        setError("Failed to load chart data");
      }
    };

    fetchHistory();

    const connect = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      const ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'subscribe',
          product_ids: ['BTC-USD'],
          channels: ['ticker'],
        }));
        setIsLive(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type !== 'ticker') return;

          const price = parseFloat(msg.price);
          if (isNaN(price)) return;

          setLastPrice(price.toFixed(2));

          const tickerTime = Math.floor(new Date(msg.time).getTime() / 1000);
          const bucketTime = Math.floor(tickerTime / 60) * 60;

          const existing = candlesRef.current.get(bucketTime);
          const candle = existing
            ? {
                time: bucketTime,
                open: existing.open,
                high: Math.max(existing.high, price),
                low: Math.min(existing.low, price),
                close: price,
              }
            : {
                time: bucketTime,
                open: price,
                high: price,
                low: price,
                close: price,
              };

          candlesRef.current.set(bucketTime, candle);
          seriesRef.current?.update(candle);
        } catch (err) {
          console.error("WS parse error:", err);
        }
      };

      ws.onerror = () => setIsLive(false);

      ws.onclose = () => {
        setIsLive(false);

        reconnectTimer.current = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      resizeObserver.disconnect();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
      chart.remove();
    };
  }, []);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <span className="text-xs text-gray-500">Live market data</span>
        </div>
        <div className="flex items-center gap-3">
          {lastPrice !== "--" && (
            <span className="text-green-400 font-mono text-xl font-medium">${lastPrice}</span>
          )}
          <span className={cn("text-xs font-medium", isLive ? "text-green-400" : "text-red-400")}>
            {isLive ? "Live" : "Reconnecting..."}
          </span>
        </div>
      </div>
      <div ref={containerRef} className="w-full" />
      {error && <div className="p-4 text-center text-red-400 text-sm">{error}</div>}
    </div>
  );
}