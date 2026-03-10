import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EmptyState, EmptyStatePresets } from '../EmptyState';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No data found" />);
    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="No data" description="Add some items to get started." />);
    expect(screen.getByText('Add some items to get started.')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = render(<EmptyState title="No data" />);
    expect(container.querySelectorAll('p').length).toBe(0);
  });

  it('renders icon when provided', () => {
    render(<EmptyState title="No data" icon={<span data-testid="icon">📁</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders primary action button', () => {
    const handleClick = jest.fn();
    render(
      <EmptyState
        title="No data"
        action={{ label: 'Add Item', onClick: handleClick }}
      />
    );
    const button = screen.getByText('Add Item');
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders secondary action button', () => {
    const handlePrimary = jest.fn();
    const handleSecondary = jest.fn();
    render(
      <EmptyState
        title="No data"
        action={{ label: 'Add', onClick: handlePrimary }}
        secondaryAction={{ label: 'Learn More', onClick: handleSecondary }}
      />
    );
    fireEvent.click(screen.getByText('Learn More'));
    expect(handleSecondary).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const { container } = render(<EmptyState title="No data" className="my-class" />);
    expect(container.firstChild).toHaveClass('my-class');
  });

  it('renders with sm size', () => {
    const { container } = render(<EmptyState title="No data" size="sm" />);
    expect(container.firstChild).toHaveClass('py-6');
  });

  it('renders with lg size', () => {
    const { container } = render(<EmptyState title="No data" size="lg" />);
    expect(container.firstChild).toHaveClass('py-16');
  });

  it('renders secondary variant action button', () => {
    render(
      <EmptyState
        title="No data"
        action={{ label: 'Add', onClick: () => {}, variant: 'secondary' }}
      />
    );
    const button = screen.getByText('Add');
    expect(button).toHaveClass('bg-gray-100');
  });
});

describe('EmptyStatePresets', () => {
  it('renders NoResults preset', () => {
    render(<>{EmptyStatePresets.NoResults({})}</>);
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('renders NoData preset', () => {
    render(<>{EmptyStatePresets.NoData({})}</>);
    expect(screen.getByText('No data yet')).toBeInTheDocument();
  });

  it('renders NoIntegrations preset', () => {
    render(<>{EmptyStatePresets.NoIntegrations({})}</>);
    expect(screen.getByText('No integrations connected')).toBeInTheDocument();
  });

  it('renders ConnectionRequired preset', () => {
    render(<>{EmptyStatePresets.ConnectionRequired({})}</>);
    expect(screen.getByText('Connection required')).toBeInTheDocument();
  });

  it('renders ComingSoon preset', () => {
    render(<>{EmptyStatePresets.ComingSoon({})}</>);
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
  });

  it('allows preset overrides', () => {
    render(<>{EmptyStatePresets.NoData({ title: 'Custom Title' })}</>);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });
});
