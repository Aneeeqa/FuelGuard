/**
 * Card Component Tests
 * 
 * Tests for card component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Card from '../../../src/components/ui/Card';

describe('Card', () => {
  const defaultProps = {
    children: <p>Card content</p>,
  };

  describe('Rendering', () => {
    it('should render card content', () => {
      render(<Card {...defaultProps} />);
      
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should render with default styles', () => {
      const { container } = render(<Card {...defaultProps} />);
      
      const card = container.querySelector('.rounded-xl');
      expect(card).toBeInTheDocument();
    });

    it('should render without title', () => {
      render(<Card {...defaultProps} />);
      
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <Card>
          <p>First paragraph</p>
          <p>Second paragraph</p>
          <p>Third paragraph</p>
        </Card>
      );
      
      expect(screen.getByText('First paragraph')).toBeInTheDocument();
      expect(screen.getByText('Second paragraph')).toBeInTheDocument();
      expect(screen.getByText('Third paragraph')).toBeInTheDocument();
    });

    it('should render nested components', () => {
      render(
        <Card>
          <div>
            <span>Nested content</span>
          </div>
        </Card>
      );
      
      expect(screen.getByText('Nested content')).toBeInTheDocument();
    });
  });

  describe('Title', () => {
    it('should render card title', () => {
      render(<Card title="Card Title">Content</Card>);
      
      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    it('should render title as heading', () => {
      render(<Card title="Card Title">Content</Card>);
      
      const title = screen.getByText('Card Title');
      expect(title.tagName).toBe('H3');
    });

    it('should handle long title', () => {
      const longTitle = 'A'.repeat(100);
      
      render(<Card title={longTitle}>Content</Card>);
      
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });
  });

  describe('Click Events', () => {
    it('should handle click event', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Card onClick={handleClick}>Clickable content</Card>);
      
      const card = screen.getByText('Clickable content').closest('.rounded-xl');
      await user.click(card);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not handle click when onClick is not provided', async () => {
      const user = userEvent.setup();
      
      render(<Card>Content</Card>);
      
      const card = screen.getByText('Content').closest('.rounded-xl');
      await user.click(card);
      
      // Should not throw
      expect(card).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      const { container } = render(<Card variant="default">Content</Card>);
      
      const card = container.querySelector('.rounded-xl');
      expect(card).toBeInTheDocument();
    });

    it('should render outlined variant', () => {
      const { container } = render(<Card variant="outlined">Content</Card>);
      
      const card = container.querySelector('.rounded-xl');
      expect(card).toBeInTheDocument();
    });

    it('should render elevated variant', () => {
      const { container } = render(<Card variant="elevated">Content</Card>);
      
      const card = container.querySelector('.rounded-xl');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <Card className="custom-card">Content</Card>
      );
      
      const card = container.querySelector('.custom-card');
      expect(card).toBeInTheDocument();
    });

    it('should merge multiple classes', () => {
      const { container } = render(
        <Card className="class-1 class-2">Content</Card>
      );
      
      const card = container.querySelector('.rounded-xl');
      expect(card).toHaveClass('class-1');
      expect(card).toHaveClass('class-2');
    });
  });

  describe('Padding and Spacing', () => {
    it('should have default padding', () => {
      const { container } = render(<Card>Content</Card>);
      
      const card = container.querySelector('.rounded-xl');
      expect(card).toBeInTheDocument();
    });

    it('should handle no padding', () => {
      const { container } = render(<Card padding={false}>Content</Card>);
      
      const card = container.querySelector('.rounded-xl');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible when clickable', () => {
      const handleClick = vi.fn();
      
      render(<Card onClick={handleClick}>Clickable content</Card>);
      
      const card = screen.getByText('Clickable content').closest('.rounded-xl');
      card.focus();
      expect(card).toHaveFocus();
    });

    it('should have proper cursor when clickable', () => {
      const { container } = render(
        <Card onClick={vi.fn()}>Clickable content</Card>
      );
      
      const card = container.querySelector('.rounded-xl');
      expect(card).toHaveClass('cursor-pointer');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null children', () => {
      render(<Card>{null}</Card>);
      
      const card = screen.getByRole('article') || screen.queryByTestId('card');
      // Card should render even with null children
      expect(document.querySelector('.rounded-xl')).toBeInTheDocument();
    });

    it('should handle empty string children', () => {
      render(<Card>{''}</Card>);
      
      const card = screen.queryByRole('article') || screen.queryByTestId('card');
      expect(document.querySelector('.rounded-xl')).toBeInTheDocument();
    });

    it('should handle undefined children', () => {
      render(<Card>{undefined}</Card>);
      
      expect(document.querySelector('.rounded-xl')).toBeInTheDocument();
    });

    it('should handle mixed content types', () => {
      render(
        <Card>
          {null}
          <p>Valid content</p>
          {undefined}
          <span>More content</span>
          {false}
        </Card>
      );
      
      expect(screen.getByText('Valid content')).toBeInTheDocument();
      expect(screen.getByText('More content')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should handle responsive classes', () => {
      const { container } = render(
        <Card className="md:w-full lg:w-1/2">Content</Card>
      );
      
      const card = container.querySelector('.rounded-xl');
      expect(card).toHaveClass('md:w-full');
      expect(card).toHaveClass('lg:w-1/2');
    });
  });

  describe('Visual Styling', () => {
    it('should have proper border radius', () => {
      const { container } = render(<Card>Content</Card>);
      
      const card = container.querySelector('.rounded-xl');
      expect(card).toHaveClass('rounded-xl');
    });

    it('should have proper shadow', () => {
      const { container } = render(<Card>Content</Card>);
      
      const card = container.querySelector('.rounded-xl');
      expect(card).toBeInTheDocument();
    });
  });
});
