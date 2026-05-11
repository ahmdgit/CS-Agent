import React from 'react';
import { MapPin, Clock, Search, Info, ExternalLink, AlertTriangle, Map, Navigation } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useTollCalculator } from '../hooks/useTollCalculator';
import { allTollSystems } from '../config/tolls';

export function TollGatesTab() {
  const {
    pickup, setPickup,
    dropoff, setDropoff,
    time, setTime,
    image, handleImageUpload, removeImage,
    isCalculating,
    isExtracting,
    result,
    error,
    mapRoute,
    calculate,
    resetAll
  } = useTollCalculator();

  React.useEffect(() => {
    window.addEventListener('reset-tollGates', resetAll);
    window.addEventListener('cancel-tollGates', resetAll);
    return () => {
      window.removeEventListener('reset-tollGates', resetAll);
      window.removeEventListener('cancel-tollGates', resetAll);
    };
  }, [resetAll]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
          <Map className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">UAE Toll Gates</h2>
          <p className="text-slate-600">Information and calculator for Salik (Dubai) and Darb (Abu Dhabi)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary-600" />
            Toll Calculator
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            Enter your trip details to estimate the toll gates you'll cross and the total cost.
          </p>

          <div className="space-y-4 flex-1">
            <Input
              label="Pick-up Location"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              placeholder="e.g., Dubai Marina"
              leftIcon={<MapPin className="w-5 h-5" />}
            />

            <Input
              label="Drop-off Location"
              value={dropoff}
              onChange={(e) => setDropoff(e.target.value)}
              placeholder="e.g., Abu Dhabi Airport"
              leftIcon={<MapPin className="w-5 h-5" />}
            />

            <Input
              type="datetime-local"
              label="Date & Time of Travel"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              leftIcon={<Clock className="w-5 h-5" />}
            />
            <p className="text-xs text-slate-500 mt-1">Time is important as Darb tolls depend on peak hours.</p>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Route Screenshot (Optional)</label>
              {!image ? (
                <div className="flex items-center justify-center w-full">
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 ${isExtracting ? 'border-primary-400 bg-primary-50' : 'border-slate-300 bg-slate-50'} border-dashed rounded-lg cursor-pointer hover:bg-slate-100 transition-colors`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isExtracting ? (
                        <>
                          <div className="w-8 h-8 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin mb-2" />
                          <p className="text-sm text-primary-600 font-medium">Extracting locations...</p>
                        </>
                      ) : (
                        <>
                          <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click to upload</span></p>
                          <p className="text-xs text-slate-500">PNG, JPG up to 5MB</p>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      disabled={isExtracting}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                  </label>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden border border-slate-200">
                  <img src={image.objectUrl} alt="Route Screenshot" className="w-full h-32 object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="danger" onClick={removeImage}>Remove Image</Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <Button
            onClick={calculate}
            disabled={isCalculating}
            isLoading={isCalculating}
            className="w-full mt-4 bg-primary-600 hover:bg-primary-700"
            leftIcon={!isCalculating && <Search className="w-4 h-4" />}
          >
            {isCalculating ? 'Calculating...' : 'Calculate Tolls'}
          </Button>

          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                key="toll-result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200"
              >
                <h4 className="font-medium text-slate-800 mb-2">Estimated Tolls</h4>
                <div className="prose prose-sm prose-primary max-w-none text-slate-700">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info Section */}
        <div className="space-y-6">
          {/* Yandex Map Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Map className="w-5 h-5 text-primary-600" />
                Track Route
              </h3>
              {mapRoute && (
                <div className="flex flex-wrap gap-3">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(mapRoute.pickup)}&destination=${encodeURIComponent(mapRoute.dropoff)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1 font-medium bg-primary-50 px-2 py-1 rounded-md"
                  >
                    Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href={`https://yandex.com/maps/?rtext=${encodeURIComponent(mapRoute.pickup)}~${encodeURIComponent(mapRoute.dropoff)}&rtt=auto`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1 font-medium bg-primary-50 px-2 py-1 rounded-md"
                  >
                    Yandex Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
            <div className="w-full h-[300px] rounded-lg overflow-hidden relative bg-slate-100 border border-slate-200">
              {mapRoute ? (
                <iframe
                  src={`https://yandex.com/map-widget/v1/?rtext=${encodeURIComponent(mapRoute.pickup)}~${encodeURIComponent(mapRoute.dropoff)}&rtt=auto&lang=en_US`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allowFullScreen={true}
                  className="absolute inset-0"
                ></iframe>
              ) : (
                <iframe
                  src="https://yandex.com/map-widget/v1/?ll=54.898804%2C24.857059&z=8&lang=en_US"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allowFullScreen={true}
                  className="absolute inset-0"
                ></iframe>
              )}
            </div>
          </div>

          {/* Toll Systems Info */}
          {allTollSystems.map((system) => {
            const isDubai = system.id === 'salik';
            const colorClass = isDubai ? 'orange' : 'blue';
            
            return (
              <div key={system.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full bg-${colorClass}-500`}></span>
                    {system.name} ({system.emirate})
                  </h3>
                  <a
                    href={system.officialWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1"
                  >
                    {system.officialWebsite.replace('https://www.', '').replace('https://', '')} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                
                <div className="space-y-3 text-sm text-slate-600">
                  <p>
                    <strong>Cost:</strong> {system.basePriceAed} AED per crossing
                    {system.hasPeakHours && <em> during peak hours only</em>}.
                  </p>
                  
                  {!system.hasPeakHours && (
                    <p><strong>Peak Times:</strong> <span className="font-semibold text-primary-600">None.</span> {system.emirate} charges a flat rate 24/7.</p>
                  )}
                  
                  <p><strong>Gates ({system.gates.length}):</strong> {system.gates.map(g => g.name).join(', ')}.</p>
                  
                  <div className={`p-3 bg-${colorClass}-50 rounded-lg border border-${colorClass}-100 text-${colorClass}-800`}>
                    <p className="font-medium mb-1 flex items-center gap-1">
                      <Info className="w-4 h-4" /> Rules & Timings
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      {system.hasPeakHours && system.peakHours && (
                        <li>Peak Hours: {system.peakHours.map(ph => `${ph.startTime} - ${ph.endTime}`).join(' and ')} ({system.peakHours[0].days[0]} to {system.peakHours[0].days[system.peakHours[0].days.length-1]}).</li>
                      )}
                      
                      {system.freeTimes && <li>{system.freeTimes}</li>}
                      
                      {system.exceptionRules.map((rule, idx) => (
                        <li key={idx}>{rule.gates.join(' & ')}: {rule.description}</li>
                      ))}
                      
                      {system.dailyCapLimitAed ? (
                        <li>Maximum daily cap: {system.dailyCapLimitAed} AED per vehicle.</li>
                      ) : (
                        <li>Maximum daily cap: None.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
