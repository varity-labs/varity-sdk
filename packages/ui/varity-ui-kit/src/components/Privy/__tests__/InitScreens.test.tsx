import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InitializingScreen } from '../InitializingScreen';
import { InitTimeoutScreen } from '../InitTimeoutScreen';

describe('InitializingScreen', () => {
  it('renders with default content', () => {
    render(<InitializingScreen />);
    expect(screen.getByText('Initializing Dashboard...')).toBeInTheDocument();
    expect(screen.getByText('Setting up authentication and services. This should take just a few seconds.')).toBeInTheDocument();
  });

  it('renders default steps without blockchain jargon', () => {
    render(<InitializingScreen />);
    expect(screen.getByText('Loading authentication')).toBeInTheDocument();
    expect(screen.getByText('Connecting to Varity')).toBeInTheDocument();
    expect(screen.getByText('Preparing your session')).toBeInTheDocument();

    // Should NOT contain blockchain jargon
    expect(screen.queryByText(/Web3/i)).toBeNull();
    expect(screen.queryByText(/Varity L3/i)).toBeNull();
    expect(screen.queryByText(/wallet/i)).toBeNull();
    expect(screen.queryByText(/blockchain/i)).toBeNull();
  });

  it('renders custom title', () => {
    render(<InitializingScreen title="Loading your workspace..." />);
    expect(screen.getByText('Loading your workspace...')).toBeInTheDocument();
  });

  it('renders custom description', () => {
    render(<InitializingScreen description="Please wait while we set things up." />);
    expect(screen.getByText('Please wait while we set things up.')).toBeInTheDocument();
  });

  it('renders custom steps', () => {
    render(<InitializingScreen steps={['Step A', 'Step B']} />);
    expect(screen.getByText('Step A')).toBeInTheDocument();
    expect(screen.getByText('Step B')).toBeInTheDocument();
  });

  it('renders spinner animation', () => {
    const { container } = render(<InitializingScreen />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });
});

describe('InitTimeoutScreen', () => {
  it('renders with default content', () => {
    render(<InitTimeoutScreen onRetry={() => {}} />);
    expect(screen.getByText('Initialization Taking Longer Than Expected')).toBeInTheDocument();
    expect(screen.getByText(/authentication services are taking longer/)).toBeInTheDocument();
  });

  it('renders default tips without blockchain jargon', () => {
    render(<InitTimeoutScreen onRetry={() => {}} />);
    expect(screen.getByText('Check your internet connection')).toBeInTheDocument();

    // Should NOT contain blockchain jargon
    expect(screen.queryByText(/Web3/i)).toBeNull();
    expect(screen.queryByText(/blockchain/i)).toBeNull();
  });

  it('calls onRetry when Retry button is clicked', () => {
    const handleRetry = jest.fn();
    render(<InitTimeoutScreen onRetry={handleRetry} />);
    fireEvent.click(screen.getByText('Retry'));
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('renders Continue Waiting button', () => {
    render(<InitTimeoutScreen onRetry={() => {}} />);
    expect(screen.getByText('Continue Waiting')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(<InitTimeoutScreen onRetry={() => {}} title="Still loading..." />);
    expect(screen.getByText('Still loading...')).toBeInTheDocument();
  });

  it('renders custom tips', () => {
    render(<InitTimeoutScreen onRetry={() => {}} tips={['Tip 1', 'Tip 2']} />);
    expect(screen.getByText('Tip 1')).toBeInTheDocument();
    expect(screen.getByText('Tip 2')).toBeInTheDocument();
  });
});
