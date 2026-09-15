import React from 'react';
import { ArrowRight, Server, CheckCircle2, Play, AlertCircle, Database, Shield } from 'lucide-react';
import { StepState, Pipeline } from '../types';

interface Step1WorkspaceInfoProps {
  step: StepState;
  onExecute: () => void;
  isRunning: boolean;
  pipelineData: {
    pipeline?: Pipeline;
    stageWorkspace?: { id: string; name: string; capacity?: string };
    prodWorkspace?: { id: string; name: string; capacity?: string };
    simulated?: boolean;
  } | null;
  onContinue: () => void;
}

export const Step1WorkspaceInfo: React.FC<Step1WorkspaceInfoProps> = ({
  step,
  onExecute,
  isRunning,
  pipelineData,
  onContinue,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h3 className="text-base font-semibold text-slate-100">
              Retrieve Workspace & Deployment Pipeline Information
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 pl-8">
            Queries the Power BI REST API (<code className="bg-slate-800 border border-slate-700 px-1 py-0.5 rounded text-amber-500 font-mono text-[11px]">GET /v1.0/myorg/pipelines/{'{pipelineId}'}/stages</code>) to discover Stage and Production workspace bindings.
          </p>
        </div>

        <button
          id="btn-execute-step-1"
          onClick={onExecute}
          disabled={isRunning}
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-2 rounded-lg text-xs font-semibold shadow-xl border border-slate-700 disabled:opacity-50 transition-all shrink-0"
        >
          {isRunning ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Querying Pipeline...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{step.status === 'success' ? 'Re-fetch Information' : 'Retrieve Workspace Info'}</span>
            </>
          )}
        </button>
      </div>

      {step.error && (
        <div className="mt-4 p-3.5 bg-rose-900/30 border border-rose-500/30 rounded-lg flex items-start gap-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-400">Pipeline Query Failed</p>
            <p className="mt-0.5">{step.error}</p>
          </div>
        </div>
      )}

      {/* Discovered Pipeline Information */}
      {pipelineData?.pipeline ? (
        <div className="mt-6 space-y-6">
          {/* Overview Info Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-amber-500" />
                {pipelineData.pipeline.displayName}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                ID: {pipelineData.pipeline.id}
              </span>
            </div>
            {pipelineData.pipeline.description && (
              <p className="text-xs text-slate-600">{pipelineData.pipeline.description}</p>
            )}
          </div>

          {/* Visual Workspace Flow Card */}
          <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
            {/* Source Stage Workspace */}
            <div className="md:col-span-5 border border-amber-500/30 bg-amber-900/10 rounded-xl p-4 relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 bg-amber-900/40 px-2 py-0.5 rounded border border-amber-500/20">
                  Source: Stage / UAT (Order 1)
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              </div>
              <p className="text-sm font-bold text-slate-100">
                {pipelineData.stageWorkspace?.name || 'Finance Analytics [STAGE / UAT]'}
              </p>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Workspace ID: {pipelineData.stageWorkspace?.id || 'ws-stage-101'}
              </p>
              <div className="mt-3 pt-3 border-t border-amber-500/20 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-amber-500" />
                  Capacity: {pipelineData.stageWorkspace?.capacity || 'Fabric F64 Dedicated'}
                </span>
                <span className="text-[11px] text-amber-500 font-medium">Ready for Release</span>
              </div>
            </div>

            {/* Transfer Direction Indicator */}
            <div className="md:col-span-1 flex justify-center py-2 md:py-0">
              <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 shadow-xl">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Target Production Workspace */}
            <div className="md:col-span-5 border border-emerald-500/30 bg-emerald-900/10 rounded-xl p-4 relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-500/20">
                  Target: Production (Order 2)
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              </div>
              <p className="text-sm font-bold text-slate-100">
                {pipelineData.prodWorkspace?.name || 'Finance Analytics [PRODUCTION]'}
              </p>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Workspace ID: {pipelineData.prodWorkspace?.id || 'ws-prod-202'}
              </p>
              <div className="mt-3 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  Capacity: {pipelineData.prodWorkspace?.capacity || 'Fabric F64 Dedicated'}
                </span>
                <span className="text-[11px] text-emerald-500 font-medium">Protected Production</span>
              </div>
            </div>
          </div>

          {/* Success status and proceed button */}
          {step.status === 'success' && (
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-emerald-500 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Workspace and pipeline topologies successfully verified.</span>
              </div>
              <button
                id="btn-step-1-continue"
                onClick={onContinue}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg shadow-xl transition-colors"
              >
                <span>Proceed to Step 2 (List Reports)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-8 text-center py-10 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
          <Server className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-300">Workspace topology not yet queried</p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Click &quot;Retrieve Workspace Info&quot; above to contact Power BI and resolve the pipeline configuration.
          </p>
        </div>
      )}
    </div>
  );
};
