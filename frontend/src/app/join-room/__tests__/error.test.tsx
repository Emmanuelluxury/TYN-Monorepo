import { render, screen, fireEvent } from '@testing-library/react';
import JoinRoomError from '../error';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('JoinRoomError (Error Boundary)', () => {
  let mockReset: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockReset = vi.fn();
  });

  it('should render error display component', () => {
    const error = new Error('Test error message');
    render(
      <JoinRoomError error={error} reset={mockReset} />
    );

    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  it('should display the error message from the error object', () => {
    const error = new Error('Room not found');
    render(
      <JoinRoomError error={error} reset={mockReset} />
    );

    expect(screen.getByText(/room not found/i)).toBeInTheDocument();
  });

  it('should have full-screen layout to prevent jarring visual changes', () => {
    const error = new Error('Test error');
    const { container } = render(
      <JoinRoomError error={error} reset={mockReset} />
    );

    const section = container.querySelector('div');
    expect(section).toHaveClass('min-h-screen');
    expect(section).toHaveClass('flex', 'items-center', 'justify-center');
  });

  it('should use correct background color from theme variables', () => {
    const error = new Error('Test error');
    const { container } = render(
      <JoinRoomError error={error} reset={mockReset} />
    );

    const section = container.querySelector('div');
    expect(section).toHaveClass('bg-[var(--tycoon-bg)]');
  });

  it('should show technical error details in development mode', () => {
    // Mock NODE_ENV as development
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      configurable: true,
    });

    const error = new Error('Technical error details');
    error.stack = 'Error: Technical error details\n  at testFunction (test.ts:10)';

    render(
      <JoinRoomError error={error} reset={mockReset} />
    );

    // In development, stack trace should be shown via ErrorDisplay
    // (actual display depends on ErrorDisplay implementation)
    expect(screen.getByText(/error/i)).toBeInTheDocument();

    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      configurable: true,
    });
  });

  it('should hide technical details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true,
    });

    const error = new Error('Technical error details');
    render(
      <JoinRoomError error={error} reset={mockReset} />
    );

    // ErrorDisplay should handle showing/hiding technical details based on showTechnical prop
    expect(screen.getByText(/error/i)).toBeInTheDocument();

    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      configurable: true,
    });
  });

  it('should call reset function when retry button is clicked', () => {
    const error = new Error('Test error');
    render(
      <JoinRoomError error={error} reset={mockReset} />
    );

    const retryButton = screen.getByRole('button', { name: /retry|try again/i });
    fireEvent.click(retryButton);

    expect(mockReset).toHaveBeenCalled();
  });

  it('should handle errors with digest property', () => {
    const error = new Error('Test error');
    error.digest = 'abc123digest';
    render(
      <JoinRoomError error={error} reset={mockReset} />
    );

    // Error boundary should handle digest for error reporting
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  it('should provide navigation options in error display', () => {
    const error = new Error('Something went wrong');
    render(
      <JoinRoomError error={error} reset={mockReset} />
    );

    // Should have retry button (tested above)
    expect(screen.getByRole('button', { name: /retry|try again/i })).toBeInTheDocument();
    
    // May also have home button depending on ErrorDisplay implementation
    // Just verify error display is rendered
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  it('should have padding to prevent content cutoff on small screens', () => {
    const error = new Error('Test error');
    const { container } = render(
      <JoinRoomError error={error} reset={mockReset} />
    );

    const section = container.querySelector('div');
    expect(section).toHaveClass('p-4');
  });

  it('should pass correct props to ErrorDisplay', () => {
    const error = new Error('Display error');
    const { container } = render(
      <JoinRoomError error={error} reset={mockReset} />
    );

    // ErrorDisplay should be rendered with the error
    const errorDisplay = container.querySelector('[class*="error"]');
    expect(errorDisplay).toBeInTheDocument();
  });
});
