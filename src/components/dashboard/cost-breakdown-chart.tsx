'use client';

import { Pie, PieChart, ResponsiveContainer, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { CompanyCost } from '@/lib/data';

type CostBreakdownChartProps = {
  data: CompanyCost;
};

const chartConfig = {
  fixedFee: {
    label: 'Cuota Fija',
    color: 'hsl(var(--chart-2))',
  },
  consumptionCost: {
    label: 'Coste Consumo',
    color: 'hsl(var(--chart-1))',
  },
  otherCosts: {
    label: 'Otros Costes',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;

const COLORS = [chartConfig.consumptionCost.color, chartConfig.fixedFee.color, chartConfig.otherCosts.color];

export default function CostBreakdownChart({ data }: CostBreakdownChartProps) {
  const chartData = [
    { name: 'Coste Consumo', value: data.consumptionCost },
    { name: 'Cuota Fija', value: data.fixedFee },
    { name: 'Otros Costes', value: data.otherCosts },
  ];

  const total = chartData.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className="relative w-full h-24">
       <ChartContainer config={chartConfig} className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent 
                    formatter={(value, name) => `${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value as number)} (${((value as number / total) * 100).toFixed(1)}%)`}
                    hideLabel
                />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={40}
              innerRadius={28}
              paddingAngle={2}
              stroke="hsl(var(--background))"
              strokeWidth={3}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
         <span className="text-sm font-bold">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(data.totalCost)}</span>
      </div>
    </div>
  );
}
