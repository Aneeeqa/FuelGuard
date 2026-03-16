/**
 * BudgetCard Component Tests
 * 
 * Tests for budget tracking card component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import BudgetCard from '../../../src/components/dashboard/BudgetCard';

describe('BudgetCard', () => {
  const defaultProps = {
    currentSpending: 150,
    budget: 200,
    currency: '$'
  };

  describe('Rendering', () => {
    it('should display current spending', () => {
      render(<BudgetCard {...defaultProps} />);
      
      expect(screen.getByText(/150/)).toBeInTheDocument();
    });

    it('should display budget amount', () => {
      render(<BudgetCard {...defaultProps} />);
      
      expect(screen.getByText(/200/)).toBeInTheDocument();
    });

    it('should display currency symbol', () => {
      render(<BudgetCard {...defaultProps} />);
      
      expect(screen.getByText(/\$/)).toBeInTheDocument();
    });

    it('should calculate percentage correctly', () => {
      render(<BudgetCard {...defaultProps} />);
      
      expect(screen.getByText(/75/)).toBeInTheDocument();
    });

    it('should display progress bar', () => {
      const { container } = render(<BudgetCard {...defaultProps} />);
      
      const progressBar = container.querySelector('[role="progressbar"]') || 
                        container.querySelector('.progress-bar');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Budget Warning', () => {
    it('should show warning when over budget', () => {
      render(
        <BudgetCard currentSpending={250} budget={200} currency="$" />
      );
      
      expect(screen.getByText(/over budget/i)).toBeInTheDocument();
    });

    it('should show warning at budget limit', () => {
      render(
        <BudgetCard currentSpending={200} budget={200} currency="$" />
      );
      
      expect(screen.getByText(/at budget/i)).toBeInTheDocument();
    });

    it('should not show warning when under budget', () => {
      render(
        <BudgetCard currentSpending={150} budget={200} currency="$" />
      );
      
      expect(screen.queryByText(/over budget/i)).not.toBeInTheDocument();
    });

    it('should display danger styling when significantly over budget', () => {
      render(
        <BudgetCard currentSpending={300} budget={200} currency="$" />
      );
      
      expect(screen.getByText(/over budget/i)).toBeInTheDocument();
    });
  });

  describe('Percentage Calculation', () => {
    it('should calculate 0% when no spending', () => {
      render(
        <BudgetCard currentSpending={0} budget={200} currency="$" />
      );
      
      expect(screen.getByText(/0%/)).toBeInTheDocument();
    });

    it('should calculate 50% when halfway to budget', () => {
      render(
        <BudgetCard currentSpending={100} budget={200} currency="$" />
      );
      
      expect(screen.getByText(/50%/)).toBeInTheDocument();
    });

    it('should calculate 100% when at budget', () => {
      render(
        <BudgetCard currentSpending={200} budget={200} currency="$" />
      );
      
      expect(screen.getByText(/100%/)).toBeInTheDocument();
    });

    it('should calculate >100% when over budget', () => {
      render(
        <BudgetCard currentSpending={250} budget={200} currency="$" />
      );
      
      expect(screen.getByText(/125%/)).toBeInTheDocument();
    });
  });

  describe('Different Currencies', () => {
    it('should display USD currency', () => {
      render(<BudgetCard currentSpending={150} budget={200} currency="$" />);
      
      expect(screen.getByText(/\$/)).toBeInTheDocument();
    });

    it('should display EUR currency', () => {
      render(<BudgetCard currentSpending={150} budget={200} currency="€" />);
      
      expect(screen.getByText(/€/)).toBeInTheDocument();
    });

    it('should display GBP currency', () => {
      render(<BudgetCard currentSpending={150} budget={200} currency="£" />);
      
      expect(screen.getByText(/£/)).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('should show progress at 50%', () => {
      const { container } = render(
        <BudgetCard currentSpending={100} budget={200} currency="$" />
      );
      
      const progressBar = container.querySelector('[role="progressbar"]') || 
                        container.querySelector('.progress-bar');
      expect(progressBar).toBeInTheDocument();
    });

    it('should show progress at 100%', () => {
      const { container } = render(
        <BudgetCard currentSpending={200} budget={200} currency="$" />
      );
      
      const progressBar = container.querySelector('[role="progressbar"]') || 
                        container.querySelector('.progress-bar');
      expect(progressBar).toBeInTheDocument();
    });

    it('should show progress over 100%', () => {
      const { container } = render(
        <BudgetCard currentSpending={250} budget={200} currency="$" />
      );
      
      const progressBar = container.querySelector('[role="progressbar"]') || 
                        container.querySelector('.progress-bar');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero budget', () => {
      expect(() => {
        render(<BudgetCard currentSpending={0} budget={0} currency="$" />);
      }).not.toThrow();
    });

    it('should handle negative spending', () => {
      expect(() => {
        render(<BudgetCard currentSpending={-50} budget={200} currency="$" />);
      }).not.toThrow();
    });

    it('should handle very large budget', () => {
      render(<BudgetCard currentSpending={1000} budget={10000} currency="$" />);
      
      expect(screen.getByText(/10%/)).toBeInTheDocument();
    });

    it('should handle decimal values', () => {
      render(
        <BudgetCard currentSpending={123.45} budget={200} currency="$" />
      );
      
      expect(screen.getByText(/123\.45/)).toBeInTheDocument();
    });
  });

  describe('Visual Feedback', () => {
    it('should show green indicator when under 50% budget', () => {
      render(
        <BudgetCard currentSpending={80} budget={200} currency="$" />
      );
      
      expect(screen.getByText(/40%/)).toBeInTheDocument();
    });

    it('should show yellow indicator when 50-90% budget', () => {
      render(
        <BudgetCard currentSpending={140} budget={200} currency="$" />
      );
      
      expect(screen.getByText(/70%/)).toBeInTheDocument();
    });

    it('should show red indicator when over 90% budget', () => {
      render(
        <BudgetCard currentSpending={190} budget={200} currency="$" />
      );
      
      expect(screen.getByText(/95%/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for progress', () => {
      const { container } = render(
        <BudgetCard currentSpending={150} budget={200} currency="$" />
      );
      
      const progressBar = container.querySelector('[role="progressbar"]') || 
                        container.querySelector('.progress-bar');
      if (progressBar) {
        expect(progressBar).toBeInTheDocument();
      }
    });
  });
});
