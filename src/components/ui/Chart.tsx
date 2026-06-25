'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { SkeletonChart } from './LoadingSkeleton';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DataKey {
  key: string;
  color: string;
  label: string;
}

interface BaseChartProps {
  title: string;
  data: Record<string, unknown>[];
  dataKeys: DataKey[];
  height?: number;
  loading?: boolean;
  className?: string;
  xAxisKey?: string;
}

/* ------------------------------------------------------------------ */
/*  Brand palette                                                      */
/* ------------------------------------------------------------------ */

const BRAND_COLORS = [
  '#7c3aed', // purple
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#6d28d9', // violet
  '#4f46e5', // indigo
];

/* ------------------------------------------------------------------ */
/*  Custom Tooltip                                                     */
/* ------------------------------------------------------------------ */

interface TooltipPayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function GlassTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-xl border border-white/[0.08] px-4 py-3 text-sm shadow-xl"
      style={{
        background: 'rgba(15,15,30,0.92)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {label && <p className="text-white/50 text-xs mb-2 font-medium">{label}</p>}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-white/60 text-xs">{entry.name}:</span>
            <span className="text-white font-semibold text-xs ml-auto">
              {typeof entry.value === 'number'
                ? entry.value.toLocaleString()
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Custom Legend                                                       */
/* ------------------------------------------------------------------ */

interface LegendEntry {
  value?: string;
  color?: string;
}

interface CustomLegendProps {
  payload?: LegendEntry[];
}

function GlassLegend({ payload }: CustomLegendProps) {
  if (!payload?.length) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 mt-3 px-2">
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-white/50">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Card wrapper                                                       */
/* ------------------------------------------------------------------ */

function ChartCard({
  title,
  loading,
  height = 300,
  className = '',
  children,
}: {
  title: string;
  loading?: boolean;
  height?: number;
  className?: string;
  children: React.ReactNode;
}) {
  if (loading) return <SkeletonChart height={height} className={className} />;

  return (
    <div className={`glass-card rounded-2xl p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-white/80 mb-4 font-[Outfit]">{title}</h3>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared axis / grid props                                           */
/* ------------------------------------------------------------------ */

const GRID_PROPS = {
  strokeDasharray: '3 3',
  stroke: 'rgba(255,255,255,0.05)',
};

const AXIS_STYLE = {
  fontSize: 11,
  fill: 'rgba(255,255,255,0.35)',
  fontFamily: 'Inter, sans-serif',
};

/* ------------------------------------------------------------------ */
/*  AreaChartCard                                                      */
/* ------------------------------------------------------------------ */

export function AreaChartCard({
  title,
  data,
  dataKeys,
  height = 300,
  loading,
  className = '',
  xAxisKey = 'name',
}: BaseChartProps) {
  return (
    <ChartCard title={title} loading={loading} height={height} className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
          <defs>
            {dataKeys.map((dk) => (
              <linearGradient key={dk.key} id={`grad-${dk.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={dk.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={dk.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey={xAxisKey} tick={AXIS_STYLE} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
          <Tooltip content={<GlassTooltip />} />
          <Legend content={<GlassLegend />} />
          {dataKeys.map((dk) => (
            <Area
              key={dk.key}
              type="monotone"
              dataKey={dk.key}
              name={dk.label}
              stroke={dk.color}
              strokeWidth={2}
              fill={`url(#grad-${dk.key})`}
              dot={false}
              activeDot={{ r: 4, fill: dk.color, stroke: '#0a0a1a', strokeWidth: 2 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ------------------------------------------------------------------ */
/*  BarChartCard                                                       */
/* ------------------------------------------------------------------ */

export function BarChartCard({
  title,
  data,
  dataKeys,
  height = 300,
  loading,
  className = '',
  xAxisKey = 'name',
}: BaseChartProps) {
  return (
    <ChartCard title={title} loading={loading} height={height} className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey={xAxisKey} tick={AXIS_STYLE} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
          <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(124,58,237,0.08)' }} />
          <Legend content={<GlassLegend />} />
          {dataKeys.map((dk) => (
            <Bar
              key={dk.key}
              dataKey={dk.key}
              name={dk.label}
              fill={dk.color}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              opacity={0.85}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ------------------------------------------------------------------ */
/*  LineChartCard                                                       */
/* ------------------------------------------------------------------ */

export function LineChartCard({
  title,
  data,
  dataKeys,
  height = 300,
  loading,
  className = '',
  xAxisKey = 'name',
}: BaseChartProps) {
  return (
    <ChartCard title={title} loading={loading} height={height} className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey={xAxisKey} tick={AXIS_STYLE} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
          <Tooltip content={<GlassTooltip />} />
          <Legend content={<GlassLegend />} />
          {dataKeys.map((dk) => (
            <Line
              key={dk.key}
              type="monotone"
              dataKey={dk.key}
              name={dk.label}
              stroke={dk.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: dk.color, stroke: '#0a0a1a', strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ------------------------------------------------------------------ */
/*  PieChartCard                                                       */
/* ------------------------------------------------------------------ */

export interface PieChartDataItem {
  name: string;
  value: number;
  color?: string;
}

export interface PieChartCardProps {
  title: string;
  data: PieChartDataItem[];
  height?: number;
  loading?: boolean;
  className?: string;
  innerRadius?: number;
  outerRadius?: number;
  dataKeys?: DataKey[]; // unused but keeps signature consistent
}

export function PieChartCard({
  title,
  data,
  height = 300,
  loading,
  className = '',
  innerRadius = 55,
  outerRadius = 90,
}: PieChartCardProps) {
  return (
    <ChartCard title={title} loading={loading} height={height} className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={4}
            dataKey="value"
            nameKey="name"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color ?? BRAND_COLORS[index % BRAND_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<GlassTooltip />} />
          <Legend content={<GlassLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
