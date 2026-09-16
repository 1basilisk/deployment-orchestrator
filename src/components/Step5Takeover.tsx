import React from 'react';
import { ShieldCheck, PlayCircle, Loader2 } from 'lucide-react';
import { StepState, Dataset } from '../types';

interface Step5TakeoverProps {
  step: StepState;
  datasets: Dataset[];
  onExecute: () => void;
  isRunning: boolean;
  onContinue: () => void;
}

export const Step5Takeover: React.FC<Step5TakeoverProps> = ({
  step,
  datasets,
  onExecute,
  isRunning,
  onContinue,
}) => {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 text-xs font-bold flex items-center justify-center">
              5
            </span>
            <h3 className="text-base font-semibold text-neutral-100">
              Take Over Production Datasets
            </h3>
          </div>
          <p className="text-sm text-neutral-400 mt-1 pl-8">
            Take ownership of the newly deployed datasets in the Production workspace.
          </p>
        </div>
      </div>

      <div className="mt-5 pl-8">
        <p className="text-sm text-neutral-300 mb-4">
          The following {datasets.length} datasets require ownership takeover before their credentials can be updated or a refresh can be triggered.
        </p>

        {datasets.length > 0 && (
          <div className="bg-neutral-950 rounded-lg border border-neutral-800 overflow-hidden mb-6">
            <table className="w-full text-left text-sm text-neutral-400">
              <thead className="bg-neutral-900 text-xs uppercase text-neutral-300 border-b border-neutral-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Dataset Name</th>
                  <th className="px-4 py-3 font-semibold">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {datasets.map(d => (
                  <tr key={d.id} className="hover:bg-neutral-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-neutral-200">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        {d.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">{d.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-neutral-800">
          {step.status === 'success' ? (
            <button
              onClick={onContinue}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              Continue to Parameters
            </button>
          ) : (
            <button
              onClick={onExecute}
              disabled={isRunning || datasets.length === 0}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-700 disabled:text-neutral-500 text-neutral-950 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Taking Over...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  Take Over Datasets
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
