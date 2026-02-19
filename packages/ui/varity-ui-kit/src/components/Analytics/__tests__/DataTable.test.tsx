import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DataTable } from '../DataTable';

const columns = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'value', header: 'Value', align: 'right' as const },
];

const data = [
  { name: 'Alpha', value: 100 },
  { name: 'Beta', value: 200 },
  { name: 'Charlie', value: 50 },
];

describe('DataTable', () => {
  it('renders column headers', () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
  });

  it('renders data rows', () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('shows empty message when data is empty', () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('shows custom empty message', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('shows loading spinner when loading=true', () => {
    const { container } = render(<DataTable columns={columns} data={data} loading />);
    // When loading, data rows should not be visible
    expect(screen.queryByText('Alpha')).toBeNull();
  });

  it('sorts data when clicking sortable column header', () => {
    render(<DataTable columns={columns} data={data} />);
    // Click the Name column header (sortable)
    fireEvent.click(screen.getByText('Name'));

    // Get all table cells
    const cells = screen.getAllByRole('cell');
    // First data cell should be Alpha (asc sort)
    expect(cells[0]).toHaveTextContent('Alpha');
  });

  it('reverses sort direction on second click', () => {
    render(<DataTable columns={columns} data={data} />);
    const header = screen.getByText('Name');

    // First click: ascending
    fireEvent.click(header);
    // Second click: descending
    fireEvent.click(header);

    const cells = screen.getAllByRole('cell');
    // First data cell should be Charlie (desc sort)
    expect(cells[0]).toHaveTextContent('Charlie');
  });

  it('handles row click events', () => {
    const handleRowClick = jest.fn();
    render(<DataTable columns={columns} data={data} onRowClick={handleRowClick} />);

    fireEvent.click(screen.getByText('Alpha'));
    expect(handleRowClick).toHaveBeenCalledWith(data[0]);
  });

  it('renders custom cell renderers', () => {
    const customColumns = [
      { key: 'name', header: 'Name' },
      { key: 'value', header: 'Value', render: (val: number) => <span data-testid="custom">${val}</span> },
    ];

    render(<DataTable columns={customColumns} data={data} />);
    const customCells = screen.getAllByTestId('custom');
    expect(customCells[0]).toHaveTextContent('$100');
  });

  it('renders pagination controls when pagination=true', () => {
    const largeData = Array.from({ length: 25 }, (_, i) => ({ name: `Item ${i}`, value: i }));
    render(<DataTable columns={columns} data={largeData} pagination pageSize={10} />);

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
  });

  it('navigates pages when clicking Next/Previous', () => {
    const largeData = Array.from({ length: 25 }, (_, i) => ({ name: `Item ${i}`, value: i }));
    render(<DataTable columns={columns} data={largeData} pagination pageSize={10} />);

    // Should show first 10 items
    expect(screen.getByText('Item 0')).toBeInTheDocument();
    expect(screen.queryByText('Item 10')).toBeNull();

    // Click Next
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
    expect(screen.getByText('Item 10')).toBeInTheDocument();
    expect(screen.queryByText('Item 0')).toBeNull();

    // Click Previous
    fireEvent.click(screen.getByText('Previous'));
    expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
    expect(screen.getByText('Item 0')).toBeInTheDocument();
  });

  it('disables Previous button on first page', () => {
    const largeData = Array.from({ length: 25 }, (_, i) => ({ name: `Item ${i}`, value: i }));
    render(<DataTable columns={columns} data={largeData} pagination pageSize={10} />);

    const prevButton = screen.getByText('Previous');
    expect(prevButton).toBeDisabled();
  });

  it('does not show pagination when data fits in one page', () => {
    render(<DataTable columns={columns} data={data} pagination pageSize={10} />);
    expect(screen.queryByText('Previous')).toBeNull();
    expect(screen.queryByText('Next')).toBeNull();
  });
});
