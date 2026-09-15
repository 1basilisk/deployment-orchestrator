import { ApiTransaction, DeploymentConfig, DeploymentOperation, DatasetRefresh, Pipeline, Report, Dataset, DatasetParameter } from '../types';

export const apiClient = {
  async getConfig(): Promise<DeploymentConfig & { hasClientSecret?: boolean }> {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('Failed to fetch config');
    return res.json();
  },

  async getPipelineInfo(): Promise<{
    success: boolean;
    pipeline: Pipeline;
    stageWorkspace?: { id: string; name: string; capacity?: string };
    prodWorkspace?: { id: string; name: string; capacity?: string };
  }> {
    const res = await fetch('/api/powerbi/pipeline-info');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to retrieve pipeline information');
    return data;
  },

  async getStageArtifacts(workspaceId?: string): Promise<{
    success: boolean;
    workspaceId: string;
    reports: Report[];
    datasets: Dataset[];
  }> {
    const url = workspaceId ? `/api/powerbi/stage-artifacts?workspaceId=${encodeURIComponent(workspaceId)}` : '/api/powerbi/stage-artifacts';
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to retrieve stage artifacts');
    return data;
  },

  async triggerDeploy(payload: {
    pipelineId?: string;
    sourceStageOrder?: number;
    targetStageOrder?: number;
    reportIds?: string[];
    datasetIds?: string[];
    note?: string;
  }): Promise<{ success: boolean; operationId: string; message: string }> {
    const res = await fetch('/api/powerbi/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok && res.status !== 202) throw new Error(data.error || 'Failed to trigger deployment');
    return data;
  },

  async getOperationStatus(operationId: string, pipelineId?: string): Promise<{
    success: boolean;
    operation: DeploymentOperation;
  }> {
    const url = pipelineId
      ? `/api/powerbi/operations/${encodeURIComponent(operationId)}?pipelineId=${encodeURIComponent(pipelineId)}`
      : `/api/powerbi/operations/${encodeURIComponent(operationId)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to check operation status');
    return data;
  },

  async getDatasetParameters(datasetId: string, workspaceId?: string): Promise<{
    success: boolean;
    datasetId: string;
    parameters: DatasetParameter[];
  }> {
    const url = workspaceId
      ? `/api/powerbi/datasets/${encodeURIComponent(datasetId)}/parameters?workspaceId=${encodeURIComponent(workspaceId)}`
      : `/api/powerbi/datasets/${encodeURIComponent(datasetId)}/parameters`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch dataset parameters');
    return data;
  },

  async updateDatasetParameters(
    datasetId: string,
    updateDetails: Array<{ name: string; newValue: string }>,
    workspaceId?: string
  ): Promise<{ success: boolean; message: string; parameters?: DatasetParameter[] }> {
    const res = await fetch(`/api/powerbi/datasets/${encodeURIComponent(datasetId)}/update-parameters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, updateDetails }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update dataset parameters');
    return data;
  },

  async triggerRefresh(datasetId: string, workspaceId?: string): Promise<{
    success: boolean;
    refreshId?: string;
    message: string;
  }> {
    // Notify option is handled server-side now.
    const res = await fetch(`/api/powerbi/datasets/${encodeURIComponent(datasetId)}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId }),
    });
    const data = await res.json();
    if (!res.ok && res.status !== 202) throw new Error(data.error || 'Failed to trigger dataset refresh');
    return data;
  },

  async getRefreshStatus(datasetId: string, workspaceId?: string): Promise<{
    success: boolean;
    refresh: DatasetRefresh;
  }> {
    const url = workspaceId
      ? `/api/powerbi/datasets/${encodeURIComponent(datasetId)}/refresh-status?workspaceId=${encodeURIComponent(workspaceId)}`
      : `/api/powerbi/datasets/${encodeURIComponent(datasetId)}/refresh-status`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to retrieve refresh status');
    return data;
  },

  async getLogs(): Promise<ApiTransaction[]> {
    const res = await fetch('/api/logs');
    if (!res.ok) return [];
    return res.json();
  },

  async clearLogs(): Promise<void> {
    await fetch('/api/logs', { method: 'DELETE' });
  },
};
