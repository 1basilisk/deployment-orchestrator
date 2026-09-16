import React from 'react';
import { StepState, Dataset } from '../types';
import { DatasetParametersManager } from './DatasetParametersManager';

interface Step4ParametersProps {
  step: StepState;
  datasets: Dataset[];
  workspaceId: string;
  onFetchParameters: (datasetId: string, wsId: string) => Promise<any>;
  onSaveParameters: (datasetId: string, wsId: string, updates: any[]) => Promise<void>;
  onContinue: () => void;
}

export const Step4Parameters: React.FC<Step4ParametersProps> = ({
  step,
  datasets,
  workspaceId,
  onFetchParameters,
  onSaveParameters,
  onContinue,
}) => {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 text-xs font-bold flex items-center justify-center">
              5
            </span>
            <h3 className="text-base font-semibold text-neutral-100">
              Check &amp; Update Prod Parameters
            </h3>
          </div>
          <div className="pl-8 mt-1 space-y-1">
            <p className="text-xs text-neutral-400">
              Inspects parameters in Production and updates connection strings or server endpoints.
            </p>
            <p className="text-[11px] font-mono text-neutral-500">
              Target Workspace ID: <span className="text-neutral-300 font-medium">{workspaceId || 'N/A'}</span>
            </p>
          </div>
        </div>
      </div>
      <DatasetParametersManager
        workspaceType="Production"
        datasets={datasets}
        workspaceId={workspaceId}
        onFetchParameters={onFetchParameters}
        onSaveParameters={onSaveParameters}
        onContinue={onContinue}
        nextStepName="Proceed to Dataset Refresh"
      />
    </div>
  );
};
