import React from 'react';
import { Rocket, CheckCircle2, AlertCircle, ArrowRight, Clock, ShieldCheck, FileCheck } from 'lucide-react';
import { StepState, DeploymentOperation } from '../types';

interface Step3DeployProps {
  step: StepState;
  onTriggerDeploy: () => void;
  isRunning: boolean;
  operation: DeploymentOperation | null;
  pollCount: number;
  selectedReportsCount: number;
  selectedDatasetsCount: number;
  deploymentNote: string;
  setDeploymentNote: (note: string) => void;
  onContinue: () => void;
}

export const Step3Deploy: React.FC<Step3DeployProps> = ({
  step,
  onTriggerDeploy,
  isRunning,
  operation,
  pollCount,
  selectedReportsCount,
  selectedDatasetsCount,
  deploymentNote,
  setDeploymentNote,
  onContinue,
}) => {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 text-xs font-bold flex items-center justify-center">
              3
            </span>
            <h3 className="text-base font-semibold text-neutral-100">
              Trigger Deployment &amp; Verify Success
            </h3>
          </div>
          <p className="text-xs text-neutral-400 mt-1 pl-8">
            Executes <code className="bg-neutral-800 border border-neutral-700 px-1 py-0.5 rounded text-amber-500 font-mono text-[11px]">POST /v1.0/myorg/pipelines/{'{pipelineId}'}/deploy</code> and actively polls <code className="bg-neutral-800 border border-neutral-700 px-1 py-0.5 rounded text-amber-500 font-mono text-[11px]">GET /operations/{'{operationId}'}</code> until status reports <span className="font-semibold text-emerald-500">Succeeded</span>.
          </p>
        </div>

        <button
          id="btn-execute-step-3"
          onClick={onTriggerDeploy}
          disabled={isRunning || (selectedReportsCount === 0 && selectedDatasetsCount === 0)}
          className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 px-5 py-2.5 rounded-lg text-xs font-bold shadow-xl disabled:opacity-50 transition-all shrink-0"
        >
          {isRunning ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-neutral-950/30 border-t-neutral-950 rounded-full animate-spin" />
              <span>Deploying (Poll #{pollCount})...</span>
            </>
          ) : (
            <>
              <Rocket className="w-3.5 h-3.5 fill-current" />
              <span>{operation?.status === 'Succeeded' ? 'Re-deploy to Production' : 'Deploy Stage → Production'}</span>
            </>
          )}
        </button>
      </div>

      {step.error && (
        <div className="mt-4 p-3.5 bg-rose-900/30 border border-rose-500/30 rounded-lg flex items-start gap-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-400">Deployment Operation Failed</p>
            <p className="mt-0.5">{step.error}</p>
          </div>
        </div>
      )}

      {/* Deployment Configuration Box */}
      <div className="mt-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3.5">
            <span className="text-[10px] uppercase font-bold text-neutral-500">Promoted Scope</span>
            <p className="text-xs font-semibold text-neutral-200 mt-1">
              {selectedReportsCount} Report(s) &bull; {selectedDatasetsCount} Dataset(s)
            </p>
            <span className="text-[11px] text-neutral-400">Stage Order 1 → Order 2</span>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3.5">
            <span className="text-[10px] uppercase font-bold text-neutral-500">Safety &amp; Overwrite Options</span>
            <p className="text-xs font-semibold text-neutral-200 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Create &amp; Overwrite Enabled</span>
            </p>
            <span className="text-[11px] text-neutral-400">allowCreateArtifact: true, allowOverwrite: true</span>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3.5">
            <span className="text-[10px] uppercase font-bold text-neutral-500">Polling State</span>
            <p className="text-xs font-semibold text-neutral-200 mt-1 flex items-center gap-1.5">
              {isRunning ? (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                  <span className="text-amber-500">Polling Power BI (Check #{pollCount})</span>
                </>
              ) : operation?.status === 'Succeeded' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Deployment Verified</span>
                </>
              ) : (
                <span className="text-neutral-400">Ready to Trigger</span>
              )}
            </p>
            <span className="text-[11px] text-neutral-400">Waits for 200 Succeeded from Microsoft</span>
          </div>
        </div>

        {/* Release Note Input */}
        <div>
          <label htmlFor="deployment-note" className="block text-xs font-semibold text-neutral-400 mb-1">
            Deployment Note / Audit Tag
          </label>
          <input
            id="deployment-note"
            type="text"
            value={deploymentNote}
            onChange={(e) => setDeploymentNote(e.target.value)}
            placeholder="e.g. Release v2.4.1 - Q3 Corporate Financial Reports promotion"
            className="w-full px-3 py-2 text-xs border border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-neutral-950 text-neutral-200"
            disabled={isRunning}
          />
        </div>

        {/* Live Operation Status Box */}
        {operation && (
          <div className={`p-4 rounded-xl border transition-all ${
            operation.status === 'Succeeded'
              ? 'bg-emerald-900/10 border-emerald-500/30'
              : operation.status === 'Failed'
              ? 'bg-rose-900/10 border-rose-500/30'
              : 'bg-amber-900/10 border-amber-500/30'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-neutral-400" />
                <span className="text-xs font-bold text-neutral-200">
                  Power BI Deployment Operation Tracker
                </span>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                operation.status === 'Succeeded'
                  ? 'bg-emerald-900/40 text-emerald-500 border border-emerald-500/20'
                  : operation.status === 'Failed'
                  ? 'bg-rose-900/40 text-rose-500 border border-rose-500/20'
                  : 'bg-amber-900/40 text-amber-500 border border-amber-500/20 animate-pulse'
              }`}>
                {operation.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-neutral-500 text-[10px]">Operation ID:</span>
                <p className="font-mono text-[11px] text-neutral-300 break-all">{operation.id}</p>
              </div>
              <div>
                <span className="text-neutral-500 text-[10px]">Execution Started:</span>
                <p className="text-neutral-300">
                  {operation.executionStartTime ? new Date(operation.executionStartTime).toLocaleTimeString() : 'Just now'}
                </p>
              </div>
              <div>
                <span className="text-neutral-500 text-[10px]">Execution Completed:</span>
                <p className="text-neutral-300">
                  {operation.executionEndTime ? new Date(operation.executionEndTime).toLocaleTimeString() : (isRunning ? 'In progress...' : 'Pending')}
                </p>
              </div>
            </div>

            {operation.status === 'Executing' && (
              <div className="mt-3 pt-3 border-t border-amber-500/20 flex items-center gap-2 text-xs text-amber-500">
                <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <span>Power BI Fabric engine is binding reports and datasets to production workspace...</span>
              </div>
            )}
          </div>
        )}

        {/* Step 3 Success & Continue */}
        {step.status === 'success' && (
          <div className="pt-4 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-emerald-500 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Artifacts successfully deployed to Production! Ready to verify environment parameters.</span>
            </div>
            <button
              id="btn-step-3-continue"
              onClick={onContinue}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-bold px-4 py-2 rounded-lg shadow-xl transition-colors"
            >
              <span>Proceed to Step 4 (Check &amp; Update Parameters)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
