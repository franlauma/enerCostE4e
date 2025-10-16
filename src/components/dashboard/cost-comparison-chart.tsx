'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { CompanyCost } from '@/lib/data';

type CostComparisonChartProps = {
  data: CompanyCost[];
};

const chartConfig = {
  totalCost: {
    label: 'Coste Total',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export default function CostComparisonChart({ data }: CostComparisonChartProps) {
  const chartData = data.map(item => ({
    company: item.name,
    totalCost: item.totalCost,
  })).sort((a,b) => a.totalCost - b.totalCost);

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 20 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="company"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => value.length > 15 ? value.slice(0, 12) + '...' : value}
            interval={0}
          />
          <YAxis 
            tickFormatter={(value) => `€${value}`}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent 
                formatter={(value) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value as number)}
                labelClassName="font-bold"
                indicator='dot'
            />}
          />
          <Bar dataKey="totalCost" fill="var(--color-totalCost)" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
