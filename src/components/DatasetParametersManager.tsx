import React, { useState, useEffect } from 'react';
import { Database, Sliders, CheckCircle2, Play, AlertCircle, Save, ArrowRight } from 'lucide-react';
import { Dataset, DatasetParameter } from '../types';

interface DatasetParametersManagerProps {
  workspaceType: 'Stage' | 'Production';
  datasets: Dataset[];
  workspaceId: string;
  onFetchParameters: (datasetId: string, wsId: string) => Promise<any>;
  onSaveParameters?: (datasetId: string, wsId: string, updates: { name: string; newValue: string }[]) => Promise<void>;
  onContinue: () => void;
  nextStepName: string;
  onRefreshLogs?: () => void;
}

export const DatasetParametersManager: React.FC<DatasetParametersManagerProps> = ({
  workspaceType,
  datasets,
  workspaceId,
  onFetchParameters,
  onSaveParameters,
  onContinue,
  nextStepName,
  onRefreshLogs
}) => {
  const [activeDatasetId, setActiveDatasetId] = useState<string>(datasets[0]?.id || '');
  const [paramsByDataset, setParamsByDataset] = useState<Record<string, DatasetParameter[]>>({});
  const [draftsByDataset, setDraftsByDataset] = useState<Record<string, Record<string, string>>>({});
  const [loadingDataset, setLoadingDataset] = useState<string | null>(null);
  const [savingDataset, setSavingDataset] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (datasets.length > 0 && !activeDatasetId) {
      setActiveDatasetId(datasets[0].id);
    }
  }, [datasets, activeDatasetId]);

  const activeDataset = datasets.find(d => d.id === activeDatasetId);
  const activeParams = paramsByDataset[activeDatasetId] || [];
  const activeDrafts = draftsByDataset[activeDatasetId] || {};

  const hasModifications = activeParams.some(
    (p) => activeDrafts[p.name] !== undefined && activeDrafts[p.name] !== p.currentValue
  );

  const handleFetch = async (datasetId: string) => {
    setLoadingDataset(datasetId);
    setError(null);
    try {
      const data = await onFetchParameters(datasetId, workspaceId);
      setParamsByDataset(prev => ({ ...prev, [datasetId]: data.parameters || [] }));
      onRefreshLogs?.();
    } catch (err: any) {
      setError(err.message || 'Failed to fetch parameters');
      onRefreshLogs?.();
    } finally {
      setLoadingDataset(null);
    }
  };

  const handleFetchAll = async () => {
    for (const d of datasets) {
      await handleFetch(d.id);
    }
  };

  const handleParamChange = (datasetId: string, paramName: string, value: string) => {
    setDraftsByDataset(prev => ({
      ...prev,
      [datasetId]: {
        ...(prev[datasetId] || {}),
        [paramName]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!onSaveParameters || !activeDatasetId) return;
    const updates = activeParams
      .filter(p => activeDrafts[p.name] !== undefined && activeDrafts[p.name] !== p.currentValue)
      .map(p => ({ name: p.name, newValue: activeDrafts[p.name] }));
    
    if (updates.length === 0) return;

    setSavingDataset(activeDatasetId);
    setError(null);
    try {
      await onSaveParameters(activeDatasetId, workspaceId, updates);
      onRefreshLogs?.();
      // Re-fetch to reflect changes
      await handleFetch(activeDatasetId);
      // Clear drafts for this dataset
      setDraftsByDataset(prev => ({
        ...prev,
        [activeDatasetId]: {}
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to update parameters');
      onRefreshLogs?.();
    } finally {
      setSavingDataset(null);
    }
  };

  if (datasets.length === 0) {
    return (
      <div className="mt-4">
        <div className="text-center py-10 border-2 border-dashed border-neutral-800 rounded-xl bg-neutral-900/50">
          <Sliders className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
          <p className="text-xs font-medium text-neutral-300">No datasets selected. You can skip this step.</p>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onContinue}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-bold px-4 py-2 rounded-lg shadow-xl transition-colors"
          >
            <span>{nextStepName}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  const isEditable = workspaceType === 'Production' && onSaveParameters !== undefined;

  return (
    <div className="mt-4">
      {/* Dataset Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        {datasets.map(d => {
          const isActive = d.id === activeDatasetId;
          const hasData = paramsByDataset[d.id] !== undefined;
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
              {d.hasDuplicateName && <span title="Duplicate name detected in Production workspace"><AlertCircle className="w-3.5 h-3.5 text-rose-500" /></span>}
              {hasData && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
            </button>
          );
        })}
        <button
          onClick={handleFetchAll}
          disabled={loadingDataset !== null}
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold bg-neutral-800 text-neutral-200 px-3 py-1.5 rounded-lg hover:bg-neutral-700 transition-colors"
        >
          <Play className="w-3.5 h-3.5" />
          Fetch All
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-rose-900/30 border border-rose-500/30 rounded-lg flex items-start gap-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-400">Parameter Operation Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {activeParams.length > 0 ? (
        <div className="border border-neutral-800 rounded-lg overflow-hidden shadow-xl bg-neutral-900">
          <div className="p-3 border-b border-neutral-800 flex justify-between items-center bg-neutral-950">
            <span className="text-xs font-bold text-neutral-200">
              {workspaceType} Parameters for: {activeDataset?.name}
            </span>
            <button
              onClick={() => handleFetch(activeDatasetId)}
              disabled={loadingDataset === activeDatasetId}
              className="text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2 py-1 rounded transition-colors"
            >
              {loadingDataset === activeDatasetId ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-900 text-neutral-400 font-semibold border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4 w-1/4">Parameter Name</th>
                  <th className="py-3 px-4 w-1/3">Current {workspaceType} Value</th>
                  {isEditable && <th className="py-3 px-4 w-1/3">New Value (To Apply)</th>}
                  <th className="py-3 px-4 w-1/6">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 bg-neutral-900/50">
                {activeParams.map((param) => {
                  const currentVal = param.currentValue;
                  const draftVal = activeDrafts[param.name] ?? currentVal;
                  const isChanged = draftVal !== currentVal;
                  return (
                    <tr key={param.name} className={isChanged ? 'bg-amber-900/10' : ''}>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-neutral-200">{param.name}</p>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-400 break-all">
                        {currentVal}
                      </td>
                      {isEditable && (
                        <td className="py-3.5 px-4">
                          <input
                            type="text"
                            value={draftVal}
                            onChange={(e) => handleParamChange(activeDatasetId, param.name, e.target.value)}
                            className={`w-full px-2.5 py-1.5 text-xs border rounded font-mono transition-colors focus:outline-none focus:ring-1 ${
                              isChanged
                                ? 'border-amber-500 bg-amber-900/40 text-amber-500 focus:ring-amber-500'
                                : 'border-neutral-700 bg-neutral-950 text-neutral-300 focus:ring-neutral-500'
                            }`}
                          />
                        </td>
                      )}
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-400">
                          {param.type}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {isEditable && (
            <div className="p-3 border-t border-neutral-800 bg-neutral-950 flex justify-end">
              <button
                onClick={handleSave}
                disabled={!hasModifications || savingDataset === activeDatasetId}
                className="flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-semibold px-4 py-2 rounded-lg shadow-xl transition-colors disabled:opacity-50"
              >
                {savingDataset === activeDatasetId ? 'Saving...' : <><Save className="w-3.5 h-3.5" /> Save {activeDataset?.name} Updates</>}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 border border-neutral-800 rounded-xl bg-neutral-900/50 mt-4">
          <p className="text-xs text-neutral-400 mb-2">Parameters not loaded for {activeDataset?.name}</p>
          <button
            onClick={() => handleFetch(activeDatasetId)}
            disabled={loadingDataset === activeDatasetId}
            className="bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
          >
            {loadingDataset === activeDatasetId ? 'Loading...' : 'Fetch Parameters'}
          </button>
        </div>
      )}

      {/* Footer Continue */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={onContinue}
          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-bold px-4 py-2 rounded-lg shadow-xl transition-colors"
        >
          <span>{nextStepName}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
