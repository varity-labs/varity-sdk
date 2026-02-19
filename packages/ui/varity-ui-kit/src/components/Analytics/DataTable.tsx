/**
 * DataTable - Sortable, filterable data table component
 *
 * Displays tabular data with sorting, filtering, and pagination support.
 */

import React, { useState, useMemo } from 'react'

export interface DataTableColumn<T = any> {
  /** Column key (must match data object key) */
  key: string
  /** Column display header */
  header: string
  /** Column width */
  width?: string | number
  /** Whether column is sortable */
  sortable?: boolean
  /** Custom cell renderer */
  render?: (value: any, row: T) => React.ReactNode
  /** Alignment */
  align?: 'left' | 'center' | 'right'
}

export interface DataTableProps<T = any> {
  /** Table columns configuration */
  columns: DataTableColumn<T>[]
  /** Table data */
  data: T[]
  /** Loading state */
  loading?: boolean
  /** Show pagination */
  pagination?: boolean
  /** Items per page */
  pageSize?: number
  /** Row click handler */
  onRowClick?: (row: T) => void
  /** Empty state message */
  emptyMessage?: string
  /** Enable row hover */
  hoverable?: boolean
  /** Enable row striping */
  striped?: boolean
}

/**
 * DataTable Component
 *
 * @example
 * ```tsx
 * <DataTable
 *   columns={[
 *     { key: 'name', header: 'Name', sortable: true },
 *     { key: 'value', header: 'Value', align: 'right',
 *       render: (val) => `$${val}` }
 *   ]}
 *   data={[
 *     { name: 'Product A', value: 1000 },
 *     { name: 'Product B', value: 2000 }
 *   ]}
 *   pagination
 *   pageSize={10}
 * />
 * ```
 */
export const DataTable = <T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  pagination = false,
  pageSize = 10,
  onRowClick,
  emptyMessage = 'No data available',
  hoverable = true,
  striped = true
}: DataTableProps<T>) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortColumn) return data

    return [...data].sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]

      if (aVal === bVal) return 0

      const comparison = aVal > bVal ? 1 : -1
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [data, sortColumn, sortDirection])

  // Pagination logic
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData

    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return sortedData.slice(startIndex, endIndex)
  }, [sortedData, pagination, currentPage, pageSize])

  const totalPages = Math.ceil(data.length / pageSize)

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  return (
    <div className="varity-data-table">
      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}
        >
          {/* Header */}
          <thead>
            <tr style={{ borderBottom: '2px solid var(--varity-border-color, #e0e0e0)' }}>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    padding: '12px 16px',
                    textAlign: column.align || 'left',
                    fontWeight: 600,
                    color: 'var(--varity-text-primary, #212121)',
                    backgroundColor: 'var(--varity-bg-secondary, #f9f9f9)',
                    cursor: column.sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                    width: column.width
                  }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: column.align === 'right' ? 'flex-end' : column.align === 'center' ? 'center' : 'flex-start' }}>
                    <span>{column.header}</span>
                    {column.sortable && (
                      <span style={{ fontSize: '10px', opacity: sortColumn === column.key ? 1 : 0.3 }}>
                        {sortColumn === column.key && sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: 'var(--varity-text-secondary, #757575)'
                  }}
                >
                  <div
                    style={{
                      display: 'inline-block',
                      width: '32px',
                      height: '32px',
                      border: '3px solid var(--varity-border-color, #e0e0e0)',
                      borderTop: '3px solid var(--varity-primary-color, #1976d2)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}
                  />
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: 'var(--varity-text-secondary, #757575)'
                  }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={row.id || `row-${rowIndex}`}
                  style={{
                    borderBottom: '1px solid var(--varity-border-color, #e0e0e0)',
                    backgroundColor: striped && rowIndex % 2 === 1 ? 'var(--varity-bg-secondary, #f9f9f9)' : 'transparent',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background-color 0.2s ease'
                  }}
                  onClick={() => onRowClick && onRowClick(row)}
                  onMouseEnter={(e) => {
                    if (hoverable) {
                      e.currentTarget.style.backgroundColor = 'var(--varity-bg-hover, #f0f0f0)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = striped && rowIndex % 2 === 1 ? 'var(--varity-bg-secondary, #f9f9f9)' : 'transparent'
                  }}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      style={{
                        padding: '12px 16px',
                        textAlign: column.align || 'left',
                        color: 'var(--varity-text-primary, #212121)'
                      }}
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && !loading && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '16px',
            padding: '12px 16px',
            backgroundColor: 'var(--varity-bg-secondary, #f9f9f9)',
            borderRadius: '8px'
          }}
        >
          <span style={{ fontSize: '13px', color: 'var(--varity-text-secondary, #757575)' }}>
            Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, data.length)} of {data.length}
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: '6px 12px',
                backgroundColor: 'var(--varity-bg-card, #ffffff)',
                border: '1px solid var(--varity-border-color, #e0e0e0)',
                borderRadius: '6px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                opacity: currentPage === 1 ? 0.5 : 1
              }}
            >
              Previous
            </button>

            <span
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                color: 'var(--varity-text-secondary, #757575)'
              }}
            >
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: '6px 12px',
                backgroundColor: 'var(--varity-bg-card, #ffffff)',
                border: '1px solid var(--varity-border-color, #e0e0e0)',
                borderRadius: '6px',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                opacity: currentPage === totalPages ? 0.5 : 1
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
