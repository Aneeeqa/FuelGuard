import { useState, useEffect, useContext } from 'react';
import { Bell, List, Phone, X, SignOut } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import EmergencyContact from '../EmergencyContact';
import { FuelContext } from '../../context/FuelContext';
import { useAuth } from '../../context/AuthContext';
import { signOut, auth } from '../../services/firebase';
import { analyzeFuelDrain, generateDrainAlertMessage } from '../../utils/fuelDrainCalculator';
import { getFuelStatus } from '../../utils/fuelLevelAlerts';
import { checkBudgetAlert } from '../../utils/calculations';
import { getCurrencySymbol } from '../../utils/currency';

const TopNavigationBar = () => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const navigate = useNavigate();
  const { data } = useContext(FuelContext);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) {
    return null;
  }

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!data || !data.logs) {
      setNotifications([]);
      return;
    }

    const { logs, vehicleProfile, stats } = data;
    const newNotifications = [];

    // Theft alert
    const flaggedCount = logs.filter((log) => log.isFlagged).length;
    if (flaggedCount > 0) {
      newNotifications.push({
        id: 'theft-alert',
        title: `${flaggedCount} Potential Theft${flaggedCount > 1 ? 's' : ''} Detected`,
        message: 'Unusual mileage drops found. Check your history for details.',
        severity: 'danger'
      });
    }

    // Fuel drain alert
    const drainAnalysis = analyzeFuelDrain(
      logs || [],
      vehicleProfile?.tankCapacity || 50,
      vehicleProfile?.expectedMileage || stats?.avgMileage || 15
    );
    if (drainAnalysis.hasAlert) {
      newNotifications.push({
        id: 'fuel-drain-alert',
        title: 'Abnormal Fuel Drain Detected',
        message: generateDrainAlertMessage(drainAnalysis.latestDrain),
        severity: 'warning'
      });
    }

    // Fuel level alert
    const lastFuelLog = logs.length > 0 ? logs[0] : null;
    const currentFuelAmount = lastFuelLog ? lastFuelLog.liters : 0;
    const fuelLevelAnalysis = getFuelStatus(
      currentFuelAmount,
      vehicleProfile?.tankCapacity || 50,
      stats?.avgMileage || 15
    );
    if (fuelLevelAnalysis.fuelAlert.triggered) {
      newNotifications.push({
        id: 'fuel-level-alert',
        title: fuelLevelAnalysis.fuelAlert.severity === 'critical' ? 'Critical Fuel Level!' : 'Low Fuel Warning',
        message: fuelLevelAnalysis.fuelAlert.message,
        severity: fuelLevelAnalysis.fuelAlert.severity === 'critical' ? 'danger' : 'warning'
      });
    }

    // Budget alert
    const currency = vehicleProfile?.currency || 'USD';
    const currencySymbol = getCurrencySymbol(currency);
    const monthlyBudget = vehicleProfile?.monthlyBudget || 200;
    const currentDate = new Date();
    const currentMonthExpenditure = logs
      .filter(log => {
        const logDate = new Date(log.date);
        return logDate.getMonth() === currentDate.getMonth() &&
               logDate.getFullYear() === currentDate.getFullYear();
      })
      .reduce((sum, log) => sum + (log.price || 0), 0);
    const monthlyBudgetAlert = checkBudgetAlert(currentMonthExpenditure, monthlyBudget);
    if (monthlyBudgetAlert.triggered) {
      newNotifications.push({
        id: 'budget-alert',
        title: monthlyBudgetAlert.level === 'critical' ? 'Budget Exceeded!' : 'Budget Warning',
        message: monthlyBudgetAlert.message,
        severity: monthlyBudgetAlert.level === 'critical' ? 'danger' : 'warning'
      });
    }

    setNotifications(newNotifications);
  }, [data]);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  const handleMenuClick = () => {
    navigate('/settings');
  };

  const handleRemoveNotification = (id, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 w-full h-16 md:h-20"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="FuelGuard Logo"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h1
              className="text-xl md:text-2xl font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              FuelGuard
            </h1>
            <p
              className="text-sm hidden md:block"
              style={{ color: 'var(--text-muted)' }}
            >
              Track • Detect • Protect
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => setShowEmergency(true)}
            className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg transition-transform hover:scale-105 active:scale-95 focus:outline-none"
            style={{
              border: 'none',
              backgroundColor: 'transparent',
            }}
            aria-label="Emergency Contact"
          >
            <Phone
              size={20}
              weight="duotone"
              style={{ color: 'var(--accent-alert)' }}
            />
          </button>

          <div className="h-8 w-px bg-gray-700 mx-1" />

          <div className="relative">
            <button
              onClick={handleNotificationClick}
              className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg transition-transform hover:scale-105 active:scale-95 focus:outline-none"
              style={{ border: 'none', backgroundColor: 'transparent' }}
              aria-label="Notifications"
            >
              <Bell
                size={20}
                weight="regular"
                style={{ color: 'var(--text-primary)' }}
              />
            </button>

            {notifications.length > 0 && (
              <div
                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2"
                style={{ borderColor: 'var(--bg-secondary)' }}
              >
                {notifications.length > 99 ? '99+' : notifications.length}
              </div>
            )}

            {showNotifications && (
              <div
                className="absolute right-0 top-14 w-80 max-w-[calc(100vw-2rem)] rounded-xl shadow-2xl z-50"
                onClick={(e) => e.stopPropagation()}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 20px 25px rgba(0, 0, 0, 0.2)',
                }}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                      Notifications
                    </h3>
                    <button
                      onClick={handleClearAll}
                      className="text-xs px-3 py-1 rounded-lg transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      Clear All
                    </button>
                  </div>

                  {notifications.length === 0 ? (
                    <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                      No notifications
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="relative p-3 rounded-lg transition-all hover:opacity-80"
                          style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            borderLeft: notification.severity === 'danger'
                              ? '3px solid var(--accent-alert)'
                              : '3px solid #f59e0b'
                          }}
                        >
                          <button
                            onClick={(e) => handleRemoveNotification(notification.id, e)}
                            className="absolute top-2 right-2 p-1 rounded-md transition-colors"
                            style={{
                              backgroundColor: 'transparent',
                              color: 'var(--text-muted)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--accent-alert)';
                              e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = 'var(--text-muted)';
                            }}
                          >
                            <X size={16} />
                          </button>
                          <p className="font-medium text-sm pr-6" style={{ color: 'var(--text-primary)' }}>
                            {notification.title}
                          </p>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            {notification.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleMenuClick}
            className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg transition-transform hover:scale-105 active:scale-95 focus:outline-none"
            style={{
              border: 'none',
              backgroundColor: 'transparent',
            }}
            aria-label="Settings"
          >
            <List
              size={20}
              weight="regular"
              style={{ color: 'var(--text-primary)' }}
            />
          </button>

          <button
            onClick={handleSignOut}
            className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg transition-transform hover:scale-105 active:scale-95 focus:outline-none"
            style={{
              border: 'none',
              backgroundColor: 'transparent',
            }}
            aria-label="Sign Out"
          >
            <SignOut
              size={20}
              weight="regular"
              style={{ color: 'var(--text-primary)' }}
            />
          </button>
        </div>
      </div>

      {showEmergency && (
        <EmergencyContact onClose={() => setShowEmergency(false)} />
      )}
    </nav>
  );
};

export default TopNavigationBar;
