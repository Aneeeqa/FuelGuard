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
        <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Filter className="w-10 h-10 text-[#9CA3AF]" />
        </div>
        <h1 className="text-xl font-bold text-[#F3F4F6] mb-2">No Entries Yet</h1>
        <p className="text-[#D1D5DB] mb-6">Start tracking your fuel consumption.</p>
        <a
          href="/add"
          className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-colors min-h-[48px]"
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
        <h1 className="text-2xl lg:text-3xl font-bold text-[#F3F4F6]">History</h1>
        <span className="text-sm text-[#9CA3AF]">{logs.length} entries</span>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors min-h-[44px] ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          All ({logs.length})
        </button>
        <button
          onClick={() => setFilter('flagged')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors min-h-[44px] flex items-center gap-2 ${
            filter === 'flagged'
              ? 'bg-danger-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Flagged ({logs.filter((l) => l.isFlagged).length})
        </button>
      </div>

      {/* Entries List - Grid on desktop */}
      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-[#9CA3AF]">
            No flagged entries found.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`bg-[#1E293B] rounded-xl shadow-sm border overflow-hidden ${
                log.isFlagged ? 'border-danger-500/50 border-l-4 border-l-danger-500' : 'border-gray-700'
              }`}
            >
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-[#F3F4F6]">
                        {log.liters}L
                      </span>
                      {log.isFlagged && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-danger-600/20 text-danger-400 text-xs font-semibold rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          Theft Alert
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#D1D5DB]">
                      Odometer: {log.odometer.toLocaleString()} km
                    </p>
                    <p className="text-sm text-[#9CA3AF]">
                      {new Date(log.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    {log.price && (
                      <p className="text-sm text-[#9CA3AF]">
                        Cost: ₹{log.price.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-xl font-bold ${
                        log.isFlagged ? 'text-danger-500' : 'text-[#60A5FA]'
                      }`}
                    >
                      {log.mileage.toFixed(1)}
                    </p>
                    <p className="text-xs text-[#9CA3AF]">km/L</p>
                  </div>
                </div>

                {/* Delete Confirmation */}
                {confirmDelete === log.id ? (
                  <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between">
                    <span className="text-sm text-[#D1D5DB]">Delete this entry?</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-3 py-1.5 text-sm text-[#9CA3AF] hover:text-[#F3F4F6] min-h-[36px]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="px-3 py-1.5 bg-danger-600 text-white text-sm rounded-lg hover:bg-danger-700 min-h-[36px]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(log.id)}
                    className="mt-3 pt-3 border-t border-gray-700 w-full flex items-center justify-center gap-2 text-[#9CA3AF] hover:text-danger-500 transition-colors min-h-[44px]"
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

