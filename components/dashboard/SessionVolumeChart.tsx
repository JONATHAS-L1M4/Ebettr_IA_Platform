import React, { useEffect } from 'react';
import Chart from 'react-apexcharts';
import { ChartDataPoint } from './types';

interface SessionVolumeChartProps {
  data: ChartDataPoint[];
  rangeLabel: string;
}

const CHART_PRIMARY = '#4e00b0';

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
      <div className="bg-panel border border-border rounded-lg p-5 shadow-sm flex flex-col h-[300px] animate-fade-in w-full">
        <div className="mb-4">
          <h3 className="text-base font-bold text-foreground">Volume de Sessões</h3>
          <p className="text-xs text-muted-foreground">Sem dados para exibir.</p>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm bg-muted rounded-lg border border-dashed border-border">
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
      colors: [CHART_PRIMARY]
    },
    markers: {
      size: 0,
      hover: {
        size: 4,
        sizeOffset: 2
      },
      colors: [CHART_PRIMARY],
      strokeColors: 'var(--background)',
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
        style: { colors: 'var(--muted-foreground)', fontSize: '10px', fontFamily: '"Plus Jakarta Sans", sans-serif' },
        datetimeFormatter: { year: 'yyyy', month: 'MMM', day: 'dd MMM' }
      },
      tooltip: { enabled: true }
    },
    yaxis: {
      opposite: true,
      labels: {
        style: { colors: 'var(--muted-foreground)', fontSize: '10px', fontFamily: 'monospace' },
        formatter: (val: number) => Math.round(val).toString()
      }
    },
    legend: { show: false },
    grid: {
      borderColor: 'var(--border)',
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
          { offset: 0, color: CHART_PRIMARY, opacity: 0.22 },
          { offset: 100, color: CHART_PRIMARY, opacity: 0 }
        ]
      }
    },
    colors: [CHART_PRIMARY],
    tooltip: {
      theme: 'dark',
      x: { format: 'dd MMM HH:mm' },
      marker: { show: false },
      style: { fontSize: '11px', fontFamily: '"Plus Jakarta Sans", sans-serif' }
    }
  };

  return (
    <div className="bg-panel border border-border rounded-lg p-5 shadow-sm animate-fade-in w-full overflow-hidden flex flex-col h-[300px]">
      <div className="mb-1">
         <h3 className="text-base font-bold text-foreground">Análise de Volume</h3>
         <p className="text-[11px] text-muted-foreground">Movimentação de sessões (Últimos {rangeLabel})</p>
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
