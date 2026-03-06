import { useState } from 'react';
import { useFuelData } from '../hooks/useFuelData';
import { Trash2, AlertTriangle, Filter } from 'lucide-react';
import Skeleton from '../components/ui/Skeleton';

const History = () => {
  const { data, loading, deleteLog } = useFuelData();
  const [filter, setFilter] = useState('all'); // 'all' | 'flagged'
  const [confirmDelete, setConfirmDelete] = useState(null);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-full" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  const { logs } = data;
  const filteredLogs = filter === 'flagged'
    ? logs.filter((log) => log.isFlagged)
    : logs;

  const handleDelete = (logId) => {
    deleteLog(logId);
    setConfirmDelete(null);
  };

  // Empty state
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <Filter className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
        </div>
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No Entries Yet</h1>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Start tracking your fuel consumption.</p>
        <a
          href="/add"
          className="inline-flex items-center justify-center px-6 py-3 text-white font-semibold rounded-xl transition-colors min-h-[48px]"
          style={{ backgroundColor: 'var(--accent-blue)' }}
        >
          Add Entry
        </a>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>History</h1>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{logs.length} entries</span>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors min-h-[44px] ${filter === 'all'
              ? 'text-white'
              : ''
            }`}
          style={{
            backgroundColor: filter === 'all' ? 'var(--accent-blue)' : 'var(--bg-secondary)',
            color: filter === 'all' ? 'white' : 'var(--text-secondary)',
            border: `1px solid ${filter === 'all' ? 'var(--accent-blue)' : 'var(--border-color)'}`
          }}
        >
          All ({logs.length})
        </button>
        <button
          onClick={() => setFilter('flagged')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors min-h-[44px] flex items-center gap-2`}
          style={{
            backgroundColor: filter === 'flagged' ? 'var(--accent-alert)' : 'var(--bg-secondary)',
            color: filter === 'flagged' ? 'white' : 'var(--text-secondary)',
            border: `1px solid ${filter === 'flagged' ? 'var(--accent-alert)' : 'var(--border-color)'}`
          }}
        >
          <AlertTriangle className="w-4 h-4" />
          Flagged ({logs.filter((l) => l.isFlagged).length})
        </button>
      </div>

      {/* Entries List - Grid on desktop */}
      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
            No flagged entries found.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`rounded-xl shadow-sm overflow-hidden ${log.isFlagged ? 'border-l-4' : ''
                }`}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: `1px solid ${log.isFlagged ? 'var(--accent-alert)' : 'var(--border-color)'}`,
                borderLeftColor: log.isFlagged ? 'var(--accent-alert)' : undefined,
                borderLeftWidth: log.isFlagged ? '4px' : undefined,
              }}
            >
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {log.liters}L
                      </span>
                      {log.isFlagged && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full"
                          style={{
                            backgroundColor: 'color-mix(in srgb, var(--accent-alert) 20%, transparent)',
                            color: 'var(--accent-alert)'
                          }}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          Theft Alert
                        </span>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Odometer: {log.odometer.toLocaleString()} km
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {new Date(log.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    {log.price && (
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Cost: ₹{log.price.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p
                      className="text-xl font-bold"
                      style={{ color: log.isFlagged ? 'var(--accent-alert)' : 'var(--accent-blue)' }}
                    >
                      {log.mileage.toFixed(1)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>km/L</p>
                  </div>
                </div>

                {/* Delete Confirmation */}
                {confirmDelete === log.id ? (
                  <div
                    className="mt-3 pt-3 flex items-center justify-between"
                    style={{ borderTop: '1px solid var(--border-color)' }}
                  >
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Delete this entry?</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-3 py-1.5 text-sm min-h-[36px] transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="px-3 py-1.5 text-white text-sm rounded-lg min-h-[36px]"
                        style={{ backgroundColor: 'var(--accent-alert)' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(log.id)}
                    className="mt-3 pt-3 w-full flex items-center justify-center gap-2 transition-colors min-h-[44px]"
                    style={{
                      borderTop: '1px solid var(--border-color)',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">Delete</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default History;
