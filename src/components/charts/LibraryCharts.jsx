import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

// CLMS 5-Color Palette for Data Visualizations
const COLORS = ['#8D6B94', '#B185A7', '#C3A29E', '#E8DBC5', '#6D5073'];

export const TrendLineChart = ({ data = [], xKey = 'date', yKey = 'issues', title }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const gridStroke = isDark ? 'rgba(255, 244, 233, 0.08)' : '#E8DBC5';
  const tickColor = isDark ? '#D1C2D4' : '#7A697E';
  const tooltipBg = isDark ? '#302731' : '#FFFFFF';
  const tooltipBorder = isDark ? 'rgba(255, 244, 233, 0.15)' : '#E8DBC5';
  const tooltipText = isDark ? '#FFF4E9' : '#2B232E';

  return (
    <div className="w-full h-72">
      {title && <h4 className="text-xs font-bold uppercase tracking-wider text-[#8D6B94] dark:text-[#B185A7] mb-3">{title}</h4>}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8D6B94" stopOpacity={isDark ? 0.6 : 0.4} />
              <stop offset="95%" stopColor="#8D6B94" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: tickColor }} />
          <YAxis tick={{ fontSize: 11, fill: tickColor }} />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              color: tooltipText,
              borderRadius: '8px',
              border: `1px solid ${tooltipBorder}`,
              fontSize: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          />
          <Area type="monotone" dataKey={yKey} stroke="#8D6B94" strokeWidth={2.5} fillOpacity={1} fill="url(#colorArea)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ComparisonBarChart = ({ data = [], xKey = 'code', bars = [] }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const gridStroke = isDark ? 'rgba(255, 244, 233, 0.08)' : '#E8DBC5';
  const tickColor = isDark ? '#D1C2D4' : '#7A697E';
  const tooltipBg = isDark ? '#302731' : '#FFFFFF';
  const tooltipBorder = isDark ? 'rgba(255, 244, 233, 0.15)' : '#E8DBC5';
  const tooltipText = isDark ? '#FFF4E9' : '#2B232E';

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: tickColor }} />
          <YAxis tick={{ fontSize: 11, fill: tickColor }} />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              color: tooltipText,
              borderRadius: '8px',
              border: `1px solid ${tooltipBorder}`,
              fontSize: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: tickColor }} />
          {bars.map((bar, idx) => (
            <Bar key={bar.key} dataKey={bar.key} name={bar.name || bar.key} fill={COLORS[idx % COLORS.length]} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const DistributionPieChart = ({ data = [], nameKey = 'name', valueKey = 'value' }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const tooltipBg = isDark ? '#302731' : '#FFFFFF';
  const tooltipBorder = isDark ? 'rgba(255, 244, 233, 0.15)' : '#E8DBC5';
  const tooltipText = isDark ? '#FFF4E9' : '#2B232E';

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={4}
            dataKey={valueKey}
            nameKey={nameKey}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              color: tooltipText,
              borderRadius: '8px',
              border: `1px solid ${tooltipBorder}`,
              fontSize: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
