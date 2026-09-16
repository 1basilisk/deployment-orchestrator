import React from 'react';
import { StepState, Dataset } from '../types';
import { DatasetRefreshManager } from './DatasetRefreshManager';

interface Step5RefreshProps {
  step: StepState;
  datasets: Dataset[];
  workspaceId: string;
  onTriggerRefresh: (datasetId: string, wsId: string) => Promise<any>;
  onCheckStatus: (datasetId: string, wsId: string) => Promise<any>;
  onContinue: () => void;
  onRefreshLogs?: () => void;
}

export const Step5Refresh: React.FC<Step5RefreshProps> = ({
  step,
  datasets,
  workspaceId,
  onTriggerRefresh,
  onCheckStatus,
  onContinue,
  onRefreshLogs
}) => {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 text-xs font-bold flex items-center justify-center">
              7
            </span>
            <h3 className="text-base font-semibold text-neutral-100">
              Trigger &amp; Verify Semantic Model Refresh
            </h3>
          </div>
          <p className="text-xs text-neutral-400 mt-1 pl-8">
            Triggers on-demand dataset refresh and polls status for all selected datasets.
          </p>
        </div>
      </div>
      <DatasetRefreshManager
        datasets={datasets}
        workspaceId={workspaceId}
        onTriggerRefresh={onTriggerRefresh}
        onCheckStatus={onCheckStatus}
        onContinue={onContinue}
        onRefreshLogs={onRefreshLogs}
      />
    </div>
  );
};
