/**
 * Chart Widget Component
 *
 * Universal chart component supporting multiple chart types
 */

import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton
} from '@mui/material'
import {
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
  ResponsiveContainer
} from 'recharts'

export type ChartType = 'line' | 'bar' | 'area' | 'pie'

export interface ChartDataPoint {
  [key: string]: string | number
}

export interface ChartWidgetProps {
  /** Chart title */
  title: string
  /** Chart type */
  type: ChartType
  /** Chart data */
  data: ChartDataPoint[]
  /** Data key for x-axis */
  xKey?: string
  /** Data keys for y-axis */
  yKeys: string[]
  /** Key labels */
  labels?: Record<string, string>
  /** Loading state */
  loading?: boolean
  /** Chart height */
  height?: number
  /** Color scheme */
  colors?: string[]
  /** Show legend */
  showLegend?: boolean
  /** Show grid */
  showGrid?: boolean
}

const DEFAULT_COLORS = [
  '#1976d2', // blue
  '#2e7d32', // green
  '#ed6c02', // orange
  '#d32f2f', // red
  '#9c27b0', // purple
  '#0288d1', // light blue
  '#f57c00', // deep orange
  '#c2185b'  // pink
]

export const ChartWidget: React.FC<ChartWidgetProps> = ({
  title,
  type,
  data,
  xKey = 'name',
  yKeys,
  labels = {},
  loading = false,
  height = 300,
  colors = DEFAULT_COLORS,
  showLegend = true,
  showGrid = true
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Skeleton variant="rectangular" height={height} />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Box
            sx={{
              height,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary'
            }}
          >
            <Typography>No data available</Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            {yKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name={labels[key] || key}
              />
            ))}
          </LineChart>
        )

      case 'bar':
        return (
          <BarChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            {yKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                name={labels[key] || key}
              />
            ))}
          </BarChart>
        )

      case 'area':
        return (
          <AreaChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            {yKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.6}
                name={labels[key] || key}
              />
            ))}
          </AreaChart>
        )

      case 'pie':
        // For pie chart, use first yKey
        const pieDataKey = yKeys[0]
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={pieDataKey}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            {showLegend && <Legend />}
          </PieChart>
        )

      default:
        return <div>Unsupported chart type: {type}</div>
    }
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          {title}
        </Typography>
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
