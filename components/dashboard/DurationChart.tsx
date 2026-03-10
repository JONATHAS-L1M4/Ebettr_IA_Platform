import React, { useEffect, useMemo } from 'react';
import Chart from 'react-apexcharts';
import { ExecutionLog } from './types';

interface DurationChartProps {
  logs: ExecutionLog[];
}

export const DurationChart: React.FC<DurationChartProps> = ({ logs }) => {
  useEffect(() => {
    const timeout = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 120);
    return () => clearTimeout(timeout);
  }, [logs.length]);

  const chartData = useMemo(() => {
    if (!logs || logs.length === 0) return [];

    // Filter only finished logs with both start and stop times
    const finishedLogs = logs.filter(l => l.startedAt && l.stoppedAt);
    
    // Sort by startedAt ascending so the chart flows left to right (oldest to newest)
    const sortedLogs = [...finishedLogs].sort(
      (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
    );

    return sortedLogs.map(log => {
      const start = new Date(log.startedAt).getTime();
      const end = new Date(log.stoppedAt!).getTime();
      const durationMs = Math.max(0, end - start);
      // Convert to seconds for better readability if large, else keep ms
      return {
        x: start,
        y: durationMs,
        status: log.status
      };
    });
  }, [logs]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col h-[300px] animate-fade-in w-full">
        <div className="mb-4">
          <h3 className="text-base font-bold text-gray-900">Duração das Execuções</h3>
          <p className="text-xs text-gray-500">Sem dados para exibir.</p>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
          Sem dados
        </div>
      </div>
    );
  }

  const series = [
    {
      name: 'Duração (ms)',
      data: chartData
    }
  ];

  const options: any = {
    chart: {
      type: 'area',
      width: '100%',
      height: 240,
      zoom: { enabled: false },
      toolbar: { show: false },
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      background: 'transparent',
      redrawOnParentResize: true,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 500,
      }
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 2,
      colors: ['#6e0eff']
    },
    markers: {
      size: 0,
      hover: {
        size: 4,
        sizeOffset: 2
      },
      colors: ['#6e0eff'],
      strokeColors: '#ffffff',
      strokeWidth: 2
    },
    title: { text: undefined },
    subtitle: { text: undefined },
    xaxis: {
      type: 'datetime',
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        datetimeUTC: false, // Força o uso do horário local
        style: { colors: '#9ca3af', fontSize: '10px', fontFamily: '"Plus Jakarta Sans", sans-serif' },
        datetimeFormatter: { year: 'yyyy', month: 'MMM', day: 'dd MMM', hour: 'HH:mm' }
      },
      tooltip: { enabled: true }
    },
    yaxis: {
      opposite: true,
      labels: {
        style: { colors: '#9ca3af', fontSize: '10px', fontFamily: 'monospace' },
        formatter: (val: number) => {
          if (val > 1000) return `${(val / 1000).toFixed(1)}s`;
          return `${Math.round(val)}ms`;
        }
      }
    },
    legend: { show: false },
    grid: {
      borderColor: '#f3f4f6',
      xaxis: { lines: { show: true } },
      padding: { top: 5, right: 0, bottom: 0, left: 5 }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.05,
        stops: [0, 100],
        colorStops: [
          { offset: 0, color: '#6e0eff', opacity: 0.15 },
          { offset: 100, color: '#6e0eff', opacity: 0 }
        ]
      }
    },
    colors: ['#6e0eff'],
    tooltip: {
      theme: 'light',
      x: { format: 'dd MMM HH:mm:ss' },
      y: {
        formatter: (val: number) => {
          if (val > 1000) return `${(val / 1000).toFixed(2)}s`;
          return `${Math.round(val)}ms`;
        }
      },
      marker: { show: false },
      style: { fontSize: '11px', fontFamily: '"Plus Jakarta Sans", sans-serif' }
    }
  };

  // Calculate some stats
  const durations = chartData.map(d => d.y);
  const min = Math.min(...durations);
  const max = Math.max(...durations);
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  
  const formatTime = (ms: number) => ms > 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`;

  const formatDateLabel = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ', ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const periodLabel = chartData.length > 0 
    ? `${formatDateLabel(chartData[chartData.length - 1].x)} até ${formatDateLabel(chartData[0].x)}`
    : `Latência dos últimos ${logs.length} registros`;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm animate-fade-in w-full overflow-hidden flex flex-col h-[300px]">
      <div className="mb-1 flex justify-between items-start">
         <div>
           <h3 className="text-base font-bold text-gray-900">Duração das Execuções</h3>
           <p className="text-[11px] text-gray-500">{periodLabel}</p>
         </div>
         <div className="flex gap-3 text-[10px] text-gray-500 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-100">
            <div className="flex flex-col">
              <span className="uppercase tracking-wider text-[9px] text-gray-400">Mín</span>
              <span className="font-mono font-medium text-gray-700">{formatTime(min)}</span>
            </div>
            <div className="w-px bg-gray-200"></div>
            <div className="flex flex-col">
              <span className="uppercase tracking-wider text-[9px] text-gray-400">Méd</span>
              <span className="font-mono font-medium text-gray-700">{formatTime(avg)}</span>
            </div>
            <div className="w-px bg-gray-200"></div>
            <div className="flex flex-col">
              <span className="uppercase tracking-wider text-[9px] text-gray-400">Máx</span>
              <span className="font-mono font-medium text-gray-700">{formatTime(max)}</span>
            </div>
         </div>
      </div>
      <div className="flex-1 w-full min-h-0 -ml-2 mt-2">
        <Chart
            options={options}
            series={series}
            type="area"
            height="100%"
            width="100%"
        />
      </div>
    </div>
  );
};
