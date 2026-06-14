"use client";

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line
} from 'recharts';

interface ChartDataPoint {
  date: string;
  emissions: string | number;
  goal: number;
}

interface AreaChartComponentProps {
  data: ChartDataPoint[];
}

/**
 * Enhanced AreaChart component with accessibility support.
 * Wraps the chart in a figure with a visually-hidden caption for screen readers.
 */
export default function AreaChartComponent({ data }: AreaChartComponentProps) {
  const latestValue = useMemo(() => {
    if (!data || data.length === 0) return '0';
    return data[data.length - 1].emissions;
  }, [data]);

  return (
    <figure 
      role="img" 
      aria-label="Carbon emissions over time chart"
      className="h-[400px] w-full"
    >
      <figcaption className="sr-only">
        A line chart showing your carbon emissions trend. 
        Latest value: {latestValue} kgCO2e. Target: 1.5 kgCO2e.
      </figcaption>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#00000008" vertical={false} />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }} 
            dy={15}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }} 
            dx={-15}
          />
          <Tooltip 
            cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              border: '1px solid rgba(0,0,0,0.05)', 
              borderRadius: '24px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
              padding: '16px'
            }}
            labelStyle={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '10px', color: '#71717a', letterSpacing: '0.1em', marginBottom: '8px' }}
            itemStyle={{ fontWeight: 800, fontSize: '14px', color: 'hsl(var(--primary))' }}
          />
          <Area 
            type="monotone" 
            dataKey="emissions" 
            stroke="hsl(var(--primary))" 
            strokeWidth={4}
            fillOpacity={1} 
            fill="url(#chartGradient)" 
            animationDuration={1500}
          />
          <Line 
            type="monotone" 
            dataKey="goal" 
            stroke="#e4e4e7" 
            strokeWidth={2}
            strokeDasharray="8 8" 
            dot={false} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </figure>
  );
}
