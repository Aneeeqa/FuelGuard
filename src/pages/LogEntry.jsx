import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFuelData } from '../hooks/useFuelData';
import { Fuel, CheckCircle } from 'lucide-react';

const LogEntry = () => {
  const navigate = useNavigate();
  const { addLog } = useFuelData();
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    odometer: '',
    liters: '',
    price: '',
  });

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.odometer || parseFloat(formData.odometer) <= 0) {
      newErrors.odometer = 'Please enter a valid odometer reading';
    }
    
    if (!formData.liters || parseFloat(formData.liters) <= 0) {
      newErrors.liters = 'Please enter a valid fuel amount';
    }
    
    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const newLog = {
      date: new Date(formData.date).toISOString(),
      odometer: parseFloat(formData.odometer),
      liters: parseFloat(formData.liters),
      price: formData.price ? parseFloat(formData.price) : null,
    };

    addLog(newLog);
    setSuccess(true);
    
    // Navigate after brief success feedback
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-20 h-20 bg-success-600/20 rounded-full flex items-center justify-center mb-4 animate-bounce">
          <CheckCircle className="w-10 h-10 text-success-500" />
        </div>
        <h1 className="text-xl font-bold text-[#F3F4F6] mb-2">Entry Added!</h1>
        <p className="text-[#9CA3AF]">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 pb-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F3F4F6]">Add Entry</h1>
        <p className="text-[#9CA3AF]">Log your fuel fill-up</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Date */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-[#D1D5DB] mb-2">
            Date
          </label>
          <input
            type="date"
            id="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border bg-[#0f172a] text-[#F3F4F6] min-h-[48px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.date ? 'border-danger-500' : 'border-gray-600'
            }`}
          />
          {errors.date && (
            <p className="mt-1 text-sm text-danger-500">{errors.date}</p>
          )}
        </div>

        {/* Odometer */}
        <div>
          <label htmlFor="odometer" className="block text-sm font-medium text-[#D1D5DB] mb-2">
            Odometer Reading (km)
          </label>
          <input
            type="text"
            inputMode="decimal"
            id="odometer"
            placeholder="e.g., 15000"
            value={formData.odometer}
            onChange={(e) => handleChange('odometer', e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border bg-[#0f172a] text-[#F3F4F6] placeholder-[#9CA3AF] min-h-[48px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.odometer ? 'border-danger-500' : 'border-gray-600'
            }`}
          />
          {errors.odometer && (
            <p className="mt-1 text-sm text-danger-500">{errors.odometer}</p>
          )}
        </div>

        {/* Liters */}
        <div>
          <label htmlFor="liters" className="block text-sm font-medium text-[#D1D5DB] mb-2">
            Fuel Amount (Liters)
          </label>
          <input
            type="text"
            inputMode="decimal"
            id="liters"
            placeholder="e.g., 35"
            value={formData.liters}
            onChange={(e) => handleChange('liters', e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border bg-[#0f172a] text-[#F3F4F6] placeholder-[#9CA3AF] min-h-[48px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.liters ? 'border-danger-500' : 'border-gray-600'
            }`}
          />
          {errors.liters && (
            <p className="mt-1 text-sm text-danger-500">{errors.liters}</p>
          )}
        </div>

        {/* Price (Optional) */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-[#D1D5DB] mb-2">
            Total Cost (Optional)
          </label>
          <input
            type="text"
            inputMode="decimal"
            id="price"
            placeholder="e.g., 3500"
            value={formData.price}
            onChange={(e) => handleChange('price', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-600 bg-[#0f172a] text-[#F3F4F6] placeholder-[#9CA3AF] min-h-[48px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Submit Button - Inline in form */}
        <div className="pt-4">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-colors min-h-[56px] shadow-lg"
          >
            <Fuel className="w-5 h-5" />
            Save Entry
          </button>
        </div>
      </form>
    </div>
  );
};

export default LogEntry;

