'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, CandlestickSeries } from 'lightweight-charts';
import { cn } from '@/lib/utils';
import { getLatestPrices, getMarketCandles } from '@/lib/api';

interface CandlestickChartProps {
  marketId: string;
  asset?: string;
  title?: string;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
}

function priceSymbol(asset?: string): string {
  if (!asset) return 'BTC-USD';
  const upper = asset.toUpperCase();
  if (upper.includes('ETH')) return 'ETH-USD';
  if (upper.includes('SOL')) return 'SOL-USD';
  return 'BTC-USD';
}

export function CandlestickChart({ marketId, asset, title, leftSlot, rightSlot }: CandlestickChartProps) {
  const symbol = priceSymbol(asset);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);
  const candlesRef = useRef<Map<number, any>>(new Map());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [lastPrice, setLastPrice] = useState<string>("--");
  const [isLive, setIsLive] = useState(true);
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
        const res = await getMarketCandles(marketId);
        const candles = (res.candles || [])
          .map((c) => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close }))
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

    const poll = async () => {
      try {
        const p = await getLatestPrices();
        const raw = p[symbol]?.price ?? p['BTC-USD']?.price ?? "";
        const price = parseFloat(raw);
        if (!Number.isFinite(price) || price <= 0) return;
        setLastPrice(price.toFixed(2));
        setIsLive(true);
        setError(null);

        const now = Math.floor(Date.now() / 1000);
        const bucketTime = Math.floor(now / 60) * 60;
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
      } catch {
        setIsLive(false);
      }
    };
    poll();
    pollRef.current = setInterval(poll, 1000);

    return () => {
      resizeObserver.disconnect();
      if (pollRef.current) clearInterval(pollRef.current);
      chart.remove();
    };
  }, [marketId]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>{leftSlot}</div>
        <div className="flex items-center gap-3">
          {lastPrice !== "--" && (
            <span className="text-green-400 font-mono text-xl font-medium">${lastPrice}</span>
          )}
          {rightSlot}
          <span className={cn("text-xs font-medium", isLive ? "text-green-400" : "text-red-400")}>
            {isLive ? "Live" : "Disconnected"}
          </span>
        </div>
      </div>
      <div ref={containerRef} className="w-full" />
      {error && <div className="p-4 text-center text-red-400 text-sm">{error}</div>}
    </div>
  );
}
