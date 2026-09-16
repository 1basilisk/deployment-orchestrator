import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Stepper } from './components/Stepper';
import { Step1WorkspaceInfo } from './components/Step1WorkspaceInfo';
import { Step2ListReports } from './components/Step2ListReports';
import { Step3StageParameters } from './components/Step3StageParameters';
import { Step3Deploy } from './components/Step3Deploy';
import { Step4Parameters } from './components/Step4Parameters';
import { Step5Refresh } from './components/Step5Refresh';
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
  DeploymentOperation,
} from './types';

const INITIAL_STEPS: StepState[] = [
  { id: 1, title: 'Workspace & Pipeline Info', shortDesc: 'Discover stages & bindings', status: 'idle' },
  { id: 2, title: 'List Stage Reports', shortDesc: 'Enumerate reports & models', status: 'idle' },
  { id: 3, title: 'Check Stage Parameters (Optional)', shortDesc: 'Review pre-deployment parameters', status: 'idle' },
  { id: 4, title: 'Deploy to Production', shortDesc: 'Trigger deploy & verify 200', status: 'idle' },
  { id: 5, title: 'Check & Update Prod Parameters', shortDesc: 'Configure production endpoints', status: 'idle' },
  { id: 6, title: 'Trigger & Verify Refresh', shortDesc: 'Trigger & poll semantic refresh', status: 'idle' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'logs'>('pipeline');
  const [activePipelineId, setActivePipelineId] = useState<string>('');

  const [config, setConfig] = useState<DeploymentConfig | null>(null);
  const [logs, setLogs] = useState<ApiTransaction[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const [steps, setSteps] = useState<StepState[]>(INITIAL_STEPS);
  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(true);
  const isAutoAdvancingRef = useRef(isAutoAdvancing);
  useEffect(() => {
    isAutoAdvancingRef.current = isAutoAdvancing;
  }, [isAutoAdvancing]);

  // Step 1
  const [pipelineData, setPipelineData] = useState<{
    pipeline?: Pipeline;
    stageWorkspace?: { id: string; name: string; capacity?: string };
    prodWorkspace?: { id: string; name: string; capacity?: string };
  } | null>(null);
  const [isStep1Running, setIsStep1Running] = useState(false);

  // Step 2
  const [stageReports, setStageReports] = useState<Report[]>([]);
  const [stageDatasets, setStageDatasets] = useState<Dataset[]>([]);
  const [prodReports, setProdReports] = useState<Report[]>([]);
  const [prodDatasets, setProdDatasets] = useState<Dataset[]>([]);
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<string[]>([]);
  const [autoSelectDataset, setAutoSelectDataset] = useState(true);
  const [isStep2Running, setIsStep2Running] = useState(false);

  // Step 4 (Deploy)
  const [operation, setOperation] = useState<DeploymentOperation | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [isStep4Running, setIsStep4Running] = useState(false);
  const [deploymentNote, setDeploymentNote] = useState('Automated promotion from Stage to Production');

  const updateStepState = useCallback((id: StepId, patch: Partial<StepState>) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  }, []);

  const refreshLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const data = await apiClient.getLogs();
      setLogs(data);
    } catch {
      // Ignore
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    apiClient.getConfig().then((c) => {
      setConfig(c);
      if (c.pipelineIds && c.pipelineIds.length > 0) setActivePipelineId(c.pipelineIds[0]);
    });
    refreshLogs();
  }, [refreshLogs]);

  const handleResetWorkflow = () => {
    setSteps(INITIAL_STEPS);
    setCurrentStep(1);
    setPipelineData(null);
    setStageReports([]);
    setStageDatasets([]);
    setProdReports([]);
    setProdDatasets([]);
    setSelectedReportIds([]);
    setSelectedDatasetIds([]);
    setOperation(null);
    setPollCount(0);
  };

  const executeStep1 = async (advance = isAutoAdvancing) => {
    setIsStep1Running(true);
    updateStepState(1, { status: 'running', startedAt: new Date().toISOString(), error: undefined });
    try {
      const data = await apiClient.getPipelineInfo(activePipelineId);
      setPipelineData(data);
      updateStepState(1, { status: 'success', completedAt: new Date().toISOString(), details: data });
      await refreshLogs();
      if (advance) {
        setCurrentStep(2);
      }
    } catch (err: any) {
      updateStepState(1, { status: 'failed', error: err.message });
      await refreshLogs();
    } finally {
      setIsStep1Running(false);
    }
  };

  const executeStep2 = async (advance = isAutoAdvancing, wsId?: string) => {
    const targetWsId = wsId || pipelineData?.stageWorkspace?.id || config?.stageWorkspaceId;
    if (!targetWsId) return;
    setIsStep2Running(true);
    updateStepState(2, { status: 'running', startedAt: new Date().toISOString(), error: undefined });
    try {
      const data = await apiClient.getStageArtifacts(targetWsId);
      setStageReports(data.reports);
      setStageDatasets(data.datasets);
      setSelectedReportIds([]);
      setSelectedDatasetIds([]);
      updateStepState(2, { status: 'success', completedAt: new Date().toISOString() });
      await refreshLogs();
      if (advance) {
        setCurrentStep(4); // auto-advance skips optional step 3
      }
    } catch (err: any) {
      updateStepState(2, { status: 'failed', error: err.message });
      await refreshLogs();
    } finally {
      setIsStep2Running(false);
    }
  };

  const executeStep4 = async (advance = isAutoAdvancing) => {
    setIsStep4Running(true);
    setPollCount(0);
    updateStepState(4, { status: 'running', startedAt: new Date().toISOString(), error: undefined });
    try {
      const triggerRes = await apiClient.triggerDeploy({
        pipelineId: activePipelineId,
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

      let pollAttempt = 0;
      let isCompleted = false;
      while (pollAttempt < 30) {
        pollAttempt++;
        setPollCount(pollAttempt);
        await new Promise((resolve) => setTimeout(resolve, 4000));
        
        const statusRes = await apiClient.getOperationStatus(opId, activePipelineId);
        setOperation(statusRes.operation);
        await refreshLogs();

        if (statusRes.operation.status === 'Succeeded') {
          isCompleted = true;
          updateStepState(4, { status: 'success', completedAt: new Date().toISOString() });
          
          // Fetch prod artifacts to get the actual production IDs
          const pWsId = pipelineData?.prodWorkspace?.id || config?.prodWorkspaceId;
          if (pWsId) {
            try {
              const prodArtifacts = await apiClient.getStageArtifacts(pWsId);
              setProdReports(prodArtifacts.reports);
              setProdDatasets(prodArtifacts.datasets);
            } catch (e) {
              console.error("Failed to fetch prod artifacts", e);
            }
          }
          if (advance) {
            setCurrentStep(5);
          }
          break;
        } else if (statusRes.operation.status === 'Failed') {
          throw new Error(statusRes.operation.error?.message || 'Deployment operation failed.');
        }
      }

      if (!isCompleted) {
        throw new Error('Deployment operation timed out while polling.');
      }
    } catch (err: any) {
      updateStepState(4, { status: 'failed', error: err.message });
      await refreshLogs();
    } finally {
      setIsStep4Running(false);
    }
  };

  const isAnyExecuting =
    isStep1Running || isStep2Running || isStep4Running ||
    (operation?.status === 'Executing');

  const selectedDatasetsFull = stageDatasets.filter(d => selectedDatasetIds.includes(d.id));
  const selectedReportsFull = stageReports.filter(r => selectedReportIds.includes(r.id));
  
  const selectedDatasetNames = selectedDatasetsFull.map(d => d.name);
  const prodSelectedDatasetsFull = prodDatasets.filter(d => selectedDatasetNames.includes(d.name)).map((d, _, arr) => ({
    ...d,
    hasDuplicateName: arr.filter(x => x.name === d.name).length > 1
  }));
  const stageWsId = pipelineData?.stageWorkspace?.id || config?.stageWorkspaceId || '';
  const prodWsId = pipelineData?.prodWorkspace?.id || config?.prodWorkspaceId || '';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-amber-500/30 flex flex-col">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
        activePipelineId={activePipelineId}
        setActivePipelineId={setActivePipelineId}
        logsCount={logs.length}
        onResetWorkflow={handleResetWorkflow}
        isDeploying={isAnyExecuting}
      />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'pipeline' && (
          <div>
            <Stepper
              steps={steps}
              currentStep={currentStep}
              onSelectStep={(id) => setCurrentStep(id)}
              isAutoAdvancing={isAutoAdvancing}
              onToggleAutoAdvance={() => setIsAutoAdvancing(!isAutoAdvancing)}
            />

            {currentStep >= 3 && (selectedReportsFull.length > 0 || selectedDatasetsFull.length > 0) && (
              <div className="mt-6 mb-6 bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-xl">
                <h4 className="text-sm font-bold text-neutral-200 mb-4 border-b border-neutral-800 pb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  Selected Targets
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-[11px] font-bold text-neutral-500 uppercase mb-3">Reports ({selectedReportsFull.length})</h5>
                    {selectedReportsFull.length > 0 ? (
                      <ul className="space-y-1.5">
                        {selectedReportsFull.map(r => (
                          <li key={r.id} className="text-xs text-neutral-300 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-sm bg-blue-500/80"></div>
                            {r.name}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-neutral-600 italic">No reports selected.</p>
                    )}
                  </div>
                  <div>
                    <h5 className="text-[11px] font-bold text-neutral-500 uppercase mb-3">Datasets ({selectedDatasetsFull.length})</h5>
                    {selectedDatasetsFull.length > 0 ? (
                      <ul className="space-y-1.5">
                        {selectedDatasetsFull.map(d => (
                          <li key={d.id} className="text-xs text-neutral-300 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-sm bg-amber-500/80"></div>
                            {d.name}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-neutral-600 italic">No datasets selected.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div>
              {currentStep === 1 && (
                <Step1WorkspaceInfo
                  step={steps[0]}
                  pipelineData={pipelineData}
                  onExecute={() => executeStep1(isAutoAdvancing)}
                  isRunning={isStep1Running}
                  onContinue={() => setCurrentStep(2)}
                />
              )}

              {currentStep === 2 && (
                <Step2ListReports
                  step={steps[1]}
                  reports={stageReports}
                  datasets={stageDatasets}
                  selectedReportIds={selectedReportIds}
                  selectedDatasetIds={selectedDatasetIds}
                  autoSelectDataset={autoSelectDataset}
                  onToggleAutoSelectDataset={() => setAutoSelectDataset(prev => !prev)}
                  onToggleReport={(id) => {
                    const isCurrentlySelected = selectedReportIds.includes(id);
                    const nextSelectedReportIds = isCurrentlySelected
                      ? selectedReportIds.filter((r) => r !== id)
                      : [...selectedReportIds, id];
                    
                    setSelectedReportIds(nextSelectedReportIds);

                    if (autoSelectDataset) {
                      const report = stageReports.find((r) => r.id === id);
                      if (report && report.datasetId) {
                        if (!isCurrentlySelected) {
                          setSelectedDatasetIds((prev) =>
                            prev.includes(report.datasetId!) ? prev : [...prev, report.datasetId!]
                          );
                        } else {
                          const otherReports = stageReports.filter(
                            (r) => nextSelectedReportIds.includes(r.id) && r.datasetId === report.datasetId
                          );
                          if (otherReports.length === 0) {
                            setSelectedDatasetIds((prev) => prev.filter((dId) => dId !== report.datasetId));
                          }
                        }
                      }
                    }
                  }}
                  onToggleDataset={(id) =>
                    setSelectedDatasetIds((prev) =>
                      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
                    )
                  }
                  onSelectAll={() => {
                    setSelectedReportIds(stageReports.map((r) => r.id));
                    setSelectedDatasetIds(stageDatasets.map((d) => d.id));
                  }}
                  onDeselectAll={() => {
                    setSelectedReportIds([]);
                    setSelectedDatasetIds([]);
                  }}
                  onExecute={() => executeStep2(isAutoAdvancing)}
                  isRunning={isStep2Running}
                  onContinue={() => setCurrentStep(3)}
                />
              )}

              {currentStep === 3 && (
                <Step3StageParameters
                  step={steps[2]}
                  datasets={selectedDatasetsFull}
                  workspaceId={stageWsId}
                  onFetchParameters={apiClient.getDatasetParameters}
                  onContinue={() => setCurrentStep(4)}
                />
              )}

              {currentStep === 4 && (
                <Step3Deploy
                  step={steps[3]}
                  onTriggerDeploy={() => executeStep4(isAutoAdvancing)}
                  isRunning={isStep4Running}
                  operation={operation}
                  pollCount={pollCount}
                  selectedReportsCount={selectedReportIds.length}
                  selectedDatasetsCount={selectedDatasetIds.length}
                  deploymentNote={deploymentNote}
                  setDeploymentNote={setDeploymentNote}
                  onContinue={() => setCurrentStep(5)}
                />
              )}

              {currentStep === 5 && (
                <Step4Parameters
                  step={steps[4]}
                  datasets={prodSelectedDatasetsFull.length > 0 ? prodSelectedDatasetsFull : selectedDatasetsFull}
                  workspaceId={prodWsId}
                  onFetchParameters={apiClient.getDatasetParameters}
                  onSaveParameters={async (datasetId, wsId, updates) => { await apiClient.updateDatasetParameters(datasetId, updates, wsId); }}
                  onContinue={() => setCurrentStep(6)}
                />
              )}

              {currentStep === 6 && (
                <Step5Refresh
                  step={steps[5]}
                  datasets={prodSelectedDatasetsFull.length > 0 ? prodSelectedDatasetsFull : selectedDatasetsFull}
                  workspaceId={prodWsId}
                  onTriggerRefresh={apiClient.triggerRefresh}
                  onCheckStatus={apiClient.getRefreshStatus}
                  onContinue={() => alert("Deployment pipeline complete!")}
                  onRefreshLogs={refreshLogs}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <LogsView
            logs={logs}
            isLoading={isLoadingLogs}
            onClear={async () => {
              await apiClient.clearLogs();
              await refreshLogs();
            }}
            onRefresh={refreshLogs}
          />
        )}
      </main>
    </div>
  );
}
