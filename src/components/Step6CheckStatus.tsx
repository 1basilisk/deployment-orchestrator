import React from 'react';
import { Activity, CheckCircle2, AlertCircle, Clock, ExternalLink, RefreshCw, Trophy, Sparkles } from 'lucide-react';
import { StepState, DatasetRefresh } from '../types';

interface Step6CheckStatusProps {
  step: StepState;
  onCheckStatus: () => void;
  isRunning: boolean;
  refresh: DatasetRefresh | null;
  pollCount: number;
  prodWorkspaceName?: string;
  onViewLogs: () => void;
  onRestartPipeline: () => void;
}

export const Step6CheckStatus: React.FC<Step6CheckStatusProps> = ({
  step,
  onCheckStatus,
  isRunning,
  refresh,
  pollCount,
  prodWorkspaceName,
  onViewLogs,
  onRestartPipeline,
}) => {
  const isCompleted = refresh?.status === 'Completed';
  const isExecuting = refresh?.status === 'Executing' || isRunning;
  const isFailed = refresh?.status === 'Failed';

  const durationText = (() => {
    if (!refresh?.startTime) return null;
    const start = new Date(refresh.startTime).getTime();
    const end = refresh.endTime ? new Date(refresh.endTime).getTime() : Date.now();
    const sec = Math.max(1, Math.round((end - start) / 1000));
    return `${sec}s`;
  })();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs font-bold flex items-center justify-center">
              6
            </span>
            <h3 className="text-base font-semibold text-slate-100">
              Check Dataset Refresh Status &amp; Final Pipeline Telemetry
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 pl-8">
            Polls Power BI API (<code className="bg-slate-800 border border-slate-700 px-1 py-0.5 rounded text-amber-500 font-mono text-[11px]">GET /v1.0/myorg/groups/{'{prodWorkspaceId}'}/datasets/{'{id}'}/refreshes?$top=1</code>) until refresh state transitions to <span className="font-semibold text-emerald-500">Completed</span>.
          </p>
        </div>

        <button
          id="btn-execute-step-6"
          onClick={onCheckStatus}
          disabled={isRunning}
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-2 rounded-lg text-xs font-semibold shadow-xl border border-slate-700 disabled:opacity-50 transition-all shrink-0"
        >
          {isRunning ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              <span>Checking Status (Poll #{pollCount})...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isCompleted ? 'Re-check Status' : 'Check Refresh Status'}</span>
            </>
          )}
        </button>
      </div>

      {step.error && (
        <div className="mt-4 p-3.5 bg-rose-900/30 border border-rose-500/30 rounded-lg flex items-start gap-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-400">Status Verification Failed</p>
            <p className="mt-0.5">{step.error}</p>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-6">
        {/* Real-time Status Card */}
        <div className={`p-5 rounded-xl border transition-all ${
          isCompleted
            ? 'bg-emerald-900/10 border-emerald-500/30'
            : isFailed
            ? 'bg-rose-900/10 border-rose-500/30'
            : 'bg-amber-900/10 border-amber-500/30'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Activity className={`w-5 h-5 ${isCompleted ? 'text-emerald-500' : isFailed ? 'text-rose-500' : 'text-amber-500'}`} />
              <div>
                <h4 className="text-sm font-bold text-slate-200">
                  Semantic Model Execution Engine
                </h4>
                <p className="text-xs text-slate-400">
                  Target: {prodWorkspaceName || 'Finance Analytics [PRODUCTION]'}
                </p>
              </div>
            </div>

            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto border ${
              isCompleted
                ? 'bg-emerald-900/40 text-emerald-500 border-emerald-500/20'
                : isFailed
                ? 'bg-rose-900/40 text-rose-500 border-rose-500/20'
                : 'bg-amber-900/40 text-amber-500 border-amber-500/20 animate-pulse'
            }`}>
              {refresh?.status || (isRunning ? 'Executing' : 'Polling...')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Refresh ID</span>
              <p className="font-mono text-[11px] text-slate-300 break-all">{refresh?.id || 'Pending API return'}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Refresh Type</span>
              <p className="text-slate-300 font-semibold">{refresh?.refreshType || 'ViaApi'}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Duration</span>
              <p className="text-slate-300 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {durationText || 'Calculating...'}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Finished At</span>
              <p className="text-slate-300 font-semibold">
                {refresh?.endTime ? new Date(refresh.endTime).toLocaleTimeString() : (isExecuting ? 'In progress...' : 'Pending')}
              </p>
            </div>
          </div>

          {/* Animated Execution Bar */}
          {isExecuting && (
            <div className="mt-4 pt-4 border-t border-amber-500/20">
              <div className="flex items-center justify-between text-xs text-amber-500 mb-1.5 font-medium">
                <span className="flex items-center gap-1.5">
                  <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span>Ingesting data rows from production data sources... (Poll #{pollCount})</span>
                </span>
                <span className="font-mono">Processing</span>
              </div>
              <div className="w-full bg-amber-900/40 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-2 rounded-full w-2/3 animate-pulse" />
              </div>
            </div>
          )}

          {/* Failure diagnosis */}
          {isFailed && refresh?.serviceExceptionJson && (
            <div className="mt-3 p-3 bg-rose-950/60 border border-rose-900 rounded-lg text-xs text-rose-300 font-mono">
              {refresh.serviceExceptionJson}
            </div>
          )}
        </div>

        {/* Grand Complete Celebration Banner */}
        {isCompleted && (
          <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border border-emerald-500/20 rounded-xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-6 h-6 text-amber-500" />
                <span className="text-xs uppercase tracking-widest font-bold text-emerald-400">
                  Pipeline Run Completed Successfully
                </span>
              </div>
              <h4 className="text-xl font-bold tracking-tight mb-2 text-slate-100">
                Dashboards &amp; Datasets Deployed to Production!
              </h4>
              <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
                All 6 automated deployment lifecycle phases have finished with full Power BI API compliance:
                Topology confirmed, Stage artifacts migrated, deployment operation completed, production parameters applied, and semantic model fully refreshed with live data.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  id="btn-view-logs-summary"
                  onClick={onViewLogs}
                  className="bg-slate-950 text-slate-100 hover:bg-slate-900 border border-slate-700 text-xs font-bold px-4 py-2 rounded-lg shadow-xl transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Inspect All API Transaction Logs</span>
                </button>

                <a
                  href="https://app.powerbi.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-900/60 hover:bg-emerald-900/80 border border-emerald-500/30 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <span>Open Power BI Service</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  id="btn-restart-pipeline"
                  onClick={onRestartPipeline}
                  className="text-emerald-400 hover:text-emerald-300 text-xs font-medium px-3 py-2 underline transition-colors"
                >
                  Start New Deployment Cycle
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
