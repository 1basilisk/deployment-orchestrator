import React from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, ArrowRight, Bell, Database } from 'lucide-react';
import { StepState } from '../types';

interface Step5RefreshProps {
  step: StepState;
  onTriggerRefresh: () => void;
  isRunning: boolean;
  refreshId: string | null;
  activeDatasetName?: string;
  onContinue: () => void;
}

export const Step5Refresh: React.FC<Step5RefreshProps> = ({
  step,
  onTriggerRefresh,
  isRunning,
  refreshId,
  activeDatasetName,
  onContinue,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs font-bold flex items-center justify-center">
              5
            </span>
            <h3 className="text-base font-semibold text-slate-100">
              Trigger Semantic Model Refresh in Production
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 pl-8">
            Triggers on-demand dataset refresh via <code className="bg-slate-800 border border-slate-700 px-1 py-0.5 rounded text-amber-500 font-mono text-[11px]">POST /v1.0/myorg/groups/{'{prodWorkspaceId}'}/datasets/{'{id}'}/refreshes</code>.
          </p>
        </div>

        <button
          id="btn-execute-step-5"
          onClick={onTriggerRefresh}
          disabled={isRunning}
          className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 px-5 py-2.5 rounded-lg text-xs font-bold shadow-xl disabled:opacity-50 transition-all shrink-0"
        >
          {isRunning ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              <span>Queueing Refresh...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{step.status === 'success' ? 'Re-trigger Refresh' : 'Trigger Dataset Refresh'}</span>
            </>
          )}
        </button>
      </div>

      {step.error && (
        <div className="mt-4 p-3.5 bg-rose-900/30 border border-rose-500/30 rounded-lg flex items-start gap-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-400">Refresh Request Failed</p>
            <p className="mt-0.5">{step.error}</p>
          </div>
        </div>
      )}

      {/* Configuration & Options */}
      <div className="mt-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-slate-200">Target Production Dataset</span>
            </div>
            <p className="text-xs font-semibold text-slate-100">
              {activeDatasetName || 'Enterprise Financial Data Model'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Parameters are locked and verified for production ingestion.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-200">Power BI Failure Notifications</span>
            </div>
            <p className="text-xs font-medium text-slate-300">Mail on Failure</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Power BI Service will dispatch alert emails if scheduled or manual refresh throws an error.
            </p>
          </div>
        </div>

        {/* Refresh Queued Status Banner */}
        {refreshId && (
          <div className="p-4 bg-emerald-900/10 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-emerald-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="font-bold">Dataset Refresh Successfully Queued (HTTP 202 Accepted)</p>
                <p className="text-[11px] text-emerald-400 font-mono mt-0.5">
                  Execution Request ID: {refreshId}
                </p>
              </div>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-900/40 text-emerald-500 border border-emerald-500/20 font-semibold uppercase">
              Queued
            </span>
          </div>
        )}

        {/* Proceed button */}
        {step.status === 'success' && (
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Refresh request accepted by Power BI engine. Proceed to track real-time execution status.
            </p>
            <button
              id="btn-step-5-continue"
              onClick={onContinue}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg shadow-xl transition-colors"
            >
              <span>Proceed to Step 6 (Check Status)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
