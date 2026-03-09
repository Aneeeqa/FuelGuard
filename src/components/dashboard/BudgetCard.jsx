import React from 'react';
import { Wallet, AlertTriangle, CheckCircle } from 'lucide-react';
import { TrendUp, TrendDown } from '@phosphor-icons/react';
import Card from '../ui/Card';
import { checkBudgetAlert } from '../../utils/calculations';
import { getCurrencySymbol } from '../../utils/currency';

/**
 * BudgetCard Component
 *
 * Displays budget status with progress bar, alerts, and statistics.
 * Shows current expenditure vs budget for the current month.
 *
 * @param {Object} props
 * @param {Array} props.logs - Array of fuel log entries
 * @param {number} props.monthlyBudget - Monthly budget amount in currency
 * @param {string} props.currency - Currency code (e.g., 'USD', 'EUR')
 * @param {boolean} props.compact - Whether to show compact version (default: false)
 *
 * Time Complexity: O(n) where n is the number of logs (filtered by month)
 * Space Complexity: O(1) - constant space for calculations
 */

const BudgetCard = ({ logs = [], monthlyBudget = 200, currency = 'USD', compact = false }) => {
  const currencySymbol = getCurrencySymbol(currency);

  // Calculate current month's expenditure
  const currentDate = new Date();
  const currentMonthExpenditure = logs
    .filter(log => {
      const logDate = new Date(log.date);
      return logDate.getMonth() === currentDate.getMonth() &&
             logDate.getFullYear() === currentDate.getFullYear();
    })
    .reduce((sum, log) => sum + (log.price || 0), 0);

  // Calculate remaining budget
  const remainingBudget = Math.max(0, monthlyBudget - currentMonthExpenditure);
  const budgetUsedPercentage = Math.min(100, (currentMonthExpenditure / monthlyBudget) * 100);

  // Check budget alert
  const budgetAlert = checkBudgetAlert(currentMonthExpenditure, monthlyBudget);

  // Determine color based on usage
  const getProgressColor = () => {
    if (budgetAlert.level === 'critical') return 'var(--accent-alert)';
    if (budgetAlert.level === 'warning') return '#f59e0b'; // amber-500
    if (budgetUsedPercentage >= 75) return '#8b5cf6'; // violet-500
    return 'var(--accent-success)';
  };

  const getBudgetStatus = () => {
    if (budgetAlert.level === 'critical') return 'Exceeded';
    if (budgetAlert.level === 'warning') return 'Near Limit';
    if (budgetUsedPercentage >= 75) return 'High Usage';
    return 'On Track';
  };

  // Calculate trend (compare with previous month)
  const previousMonthExpenditure = logs
    .filter(log => {
      const logDate = new Date(log.date);
      const prevMonth = new Date(currentDate);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      return logDate.getMonth() === prevMonth.getMonth() &&
             logDate.getFullYear() === prevMonth.getFullYear();
    })
    .reduce((sum, log) => sum + (log.price || 0), 0);

  const hasPreviousMonthData = previousMonthExpenditure > 0;
  const trend = hasPreviousMonthData
    ? ((currentMonthExpenditure - previousMonthExpenditure) / previousMonthExpenditure) * 100
    : null;

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
          {currencySymbol}{currentMonthExpenditure.toFixed(0)} <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>/ {currencySymbol}{monthlyBudget}</span>
        </p>
        {/* Progress Bar */}
        <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${budgetUsedPercentage}%`,
              backgroundColor: getProgressColor(),
            }}
          />
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {budgetUsedPercentage.toFixed(0)}% used · {currencySymbol}{remainingBudget.toFixed(0)} remaining
        </p>
      </div>
    );
  }

  return (
    <Card variant="elevated" interactive>
      <Card.Header>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'color-mix(in srgb, var(--accent-blue) 15%, transparent)' }}
            >
              <Wallet className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
            </div>
            <div>
              <Card.Title>Budget Status</Card.Title>
              <Card.Subtitle>Monthly fuel spending</Card.Subtitle>
            </div>
          </div>
          {budgetAlert.triggered && (
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: budgetAlert.level === 'critical'
                  ? 'color-mix(in srgb, var(--accent-alert) 15%, transparent)'
                  : 'color-mix(in srgb, #f59e0b 15%, transparent)',
              }}
            >
              <AlertTriangle
                className="w-5 h-5"
                style={{
                  color: budgetAlert.level === 'critical' ? 'var(--accent-alert)' : '#f59e0b'
                }}
              />
            </div>
          )}
        </div>
      </Card.Header>

      <div className="space-y-4 pt-2">
        {/* Main Budget Display */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {currencySymbol}{currentMonthExpenditure.toFixed(0)}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Budget: {currencySymbol}{monthlyBudget}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(100, budgetUsedPercentage)}%`,
                backgroundColor: getProgressColor(),
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-sm">
            <span style={{ color: 'var(--text-muted)' }}>
              {budgetUsedPercentage.toFixed(0)}% of budget used
            </span>
            <span className="font-medium" style={{ color: getProgressColor() }}>
              {getBudgetStatus()}
            </span>
          </div>
        </div>

        {/* Budget Alert Message */}
        {budgetAlert.triggered && (
          <div
            className="p-3 rounded-lg flex items-start gap-2 animate-fade-in"
            style={{
              backgroundColor: budgetAlert.level === 'critical'
                ? 'color-mix(in srgb, var(--accent-alert) 10%, transparent)'
                : 'color-mix(in srgb, #f59e0b 10%, transparent)',
              border: `1px solid ${budgetAlert.level === 'critical' ? 'var(--accent-alert)' : '#f59e0b'}30`,
            }}
          >
            <AlertTriangle
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              style={{
                color: budgetAlert.level === 'critical' ? 'var(--accent-alert)' : '#f59e0b'
              }}
            />
            <div>
              <p
                className="font-semibold text-sm"
                style={{
                  color: budgetAlert.level === 'critical' ? 'var(--accent-alert)' : '#f59e0b'
                }}
              >
                {budgetAlert.level === 'critical' ? 'Budget Exceeded!' : 'Budget Warning'}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {budgetAlert.message}
              </p>
            </div>
          </div>
        )}

        {/* Remaining Budget & Trend */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4" style={{ color: 'var(--accent-success)' }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Remaining
              </p>
            </div>
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {currencySymbol}{remainingBudget.toFixed(0)}
            </p>
          </div>

          {hasPreviousMonthData && (
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                {trend !== null && trend > 0 ? (
                  <TrendUp className="w-4 h-4" style={{ color: 'var(--accent-alert)' }} />
                ) : (
                  <TrendDown className="w-4 h-4" style={{ color: 'var(--accent-success)' }} />
                )}
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  vs Last Month
                </p>
              </div>
              <p
                className="text-lg font-bold"
                style={{
                  color: trend !== null && trend > 0 ? 'var(--accent-alert)' : 'var(--accent-success)'
                }}
              >
                {trend !== null ? (trend > 0 ? '+' : '') + trend.toFixed(1) + '%' : 'N/A'}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default BudgetCard;
