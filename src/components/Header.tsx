import React from 'react';
import { Power, Settings, FileText, Activity, Server, ShieldCheck, RefreshCcw } from 'lucide-react';
import { DeploymentConfig } from '../types';

interface HeaderProps {
  activeTab: 'pipeline' | 'logs';
  setActiveTab: (tab: 'pipeline' | 'logs') => void;
  config: DeploymentConfig | null;
  logsCount: number;
  onResetWorkflow: () => void;
  isDeploying: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  config,
  logsCount,
  onResetWorkflow,
  isDeploying,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between h-auto md:h-16 py-4 md:py-0 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 p-2 rounded-lg border border-amber-500/30">
              <Power className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Power BI Deployment Orchestrator
                <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold bg-slate-800 text-slate-400 border border-slate-700">
                  v1.0
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Server className="w-3 h-3" /> Target Pipeline: <span className="font-mono text-slate-300">{config?.pipelineId || 'Not Configured'}</span>
              </p>
            </div>
          </div>

          {/* Navigation & Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            
            {/* Primary Navigation Tabs */}
            <nav className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveTab('pipeline')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'pipeline'
                    ? 'bg-slate-800 text-amber-400 shadow-xs border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Pipeline Flow
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'logs'
                    ? 'bg-slate-800 text-amber-400 shadow-xs border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Logs
                {logsCount > 0 && (
                  <span className="ml-1 bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded-full text-[10px]">
                    {logsCount > 99 ? '99+' : logsCount}
                  </span>
                )}
              </button>
            </nav>

            <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>

            {/* Reset Button */}
            <button
              onClick={onResetWorkflow}
              disabled={isDeploying}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Reset Flow
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
