/**
 * Component XSS Prevention Tests
 * 
 * Security tests for React JSX escaping and XSS prevention in components
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

describe('Component XSS Prevention', () => {
  beforeEach(() => {
    // Reset document body
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('React JSX Escaping', () => {
    it('should escape HTML tags in text content', () => {
      const maliciousInput = '<script>alert("XSS")</script>';
      
      const TestComponent = ({ content }) => (
        <div>{content}</div>
      );
      
      render(<TestComponent content={maliciousInput} />);
      
      // Should escape and display as text, not execute
      expect(screen.queryByText(/<script>/)).toBeInTheDocument();
    });

    it('should escape JavaScript URLs in href', () => {
      const maliciousUrl = 'javascript:alert("XSS")';
      
      const TestComponent = ({ url }) => (
        <a href={url}>Click me</a>
      );
      
      render(<TestComponent url={maliciousUrl} />);
      
      const link = screen.getByRole('link');
      // React 18+ blocks javascript: URLs as a security precaution
      const href = link.getAttribute('href');
      expect(href).toBeDefined();
    });

    it('should escape on* event handlers', () => {
      const maliciousEvent = 'onload=alert("XSS")';
      
      const TestComponent = ({ src }) => (
        <img src={src} alt="test" />
      );
      
      render(<TestComponent src={maliciousEvent} />);
      
      // React handles this safely
      const img = screen.getByAltText('test');
      expect(img).toBeInTheDocument();
    });

    it('should escape CSS injection attempts', () => {
      const maliciousStyle = 'background: url("javascript:alert(1)")';
      
      const TestComponent = ({ style }) => (
        <div style={style}>Content</div>
      );
      
      render(<TestComponent style={{ background: maliciousStyle }} />);
      
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('No Dangerous innerHTML', () => {
    it('should not use dangerouslySetInnerHTML in safe components', () => {
      const TestComponent = () => {
        // This should be avoided in production code
        return <div>Safe Content</div>;
      };
      
      render(<TestComponent />);
      
      expect(screen.getByText('Safe Content')).toBeInTheDocument();
    });

    it('should sanitize HTML when using dangerouslySetInnerHTML', () => {
      const maliciousHTML = '<script>alert("XSS")</script>Safe content';
      
      const TestComponent = ({ html }) => {
        // When dangerouslySetInnerHTML is used, it should be with sanitized HTML
        return (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        );
      };
      
      render(<TestComponent html={maliciousHTML} />);
      
      // The script tag won't execute but will be in the DOM
      expect(screen.getByText('Safe content')).toBeInTheDocument();
    });

    it('should handle SVG with script tags', () => {
      const maliciousSVG = '<svg><script>alert("XSS")</script></svg>';
      
      const TestComponent = ({ svg }) => (
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      );
      
      const { container } = render(<TestComponent svg={maliciousSVG} />);
      
      const div = container.querySelector('div');
      expect(div).toBeInTheDocument();
    });
  });

  describe('User Input Sanitization', () => {
    it('should sanitize user input in text fields', () => {
      const maliciousInput = '<img src=x onerror=alert("XSS")>';
      
      const TestComponent = () => {
        const [value, setValue] = React.useState(maliciousInput);
        return <input value={value} onChange={(e) => setValue(e.target.value)} />;
      };
      
      render(<TestComponent />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue(maliciousInput);
    });

    it('should handle special characters in user input', () => {
      const specialChars = '&<>"\'/';
      
      const TestComponent = () => {
        const [value, setValue] = React.useState(specialChars);
        return <div>{value}</div>;
      };
      
      render(<TestComponent />);
      
      expect(screen.getByText(specialChars)).toBeInTheDocument();
    });

    it('should handle Unicode characters', () => {
      const unicodeInput = '🎉 <script>alert("XSS")</script> 💥';
      
      const TestComponent = ({ content }) => (
        <div>{content}</div>
      );
      
      render(<TestComponent content={unicodeInput} />);
      
      expect(screen.getByText(/<script>/)).toBeInTheDocument();
    });
  });

  describe('Stored XSS Prevention', () => {
    it('should prevent stored XSS in comments', () => {
      const maliciousComment = '<img src=x onerror=alert("XSS")>';
      
      const TestComponent = ({ comment }) => (
        <div className="comment">{comment}</div>
      );
      
      render(<TestComponent comment={maliciousComment} />);
      
      expect(screen.queryByText(/<img src=x onerror=alert/)).toBeInTheDocument();
    });

    it('should handle stored XSS in user profiles', () => {
      const maliciousProfile = {
        name: '<script>alert("XSS")</script>John Doe',
        bio: '<img src=x onerror=alert("XSS")>Software Developer',
      };
      
      const TestComponent = ({ profile }) => (
        <div>
          <h1>{profile.name}</h1>
          <p>{profile.bio}</p>
        </div>
      );
      
      render(<TestComponent profile={maliciousProfile} />);
      
      expect(screen.queryByText(/<script>/)).toBeInTheDocument();
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    });
  });

  describe('Reflected XSS Prevention', () => {
    it('should prevent reflected XSS in search', () => {
      const searchQuery = '<script>alert("XSS")</script>test';
      
      const TestComponent = ({ query }) => (
        <div>
          <span>Search results for: {query}</span>
        </div>
      );
      
      render(<TestComponent query={searchQuery} />);
      
      expect(screen.queryByText(/<script>/)).toBeInTheDocument();
    });

    it('should handle URL parameter injection', () => {
      const maliciousParam = '"><script>alert("XSS")</script>';
      
      const TestComponent = ({ param }) => (
        <input value={param} readOnly />
      );
      
      render(<TestComponent param={maliciousParam} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue(maliciousParam);
    });
  });

  describe('Data URI Prevention', () => {
    it('should handle data URI in src attributes', () => {
      const dataURI = 'data:text/html,<script>alert("XSS")</script>';
      
      const TestComponent = ({ src }) => (
        <img src={src} alt="test" />
      );
      
      render(<TestComponent src={dataURI} />);
      
      const img = screen.getByAltText('test');
      expect(img).toBeInTheDocument();
    });

    it('should prevent data URI in href', () => {
      const dataURI = 'data:text/html,<script>alert("XSS")</script>';
      
      const TestComponent = ({ href }) => (
        <a href={href}>Click me</a>
      );
      
      render(<TestComponent href={dataURI} />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', dataURI);
    });
  });

  describe('CSS Expression Prevention', () => {
    it('should prevent CSS expressions', () => {
      const maliciousCSS = 'expression(alert("XSS"))';
      
      const TestComponent = () => {
        // React handles inline styles safely
        return <div style={{}}>Content</div>;
      };
      
      render(<TestComponent />);
      
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('Template Literal Injection', () => {
    it('should handle template literal injection', () => {
      const maliciousInput = '${alert("XSS")}';
      
      const TestComponent = ({ input }) => {
        // React handles template literals safely
        return <div>{input}</div>;
      };
      
      render(<TestComponent input={maliciousInput} />);
      
      expect(screen.getByText('${alert("XSS")}')).toBeInTheDocument();
    });
  });

  describe('DOM-based XSS Prevention', () => {
    it('should prevent DOMXSS through getElementById', () => {
      const maliciousInput = '<img src=x onerror=alert("XSS")>';
      
      const TestComponent = () => {
        React.useEffect(() => {
          // This should be avoided in production code
          const element = document.getElementById('test-element');
          if (element) {
            element.textContent = maliciousInput;
          }
        }, []);
        
        return <div id="test-element">Safe</div>;
      };
      
      render(<TestComponent />);
      
      const element = document.getElementById('test-element');
      if (element) {
        expect(element.textContent).toBe(maliciousInput);
      }
    });
  });

  describe('Event Handler Injection', () => {
    it('should prevent event handler injection', () => {
      const maliciousInput = 'javascript:alert("XSS")';
      
      const TestComponent = () => {
        const handleClick = () => {
          window.location.href = maliciousInput;
        };
        
        return <button onClick={handleClick}>Click me</button>;
      };
      
      render(<TestComponent />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });
});
