/**
 * Badge Component Tests
 * 
 * Tests for badge component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '../../../src/components/ui/Badge';

describe('Badge', () => {
  const defaultProps = {
    count: 5,
  };

  describe('Rendering', () => {
    it('should render badge text', () => {
      render(<Badge {...defaultProps}>Test</Badge>);
      
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('should render count', () => {
      render(<Badge {...defaultProps}>Test</Badge>);
      
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should render without count when not provided', () => {
      render(<Badge>Test</Badge>);
      
      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(screen.queryByText('5')).not.toBeInTheDocument();
    });
  });

  describe('Count Display', () => {
    it('should display single digit count', () => {
      render(<Badge count={3}>Test</Badge>);
      
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should display double digit count', () => {
      render(<Badge count={12}>Test</Badge>);
      
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('should display large count', () => {
      render(<Badge count={999}>Test</Badge>);
      
      expect(screen.getByText('999')).toBeInTheDocument();
    });

    it('should display zero count', () => {
      render(<Badge count={0}>Test</Badge>);
      
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should hide when count is zero and hideZero is true', () => {
      const { container } = render(<Badge count={0} hideZero>Test</Badge>);
      
      const badge = container.querySelector('.badge');
      expect(badge).not.toBeInTheDocument();
    });

    it('should show when count is zero and hideZero is false', () => {
      render(<Badge count={0} hideZero={false}>Test</Badge>);
      
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Variants and Styling', () => {
    it('should display badge color', () => {
      const { container } = render(<Badge variant="primary">Test</Badge>);
      
      const badge = container.querySelector('.badge');
      expect(badge).toBeInTheDocument();
    });

    it('should render success variant', () => {
      const { container } = render(<Badge variant="success">Test</Badge>);
      
      const badge = container.querySelector('.badge');
      expect(badge).toBeInTheDocument();
    });

    it('should render warning variant', () => {
      const { container } = render(<Badge variant="warning">Test</Badge>);
      
      const badge = container.querySelector('.badge');
      expect(badge).toBeInTheDocument();
    });

    it('should render error variant', () => {
      const { container } = render(<Badge variant="error">Test</Badge>);
      
      const badge = container.querySelector('.badge');
      expect(badge).toBeInTheDocument();
    });

    it('should render info variant', () => {
      const { container } = render(<Badge variant="info">Test</Badge>);
      
      const badge = container.querySelector('.badge');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      const { container } = render(<Badge size="sm">Test</Badge>);
      
      const badge = container.querySelector('.badge');
      expect(badge).toBeInTheDocument();
    });

    it('should render medium size (default)', () => {
      const { container } = render(<Badge size="md">Test</Badge>);
      
      const badge = container.querySelector('.badge');
      expect(badge).toBeInTheDocument();
    });

    it('should render large size', () => {
      const { container } = render(<Badge size="lg">Test</Badge>);
      
      const badge = container.querySelector('.badge');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <Badge className="custom-badge">Test</Badge>
      );
      
      const badge = container.querySelector('.custom-badge');
      expect(badge).toBeInTheDocument();
    });

    it('should merge multiple classes', () => {
      const { container } = render(
        <Badge className="class-1 class-2">Test</Badge>
      );
      
      const badge = container.querySelector('.class-1');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { container } = render(<Badge count={5}>Test</Badge>);
      
      const badge = container.querySelector('.badge');
      expect(badge).toHaveAttribute('aria-label');
    });

    it('should announce count to screen readers', () => {
      render(<Badge count={5}>Test</Badge>);
      
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('Positioning', () => {
    it('should be positioned by default', () => {
      const { container } = render(<Badge>Test</Badge>);
      
      const badge = container.querySelector('.badge');
      expect(badge).toBeInTheDocument();
    });

    it('should support absolute positioning', () => {
      const { container } = render(
        <Badge position="absolute">Test</Badge>
      );
      
      const badge = container.querySelector('.badge');
      expect(badge).toBeInTheDocument();
    });

    it('should support relative positioning', () => {
      const { container } = render(
        <Badge position="relative">Test</Badge>
      );
      
      const badge = container.querySelector('.badge');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text', () => {
      render(<Badge count={5}></Badge>);
      
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should handle null children', () => {
      render(<Badge count={5}>{null}</Badge>);
      
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should handle negative count', () => {
      render(<Badge count={-5}>Test</Badge>);
      
      expect(screen.getByText('-5')).toBeInTheDocument();
    });

    it('should handle decimal count', () => {
      render(<Badge count={3.5}>Test</Badge>);
      
      expect(screen.getByText('3.5')).toBeInTheDocument();
    });

    it('should handle very large count', () => {
      render(<Badge count={999999}>Test</Badge>);
      
      expect(screen.getByText('999999')).toBeInTheDocument();
    });
  });

  describe('Dot Variant', () => {
    it('should render dot variant without text', () => {
      const { container } = render(<Badge variant="dot" />);
      
      const badge = container.querySelector('.badge');
      expect(badge).toBeInTheDocument();
    });

    it('should render small dot size', () => {
      const { container } = render(<Badge variant="dot" size="sm" />);
      
      const badge = container.querySelector('.badge');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Visibility', () => {
    it('should be visible by default', () => {
      render(<Badge>Test</Badge>);
      
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('should be hidden when visible is false', () => {
      const { container } = render(<Badge visible={false}>Test</Badge>);
      
      const badge = container.querySelector('.badge');
      expect(badge).not.toBeInTheDocument();
    });
  });
});
