import React from 'react';
import Chart from 'react-apexcharts';
import { ExecutionLog } from './types';

interface StatusChartProps {
  logs: ExecutionLog[];
}

const STATUS_COLORS = ['#4e00b0', '#7b3fe4', '#b794f6'];

export const StatusChart: React.FC<StatusChartProps> = ({ logs }) => {
  const successCount = logs.filter(l => l.status === 'success').length;
  const errorCount = logs.filter(l => l.status === 'error').length;
  const canceledCount = logs.filter(l => l.status === 'canceled').length;
  const total = logs.length;

  if (total === 0) {
    return (
      <div className="bg-panel border border-border rounded-lg p-5 shadow-sm flex flex-col h-[300px] animate-fade-in w-full items-center justify-center">
        <span className="text-muted-foreground text-sm">Sem dados de status</span>
      </div>
    );
  }

  const series = [successCount, errorCount, canceledCount];
  const colors = STATUS_COLORS;

  const options: any = {
    chart: {
      type: 'donut',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      animations: { enabled: false },
      background: 'transparent',
    },
    theme: {
      mode: 'dark',
      monochrome: {
        enabled: false,
      },
    },
    labels: ['Sucesso', 'Erro', 'Cancelado'],
    colors,
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '11px',
              fontWeight: 600,
              color: '#a1a1aa',
              offsetY: -8,
            },
            value: {
              show: true,
              fontSize: '20px',
              fontWeight: 700,
              color: '#f4f4f5',
              offsetY: 4,
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Total',
              fontSize: '11px',
              fontWeight: 600,
              color: '#a1a1aa',
              formatter: (w: any) => w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0),
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { show: false },
    tooltip: {
      enabled: true,
      theme: 'dark',
      fillSeriesColor: false,
      marker: { show: true },
      style: {
        fontSize: '11px',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
      },
      y: {
        formatter: (val: number) => `${val} execucoes`,
      },
    },
  };

  return (
    <div className="bg-panel border border-border rounded-lg p-5 shadow-sm animate-fade-in h-[300px] flex flex-col">
      <h3 className="text-base font-bold text-foreground mb-1">Taxa de Sucesso</h3>
      <p className="text-[11px] text-muted-foreground mb-2">Distribuicao por status.</p>

      <div className="flex-1 flex items-center justify-center relative">
        <Chart options={options} series={series} type="donut" height={180} width={240} />
      </div>

      <div className="flex justify-center gap-4 mt-2 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[0] }} />
          <span className="text-[10px] font-medium text-muted-foreground">Sucesso</span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[1] }} />
          <span className="text-[10px] font-medium text-muted-foreground">Erro</span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[2] }} />
          <span className="text-[10px] font-medium text-muted-foreground">Cancelado</span>
        </div>
      </div>
    </div>
  );
};
