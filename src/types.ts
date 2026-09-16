export type StageOrder = 0 | 1 | 2;

export interface PipelineStage {
  order: StageOrder;
  displayName: string;
  workspaceId?: string;
  workspaceName?: string;
  isPublic?: boolean;
}

export interface Pipeline {
  id: string;
  displayName: string;
  description?: string;
  stages: PipelineStage[];
}

export interface Workspace {
  id: string;
  name: string;
  isReadOnly?: boolean;
  isOnDedicatedCapacity?: boolean;
  capacityId?: string;
}

export interface Report {
  id: string;
  name: string;
  datasetId?: string;
  reportType?: string;
  webUrl?: string;
  embedUrl?: string;
  modifiedDateTime?: string;
  selectedForDeployment?: boolean;
}

export interface Dataset {
  id: string;
  name: string;
  configuredBy?: string;
  isRefreshable?: boolean;
  targetDatasetId?: string;
}

export interface DatasetParameter {
  name: string;
  type: string;
  currentValue: string;
  newValue?: string;
  description?: string;
  isRequired?: boolean;
  suggestedValues?: string[];
}

export interface DeploymentOperation {
  id: string;
  status: 'NotStarted' | 'Executing' | 'Succeeded' | 'Failed';
  executionStartTime?: string;
  executionEndTime?: string;
  sourceStageOrder: number;
  targetStageOrder: number;
  error?: {
    code: string;
    message: string;
  };
}

export interface DatasetRefresh {
  id: string;
  status: 'Unknown' | 'Executing' | 'Completed' | 'Failed';
  startTime?: string;
  endTime?: string;
  refreshType?: string;
  serviceExceptionJson?: string;
}

export interface ApiTransaction {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  url: string;
  status: number;
  durationMs: number;
  requestPayload?: any;
  responsePayload?: any;
  error?: string;
}

export interface DeploymentConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  pipelineIds: string[];
  apiBaseUrl: string;
  stageWorkspaceId?: string;
  prodWorkspaceId?: string;
}

export type StepId = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type StepStatus = 'idle' | 'running' | 'success' | 'failed' | 'waiting_user';

export interface StepState {
  id: StepId;
  title: string;
  shortDesc: string;
  status: StepStatus;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  details?: any;
}
