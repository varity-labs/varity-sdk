import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { KPICard } from '../KPICard';

describe('KPICard', () => {
  it('renders title and value', () => {
    render(<KPICard title="Revenue" value="$12,345" />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('$12,345')).toBeInTheDocument();
  });

  it('renders numeric value', () => {
    render(<KPICard title="Users" value={1234} />);
    expect(screen.getByText('1234')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<KPICard title="Revenue" value="$12,345" subtitle="Monthly" />);
    expect(screen.getByText('Monthly')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    const { container } = render(<KPICard title="Revenue" value="$12,345" />);
    expect(container.querySelector('p')).toBeNull();
  });

  it('renders trend indicator when trend and trendValue provided', () => {
    render(<KPICard title="Revenue" value="$12,345" trend="up" trendValue="+12%" />);
    expect(screen.getByText('+12%')).toBeInTheDocument();
    expect(screen.getByText('↑')).toBeInTheDocument();
  });

  it('renders down trend icon', () => {
    render(<KPICard title="Revenue" value="$12,345" trend="down" trendValue="-5%" />);
    expect(screen.getByText('↓')).toBeInTheDocument();
    expect(screen.getByText('-5%')).toBeInTheDocument();
  });

  it('renders neutral trend icon', () => {
    render(<KPICard title="Revenue" value="$12,345" trend="neutral" trendValue="0%" />);
    expect(screen.getByText('→')).toBeInTheDocument();
  });

  it('does not render trend when only trend is provided without trendValue', () => {
    const { container } = render(<KPICard title="Revenue" value="$12,345" trend="up" />);
    expect(container.querySelector('.text-green-600')).toBeNull();
  });

  it('renders loading skeleton when loading=true', () => {
    const { container } = render(<KPICard title="Revenue" value="$12,345" loading />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    // Should NOT show the actual value when loading
    expect(screen.queryByText('$12,345')).toBeNull();
  });

  it('handles click events when onClick is provided', () => {
    const handleClick = jest.fn();
    render(<KPICard title="Revenue" value="$12,345" onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not have button role when onClick is not provided', () => {
    render(<KPICard title="Revenue" value="$12,345" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders icon when provided', () => {
    render(<KPICard title="Revenue" value="$12,345" icon={<span data-testid="icon">$</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<KPICard title="Revenue" value="$12,345" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders with outlined variant', () => {
    const { container } = render(<KPICard title="Revenue" value="$12,345" variant="outlined" />);
    expect(container.firstChild).toHaveClass('border-2');
  });

  it('renders with sm size', () => {
    const { container } = render(<KPICard title="Revenue" value="$12,345" size="sm" />);
    expect(container.firstChild).toHaveClass('p-3');
  });

  it('renders with lg size', () => {
    const { container } = render(<KPICard title="Revenue" value="$12,345" size="lg" />);
    expect(container.firstChild).toHaveClass('p-6');
  });
});
