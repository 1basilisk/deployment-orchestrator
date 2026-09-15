import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Stepper } from './components/Stepper';
import { Step1WorkspaceInfo } from './components/Step1WorkspaceInfo';
import { Step2ListReports } from './components/Step2ListReports';
import { Step3Deploy } from './components/Step3Deploy';
import { Step4Parameters } from './components/Step4Parameters';
import { Step5Refresh } from './components/Step5Refresh';
import { Step6CheckStatus } from './components/Step6CheckStatus';
import { LogsView } from './components/LogsView';
import { apiClient } from './services/api';
import {
  StepId,
  StepState,
  DeploymentConfig,
  ApiTransaction,
  Pipeline,
  Report,
  Dataset,
  DatasetParameter,
  DeploymentOperation,
  DatasetRefresh,
} from './types';

const INITIAL_STEPS: StepState[] = [
  {
    id: 1,
    title: 'Workspace & Pipeline Info',
    shortDesc: 'Discover stages & bindings',
    status: 'idle',
  },
  {
    id: 2,
    title: 'List Stage Reports',
    shortDesc: 'Enumerate reports & models',
    status: 'idle',
  },
  {
    id: 3,
    title: 'Deploy to Production',
    shortDesc: 'Trigger deploy & verify 200',
    status: 'idle',
  },
  {
    id: 4,
    title: 'Check & Update Parameters',
    shortDesc: 'Configure production endpoints',
    status: 'idle',
  },
  {
    id: 5,
    title: 'Dataset Refresh',
    shortDesc: 'Trigger cloud semantic refresh',
    status: 'idle',
  },
  {
    id: 6,
    title: 'Verify Refresh Status',
    shortDesc: 'Poll until Completed state',
    status: 'idle',
  },
];

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'pipeline' | 'logs'>('pipeline');

  // Config & Logs
  const [config, setConfig] = useState<DeploymentConfig | null>(null);
  const [logs, setLogs] = useState<ApiTransaction[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Stepper & Auto-advance
  const [steps, setSteps] = useState<StepState[]>(INITIAL_STEPS);
  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(true);

  // Step 1: Pipeline Data
  const [pipelineData, setPipelineData] = useState<{
    pipeline?: Pipeline;
    stageWorkspace?: { id: string; name: string; capacity?: string };
    prodWorkspace?: { id: string; name: string; capacity?: string };
    simulated?: boolean;
  } | null>(null);
  const [isStep1Running, setIsStep1Running] = useState(false);

  // Step 2: Reports & Datasets
  const [stageReports, setStageReports] = useState<Report[]>([]);
  const [stageDatasets, setStageDatasets] = useState<Dataset[]>([]);
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<string[]>([]);
  const [isStep2Running, setIsStep2Running] = useState(false);

  // Step 3: Deployment Trigger & Poll
  const [operation, setOperation] = useState<DeploymentOperation | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [isStep3Running, setIsStep3Running] = useState(false);
  const [deploymentNote, setDeploymentNote] = useState('Automated promotion from Stage to Production');

  // Step 4: Parameters
  const [parameters, setParameters] = useState<DatasetParameter[]>([]);
  const [paramDrafts, setParamDrafts] = useState<Record<string, string>>({});
  const [isStep4Running, setIsStep4Running] = useState(false);
  const [isSavingParams, setIsSavingParams] = useState(false);

  // Step 5: Refresh
  const [refreshId, setRefreshId] = useState<string | null>(null);
  const [isStep5Running, setIsStep5Running] = useState(false);

  // Step 6: Refresh Poll
  const [latestRefresh, setLatestRefresh] = useState<DatasetRefresh | null>(null);
  const [refreshPollCount, setRefreshPollCount] = useState(0);
  const [isStep6Running, setIsStep6Running] = useState(false);

  // Helper to update a single step's state
  const updateStepState = useCallback((id: StepId, patch: Partial<StepState>) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  }, []);

  // Fetch initial config & logs on mount
  const refreshLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const data = await apiClient.getLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load logs', err);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      const cfg = await apiClient.getConfig();
      setConfig(cfg);
    } catch (err) {
      console.error('Failed to load config', err);
    }
  }, []);

  useEffect(() => {
    loadConfig();
    refreshLogs();
  }, [loadConfig, refreshLogs]);

  // Handle Toggle Demo Mode - Removed

  // Clear Logs
  const handleClearLogs = async () => {
    try {
      await apiClient.clearLogs();
      setLogs([]);
    } catch (err) {
      console.error('Failed to clear logs', err);
    }
  };

  // Reset Entire Workflow
  const handleResetWorkflow = () => {
    setSteps(INITIAL_STEPS);
    setCurrentStep(1);
    setPipelineData(null);
    setStageReports([]);
    setStageDatasets([]);
    setSelectedReportIds([]);
    setSelectedDatasetIds([]);
    setOperation(null);
    setPollCount(0);
    setParameters([]);
    setParamDrafts({});
    setRefreshId(null);
    setLatestRefresh(null);
    setRefreshPollCount(0);
  };

  // -------------------------------------------------------------
  // STEP 1 EXECUTION: Retrieve Workspace & Pipeline Info
  // -------------------------------------------------------------
  const executeStep1 = async (advance = isAutoAdvancing) => {
    setIsStep1Running(true);
    updateStepState(1, { status: 'running', startedAt: new Date().toISOString(), error: undefined });

    try {
      const data = await apiClient.getPipelineInfo();
      setPipelineData(data);
      updateStepState(1, {
        status: 'success',
        completedAt: new Date().toISOString(),
        details: data,
      });
      await refreshLogs();

      if (advance) {
        setCurrentStep(2);
        // Automatically start Step 2
        setTimeout(() => executeStep2(true, data.stageWorkspace?.id), 300);
      }
    } catch (err: any) {
      updateStepState(1, { status: 'failed', error: err.message });
      await refreshLogs();
    } finally {
      setIsStep1Running(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 2 EXECUTION: List Existing Reports & Datasets in Stage
  // -------------------------------------------------------------
  const executeStep2 = async (advance = isAutoAdvancing, workspaceIdOverride?: string) => {
    const wsId = workspaceIdOverride || pipelineData?.stageWorkspace?.id || config?.stageWorkspaceId;
    setIsStep2Running(true);
    updateStepState(2, { status: 'running', startedAt: new Date().toISOString(), error: undefined });

    try {
      const data = await apiClient.getStageArtifacts(wsId);
      setStageReports(data.reports);
      setStageDatasets(data.datasets);

      // Default select first two reports and primary dataset
      const defaultReports = data.reports.slice(0, 2).map((r) => r.id);
      const defaultDatasets = data.datasets.slice(0, 1).map((d) => d.id);
      setSelectedReportIds(defaultReports);
      setSelectedDatasetIds(defaultDatasets);

      updateStepState(2, {
        status: 'success',
        completedAt: new Date().toISOString(),
        details: { reportsCount: data.reports.length, datasetsCount: data.datasets.length },
      });
      await refreshLogs();

      if (advance) {
        setCurrentStep(3);
      }
    } catch (err: any) {
      updateStepState(2, { status: 'failed', error: err.message });
      await refreshLogs();
    } finally {
      setIsStep2Running(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 3 EXECUTION: Trigger Deployment & Poll Until Succeeded
  // -------------------------------------------------------------
  const executeStep3 = async (advance = isAutoAdvancing) => {
    setIsStep3Running(true);
    setPollCount(0);
    updateStepState(3, { status: 'running', startedAt: new Date().toISOString(), error: undefined });

    try {
      // 1. Trigger deployment
      const triggerRes = await apiClient.triggerDeploy({
        pipelineId: config?.pipelineId,
        sourceStageOrder: 1,
        targetStageOrder: 2,
        reportIds: selectedReportIds,
        datasetIds: selectedDatasetIds,
        note: deploymentNote,
      });

      const opId = triggerRes.operationId;
      setOperation({
        id: opId,
        status: 'Executing',
        sourceStageOrder: 1,
        targetStageOrder: 2,
        executionStartTime: new Date().toISOString(),
      });
      await refreshLogs();

      // 2. Poll operation status until Succeeded or Failed
      let pollAttempt = 0;
      let isCompleted = false;

      while (!isCompleted && pollAttempt < 30) {
        pollAttempt++;
        setPollCount(pollAttempt);
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const statusRes = await apiClient.getOperationStatus(opId, config?.pipelineId);
        setOperation(statusRes.operation);
        await refreshLogs();

        if (statusRes.operation.status === 'Succeeded') {
          isCompleted = true;
          updateStepState(3, {
            status: 'success',
            completedAt: new Date().toISOString(),
            details: statusRes.operation,
          });

          if (advance) {
            setCurrentStep(4);
            // Automatically fetch parameters in Step 4
            setTimeout(() => executeStep4Fetch(true), 400);
          }
          break;
        } else if (statusRes.operation.status === 'Failed') {
          throw new Error(statusRes.operation.error?.message || 'Deployment operation reported failure from Power BI.');
        }
      }

      if (!isCompleted) {
        throw new Error('Deployment operation timed out while polling.');
      }
    } catch (err: any) {
      updateStepState(3, { status: 'failed', error: err.message });
      await refreshLogs();
    } finally {
      setIsStep3Running(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 4 EXECUTION: Check & Update Parameters
  // -------------------------------------------------------------
  const getActiveDatasetId = () => {
    if (selectedDatasetIds.length > 0) return selectedDatasetIds[0];
    if (stageDatasets.length > 0) return stageDatasets[0].id;
    return 'ds-fin-01';
  };

  const executeStep4Fetch = async (advance = false) => {
    const datasetId = getActiveDatasetId();
    setIsStep4Running(true);
    updateStepState(4, { status: 'running', startedAt: new Date().toISOString(), error: undefined });

    try {
      const data = await apiClient.getDatasetParameters(datasetId, pipelineData?.prodWorkspace?.id);
      setParameters(data.parameters);

      const drafts: Record<string, string> = {};
      for (const p of data.parameters) {
        drafts[p.name] = p.currentValue;
      }
      setParamDrafts(drafts);

      // Keep in waiting_user state so user can review parameters
      updateStepState(4, {
        status: 'waiting_user',
        details: { count: data.parameters.length },
      });
      await refreshLogs();
    } catch (err: any) {
      updateStepState(4, { status: 'failed', error: err.message });
      await refreshLogs();
    } finally {
      setIsStep4Running(false);
    }
  };

  const handleSaveParameters = async (advance = isAutoAdvancing) => {
    const datasetId = getActiveDatasetId();
    setIsSavingParams(true);
    updateStepState(4, { status: 'running', error: undefined });

    try {
      const updateDetails: Array<{ name: string; newValue: string }> = Object.entries(paramDrafts).map(
        ([name, newValue]) => ({
          name,
          newValue: String(newValue),
        })
      );

      const res = await apiClient.updateDatasetParameters(datasetId, updateDetails, pipelineData?.prodWorkspace?.id);
      if (res.parameters) {
        setParameters(res.parameters);
      }

      updateStepState(4, {
        status: 'success',
        completedAt: new Date().toISOString(),
        details: { updatedCount: updateDetails.length },
      });
      await refreshLogs();

      if (advance) {
        setCurrentStep(5);
        setTimeout(() => executeStep5(true), 300);
      }
    } catch (err: any) {
      updateStepState(4, { status: 'failed', error: err.message });
      await refreshLogs();
    } finally {
      setIsSavingParams(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 5 EXECUTION: Trigger Dataset Refresh
  // -------------------------------------------------------------
  const executeStep5 = async (advance = isAutoAdvancing) => {
    const datasetId = getActiveDatasetId();
    setIsStep5Running(true);
    updateStepState(5, { status: 'running', startedAt: new Date().toISOString(), error: undefined });

    try {
      const res = await apiClient.triggerRefresh(datasetId, pipelineData?.prodWorkspace?.id);
      setRefreshId(res.refreshId || `ref-${Date.now()}`);

      updateStepState(5, {
        status: 'success',
        completedAt: new Date().toISOString(),
        details: res,
      });
      await refreshLogs();

      if (advance) {
        setCurrentStep(6);
        setTimeout(() => executeStep6(), 400);
      }
    } catch (err: any) {
      updateStepState(5, { status: 'failed', error: err.message });
      await refreshLogs();
    } finally {
      setIsStep5Running(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 6 EXECUTION: Check Refresh Status
  // -------------------------------------------------------------
  const executeStep6 = async () => {
    const datasetId = getActiveDatasetId();
    setIsStep6Running(true);
    setRefreshPollCount(0);
    updateStepState(6, { status: 'running', startedAt: new Date().toISOString(), error: undefined });

    try {
      let pollAttempt = 0;
      let isCompleted = false;

      while (!isCompleted && pollAttempt < 25) {
        pollAttempt++;
        setRefreshPollCount(pollAttempt);
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const res = await apiClient.getRefreshStatus(datasetId, pipelineData?.prodWorkspace?.id);
        setLatestRefresh(res.refresh);
        await refreshLogs();

        if (res.refresh.status === 'Completed') {
          isCompleted = true;
          updateStepState(6, {
            status: 'success',
            completedAt: new Date().toISOString(),
            details: res.refresh,
          });
          break;
        } else if (res.refresh.status === 'Failed') {
          throw new Error(res.refresh.serviceExceptionJson || 'Power BI dataset refresh failed with engine exception.');
        }
      }

      if (!isCompleted) {
        throw new Error('Refresh polling timed out waiting for Completed status.');
      }
    } catch (err: any) {
      updateStepState(6, { status: 'failed', error: err.message });
      await refreshLogs();
    } finally {
      setIsStep6Running(false);
    }
  };

  // Selection handlers
  const handleToggleReport = (id: string) => {
    setSelectedReportIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleDataset = (id: string) => {
    setSelectedDatasetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedReportIds(stageReports.map((r) => r.id));
    setSelectedDatasetIds(stageDatasets.map((d) => d.id));
  };

  const handleDeselectAll = () => {
    setSelectedReportIds([]);
    setSelectedDatasetIds([]);
  };

  const isAnyExecuting =
    isStep1Running || isStep2Running || isStep3Running || isStep4Running || isStep5Running || isStep6Running;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
        logsCount={logs.length}
        onResetWorkflow={handleResetWorkflow}
        isDeploying={isAnyExecuting}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: PIPELINE FLOW */}
        {activeTab === 'pipeline' && (
          <div>
            {/* Visual 6-Step Stepper Progress Bar */}
            <Stepper
              steps={steps}
              currentStep={currentStep}
              onSelectStep={(id) => setCurrentStep(id)}
              isAutoAdvancing={isAutoAdvancing}
              onToggleAutoAdvance={() => setIsAutoAdvancing(!isAutoAdvancing)}
            />

            {/* Step Card Rendered According to Current Selection */}
            <div>
              {currentStep === 1 && (
                <Step1WorkspaceInfo
                  step={steps[0]}
                  onExecute={() => executeStep1(false)}
                  isRunning={isStep1Running}
                  pipelineData={pipelineData}
                  onContinue={() => {
                    setCurrentStep(2);
                    if (stageReports.length === 0) executeStep2(false);
                  }}
                />
              )}

              {currentStep === 2 && (
                <Step2ListReports
                  step={steps[1]}
                  onExecute={() => executeStep2(false)}
                  isRunning={isStep2Running}
                  stageWorkspaceName={pipelineData?.stageWorkspace?.name}
                  reports={stageReports}
                  datasets={stageDatasets}
                  selectedReportIds={selectedReportIds}
                  selectedDatasetIds={selectedDatasetIds}
                  onToggleReport={handleToggleReport}
                  onToggleDataset={handleToggleDataset}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                  onContinue={() => setCurrentStep(3)}
                />
              )}

              {currentStep === 3 && (
                <Step3Deploy
                  step={steps[2]}
                  onTriggerDeploy={() => executeStep3(false)}
                  isRunning={isStep3Running}
                  operation={operation}
                  pollCount={pollCount}
                  selectedReportsCount={selectedReportIds.length}
                  selectedDatasetsCount={selectedDatasetIds.length}
                  deploymentNote={deploymentNote}
                  setDeploymentNote={setDeploymentNote}
                  onContinue={() => {
                    setCurrentStep(4);
                    if (parameters.length === 0) executeStep4Fetch(false);
                  }}
                />
              )}

              {currentStep === 4 && (
                <Step4Parameters
                  step={steps[3]}
                  onFetchParameters={() => executeStep4Fetch(false)}
                  onSaveParameters={() => handleSaveParameters(false)}
                  isRunning={isStep4Running}
                  isSaving={isSavingParams}
                  parameters={parameters}
                  paramDrafts={paramDrafts}
                  onParamChange={(name, value) =>
                    setParamDrafts((prev) => ({ ...prev, [name]: value }))
                  }
                  onContinue={() => {
                    updateStepState(4, { status: 'success' });
                    setCurrentStep(5);
                  }}
                  activeDatasetName={stageDatasets.find((d) => d.id === getActiveDatasetId())?.name}
                />
              )}

              {currentStep === 5 && (
                <Step5Refresh
                  step={steps[4]}
                  onTriggerRefresh={() => executeStep5(false)}
                  isRunning={isStep5Running}
                  refreshId={refreshId}
                  activeDatasetName={stageDatasets.find((d) => d.id === getActiveDatasetId())?.name}
                  onContinue={() => setCurrentStep(6)}
                />
              )}

              {currentStep === 6 && (
                <Step6CheckStatus
                  step={steps[5]}
                  onCheckStatus={executeStep6}
                  isRunning={isStep6Running}
                  refresh={latestRefresh}
                  pollCount={refreshPollCount}
                  prodWorkspaceName={pipelineData?.prodWorkspace?.name}
                  onViewLogs={() => setActiveTab('logs')}
                  onRestartPipeline={handleResetWorkflow}
                />
              )}
            </div>
          </div>
        )}

        {/* TAB 2: API TRANSACTION LOGS */}
        {activeTab === 'logs' && (
          <LogsView
            logs={logs}
            onRefresh={refreshLogs}
            onClear={handleClearLogs}
            isLoading={isLoadingLogs}
          />
        )}
      </main>

      {/* Persistent Bottom Status Strip */}
      <footer className="bg-slate-900 border-t border-slate-800 py-2.5 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="font-semibold text-slate-400">Service Status: Connected</span>
            <span className="text-slate-700">|</span>
            <span>API Target: {config?.apiBaseUrl || 'https://api.powerbi.com'}</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>Mode: Live Entra ID</span>
            <span>&bull;</span>
            <span>Pipeline: {config?.pipelineId || 'Not set'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
