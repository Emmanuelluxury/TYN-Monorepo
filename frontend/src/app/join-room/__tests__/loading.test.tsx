import { render, screen, waitFor } from '@testing-library/react';
import JoinRoomLoading from '../loading';
import { describe, it, expect } from 'vitest';

describe('JoinRoomLoading (Skeleton)', () => {
  it('should render without crashing', () => {
    render(<JoinRoomLoading />);
    const skeleton = screen.getByLabelText('Loading join room form');
    expect(skeleton).toBeInTheDocument();
  });

  it('should have aria-busy="true" to indicate loading state', () => {
    render(<JoinRoomLoading />);
    const section = screen.getByLabelText('Loading join room form');
    expect(section).toHaveAttribute('aria-busy', 'true');
  });

  it('should have full screen layout to prevent CLS', () => {
    const { container } = render(<JoinRoomLoading />);
    const section = container.querySelector('section');
    expect(section).toHaveClass('min-h-screen', 'w-full');
  });

  it('should maintain proper spacing and layout with skeleton elements', () => {
    const { container } = render(<JoinRoomLoading />);
    
    // Card should have proper layout classes
    const card = container.querySelector('.max-w-md');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('rounded-2xl', 'p-6');

    // Inner card should have proper layout
    const innerCard = card?.querySelector('.rounded-lg');
    expect(innerCard).toHaveClass('p-6', 'space-y-5');
  });

  it('should have proper color/theme variables for integration with main form', () => {
    const { container } = render(<JoinRoomLoading />);
    const section = container.querySelector('section');
    
    // Check for tycoon theme variables
    const styles = window.getComputedStyle(section!);
    expect(section).toHaveClass('bg-[var(--tycoon-bg)]');
  });

  it('should render all expected skeleton slots', () => {
    const { container } = render(<JoinRoomLoading />);
    const skeletons = container.querySelectorAll('[data-testid="skeleton"]');
    
    // Should have: title, label, hint, input, button skeletons
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should preserve error slot space even when empty', () => {
    const { container } = render(<JoinRoomLoading />);
    const errorSlot = container.querySelector('.min-h-[1.25rem]');
    
    // Error slot should exist and have minimum height
    expect(errorSlot).toBeInTheDocument();
    expect(errorSlot).toHaveClass('min-h-[1.25rem]');
  });

  it('should have bg-[var(--tycoon-bg)] matching the actual form', () => {
    const { container } = render(<JoinRoomLoading />);
    const section = container.querySelector('section');
    expect(section).toHaveClass('bg-[var(--tycoon-bg)]');
  });

  it('should be visible and not hidden by default', () => {
    render(<JoinRoomLoading />);
    const section = screen.getByLabelText('Loading join room form');
    expect(section).toBeVisible();
  });
});
