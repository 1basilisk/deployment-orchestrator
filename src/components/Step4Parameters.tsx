import React from 'react';
import { Sliders, Save, CheckCircle2, AlertCircle, ArrowRight, Play, Sparkles, Database } from 'lucide-react';
import { StepState, DatasetParameter } from '../types';

interface Step4ParametersProps {
  step: StepState;
  onFetchParameters: () => void;
  onSaveParameters: () => void;
  isRunning: boolean;
  isSaving: boolean;
  parameters: DatasetParameter[];
  paramDrafts: Record<string, string>;
  onParamChange: (name: string, value: string) => void;
  onContinue: () => void;
  activeDatasetName?: string;
}

export const Step4Parameters: React.FC<Step4ParametersProps> = ({
  step,
  onFetchParameters,
  onSaveParameters,
  isRunning,
  isSaving,
  parameters,
  paramDrafts,
  onParamChange,
  onContinue,
  activeDatasetName,
}) => {
  const hasModifications = parameters.some(
    (p) => paramDrafts[p.name] !== undefined && paramDrafts[p.name] !== p.currentValue
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs font-bold flex items-center justify-center">
              4
            </span>
            <h3 className="text-base font-semibold text-slate-100">
              Check &amp; Update Semantic Model Parameters
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 pl-8">
            Inspects parameters in Production via <code className="bg-slate-800 border border-slate-700 px-1 py-0.5 rounded text-amber-500 font-mono text-[11px]">GET .../datasets/{'{id}'}/parameters</code> and updates connection strings or server endpoints via <code className="bg-slate-800 border border-slate-700 px-1 py-0.5 rounded text-amber-500 font-mono text-[11px]">POST .../Default.UpdateParameters</code>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-fetch-parameters"
            onClick={onFetchParameters}
            disabled={isRunning || isSaving}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xl disabled:opacity-50 transition-all shrink-0"
          >
            {isRunning ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                <span>Reading Parameters...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{parameters.length > 0 ? 'Re-check Parameters' : 'Check Parameters'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {step.error && (
        <div className="mt-4 p-3.5 bg-rose-900/30 border border-rose-500/30 rounded-lg flex items-start gap-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-400">Parameter Operation Error</p>
            <p className="mt-0.5">{step.error}</p>
          </div>
        </div>
      )}

      {parameters.length > 0 ? (
        <div className="mt-6 space-y-5">
          {/* Action Header & Presets */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-600" />
              <div>
                <span className="text-xs font-bold text-slate-200">
                  Target Semantic Model: {activeDatasetName || 'Active Dataset'}
                </span>
                <p className="text-[11px] text-slate-400">
                  Ensure database connections point to production instances before triggering dataset refresh.
                </p>
              </div>
            </div>
          </div>

          {/* Parameters Editor Table */}
          <div className="border border-slate-800 rounded-lg overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 w-1/4">Parameter Name</th>
                    <th className="py-3 px-4 w-1/4">Current Power BI Value</th>
                    <th className="py-3 px-4 w-1/3">New Value (To Apply)</th>
                    <th className="py-3 px-4 w-1/6">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                  {parameters.map((param) => {
                    const currentVal = param.currentValue;
                    const draftVal = paramDrafts[param.name] ?? currentVal;
                    const isChanged = draftVal !== currentVal;

                    return (
                      <tr key={param.name} className={isChanged ? 'bg-amber-900/10' : ''}>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-200">{param.name}</p>
                          {param.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5">{param.description}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 break-all">
                          {currentVal}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              value={draftVal}
                              onChange={(e) => onParamChange(param.name, e.target.value)}
                              className={`w-full px-2.5 py-1.5 text-xs border rounded font-mono transition-colors focus:outline-none focus:ring-1 ${
                                isChanged
                                  ? 'border-amber-500 bg-amber-900/40 text-amber-500 focus:ring-amber-500'
                                  : 'border-slate-700 bg-slate-950 text-slate-300 focus:ring-slate-500'
                              }`}
                            />
                            {param.suggestedValues && param.suggestedValues.length > 0 && (
                              <div className="flex flex-wrap gap-1 items-center">
                                <span className="text-[10px] text-slate-500">Suggestions:</span>
                                {param.suggestedValues.map((sug) => (
                                  <button
                                    key={sug}
                                    type="button"
                                    onClick={() => onParamChange(param.name, sug)}
                                    className="text-[10px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono transition-colors"
                                  >
                                    {sug}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                            {param.type}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {hasModifications ? (
                <button
                  id="btn-save-parameters"
                  onClick={onSaveParameters}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-semibold px-4 py-2 rounded-lg shadow-xl transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                      <span>Updating via API...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Update Parameters in Power BI</span>
                    </>
                  )}
                </button>
              ) : (
                <span className="text-xs text-slate-400">
                  Parameters match current requirements (or no pending changes).
                </span>
              )}
            </div>

            <button
              id="btn-step-4-continue"
              onClick={onContinue}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg shadow-xl transition-colors"
            >
              <span>Proceed to Step 5 (Dataset Refresh)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8 text-center py-10 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
          <Sliders className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-300">Parameters not yet fetched</p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Click &quot;Check Parameters&quot; to inspect connection strings and endpoints configured in the target semantic model.
          </p>
        </div>
      )}
    </div>
  );
};
