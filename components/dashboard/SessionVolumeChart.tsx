import React, { useEffect } from 'react';
import Chart from 'react-apexcharts';
import { ChartDataPoint } from './types';

interface SessionVolumeChartProps {
  data: ChartDataPoint[];
  rangeLabel: string;
}

export const SessionVolumeChart: React.FC<SessionVolumeChartProps> = ({ data, rangeLabel }) => {
  useEffect(() => {
    const timeout = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 120);
    return () => clearTimeout(timeout);
  }, [data.length, rangeLabel]);

  // Estado vazio
  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col h-[300px] animate-fade-in w-full">
        <div className="mb-4">
          <h3 className="text-base font-bold text-gray-900">Volume de Sessões</h3>
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
      name: 'Sessões',
      data: data
        .filter(
          p =>
            p.dateObj instanceof Date &&
            !isNaN(p.dateObj.getTime()) &&
            typeof p.value === 'number'
        )
        .map(point => ({
          x: point.dateObj.getTime(),
          y: point.value
        }))
    }
  ];

  const options: any = {
    chart: {
      type: 'area',
      width: '100%',
      height: 240, // Altura interna reduzida
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
        datetimeFormatter: { year: 'yyyy', month: 'MMM', day: 'dd MMM' }
      },
      tooltip: { enabled: true }
    },
    yaxis: {
      opposite: true,
      labels: {
        style: { colors: '#9ca3af', fontSize: '10px', fontFamily: 'monospace' },
        formatter: (val: number) => Math.round(val).toString()
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
      x: { format: 'dd MMM HH:mm' },
      marker: { show: false },
      style: { fontSize: '11px', fontFamily: '"Plus Jakarta Sans", sans-serif' }
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm animate-fade-in w-full overflow-hidden flex flex-col h-[300px]">
      <div className="mb-1">
         <h3 className="text-base font-bold text-gray-900">Análise de Volume</h3>
         <p className="text-[11px] text-gray-500">Movimentação de sessões (Últimos {rangeLabel})</p>
      </div>
      <div className="flex-1 w-full min-h-0 -ml-2">
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