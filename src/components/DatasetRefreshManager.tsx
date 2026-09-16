import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, CheckCircle2, AlertCircle, Play, ArrowRight } from 'lucide-react';
import { Dataset, DatasetRefresh } from '../types';

interface DatasetRefreshManagerProps {
  datasets: Dataset[];
  workspaceId: string;
  onTriggerRefresh: (datasetId: string, wsId: string) => Promise<{ refreshId?: string }>;
  onCheckStatus: (datasetId: string, wsId: string) => Promise<any>;
  onContinue: () => void;
  onRefreshLogs?: () => void;
}

export const DatasetRefreshManager: React.FC<DatasetRefreshManagerProps> = ({
  datasets,
  workspaceId,
  onTriggerRefresh,
  onCheckStatus,
  onContinue,
  onRefreshLogs
}) => {
  const [activeDatasetId, setActiveDatasetId] = useState<string>(datasets[0]?.id || '');
  const [refreshIds, setRefreshIds] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, DatasetRefresh>>({});
  const [loadingDataset, setLoadingDataset] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (datasets.length > 0 && !activeDatasetId) {
      setActiveDatasetId(datasets[0].id);
    }
  }, [datasets, activeDatasetId]);

  const activeDataset = datasets.find(d => d.id === activeDatasetId);
  const activeRefreshId = refreshIds[activeDatasetId];
  const activeStatus = statuses[activeDatasetId];

  const handleTrigger = async (datasetId: string) => {
    setLoadingDataset(datasetId);
    setError(null);
    try {
      const data = await onTriggerRefresh(datasetId, workspaceId);
      if (data.refreshId) {
        setRefreshIds(prev => ({ ...prev, [datasetId]: data.refreshId! }));
      }
      onRefreshLogs?.();
      
      // Auto-poll status once after triggering
      setTimeout(() => handleCheckStatus(datasetId), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to trigger refresh');
      onRefreshLogs?.();
    } finally {
      setLoadingDataset(null);
    }
  };

  const handleTriggerAll = async () => {
    for (const d of datasets) {
      if (!refreshIds[d.id] || statuses[d.id]?.status === 'Completed' || statuses[d.id]?.status === 'Failed') {
        await handleTrigger(d.id);
      }
    }
  };

  const handleCheckStatus = async (datasetId: string) => {
    setLoadingDataset(datasetId + '_status');
    setError(null);
    try {
      const data = await onCheckStatus(datasetId, workspaceId);
      setStatuses(prev => ({ ...prev, [datasetId]: data.refresh }));
      onRefreshLogs?.();
    } catch (err: any) {
      setError(err.message || 'Failed to check status');
      onRefreshLogs?.();
    } finally {
      setLoadingDataset(null);
    }
  };

  const handleCheckAll = async () => {
    for (const d of datasets) {
      if (refreshIds[d.id] && statuses[d.id]?.status !== 'Completed') {
        await handleCheckStatus(d.id);
      }
    }
  };

  if (datasets.length === 0) {
    return (
      <div className="mt-4">
        <div className="text-center py-10 border-2 border-dashed border-neutral-800 rounded-xl bg-neutral-900/50">
          <RefreshCw className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
          <p className="text-xs font-medium text-neutral-300">No datasets selected to refresh. You can complete the workflow.</p>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onContinue}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-bold px-4 py-2 rounded-lg shadow-xl transition-colors"
          >
            <span>{"Complete Workflow"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Dataset Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        {datasets.map(d => {
          const isActive = d.id === activeDatasetId;
          const status = statuses[d.id]?.status;
          return (
            <button
              key={d.id}
              onClick={() => setActiveDatasetId(d.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              {d.name}
              {status === 'Completed' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
              {status === 'Failed' && <AlertCircle className="w-3 h-3 text-rose-500" />}
              {(status === 'Executing' || status === 'Unknown') && <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />}
            </button>
          );
        })}
        <button
          onClick={handleTriggerAll}
          disabled={loadingDataset !== null}
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold bg-neutral-800 text-neutral-200 px-3 py-1.5 rounded-lg hover:bg-neutral-700 transition-colors"
        >
          <Play className="w-3.5 h-3.5" />
          Trigger All
        </button>
        <button
          onClick={handleCheckAll}
          disabled={loadingDataset !== null}
          className="flex items-center gap-1.5 text-xs font-semibold bg-neutral-800 text-neutral-200 px-3 py-1.5 rounded-lg hover:bg-neutral-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Poll All
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-rose-900/30 border border-rose-500/30 rounded-lg flex items-start gap-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-400">Refresh Operation Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div className="border border-neutral-800 rounded-lg p-5 bg-neutral-900 shadow-xl">
        <h4 className="text-sm font-bold text-neutral-100 mb-4">{activeDataset?.name} - Refresh Management</h4>
        
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => handleTrigger(activeDatasetId)}
            disabled={loadingDataset === activeDatasetId || activeStatus?.status === 'Executing'}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
          >
            {loadingDataset === activeDatasetId ? 'Queueing...' : <><Play className="w-3.5 h-3.5" /> Trigger Refresh</>}
          </button>
          
          <button
            onClick={() => handleCheckStatus(activeDatasetId)}
            disabled={loadingDataset === activeDatasetId + '_status'}
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
          >
            {loadingDataset === activeDatasetId + '_status' ? 'Checking...' : <><RefreshCw className="w-3.5 h-3.5" /> Check Status</>}
          </button>
        </div>

        {activeStatus ? (
          <div className={`p-4 border rounded-xl flex flex-col gap-2 ${
            activeStatus.status === 'Completed' ? 'bg-emerald-900/10 border-emerald-500/30' :
            activeStatus.status === 'Failed' ? 'bg-rose-900/10 border-rose-500/30' :
            'bg-amber-900/10 border-amber-500/30'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full border ${
                activeStatus.status === 'Completed' ? 'bg-emerald-900/40 text-emerald-400 border-emerald-500/30' :
                activeStatus.status === 'Failed' ? 'bg-rose-900/40 text-rose-400 border-rose-500/30' :
                'bg-amber-900/40 text-amber-400 border-amber-500/30'
              }`}>
                {activeStatus.status}
              </span>
              <span className="text-xs text-neutral-300">
                {activeStatus.startTime ? new Date(activeStatus.startTime).toLocaleString() : 'Recently queued'}
              </span>
            </div>
            {activeStatus.serviceExceptionJson && (
              <div className="mt-2 text-[10px] font-mono text-rose-400 bg-rose-950/50 p-2 rounded break-all">
                {activeStatus.serviceExceptionJson}
              </div>
            )}
          </div>
        ) : activeRefreshId ? (
          <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl">
            <p className="text-xs text-neutral-400">Refresh Queued. Request ID: <span className="font-mono text-amber-500">{activeRefreshId}</span></p>
          </div>
        ) : (
          <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl">
            <p className="text-xs text-neutral-500">No active refresh running for this dataset.</p>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={onContinue}
          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-bold px-4 py-2 rounded-lg shadow-xl transition-colors"
        >
          <span>Complete Workflow</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
