'use client';

import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  LineSeries,
  LineData,
  UTCTimestamp,
  LineStyle,
} from 'lightweight-charts';
import { cn } from '@/lib/utils';

interface OpinionTrendChartProps {
  marketId: string;
  title?: string;
}

export function OpinionTrendChart({
  marketId,
  title = 'Opinion Trend',
}: OpinionTrendChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const yesSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const noSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  const [currentYes, setCurrentYes] = useState<number | null>(null);
  const [currentNo, setCurrentNo] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 340,
      layout: {
        background: { color: 'transparent' },
        textColor: '#6b7280',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      crosshair: {
        vertLine: { style: LineStyle.Dashed },
        horzLine: { style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.08)',
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.08)',
        timeVisible: true,
      },
    });

    // ✅ Correct API for v5
    const yesSeries = chart.addSeries(LineSeries, {
      color: '#22c55e',
      lineWidth: 2,
      lastValueVisible: true,
      priceLineVisible: false,
    });

    const noSeries = chart.addSeries(LineSeries, {
      color: '#ef4444',
      lineWidth: 2,
      lastValueVisible: true,
      priceLineVisible: false,
    });

    yesSeriesRef.current = yesSeries;
    noSeriesRef.current = noSeries;
    chartRef.current = chart;

    // Resize
    const ro = new ResizeObserver(() => {
      chart.applyOptions({
        width: containerRef.current?.clientWidth ?? 600,
      });
    });
    ro.observe(containerRef.current);


    chart.subscribeCrosshairMove((param) => {
      if (!param.time) return;

      const y = param.seriesData.get(yesSeries) as LineData | undefined;
      const n = param.seriesData.get(noSeries) as LineData | undefined;

      if (y) setCurrentYes(y.value);
      if (n) setCurrentNo(n.value);
    });

    loadTrendData(
      marketId,
      yesSeries,
      noSeries,
      chart,
      setCurrentYes,
      setCurrentNo,
      setIsAnimating
    );

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [marketId]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex justify-between px-6 py-4 border-b border-white/10">
        <h3 className="text-sm text-white">{title}</h3>

        <div className="flex gap-4">
          <span className="text-green-400">
            YES {currentYes?.toFixed(0)}¢
          </span>
          <span className="text-red-400">
            NO {currentNo?.toFixed(0)}¢
          </span>
        </div>
      </div>

      <div
        ref={containerRef}
        className={cn(
          'w-full transition-opacity',
          isAnimating ? 'opacity-0' : 'opacity-100'
        )}
      />
    </div>
  );
}



async function loadTrendData(
  marketId: string,
  yesSeries: ISeriesApi<'Line'>,
  noSeries: ISeriesApi<'Line'>,
  chart: IChartApi,
  setYes: (v: number) => void,
  setNo: (v: number) => void,
  setAnimating: (v: boolean) => void
) {
  const now = Math.floor(Date.now() / 1000);
  const start = now - 300;

  const yesData: LineData[] = [];
  const noData: LineData[] = [];

  let yes = 50;

  for (let t = start; t <= now; t += 15) {
    yes += (Math.random() - 0.48) * 3;
    yes = Math.max(5, Math.min(95, yes));

    yesData.push({
      time: t as UTCTimestamp, // ✅ FIX
      value: +yes.toFixed(1),
    });
    noData.push({
      time: t as UTCTimestamp,
      value: +(100 - yes).toFixed(1),
    });
  }

  setAnimating(true);

  setTimeout(() => {
    yesSeries.setData(yesData);
    noSeries.setData(noData);

    chart.timeScale().fitContent();

    const last = yesData[yesData.length - 1];
    setYes(last.value);
    setNo(100 - last.value);

    setAnimating(false);
  }, 200);
}
