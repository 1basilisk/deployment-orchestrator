import React from 'react';
import { CheckCircle2, Clock, AlertCircle, PlayCircle, Edit3, RefreshCw } from 'lucide-react';
import { StepId, StepState } from '../types';

interface StepperProps {
  steps: StepState[];
  currentStep: StepId;
  onSelectStep: (stepId: StepId) => void;
  isAutoAdvancing: boolean;
  onToggleAutoAdvance: () => void;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onSelectStep,
  isAutoAdvancing,
  onToggleAutoAdvance,
}) => {
  const completedCount = steps.filter((s) => s.status === 'success').length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-xl mb-6">
      {/* Top bar with progress and auto-advance toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
            <span>Pipeline Execution Sequence</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-950 text-neutral-400 font-mono border border-neutral-700">
              {completedCount} / {steps.length} Steps Completed ({progressPercent}%)
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Flexible execution: follow the sequence end-to-end, or jump to specific steps to execute independent tasks
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label
            htmlFor="toggle-auto-advance"
            className="flex items-center gap-2 text-xs font-medium text-neutral-300 cursor-pointer select-none bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-700 hover:bg-neutral-800 transition-colors"
          >
            <input
              id="toggle-auto-advance"
              type="checkbox"
              checked={isAutoAdvancing}
              onChange={onToggleAutoAdvance}
              className="w-3.5 h-3.5 text-amber-500 rounded border-neutral-700 bg-neutral-900 focus:ring-amber-500/50"
            />
            <span>Auto-Advance Sequential Run</span>
          </label>
        </div>
      </div>

      {/* Progress Bar Line */}
      <div className="w-full bg-neutral-800 rounded-full h-1.5 mb-6 overflow-hidden">
        <div
          className="bg-amber-500 h-1.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 7 Step Nodes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
        {steps.map((step) => {
          const isCurrent = currentStep === step.id;
          const isSuccess = step.status === 'success';
          const isRunning = step.status === 'running';
          const isFailed = step.status === 'failed';
          const isWaitingUser = step.status === 'waiting_user';

          let statusBg = 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-800';
          let icon = <span className="text-xs font-semibold">{step.id}</span>;

          if (isRunning) {
            statusBg = 'bg-amber-900/20 border-amber-500/50 text-amber-100 ring-2 ring-amber-500/20';
            icon = <Clock className="w-4 h-4 text-amber-500 animate-spin" />;
          } else if (isSuccess) {
            statusBg = 'bg-emerald-900/20 border-emerald-500/50 text-emerald-100';
            icon = <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
          } else if (isFailed) {
            statusBg = 'bg-rose-900/20 border-rose-500/50 text-rose-100';
            icon = <AlertCircle className="w-4 h-4 text-rose-500" />;
          } else if (isWaitingUser) {
            statusBg = 'bg-indigo-900/20 border-indigo-500/50 text-indigo-100 ring-2 ring-indigo-500/20';
            icon = <Edit3 className="w-4 h-4 text-indigo-400" />;
          } else if (isCurrent) {
            statusBg = 'bg-neutral-800 border-neutral-500 text-neutral-100 ring-1 ring-neutral-500';
          }

          return (
            <button
              id={`stepper-node-${step.id}`}
              key={step.id}
              onClick={() => onSelectStep(step.id)}
              className={`p-3 rounded-lg border text-left transition-all relative flex flex-col justify-between ${statusBg} ${
                isCurrent ? 'shadow-xs' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-950 shadow-xl border border-neutral-700 text-xs font-bold text-neutral-300">
                  {icon}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold opacity-70">
                  Step {step.id}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold truncate leading-snug">{step.title}</p>
                <p className="text-[11px] opacity-75 line-clamp-1 mt-0.5">{step.shortDesc}</p>
              </div>

              {/* Status footer pill */}
              <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center justify-between text-[10px]">
                <span className="capitalize font-medium">
                  {isRunning && 'Executing...'}
                  {isSuccess && 'Completed'}
                  {isFailed && 'Failed'}
                  {isWaitingUser && 'Input Required'}
                  {step.status === 'idle' && 'Pending'}
                </span>
                {step.completedAt && (
                  <span className="opacity-60 text-[9px] font-mono">
                    {new Date(step.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
