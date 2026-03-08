import { useState, useEffect } from 'react';
import { ChevronDown, Car, Loader2, Search, X, Globe } from 'lucide-react';
import {
    getVehicleAPIForCountry,
    mpgToKmPerLiter
} from '../services/vehicleApiService';
import { SUPPORTED_COUNTRIES } from '../utils/currency';

/**
 * Multi-step vehicle selector component
 * Supports multiple databases depending on selected country
 */
const VehicleSelector = ({
    value,
    onVehicleSelect,
    className = ''
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Initial Country from profile or default
    const [country, setCountry] = useState(value?.country || 'US');
    const [countryDetails, setCountryDetails] = useState(
        SUPPORTED_COUNTRIES.find(c => c.code === country) || SUPPORTED_COUNTRIES[1]
    );

    // Selection state
    const [year, setYear] = useState(value?.year || null);
    const [make, setMake] = useState(value?.make || null);
    const [model, setModel] = useState(value?.model || null);
    const [variant, setVariant] = useState(value?.variant || null);
    const [vehicleId, setVehicleId] = useState(value?.vehicleId || null);

    // Options for each dropdown
    const [years, setYears] = useState([]);
    const [makes, setMakes] = useState([]);
    const [models, setModels] = useState([]);
    const [variants, setVariants] = useState([]);

    // Selected vehicle details
    const [vehicleDetails, setVehicleDetails] = useState(null);

    // Manual entry mode
    const [manualMode, setManualMode] = useState(false);
    const [manualName, setManualName] = useState(value?.name || '');

    // Get API functions based on selected country
    const api = getVehicleAPIForCountry(country);

    // Determine flow order: Year-first (EPA) or Make-first (Pakistani/Local)
    const yearFirst = api.usesYearFirst;

    // Load initial data on mount or country change
    useEffect(() => {
        resetSelection();
        const countryInfo = SUPPORTED_COUNTRIES.find(c => c.code === country);
        setCountryDetails(countryInfo);

        if (yearFirst) {
            loadYears();
        } else {
            loadMakes();
        }
    }, [country]);

    // Load vehicle details when we have a vehicleId (and other parts if needed)
    useEffect(() => {
        if (value?.country && value.country !== country) {
            setCountry(value.country);
        }
    }, [value]);

    const loadYears = async (selectedMake, selectedModel) => {
        setLoading(true);
        try {
            // For EPA, no args needed. For PK, make+model needed.
            const data = await api.fetchYears(selectedMake, selectedModel);
            setYears(data);
        } catch (err) {
            setError('Failed to load years');
        }
        setLoading(false);
    };

    const loadMakes = async (selectedYear) => {
        setLoading(true);
        try {
            // For EPA, year needed. For PK, no args needed.
            const data = await api.fetchMakes(selectedYear);
            setMakes(data);
        } catch (err) {
            setError('Failed to load makes');
        }
        setLoading(false);
    };

    const loadModels = async (selectedYear, selectedMake) => {
        setLoading(true);
        try {
            const data = await api.fetchModels(yearFirst ? selectedYear : selectedMake, yearFirst ? selectedMake : null);
            setModels(data);
        } catch (err) {
            setError('Failed to load models');
        }
        setLoading(false);
    };

    const loadVariants = async (arg1, arg2, arg3) => {
        setLoading(true);
        try {
            let data;
            if (yearFirst) {
                // EPA: year, make, model
                data = await api.fetchVariants(year, make, arg1); // arg1 is model
            } else {
                // PK: make, model
                data = await api.fetchVariants(make, model);
            }

            setVariants(data);

            // If only one variant, auto-select it
            if (data.length === 1) {
                handleVariantSelect(data[0].value, data[0].text);
            }
        } catch (err) {
            setError('Failed to load variants');
        }
        setLoading(false);
    };

    const loadVehicleDetails = async (id, variantName) => {
        setLoading(true);
        try {
            let details;

            if (yearFirst) {
                // EPA uses ID directly
                details = await api.getVehicleDetails(id);
            } else {
                // PK uses composite lookup
                details = await api.getVehicleDetails(make, model, variantName, year);
            }

            setVehicleDetails(details);

            // Notify parent of full selection
            if (onVehicleSelect && details) {
                onVehicleSelect({
                    vehicleId: details.id,
                    year: details.year,
                    make: details.make,
                    model: details.model,
                    variant: details.variant,

                    // EPA calls usually have cityMpg/hwyMpg. Local files have expectedMileage.
                    // Normalize expectedMileage to EPA combined if missing
                    epaCity: details.cityMpg ? mpgToKmPerLiter(details.cityMpg) : details.expectedMileage,
                    epaHighway: details.highwayMpg ? mpgToKmPerLiter(details.highwayMpg) : details.expectedMileage,
                    epaCombined: details.combinedMpg ? mpgToKmPerLiter(details.combinedMpg) : details.expectedMileage,

                    fuelType: details.fuelType,
                    tankCapacity: details.tankCapacity || 50,
                    name: `${details.year} ${details.make} ${details.model} ${details.variant}`,
                    country: country,
                    currency: countryDetails.currency,
                });
            }
        } catch (err) {
            setError('Failed to load vehicle details');
        }
        setLoading(false);
    };

    // --- Year-First Handlers (EPA / US / UK) ---
    const handleYearSelect = (val) => {
        setYear(val); setMake(null); setModel(null); setVariant(null);
        setVehicleId(null); setVehicleDetails(null);
        loadMakes(val);
    };
    const handleMakeSelectEPA = (val) => {
        setMake(val); setModel(null); setVariant(null);
        setVehicleId(null); setVehicleDetails(null);
        loadModels(year, val);
    };
    const handleModelSelectEPA = (val) => {
        setModel(val); setVariant(null);
        setVehicleId(null); setVehicleDetails(null);
        loadVariants(val);
    };

    // --- Make-First Handlers (PK / IN) ---
    const handleMakeSelectLocal = (val) => {
        setMake(val); setModel(null); setYear(null); setVariant(null);
        setVehicleId(null); setVehicleDetails(null);
        loadModels(null, val);
    };
    const handleModelSelectLocal = (val) => {
        setModel(val); setYear(null); setVariant(null);
        setVehicleId(null); setVehicleDetails(null);
        loadYears(make, val);
    };
    const handleYearSelectLocal = (val) => {
        setYear(val); setVariant(null);
        setVehicleId(null); setVehicleDetails(null);
        loadVariants(make, model);
    };

    // Universal Variant Handler
    const handleVariantSelect = (id, variantText) => {
        setVariant(variantText);
        setVehicleId(id); // For EPA this is ID, for local it's name
        loadVehicleDetails(id, variantText);
    };

    const handleCountryChange = (newCountry) => {
        setCountry(newCountry);
        // Effects will trigger reload
    };

    const handleManualSubmit = () => {
        if (manualName.trim()) {
            onVehicleSelect?.({
                name: manualName.trim(),
                vehicleId: null,
                year: null,
                make: null,
                model: null,
                variant: null,
                epaCity: null,
                epaHighway: null,
                epaCombined: null,
                fuelType: null,
                country: country,
                currency: countryDetails.currency,
            });
        }
    };

    const resetSelection = () => {
        setYear(null);
        setMake(null);
        setModel(null);
        setVariant(null);
        setVehicleId(null);
        setVehicleDetails(null);
        setYears([]); setMakes([]); setModels([]); setVariants([]);
        setError(null);
    };

    const renderDropdown = (label, currentValue, options, onSelect, placeholder) => (
        <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {label}
            </label>
            <div className="relative">
                <select
                    value={currentValue || ''}
                    onChange={(e) => onSelect(e.target.value)}
                    className="w-full px-4 py-3 pr-10 rounded-xl appearance-none min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                    style={{
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                    }}
                    disabled={loading || options.length === 0}
                >
                    <option value="">{loading ? 'Loading...' : placeholder}</option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.text}
                        </option>
                    ))}
                </select>
                <ChevronDown
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
                    style={{ color: 'var(--text-muted)' }}
                />
            </div>
        </div>
    );

    // Manual mode
    if (manualMode) {
        return (
            <div className={`space-y-4 ${className}`}>
                <div className="flex items-center justify-between">
                    <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        Manual Vehicle Entry
                    </h3>
                    <button
                        onClick={() => setManualMode(false)}
                        className="text-sm flex items-center gap-1"
                        style={{ color: 'var(--accent-blue)' }}
                    >
                        <Search className="w-4 h-4" />
                        Search Database
                    </button>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Vehicle Name
                    </label>
                    <input
                        type="text"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        onBlur={handleManualSubmit}
                        placeholder="e.g., 2020 Toyota Camry"
                        className="w-full px-4 py-3 rounded-xl min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                        style={{
                            backgroundColor: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Car className="w-5 h-5" style={{ color: 'var(--accent-fuel)' }} />
                    <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        Select Your Vehicle
                    </h3>
                </div>
                {(year || make || vehicleDetails) && (
                    <button
                        onClick={resetSelection}
                        className="p-1 rounded-full hover:bg-gray-800/50 transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Country Selector */}
            <div className="p-3 rounded-xl border mb-2" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Region Database</span>
                    </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {SUPPORTED_COUNTRIES.map((c) => (
                        <button
                            key={c.code}
                            onClick={() => handleCountryChange(c.code)}
                            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${country === c.code ? 'ring-2 ring-primary' : ''}`}
                            style={{
                                backgroundColor: country === c.code ? 'var(--accent-blue)' : 'var(--bg-input)',
                                color: country === c.code ? 'white' : 'var(--text-secondary)',
                            }}
                        >
                            <span>{c.flag}</span>
                            <span>{c.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div
                    className="px-3 py-2 rounded-lg text-sm"
                    style={{
                        backgroundColor: 'color-mix(in srgb, var(--accent-alert) 20%, transparent)',
                        color: 'var(--accent-alert)'
                    }}
                >
                    {error}
                </div>
            )}

            {/* Loading indicator */}
            {loading && (
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                </div>
            )}

            {/* Dynamic Step Rendering based on Flow */}
            {yearFirst ? (
                // EPA Flow: Year -> Make -> Model -> Variant
                <>
                    {renderDropdown('Year', year, years, handleYearSelect, 'Select Year')}
                    {year && renderDropdown('Make', make, makes, handleMakeSelectEPA, 'Select Make')}
                    {make && renderDropdown('Model', model, models, handleModelSelectEPA, 'Select Model')}
                </>
            ) : (
                // PK Flow: Make -> Model -> Year -> Variant
                <>
                    {renderDropdown('Make', make, makes, handleMakeSelectLocal, 'Select Make')}
                    {make && renderDropdown('Model', model, models, handleModelSelectLocal, 'Select Model')}
                    {model && renderDropdown('Year', year, years, handleYearSelectLocal, 'Select Year')}
                </>
            )}

            {/* Variant (Always Last) */}
            {((yearFirst && model) || (!yearFirst && year)) && variants.length > 0 && (
                renderDropdown('Variant', vehicleId, variants, (id) => {
                    const selected = variants.find(v => v.value === id);
                    handleVariantSelect(id, selected?.text || '');
                }, 'Select Variant')
            )}

            {/* Vehicle Details Preview */}
            {vehicleDetails && (
                <div
                    className="p-4 rounded-xl border animate-in fade-in slide-in-from-top-2"
                    style={{
                        backgroundColor: 'color-mix(in srgb, var(--accent-success) 10%, var(--bg-secondary))',
                        borderColor: 'var(--accent-success)'
                    }}
                >
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {vehicleDetails.year} {vehicleDetails.make} {vehicleDetails.model}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {vehicleDetails.variant}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Estimated Mileage</p>
                            <p className="font-bold text-lg" style={{ color: 'var(--accent-success)' }}>
                                {vehicleDetails.combinedMpg ? mpgToKmPerLiter(vehicleDetails.combinedMpg) : vehicleDetails.expectedMileage} km/L
                            </p>
                        </div>
                        <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Fuel Type</p>
                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                {vehicleDetails.fuelType}
                            </p>
                        </div>
                    </div>
                    {vehicleDetails.tankCapacity && (
                        <p className="mt-2 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                            Tank Capacity: {vehicleDetails.tankCapacity} Liters
                        </p>
                    )}
                </div>
            )}

            {/* Manual entry fallback */}
            <button
                onClick={() => setManualMode(true)}
                className="w-full text-sm py-2"
                style={{ color: 'var(--text-muted)' }}
            >
                Can't find your vehicle? Enter manually
            </button>
        </div>
    );
};

export default VehicleSelector;
