/**
 * KPI Card Component
 *
 * Universal KPI display card for dashboards
 */

import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Skeleton
} from '@mui/material'
import { TrendingUp, TrendingDown } from '@mui/icons-material'

export interface KPICardProps {
  /** Card title */
  title: string
  /** Main value to display */
  value: string | number
  /** Optional subtitle */
  subtitle?: string
  /** Loading state */
  loading?: boolean
  /** Trend indicator */
  trend?: {
    value: number
    label: string
  }
  /** Custom icon */
  icon?: React.ReactNode
  /** Card color variant */
  variant?: 'default' | 'primary' | 'success' | 'error' | 'warning'
  /** Click handler */
  onClick?: () => void
}

const variantColors = {
  default: '#1976d2',
  primary: '#1976d2',
  success: '#2e7d32',
  error: '#d32f2f',
  warning: '#ed6c02'
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  loading = false,
  trend,
  icon,
  variant = 'default',
  onClick
}) => {
  const color = variantColors[variant]

  if (loading) {
    return (
      <Card
        sx={{
          height: '100%',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': onClick ? {
            transform: 'translateY(-4px)',
            boxShadow: 3
          } : {}
        }}
      >
        <CardContent>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="80%" height={48} sx={{ mt: 1 }} />
          <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 3
        } : {},
        borderTop: `4px solid ${color}`
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            gutterBottom
            sx={{ fontWeight: 500 }}
          >
            {title}
          </Typography>
          {icon && (
            <Box sx={{ color, display: 'flex', alignItems: 'center' }}>
              {icon}
            </Box>
          )}
        </Box>

        <Typography
          variant="h4"
          component="div"
          sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}
        >
          {value}
        </Typography>

        {(subtitle || trend) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {trend && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: trend.value >= 0 ? 'success.main' : 'error.main'
                }}
              >
                {trend.value >= 0 ? (
                  <TrendingUp fontSize="small" />
                ) : (
                  <TrendingDown fontSize="small" />
                )}
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {Math.abs(trend.value)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {trend.label}
                </Typography>
              </Box>
            )}
            {subtitle && !trend && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
