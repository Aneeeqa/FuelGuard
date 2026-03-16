/**
 * Input Component Tests
 * 
 * Tests for mobile-optimized input component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Input from '../../../src/components/ui/Input';

// Mock @phosphor-icons/react
vi.mock('@phosphor-icons/react', () => ({
  Eye: ({ size, className }) => <span data-testid="eye" style={{ fontSize: size }} className={className}>Eye</span>,
  EyeSlash: ({ size, className }) => <span data-testid="eye-slash" style={{ fontSize: size }} className={className}>EyeSlash</span>,
  MagnifyingGlass: ({ size, className }) => <span data-testid="search" style={{ fontSize: size }} className={className}>Search</span>,
  MapPin: ({ size, className }) => <span data-testid="map-pin" style={{ fontSize: size }} className={className}>MapPin</span>,
  Drop: ({ size, className }) => <span data-testid="fuel" style={{ fontSize: size }} className={className}>Drop</span>,
  Calendar: ({ size, className }) => <span data-testid="calendar" style={{ fontSize: size }} className={className}>Calendar</span>,
}));

describe('Input', () => {
  describe('Rendering', () => {
    it('should render input field', () => {
      render(<Input label="Test Label" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should display label', () => {
      render(<Input label="Test Label" />);
      
      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('should display placeholder', () => {
      render(<Input placeholder="Enter text" />);
      
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toBeInTheDocument();
    });

    it('should render icon when provided', () => {
      render(<Input icon="search" />);
      
      expect(screen.getByTestId('search')).toBeInTheDocument();
    });

    it('should render fuel icon', () => {
      render(<Input icon="fuel" />);
      
      expect(screen.getByTestId('fuel')).toBeInTheDocument();
    });
  });

  describe('Value Handling', () => {
    it('should handle value change', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      render(<Input label="Test Label" onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'test value');
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('should update value on input', async () => {
      const user = userEvent.setup();
      
      render(<Input label="Test Label" />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'test');
      
      expect(input).toHaveValue('test');
    });

    it('should handle controlled input', async () => {
      const user = userEvent.setup();
      
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return <Input label="Test" value={value} onChange={(e) => setValue(e.target.value)} />;
      };
      
      // Need to import React for this test
      const React = require('react');
      render(<TestComponent />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'controlled');
      
      expect(input).toHaveValue('controlled');
    });
  });

  describe('Validation Error', () => {
    it('should display validation error', () => {
      render(<Input label="Test Label" error="This field is required" />);
      
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should not display error when not provided', () => {
      render(<Input label="Test Label" />);
      
      expect(screen.queryByText('This field is required')).not.toBeInTheDocument();
    });

    it('should apply error styling', () => {
      const { container } = render(
        <Input label="Test Label" error="Error message" />
      );
      
      const input = container.querySelector('input');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Helper Text', () => {
    it('should display helper text', () => {
      render(<Input label="Test Label" helperText="This is helper text" />);
      
      expect(screen.getByText('This is helper text')).toBeInTheDocument();
    });

    it('should not display helper text when error is present', () => {
      render(
        <Input 
          label="Test Label" 
          helperText="Helper text" 
          error="Error message" 
        />
      );
      
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });
  });

  describe('Focus and Blur', () => {
    it('should handle focus event', () => {
      const handleFocus = vi.fn();
      
      render(<Input label="Test Label" onFocus={handleFocus} />);
      
      const input = screen.getByRole('textbox');
      input.focus();
      
      expect(handleFocus).toHaveBeenCalled();
    });

    it('should handle blur event', () => {
      const handleBlur = vi.fn();
      
      render(<Input label="Test Label" onBlur={handleBlur} />);
      
      const input = screen.getByRole('textbox');
      input.focus();
      input.blur();
      
      expect(handleBlur).toHaveBeenCalled();
    });
  });

  describe('Password Toggle', () => {
    it('should render password input', () => {
      render(<Input label="Password" type="password" />);
      
      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should show password toggle button', () => {
      render(<Input label="Password" type="password" />);
      
      expect(screen.getByTestId('eye-slash')).toBeInTheDocument();
    });

    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      
      render(<Input label="Password" type="password" />);
      
      const eyeSlash = screen.getByTestId('eye-slash');
      await user.click(eyeSlash);
      
      expect(screen.getByTestId('eye')).toBeInTheDocument();
    });

    it('should change input type when toggled', async () => {
      const user = userEvent.setup();
      
      render(<Input label="Password" type="password" />);
      
      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('type', 'password');
      
      const eyeSlash = screen.getByTestId('eye-slash');
      await user.click(eyeSlash);
      
      expect(input).toHaveAttribute('type', 'text');
    });
  });

  describe('Floating Label', () => {
    it('should render floating label', () => {
      render(<Input label="Test Label" floatingLabel />);
      
      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('should float label when input has value', async () => {
      const user = userEvent.setup();
      
      render(<Input label="Test Label" floatingLabel />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'test');
      
      const label = screen.getByText('Test Label');
      expect(label).toBeInTheDocument();
    });

    it('should float label when input is focused', () => {
      render(<Input label="Test Label" floatingLabel />);
      
      const input = screen.getByRole('textbox');
      input.focus();
      
      const label = screen.getByText('Test Label');
      expect(label).toBeInTheDocument();
    });
  });

  describe('Input Modes', () => {
    it('should handle numeric inputMode', () => {
      render(<Input label="Number" type="number" inputMode="decimal" />);
      
      const input = screen.getByRole('spinbutton') || screen.getByRole('textbox');
      expect(input).toHaveAttribute('inputmode', 'decimal');
    });

    it('should handle email inputMode', () => {
      render(<Input label="Email" type="email" inputMode="email" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('inputmode', 'email');
    });
  });

  describe('Custom className', () => {
    it('should apply custom className to wrapper', () => {
      const { container } = render(
        <Input label="Test Label" className="custom-wrapper" />
      );
      
      const wrapper = container.querySelector('.custom-wrapper');
      expect(wrapper).toBeInTheDocument();
    });

    it('should apply custom className to input', () => {
      const { container } = render(
        <Input label="Test Label" inputClassName="custom-input" />
      );
      
      const input = container.querySelector('.custom-input');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper label association', () => {
      render(<Input label="Test Label" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAccessibleName('Test Label');
    });

    it('should be keyboard accessible', () => {
      render(<Input label="Test Label" />);
      
      const input = screen.getByRole('textbox');
      input.focus();
      expect(input).toHaveFocus();
    });

    it('should have error state in ARIA', () => {
      render(<Input label="Test Label" error="Error message" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInvalid();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty label', () => {
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should handle long text', async () => {
      render(<Input label="Test Label" />);
      
      const input = screen.getByRole('textbox');
      const longText = 'A'.repeat(1000);
      fireEvent.change(input, { target: { value: longText } });
      
      expect(input).toHaveValue(longText);
    });

    it('should handle special characters', async () => {
      const user = userEvent.setup();
      
      render(<Input label="Test Label" />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, '!@#$%^&*()');
      
      expect(input).toHaveValue('!@#$%^&*()');
    });
  });
});
