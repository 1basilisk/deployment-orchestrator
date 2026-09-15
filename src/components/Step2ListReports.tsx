import React from 'react';
import { FileBarChart2, Database, CheckSquare, Square, ArrowRight, Play, AlertCircle, ExternalLink, Calendar } from 'lucide-react';
import { StepState, Report, Dataset } from '../types';

interface Step2ListReportsProps {
  step: StepState;
  onExecute: () => void;
  isRunning: boolean;
  stageWorkspaceName?: string;
  reports: Report[];
  datasets: Dataset[];
  selectedReportIds: string[];
  selectedDatasetIds: string[];
  onToggleReport: (id: string) => void;
  onToggleDataset: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onContinue: () => void;
}

export const Step2ListReports: React.FC<Step2ListReportsProps> = ({
  step,
  onExecute,
  isRunning,
  stageWorkspaceName,
  reports,
  datasets,
  selectedReportIds,
  selectedDatasetIds,
  onToggleReport,
  onToggleDataset,
  onSelectAll,
  onDeselectAll,
  onContinue,
}) => {
  const totalSelected = selectedReportIds.length + selectedDatasetIds.length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h3 className="text-base font-semibold text-slate-100">
              List Existing Reports &amp; Semantic Models in Stage
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 pl-8">
            Enumerates reports and datasets from <span className="font-semibold text-slate-200">{stageWorkspaceName || 'Stage Workspace'}</span> via <code className="bg-slate-800 border border-slate-700 px-1 py-0.5 rounded text-amber-500 font-mono text-[11px]">GET /v1.0/myorg/groups/{'{stageWorkspaceId}'}/reports</code>.
          </p>
        </div>

        <button
          id="btn-execute-step-2"
          onClick={onExecute}
          disabled={isRunning}
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-2 rounded-lg text-xs font-semibold shadow-xl border border-slate-700 disabled:opacity-50 transition-all shrink-0"
        >
          {isRunning ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Scanning Reports...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{reports.length > 0 ? 'Refresh Artifacts List' : 'List Stage Reports'}</span>
            </>
          )}
        </button>
      </div>

      {step.error && (
        <div className="mt-4 p-3.5 bg-rose-900/30 border border-rose-500/30 rounded-lg flex items-start gap-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-400">Failed to List Reports</p>
            <p className="mt-0.5">{step.error}</p>
          </div>
        </div>
      )}

      {reports.length > 0 || datasets.length > 0 ? (
        <div className="mt-6 space-y-6">
          {/* Controls bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">Artifact Selection:</span>
              <span className="bg-amber-900/40 text-amber-500 font-bold px-2 py-0.5 rounded-full text-[11px] border border-amber-500/20">
                {selectedReportIds.length} of {reports.length} Reports
              </span>
              <span className="bg-blue-900/40 text-blue-400 font-bold px-2 py-0.5 rounded-full text-[11px] border border-blue-500/20">
                {selectedDatasetIds.length} of {datasets.length} Datasets
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="btn-select-all"
                onClick={onSelectAll}
                className="text-slate-400 hover:text-slate-100 font-medium px-2 py-1 rounded hover:bg-slate-800 transition-colors text-xs"
              >
                Select All
              </button>
              <span className="text-slate-700">|</span>
              <button
                id="btn-deselect-all"
                onClick={onDeselectAll}
                className="text-slate-400 hover:text-slate-100 font-medium px-2 py-1 rounded hover:bg-slate-800 transition-colors text-xs"
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Reports Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <FileBarChart2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Power BI Reports ({reports.length})</span>
            </h4>
            <div className="border border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-800 shadow-xl">
              {reports.map((report) => {
                const isSelected = selectedReportIds.includes(report.id);
                return (
                  <div
                    key={report.id}
                    onClick={() => onToggleReport(report.id)}
                    className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-amber-900/10 hover:bg-amber-900/20' : 'bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="text-amber-500 hover:text-amber-400"
                        aria-label={`Toggle ${report.name}`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-amber-500 fill-amber-900/40" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-slate-200">{report.name}</p>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 font-mono border border-slate-700">
                            {report.reportType || 'PowerBIReport'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Report ID: {report.id} • Bound Dataset: {report.datasetId || 'None'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {report.modifiedDateTime && (
                        <span className="hidden md:flex items-center gap-1 text-[11px] text-slate-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(report.modifiedDateTime).toLocaleDateString()}
                        </span>
                      )}
                      {report.webUrl && (
                        <a
                          href={report.webUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
                          title="Open in Power BI Service"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Datasets Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-500" />
              <span>Semantic Models / Datasets ({datasets.length})</span>
            </h4>
            <div className="border border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-800 shadow-xl">
              {datasets.map((dataset) => {
                const isSelected = selectedDatasetIds.includes(dataset.id);
                return (
                  <div
                    key={dataset.id}
                    onClick={() => onToggleDataset(dataset.id)}
                    className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-900/10 hover:bg-blue-900/20' : 'bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="text-blue-500 hover:text-blue-400"
                        aria-label={`Toggle ${dataset.name}`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-500 fill-blue-900/40" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600" />
                        )}
                      </button>
                      <div>
                        <p className="text-xs font-semibold text-slate-200">{dataset.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Dataset ID: {dataset.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-500 border border-emerald-500/20 font-medium">
                        Refreshable
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Continue button */}
          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              {totalSelected > 0 ? (
                <span className="text-emerald-500 font-medium">
                  ✓ Ready: {totalSelected} artifact{totalSelected > 1 ? 's' : ''} staged for deployment to Production.
                </span>
              ) : (
                <span className="text-amber-500 font-medium">
                  ⚠️ Select at least one report or dataset to trigger deployment.
                </span>
              )}
            </p>

            <button
              id="btn-step-2-continue"
              onClick={onContinue}
              disabled={totalSelected === 0}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg shadow-xl transition-colors disabled:opacity-40"
            >
              <span>Proceed to Step 3 (Deploy to Production)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8 text-center py-10 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
          <FileBarChart2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-300">Stage artifacts not yet retrieved</p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Click &quot;List Stage Reports&quot; above to query the reports and semantic models available for promotion.
          </p>
        </div>
      )}
    </div>
  );
};
