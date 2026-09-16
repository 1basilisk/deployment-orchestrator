import React, { useState } from 'react';
import { FileBarChart2, Database, CheckSquare, Square, ArrowRight, Play, AlertCircle, ExternalLink, Calendar, Search } from 'lucide-react';
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
  autoSelectDataset?: boolean;
  onToggleAutoSelectDataset?: () => void;
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
  autoSelectDataset,
  onToggleAutoSelectDataset,
  onToggleReport,
  onToggleDataset,
  onSelectAll,
  onDeselectAll,
  onContinue,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredReports = reports.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.id.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredDatasets = datasets.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.id.toLowerCase().includes(searchQuery.toLowerCase()));

  const totalSelected = selectedReportIds.length + selectedDatasetIds.length;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h3 className="text-base font-semibold text-neutral-100">
              List Existing Reports &amp; Semantic Models in Stage
            </h3>
          </div>
          <p className="text-xs text-neutral-400 mt-1 pl-8">
            Enumerates reports and datasets from <span className="font-semibold text-neutral-200">{stageWorkspaceName || 'Stage Workspace'}</span> via <code className="bg-neutral-800 border border-neutral-700 px-1 py-0.5 rounded text-amber-500 font-mono text-[11px]">GET /v1.0/myorg/groups/{'{stageWorkspaceId}'}/reports</code>.
          </p>
        </div>

        <button
          id="btn-execute-step-2"
          onClick={onExecute}
          disabled={isRunning}
          className="flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 px-4 py-2 rounded-lg text-xs font-semibold shadow-xl border border-neutral-700 disabled:opacity-50 transition-all shrink-0"
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
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-neutral-950 p-3 rounded-lg border border-neutral-800 text-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-semibold text-neutral-300">Selection:</span>
                <span className="bg-amber-900/40 text-amber-500 font-bold px-2 py-0.5 rounded-full text-[11px] border border-amber-500/20">
                  {selectedReportIds.length} / {reports.length} Rep
                </span>
                <span className="bg-blue-900/40 text-blue-400 font-bold px-2 py-0.5 rounded-full text-[11px] border border-blue-500/20">
                  {selectedDatasetIds.length} / {datasets.length} Data
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={onSelectAll} className="text-neutral-400 hover:text-neutral-100 font-medium px-2 py-1 rounded hover:bg-neutral-800 transition-colors text-xs">Select All</button>
                <span className="text-neutral-700">|</span>
                <button onClick={onDeselectAll} className="text-neutral-400 hover:text-neutral-100 font-medium px-2 py-1 rounded hover:bg-neutral-800 transition-colors text-xs">Deselect All</button>
              </div>
            </div>
            
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-neutral-900 border border-neutral-700 text-neutral-200 text-[11px] rounded-lg pl-8 pr-3 py-1.5 w-full focus:outline-none focus:border-amber-500 transition-colors placeholder:text-neutral-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reports Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <FileBarChart2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Power BI Reports ({filteredReports.length}{searchQuery ? ` of ${reports.length}` : ''})</span>
              </h4>
              {onToggleAutoSelectDataset && (
                <label className="flex items-center gap-2 cursor-pointer group">
                  <span className="text-[10px] font-semibold text-neutral-400 group-hover:text-neutral-300 transition-colors uppercase tracking-wider">
                    Auto-select dataset
                  </span>
                  <div className={`relative w-8 h-4 rounded-full transition-colors ${autoSelectDataset ? 'bg-amber-500' : 'bg-neutral-700'}`}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={autoSelectDataset}
                      onChange={onToggleAutoSelectDataset}
                    />
                    <div className={`absolute left-0.5 top-0.5 w-3 h-3 bg-neutral-950 rounded-full transition-transform ${autoSelectDataset ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </label>
              )}
            </div>
            <div className="border border-neutral-800 rounded-lg overflow-hidden divide-y divide-neutral-800 shadow-xl">
              {filteredReports.map((report) => {
                const isSelected = selectedReportIds.includes(report.id);
                return (
                  <div
                    key={report.id}
                    onClick={() => onToggleReport(report.id)}
                    className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-amber-900/10 hover:bg-amber-900/20' : 'bg-neutral-900 hover:bg-neutral-800'
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
                          <Square className="w-4 h-4 text-neutral-600" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-neutral-200">{report.name}</p>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-950 text-neutral-400 font-mono border border-neutral-700">
                            {report.reportType || 'PowerBIReport'}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                          Report ID: {report.id} • Bound Dataset: {report.datasetId || 'None'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      {report.modifiedDateTime && (
                        <span className="hidden md:flex items-center gap-1 text-[11px] text-neutral-500">
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
                          className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700 rounded transition-colors"
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-500" />
              <span>Semantic Models / Datasets ({filteredDatasets.length}{searchQuery ? ` of ${datasets.length}` : ''})</span>
            </h4>
            <div className="border border-neutral-800 rounded-lg overflow-hidden divide-y divide-neutral-800 shadow-xl">
              {filteredDatasets.map((dataset) => {
                const isSelected = selectedDatasetIds.includes(dataset.id);
                return (
                  <div
                    key={dataset.id}
                    onClick={() => onToggleDataset(dataset.id)}
                    className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-900/10 hover:bg-blue-900/20' : 'bg-neutral-900 hover:bg-neutral-800'
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
                          <Square className="w-4 h-4 text-neutral-600" />
                        )}
                      </button>
                      <div>
                        <p className="text-xs font-semibold text-neutral-200">{dataset.name}</p>
                        <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
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

          </div>

          {/* Continue button */}
          <div className="mt-4 pt-4 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-neutral-400">
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
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-bold px-4 py-2 rounded-lg shadow-xl transition-colors disabled:opacity-40"
            >
              <span>Proceed to Step 3 (Deploy to Production)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8 text-center py-10 border-2 border-dashed border-neutral-800 rounded-xl bg-neutral-900/50">
          <FileBarChart2 className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
          <p className="text-xs font-medium text-neutral-300">Stage artifacts not yet retrieved</p>
          <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
            Click &quot;List Stage Reports&quot; above to query the reports and semantic models available for promotion.
          </p>
        </div>
      )}
    </div>
  );
};
