import { useState } from 'react';
import { calculateIBW, IBWResult } from '../domain';

export function App() {
  const [heightCm, setHeightCm] = useState<number>(170);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [actualWeight, setActualWeight] = useState<number | undefined>(80);
  const [result, setResult] = useState<IBWResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = () => {
    try {
      setError(null);
      const res = calculateIBW({ heightCm, gender }, actualWeight);
      setResult(res);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error occurred');
      }
      setResult(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <header className="max-w-3xl mx-auto mb-8 pb-4 border-b border-slate-800">
        <h1 className="text-3xl font-bold tracking-tight text-cyan-400">AnesthOS</h1>
        <p className="text-slate-400 text-sm mt-1">Clinical Anesthesia Calculation Engine & Guardrails</p>
      </header>

      <main className="max-w-3xl mx-auto space-y-6">
        <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700 shadow-xl">
          <h2 className="text-xl font-semibold text-slate-200 mb-4">Ideal Body Weight (IBW) Calculator</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Height (cm)</label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Actual Weight (kg)</label>
              <input
                type="number"
                value={actualWeight ?? ''}
                onChange={(e) => setActualWeight(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            onClick={handleCalculate}
            className="w-full md:w-auto px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 font-medium text-white rounded-lg transition-colors"
          >
            Calculate IBW
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-950/60 border border-red-800 text-red-300 text-sm rounded-lg">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-6 p-5 bg-slate-900/90 border border-cyan-900/50 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Ideal Body Weight (IBW):</span>
                <span className="text-2xl font-bold text-cyan-400">{result.ibwKg} kg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Adjusted Body Weight (ABW):</span>
                <span className="text-lg font-semibold text-slate-200">{result.adjustedBodyWeightKg} kg</span>
              </div>
              <div className="pt-3 border-t border-slate-800 text-xs text-slate-500">
                <p>Formula: {result.formula}</p>
                <p>Provenance: {result.provenance.guidelineName} ({result.provenance.versionOrYear})</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
