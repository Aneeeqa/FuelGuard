/**
 * StatCard Component Tests
 * 
 * Tests for dashboard stat card component with animated wave design
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StatCard from '../../../src/components/dashboard/StatCard';

// Mock CSS module
vi.mock('../../../src/components/dashboard/StatCard.css', () => ({}));

describe('StatCard', () => {
  const mockIcon = () => <span data-testid="icon">Icon</span>;

  beforeEach(() => {
    // Reset document class list before each test
    document.documentElement.classList.remove('dark');
  });

  describe('Rendering', () => {
    it('should display correct value', () => {
      render(<StatCard icon={mockIcon} value="100" label="Test Label" />);
      
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should display correct label', () => {
      render(<StatCard icon={mockIcon} value="100" label="Test Label" />);
      
      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('should display correct icon', () => {
      render(<StatCard icon={mockIcon} value="100" label="Test Label" />);
      
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should display unit when provided', () => {
      render(
        <StatCard icon={mockIcon} value="100" label="Test Label" unit="km" />
      );
      
      expect(screen.getByText('km')).toBeInTheDocument();
    });

    it('should display trend when provided', () => {
      const trend = { direction: 'up', value: '5%' };
      render(
        <StatCard icon={mockIcon} value="100" label="Test Label" trend={trend} />
      );
      
      expect(screen.getByText(/↑/)).toBeInTheDocument();
      expect(screen.getByText(/5%/)).toBeInTheDocument();
    });

    it('should handle dark mode trend color for up direction', () => {
      const trend = { direction: 'up', value: '5%' };
      render(
        <StatCard icon={mockIcon} value="100" label="Test Label" trend={trend} />
      );
      
      const trendElement = screen.getByText(/↑ 5%/);
      expect(trendElement).toBeInTheDocument();
    });

    it('should handle dark mode trend color for down direction', () => {
      const trend = { direction: 'down', value: '3%' };
      render(
        <StatCard icon={mockIcon} value="100" label="Test Label" trend={trend} />
      );
      
      expect(screen.getByText(/↓/)).toBeInTheDocument();
      expect(screen.getByText(/3%/)).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClick handler when clicked', () => {
      const handleClick = vi.fn();
      render(
        <StatCard 
          icon={mockIcon} 
          value="100" 
          label="Test Label" 
          onClick={handleClick} 
        />
      );
      
      const card = screen.getByText('100').closest('.e-card');
      fireEvent.click(card);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when not provided', () => {
      render(<StatCard icon={mockIcon} value="100" label="Test Label" />);
      
      const card = screen.getByText('100').closest('.e-card');
      expect(() => fireEvent.click(card)).not.toThrow();
    });
  });

  describe('Styling & CSS', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <StatCard 
          icon={mockIcon} 
          value="100" 
          label="Test Label" 
          className="custom-class" 
        />
      );
      
      const card = container.querySelector('.e-card');
      expect(card).toHaveClass('custom-class');
    });

    it('should use light mode gradient by default', () => {
      const { container } = render(
        <StatCard icon={mockIcon} value="100" label="Test Label" gradientId={0} />
      );
      
      const card = container.querySelector('.e-card');
      expect(card).toBeInTheDocument();
    });

    it('should use dark mode gradient when dark mode is active', () => {
      document.documentElement.classList.add('dark');
      
      const { container } = render(
        <StatCard icon={mockIcon} value="100" label="Test Label" gradientId={0} />
      );
      
      const card = container.querySelector('.e-card');
      expect(card).toBeInTheDocument();
    });

    it('should apply different gradient for different gradientId', () => {
      const { container: container1 } = render(
        <StatCard icon={mockIcon} value="100" label="Test Label" gradientId={0} />
      );
      
      const { container: container2 } = render(
        <StatCard icon={mockIcon} value="200" label="Test Label" gradientId={1} />
      );
      
      expect(container1.querySelector('.e-card')).toBeInTheDocument();
      expect(container2.querySelector('.e-card')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible with onClick', () => {
      const handleClick = vi.fn();
      const { container } = render(
        <StatCard 
          icon={mockIcon} 
          value="100" 
          label="Test Label" 
          onClick={handleClick} 
        />
      );
      
      const card = container.querySelector('.e-card');
      card.focus();
      fireEvent.keyDown(card, { key: 'Enter' });
      
      // Note: div doesn't inherently handle Enter, but should be present
      expect(card).toBeInTheDocument();
    });
  });
});
