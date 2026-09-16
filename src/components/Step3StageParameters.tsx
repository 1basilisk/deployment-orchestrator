import React from 'react';
import { StepState, Dataset } from '../types';
import { DatasetParametersManager } from './DatasetParametersManager';

interface Step3StageParametersProps {
  step: StepState;
  datasets: Dataset[];
  workspaceId: string;
  onFetchParameters: (datasetId: string, wsId: string) => Promise<any>;
  onContinue: () => void;
}

export const Step3StageParameters: React.FC<Step3StageParametersProps> = ({
  step,
  datasets,
  workspaceId,
  onFetchParameters,
  onContinue,
}) => {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 text-xs font-bold flex items-center justify-center">
              3
            </span>
            <h3 className="text-base font-semibold text-neutral-100">
              Check Stage Parameters (Optional)
            </h3>
          </div>
          <p className="text-xs text-neutral-400 mt-1 pl-8">
            Review parameters in the Stage Workspace before deployment.
          </p>
        </div>
      </div>
      <DatasetParametersManager
        workspaceType="Stage"
        datasets={datasets}
        workspaceId={workspaceId}
        onFetchParameters={onFetchParameters}
        onContinue={onContinue}
        nextStepName="Proceed to Deployment"
      />
    </div>
  );
};
