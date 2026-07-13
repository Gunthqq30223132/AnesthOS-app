import { useState, useEffect } from 'react';
import { calculateIBW, IBWResult } from '../domain';
import { loadClinicalData, ClinicalDataset } from './services/dataLoader';
import { evaluateFreshness, GuardDecision } from './services/freshnessGuard';

export function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingStatus, setLoadingStatus] = useState<string>('Initializing clinical environment...');
  const [guardDecision, setGuardDecision] = useState<GuardDecision | null>(null);
  const [clinicalData, setClinicalData] = useState<ClinicalDataset | null>(null);
  
  // Calculator States
  const [heightCm, setHeightCm] = useState<number>(170);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [actualWeight, setActualWeight] = useState<number | undefined>(80);
  const [result, setResult] = useState<IBWResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const localVersion = '1.0.0';

  useEffect(() => {
    async function initApp() {
      try {
        setLoadingStatus('Verifying clinical data freshness...');
        const decision = await evaluateFreshness(localVersion);
        setGuardDecision(decision);

        // If the decision is to block, do not load data
        if (
          decision.action === 'BLOCK_REVOKED' ||
          decision.action === 'BLOCK_STALE' ||
          decision.action === 'BLOCK_EMERGENCY'
        ) {
          setLoading(false);
          return;
        }

        setLoadingStatus('Loading clinical datasets...');
        const data = await loadClinicalData();
        setClinicalData(data);
      } catch (err: any) {
        setError(`Failed to initialize application: ${err.message || err}`);
      } finally {
        setLoading(false);
      }
    }

    initApp();
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-8 font-sans">
        <div className="space-y-6 text-center max-w-md">
          {/* Custom micro-animated spinner */}
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-950"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-cyan-400 animate-spin"></div>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-wider text-cyan-400 uppercase">AnesthOS</h1>
            <p className="text-slate-400 text-sm animate-pulse">{loadingStatus}</p>
          </div>
        </div>
      </div>
    );
  }

  const isBlocked = guardDecision && (
    guardDecision.action === 'BLOCK_REVOKED' ||
    guardDecision.action === 'BLOCK_STALE' ||
    guardDecision.action === 'BLOCK_EMERGENCY'
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <header className="max-w-3xl mx-auto mb-8 pb-4 border-b border-slate-800 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-cyan-400">AnesthOS</h1>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-900/50 text-cyan-400 border border-cyan-800 rounded">v{localVersion}</span>
          </div>
          <p className="text-slate-400 text-sm mt-1">High-Reliability Clinical Anesthesia Calculations & Datasets</p>
        </div>

        {/* Guard status badge */}
        {guardDecision && (
          <div className={`px-4 py-2 rounded-lg border text-xs font-medium max-w-xs ${
            guardDecision.action === 'ALLOW' ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400' :
            guardDecision.action === 'WARN_UPDATE' ? 'bg-amber-950/40 border-amber-800/60 text-amber-400' :
            'bg-red-950/40 border-red-800/60 text-red-400'
          }`}>
            {guardDecision.message}
          </div>
        )}
      </header>

      <main className="max-w-3xl mx-auto space-y-6">
        {isBlocked ? (
          <div className="bg-red-950/30 rounded-xl p-8 border border-red-900/50 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-red-900/50 text-red-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">!</div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-red-200">Ứng dụng bị khóa tính toán</h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                {guardDecision?.message}
              </p>
            </div>
            <div className="pt-4 border-t border-red-950/60 text-xs text-slate-500">
              Mã bảo mật: CRITICAL_GUARD_LOCK | Liên hệ quản trị viên lâm sàng.
            </div>
          </div>
        ) : (
          <>
            {/* Calculation interface */}
            <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700 shadow-xl space-y-6 transition-all duration-300 hover:border-slate-600">
              <div className="border-b border-slate-700/60 pb-3">
                <h2 className="text-xl font-semibold text-slate-200">Ideal Body Weight (IBW) Calculator</h2>
                <p className="text-xs text-slate-400 mt-0.5">Physiological parameters based on the Devine Formula (1974)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Height (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Actual Weight (kg)</label>
                  <input
                    type="number"
                    value={actualWeight ?? ''}
                    onChange={(e) => setActualWeight(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono"
                  />
                </div>
              </div>

              <button
                onClick={handleCalculate}
                className="w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-500 font-semibold text-white rounded-lg transition-colors duration-200 shadow-lg shadow-cyan-950/20 active:scale-[0.98]"
              >
                Calculate Dose Parameters
              </button>

              {error && (
                <div className="p-4 bg-red-950/60 border border-red-800 text-red-300 text-sm rounded-lg animate-shake">
                  {error}
                </div>
              )}

              {result && (
                <div className="p-5 bg-slate-900/90 border border-cyan-950 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Ideal Body Weight (IBW):</span>
                    <span className="text-2xl font-bold text-cyan-400 font-mono">{result.ibwKg} kg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Adjusted Body Weight (ABW):</span>
                    <span className="text-lg font-semibold text-slate-200 font-mono">{result.adjustedBodyWeightKg} kg</span>
                  </div>
                  <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 space-y-0.5">
                    <p>Formula: {result.formula}</p>
                    <p>Provenance: {result.provenance.guidelineName} ({result.provenance.versionOrYear})</p>
                  </div>
                </div>
              )}
            </div>

            {/* General dataset status overview (shows that datasets are dynamically loaded) */}
            {clinicalData && (
              <div className="bg-slate-800/40 rounded-xl p-5 border border-slate-800/80 space-y-3">
                <h3 className="text-sm font-semibold text-slate-300">Active Datasets Loaded ({Object.keys(clinicalData).length - 1})</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                    <span>Drugs Master: {Object.keys(clinicalData.drugs).length} items</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                    <span>Sepsis Rules: {Object.keys(clinicalData.sepsisRules).length} items</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                    <span>Sugammadex: {clinicalData.sugammadexRulesVi.length} items</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                    <span>NORA Locations: {Object.keys(clinicalData.noraLocations).length} suites</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                    <span>Surgeries: {Object.keys(clinicalData.surgeries).length} procedures</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
