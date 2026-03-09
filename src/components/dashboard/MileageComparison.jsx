import { useState, useEffect } from 'react';
import { TrendUp, TrendDown, Minus, Users, Trophy, Spinner } from '@phosphor-icons/react';
import { fetchCommunityMpg, convertCommunityToKmL } from '../../services/communityMpgService';

const MileageComparison = ({
    userAverage,
    epaRating,
    vehicleId,
    vehicleName,
    className = ''
}) => {
    const [communityData, setCommunityData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch community data when vehicleId changes
    useEffect(() => {
        if (vehicleId) {
            loadCommunityData();
        } else {
            setCommunityData(null);
     }
  }, [vehicleId]);

  const loadCommunityData = async () => {
      setLoading(true);
      try {
          const data = await fetchCommunityMpg(vehicleId);
          if (data) {
              setCommunityData(convertCommunityToKmL(data));
          }
      } catch (error) {
          console.error('Failed to load community data:', error);
      }
      setLoading(false);
  };

  if (!userAverage && !epaRating) {
        return null;
    }

    // Calculate comparison status
    const getComparisonStatus = () => {
        if (!epaRating || !userAverage) return 'unknown';

        const ratio = userAverage / epaRating;

        if (ratio >= 1) return 'excellent';
        if (ratio >= 0.85) return 'normal';
        if (ratio >= 0.70) return 'below';
        return 'alert';
    };

    const status = getComparisonStatus();

    const getStatusConfig = () => {
        switch (status) {
            case 'excellent':
                return {
                    color: 'var(--accent-success)',
                    icon: TrendUp,
                    label: 'Excellent',
                    description: 'Your mileage exceeds EPA rating!'
                };
            case 'normal':
                return {
                    color: 'var(--accent-fuel)',
                    icon: Minus,
                    label: 'Normal',
                    description: 'Your mileage is within expected range'
                };
            case 'below':
                return {
                    color: 'var(--accent-fuel)',
                    icon: TrendDown,
                    label: 'Below Average',
                    description: 'Slightly below EPA rating'
                };
            case 'alert':
                return {
                    color: 'var(--accent-alert)',
                    icon: TrendDown,
                    label: 'Low Efficiency',
                    description: 'Significantly below EPA rating - check for issues'
                };
            default:
                return {
                    color: 'var(--text-muted)',
                    icon: Minus,
                    label: 'Unknown',
                    description: 'Not enough data to compare'
                };
        }
    };

    const statusConfig = getStatusConfig();
    const StatusIcon = statusConfig.icon;

    const percentDiff = epaRating && userAverage
        ? Math.round(((userAverage - epaRating) / epaRating) * 100)
        : null;

    return (
        <div
            className={`rounded-xl border p-4 transition-colors ${className}`}
            style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Mileage Comparison
                </h3>
                <div
                    className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                        backgroundColor: `color-mix(in srgb, ${statusConfig.color} 20%, transparent)`,
                        color: statusConfig.color
                    }}
                >
                    <StatusIcon size={12} weight="duotone" />
                    {statusConfig.label}
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span style={{ color: 'var(--text-secondary)' }}>Your Average</span>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {userAverage ? `${userAverage.toFixed(1)} km/L` : '—'}
                        </span>
                    </div>
                    <div
                        className="h-3 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'var(--bg-input)' }}
                    >
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: userAverage && epaRating
                                    ? `${Math.min((userAverage / (epaRating * 1.2)) * 100, 100)}%`
                                    : '0%',
                                backgroundColor: statusConfig.color
                            }}
                        />
                    </div>
                </div>

                {/* EPA Rating */}
                {epaRating && (
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                                <Trophy size={12} weight="duotone" />
                                EPA Combined
                            </span>
                            <span className="font-semibold" style={{ color: 'var(--accent-blue)' }}>
                                {epaRating.toFixed(1)} km/L
                            </span>
                        </div>
                        <div
                            className="h-3 rounded-full overflow-hidden"
                            style={{ backgroundColor: 'var(--bg-input)' }}
                        >
                            <div
                                className="h-full rounded-full"
                                style={{
                                    width: `${Math.min((epaRating / (epaRating * 1.2)) * 100, 100)}%`,
                                    backgroundColor: 'var(--accent-blue)'
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Community Average */}
                {loading ? (
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                        <Spinner size={16} className="animate-spin" />
                        Loading community data...
                    </div>
                ) : communityData ? (
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                                <Users size={12} weight="duotone" />
                                Community Avg ({communityData.count} users)
                            </span>
                            <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>
                                {communityData.avgKmL?.toFixed(1)} km/L
                            </span>
                        </div>
                        <div
                            className="h-3 rounded-full overflow-hidden"
                            style={{ backgroundColor: 'var(--bg-input)' }}
                        >
                            <div
                                className="h-full rounded-full"
                                style={{
                                    width: epaRating
                                        ? `${Math.min((communityData.avgKmL / (epaRating * 1.2)) * 100, 100)}%`
                                        : '50%',
                                    backgroundColor: 'var(--text-muted)'
                                }}
                            />
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Summary */}
            {percentDiff !== null && (
                <div
                    className="mt-4 pt-4 border-t text-sm"
                    style={{ borderColor: 'var(--border-color)' }}
                >
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {percentDiff >= 0 ? (
                            <>
                                You're achieving <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>+{percentDiff}%</span> better than EPA rating
                            </>
                        ) : (
                            <>
                                You're <span style={{ color: statusConfig.color, fontWeight: 600 }}>{percentDiff}%</span> below EPA rating
                            </>
                        )}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {statusConfig.description}
                    </p>
                </div>
            )}

            {/* No EPA data message */}
            {!epaRating && userAverage && (
                <div
                    className="mt-4 pt-4 border-t text-sm"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                >
                    <p>Select a vehicle from the database in Settings to see EPA comparison.</p>
                </div>
            )}
        </div>
    );
};

export default MileageComparison;
