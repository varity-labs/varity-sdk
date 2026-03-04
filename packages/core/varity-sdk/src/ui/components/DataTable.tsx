/**
 * DataTable Component
 *
 * Universal data table with sorting, pagination, and actions
 */

import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  IconButton,
  Chip,
  Box,
  Typography,
  Skeleton
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material'

export interface Column {
  /** Column identifier */
  id: string
  /** Column label */
  label: string
  /** Minimum width */
  minWidth?: number
  /** Alignment */
  align?: 'left' | 'right' | 'center'
  /** Format function */
  format?: (value: any) => React.ReactNode
  /** Sortable */
  sortable?: boolean
}

export interface DataTableProps {
  /** Table columns */
  columns: Column[]
  /** Table data */
  data: any[]
  /** Loading state */
  loading?: boolean
  /** Enable pagination */
  pagination?: boolean
  /** Rows per page options */
  rowsPerPageOptions?: number[]
  /** Row actions */
  actions?: {
    onView?: (row: any) => void
    onEdit?: (row: any) => void
    onDelete?: (row: any) => void
    custom?: Array<{
      icon: React.ReactNode
      label: string
      onClick: (row: any) => void
    }>
  }
  /** Empty state message */
  emptyMessage?: string
  /** Click handler for row */
  onRowClick?: (row: any) => void
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  loading = false,
  pagination = true,
  rowsPerPageOptions = [10, 25, 50, 100],
  actions,
  emptyMessage = 'No data available',
  onRowClick
}) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0])
  const [orderBy, setOrderBy] = useState<string>('')
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleSort = (columnId: string) => {
    const isAsc = orderBy === columnId && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(columnId)
  }

  const sortedData = React.useMemo(() => {
    if (!orderBy) return data

    return [...data].sort((a, b) => {
      const aValue = a[orderBy]
      const bValue = b[orderBy]

      if (aValue === bValue) return 0

      const comparison = aValue < bValue ? -1 : 1
      return order === 'asc' ? comparison : -comparison
    })
  }, [data, order, orderBy])

  const paginatedData = pagination
    ? sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : sortedData

  if (loading) {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.id} align={column.align || 'left'}>
                  <Skeleton variant="text" />
                </TableCell>
              ))}
              {actions && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column.id}>
                    <Skeleton variant="text" />
                  </TableCell>
                ))}
                {actions && (
                  <TableCell>
                    <Skeleton variant="circular" width={32} height={32} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )
  }

  if (data.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Paper>
    )
  }

  return (
    <Paper>
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {actions && (
                <TableCell align="right" style={{ minWidth: 120 }}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row, index) => (
              <TableRow
                hover
                key={index}
                onClick={() => onRowClick?.(row)}
                sx={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  '&:last-child td, &:last-child th': { border: 0 }
                }}
              >
                {columns.map((column) => {
                  const value = row[column.id]
                  return (
                    <TableCell key={column.id} align={column.align || 'left'}>
                      {column.format ? column.format(value) : value}
                    </TableCell>
                  )
                })}
                {actions && (
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      {actions.onView && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            actions.onView!(row)
                          }}
                          title="View"
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      )}
                      {actions.onEdit && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            actions.onEdit!(row)
                          }}
                          title="Edit"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                      {actions.onDelete && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation()
                            actions.onDelete!(row)
                          }}
                          title="Delete"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                      {actions.custom?.map((action, idx) => (
                        <IconButton
                          key={idx}
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            action.onClick(row)
                          }}
                          title={action.label}
                        >
                          {action.icon}
                        </IconButton>
                      ))}
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {pagination && (
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </Paper>
  )
}
