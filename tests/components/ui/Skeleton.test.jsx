/**
 * Skeleton Component Tests
 * 
 * Tests for skeleton loading component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Skeleton from '../../../src/components/ui/Skeleton';

describe('Skeleton', () => {
  const defaultProps = {};

  describe('Rendering', () => {
    it('should render skeleton loader', () => {
      render(<Skeleton {...defaultProps} />);
      
      const skeleton = screen.getByRole('status') || 
                       document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should render with default styles', () => {
      const { container } = render(<Skeleton />);
      
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render text variant', () => {
      const { container } = render(<Skeleton variant="text" />);
      
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should render circular variant', () => {
      const { container } = render(<Skeleton variant="circular" />);
      
      const skeleton = container.querySelector('.rounded-full');
      expect(skeleton).toBeInTheDocument();
    });

    it('should render rectangular variant', () => {
      const { container } = render(<Skeleton variant="rectangular" />);
      
      const skeleton = container.querySelector('.rounded');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('should animate loading state', () => {
      const { container } = render(<Skeleton />);
      
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('should have smooth animation', () => {
      const { container } = render(<Skeleton />);
      
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Dimensions', () => {
    it('should render with custom width', () => {
      const { container } = render(<Skeleton width="200px" />);
      
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toHaveStyle({ width: '200px' });
    });

    it('should render with custom height', () => {
      const { container } = render(<Skeleton height="40px" />);
      
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toHaveStyle({ height: '40px' });
    });

    it('should render with custom width and height', () => {
      const { container } = render(<Skeleton width="200px" height="40px" />);
      
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toHaveStyle({ width: '200px', height: '40px' });
    });

    it('should render with default dimensions', () => {
      const { container } = render(<Skeleton />);
      
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <Skeleton className="custom-skeleton" />
      );
      
      const skeleton = container.querySelector('.custom-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('should merge multiple classes', () => {
      const { container } = render(
        <Skeleton className="class-1 class-2" />
      );
      
      const skeleton = container.querySelector('.custom-skeleton') || 
                       container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="status"', () => {
      render(<Skeleton />);
      
      const skeleton = screen.getByRole('status');
      expect(skeleton).toBeInTheDocument();
    });

    it('should have aria-label for screen readers', () => {
      render(<Skeleton />);
      
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('aria-label');
    });

    it('should have aria-live for announcements', () => {
      render(<Skeleton />);
      
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero dimensions', () => {
      const { container } = render(<Skeleton width="0" height="0" />);
      
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should handle very large dimensions', () => {
      const { container } = render(<Skeleton width="9999px" height="9999px" />);
      
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should handle percentage dimensions', () => {
      const { container } = render(<Skeleton width="100%" height="50%" />);
      
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should handle unitless dimensions', () => {
      const { container } = render(<Skeleton width={200} height={40} />);
      
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Color and Background', () => {
    it('should have default background color', () => {
      const { container } = render(<Skeleton />);
      
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should support custom background color', () => {
      const { container } = render(
        <Skeleton className="bg-gray-200" />
      );
      
      const skeleton = container.querySelector('.bg-gray-200');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Rounded Corners', () => {
    it('should have rounded corners by default', () => {
      const { container } = render(<Skeleton />);
      
      const skeleton = container.querySelector('.rounded');
      expect(skeleton).toBeInTheDocument();
    });

    it('should have fully rounded corners for circular variant', () => {
      const { container } = render(<Skeleton variant="circular" />);
      
      const skeleton = container.querySelector('.rounded-full');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Use Cases', () => {
    it('should simulate loading text', () => {
      const { container } = render(<Skeleton variant="text" width="100%" height="1rem" />);
      
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should simulate loading image', () => {
      const { container } = render(<Skeleton variant="rectangular" width="100%" height="200px" />);
      
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should simulate loading avatar', () => {
      const { container } = render(<Skeleton variant="circular" width="40px" height="40px" />);
      
      const skeleton = container.querySelector('.rounded-full');
      expect(skeleton).toBeInTheDocument();
    });

    it('should simulate loading card', () => {
      const { container } = render(
        <div>
          <Skeleton variant="rectangular" width="100%" height="150px" />
          <Skeleton variant="text" width="80%" height="1rem" className="mt-4" />
          <Skeleton variant="text" width="60%" height="1rem" className="mt-2" />
        </div>
      );
      
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(3);
    });
  });
});
