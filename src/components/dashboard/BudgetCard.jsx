import React from 'react';
import { Wallet, AlertTriangle, CheckCircle } from 'lucide-react';
import { TrendUp, TrendDown } from '@phosphor-icons/react';
import Card from '../ui/Card';

/**
 * BudgetCard Component
 *
 * Displays budget status with progress bar, alerts, and statistics.
 * Supports two usage modes:
 * 1. Direct props: currentSpending, budget, currency (symbol)
 * 2. Log-based: logs, monthlyBudget, currency (code like 'USD')
 */

// Simple currency symbol resolver - handles both symbols and codes
const resolveCurrency = (currency) => {
  if (!currency) return '$';
  // If already a symbol (1-2 chars, non-alpha), use directly
  if (currency.length <= 2 && !/^[A-Z]+$/i.test(currency)) return currency;
  // Common currency codes
  const symbols = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', KRW: '₩', PHP: '₱' };
  return symbols[currency.toUpperCase()] || currency;
};

const BudgetCard = ({
  // Direct props (test-friendly)
  currentSpending,
  budget,
  // Log-based props (original API)
  logs = [],
  monthlyBudget,
  // Shared
  currency = '$',
  compact = false,
}) => {
  const currencySymbol = resolveCurrency(currency);

  // Resolve spending: use direct prop or calculate from logs
  let spending;
  let budgetAmount;

  if (currentSpending !== undefined) {
    spending = currentSpending;
    budgetAmount = budget !== undefined ? budget : (monthlyBudget || 200);
  } else {
    const currentDate = new Date();
    spending = logs
      .filter(log => {
        const logDate = new Date(log.date);
        return logDate.getMonth() === currentDate.getMonth() &&
               logDate.getFullYear() === currentDate.getFullYear();
      })
      .reduce((sum, log) => sum + (log.price || 0), 0);
    budgetAmount = monthlyBudget || 200;
  }

  // Calculate percentage (handle zero budget)
  const percentage = budgetAmount > 0
    ? Math.round((spending / budgetAmount) * 100)
    : 0;

  const remainingBudget = Math.max(0, budgetAmount - spending);
  const budgetUsedPercentage = budgetAmount > 0
    ? Math.min(100, (spending / budgetAmount) * 100)
    : 0;

  // Status determination
  const isOverBudget = spending > budgetAmount;
  const isAtBudget = spending === budgetAmount;
  const isNearLimit = percentage >= 90 && !isOverBudget && !isAtBudget;

  // Determine color based on usage
  const getProgressColor = () => {
    if (isOverBudget) return 'var(--accent-alert)';
    if (isNearLimit || isAtBudget) return '#f59e0b';
    if (percentage >= 75) return '#8b5cf6';
    return 'var(--accent-success)';
  };

  const getBudgetStatus = () => {
    if (isOverBudget) return 'Over Budget';
    if (isAtBudget) return 'At Budget';
    if (isNearLimit) return 'Near Limit';
    if (percentage >= 75) return 'High Usage';
    return 'On Track';
  };

  if (compact) {
    return (
      <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Monthly Budget
            </p>
          </div>
          <span className="text-xs font-medium" style={{ color: getProgressColor() }}>
            {getBudgetStatus()}
          </span>
        </div>
        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {currencySymbol}{spending} <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>/ {currencySymbol}{budgetAmount}</span>
        </p>
        <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <div
            role="progressbar"
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(100, budgetUsedPercentage)}%`,
              backgroundColor: getProgressColor(),
            }}
          />
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {percentage}% used · {currencySymbol}{remainingBudget} remaining
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            Budget Status
          </p>
        </div>
        {(isOverBudget || isNearLimit) && (
          <AlertTriangle className="w-5 h-5" style={{ color: isOverBudget ? 'var(--accent-alert)' : '#f59e0b' }} />
        )}
      </div>

      {/* Main Budget Display - single element with currency symbol */}
      <div className="mb-3">
        <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {currencySymbol}{spending} <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>/ {budgetAmount}</span>
        </p>

        {/* Progress Bar */}
        <div className="mt-2 h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <div
            role="progressbar"
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.min(100, budgetUsedPercentage)}%`,
              backgroundColor: getProgressColor(),
            }}
          />
        </div>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
          {percentage}% of budget used
        </p>
      </div>

      {/* Budget Warning Messages - single warning text only */}
      {isOverBudget && (
        <div className="p-3 rounded-lg flex items-start gap-2" style={{
          backgroundColor: 'color-mix(in srgb, var(--accent-alert) 10%, transparent)',
          border: '1px solid var(--accent-alert)',
        }}>
          <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent-alert)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--accent-alert)' }}>
            Over budget by {currencySymbol}{(spending - budgetAmount).toFixed(0)}
          </p>
        </div>
      )}

      {isAtBudget && (
        <div className="p-3 rounded-lg flex items-start gap-2" style={{
          backgroundColor: 'color-mix(in srgb, #f59e0b 10%, transparent)',
          border: '1px solid #f59e0b',
        }}>
          <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: '#f59e0b' }} />
          <p className="text-sm font-semibold" style={{ color: '#f59e0b' }}>
            At budget limit
          </p>
        </div>
      )}
    </div>
  );
};

export default BudgetCard;
