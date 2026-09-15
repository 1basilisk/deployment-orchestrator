import React, { useState } from 'react';
import { FileText, Search, Trash2, Download, Copy, Check, ChevronDown, ChevronRight, RefreshCw, Filter, ShieldCheck, Zap } from 'lucide-react';
import { ApiTransaction } from '../types';

interface LogsViewProps {
  logs: ApiTransaction[];
  onRefresh: () => void;
  onClear: () => void;
  isLoading: boolean;
}

export const LogsView: React.FC<LogsViewProps> = ({
  logs,
  onRefresh,
  onClear,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<'ALL' | 'GET' | 'POST'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'ERROR'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (methodFilter !== 'ALL' && log.method !== methodFilter) return false;
    if (statusFilter === 'SUCCESS' && (log.status < 200 || log.status >= 300)) return false;
    if (statusFilter === 'ERROR' && (log.status >= 200 && log.status < 300)) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const inUrl = log.url.toLowerCase().includes(q);
      const inErr = log.error?.toLowerCase().includes(q);
      const inReq = JSON.stringify(log.requestPayload || '').toLowerCase().includes(q);
      const inRes = JSON.stringify(log.responsePayload || '').toLowerCase().includes(q);
      return inUrl || inErr || inReq || inRes;
    }
    return true;
  });

  const handleCopyJson = (log: ApiTransaction) => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `powerbi-api-transactions-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Top Header & Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              <span>Power BI API Transaction Audit Trail</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono border border-slate-700">
                {logs.length} Recorded Transactions
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Full diagnostic stream of HTTP requests, authentication handshakes, payloads, and timing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-refresh-logs"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              id="btn-export-logs"
              onClick={handleExportJson}
              disabled={logs.length === 0}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              id="btn-clear-logs"
              onClick={onClear}
              disabled={logs.length === 0}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-900/30 hover:bg-rose-900/50 border border-rose-500/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Logs</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by URL, parameter, error message..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-slate-950 text-slate-200"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              {(['ALL', 'GET', 'POST'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethodFilter(m)}
                  className={`px-2.5 py-1 rounded font-medium ${
                    methodFilter === m ? 'bg-slate-600 text-slate-100 font-bold' : 'text-slate-400'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              {(['ALL', 'SUCCESS', 'ERROR'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded font-medium ${
                    statusFilter === s ? 'bg-slate-600 text-slate-100 font-bold' : 'text-slate-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table / Accordion */}
      {filteredLogs.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl divide-y divide-slate-800">
          {filteredLogs.map((log) => {
            const isExpanded = expandedId === log.id;
            const isSuccess = log.status >= 200 && log.status < 300;
            const isCopied = copiedId === log.id;

            return (
              <div key={log.id} className="transition-colors">
                {/* Collapsed Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-800 text-xs ${
                    isExpanded ? 'bg-slate-800/80' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <button
                      type="button"
                      className="text-slate-500 hover:text-slate-300 shrink-0"
                      aria-label="Expand details"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    {/* Method Badge */}
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] shrink-0 border ${
                        log.method === 'GET'
                          ? 'bg-blue-900/30 text-blue-400 border-blue-500/30'
                          : log.method === 'POST'
                          ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-900/30 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {log.method}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] shrink-0 border ${
                        isSuccess
                          ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-900/30 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {log.status}
                    </span>

                    {/* URL */}
                    <span className="font-mono text-slate-300 truncate text-[11px]" title={log.url}>
                      {log.url}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-slate-500 text-[11px]">
                    {/* Latency */}
                    <span className="font-mono">{log.durationMs}ms</span>

                    {/* Time */}
                    <span className="hidden md:inline font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 bg-slate-950 text-slate-200 text-xs font-mono space-y-3 border-t border-slate-800">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-[11px] text-slate-500">Transaction ID: {log.id}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyJson(log);
                        }}
                        className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-2 py-1 rounded transition-colors"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy JSON</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* URL & Headers */}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-500">Full Request URL</span>
                      <p className="text-slate-300 break-all select-all mt-0.5">{log.url}</p>
                    </div>

                    {/* Request Payload */}
                    {log.requestPayload && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-500">Request Body / Query</span>
                        <pre className="mt-1 p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] overflow-x-auto text-amber-200">
                          {JSON.stringify(log.requestPayload, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Response Payload */}
                    {log.responsePayload && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-500">Response Body</span>
                        <pre className="mt-1 p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] overflow-x-auto text-emerald-300 max-h-64">
                          {JSON.stringify(log.responsePayload, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Error Output */}
                    {log.error && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-rose-500">Error Details</span>
                        <p className="mt-1 p-2 bg-rose-950/60 border border-rose-900 rounded text-rose-300 text-xs">
                          {log.error}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl shadow-xl">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-300">No transactions match your query</p>
          <p className="text-xs text-slate-500 mt-1">
            Execute actions in the Deployment Pipeline tab to populate live API transaction records.
          </p>
        </div>
      )}
    </div>
  );
};
