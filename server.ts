import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { ApiTransaction, DeploymentConfig } from './src/types.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory configuration store
let config: DeploymentConfig = {
  tenantId: process.env.AZURE_TENANT_ID || '',
  clientId: process.env.AZURE_CLIENT_ID || '',
  clientSecret: process.env.AZURE_CLIENT_SECRET || '',
  pipelineIds: process.env.POWERBI_PIPELINE_IDS ? process.env.POWERBI_PIPELINE_IDS.split(',').map(s => s.trim()).filter(Boolean) : (process.env.POWERBI_PIPELINE_ID ? [process.env.POWERBI_PIPELINE_ID] : []),
  apiBaseUrl: 'https://api.powerbi.com',
  stageWorkspaceId: '',
  prodWorkspaceId: '',
};

// In-memory API transaction log
const apiLogs: ApiTransaction[] = [];

function recordLog(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  url: string,
  status: number,
  durationMs: number,
  requestPayload: any,
  responsePayload: any,
  error?: string
) {
  const logItem: ApiTransaction = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    method,
    url,
    status,
    durationMs,
    requestPayload: requestPayload ? JSON.parse(JSON.stringify(requestPayload)) : undefined,
    responsePayload: responsePayload ? JSON.parse(JSON.stringify(responsePayload)) : undefined,
    error,
  };
  apiLogs.unshift(logItem);
  if (apiLogs.length > 250) {
    apiLogs.length = 250;
  }
  return logItem;
}

// Azure Entra ID token helper
async function getAccessToken(): Promise<string> {
  if (!config.tenantId || !config.clientId || !config.clientSecret) {
    throw new Error('Azure Entra ID credentials missing. Please configure Tenant ID, Client ID, and Secret in Config.');
  }

  const tokenEndpoint = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;
  const startTime = Date.now();
  const params = new URLSearchParams();
  params.append('client_id', config.clientId);
  params.append('client_secret', config.clientSecret);
  params.append('scope', 'https://analysis.windows.net/powerbi/api/.default');
  params.append('grant_type', 'client_credentials');

  try {
    const res = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const duration = Date.now() - startTime;
    const data = await res.json() as any;

    recordLog('POST', tokenEndpoint, res.status, duration, { client_id: config.clientId, scope: 'powerbi/api/.default' }, { token_type: data.token_type, expires_in: data.expires_in, error: data.error }, data.error_description);

    if (!res.ok || !data.access_token) {
      throw new Error(data.error_description || `Failed to authenticate with Azure Entra ID (${res.status})`);
    }

    return data.access_token;
  } catch (err: any) {
    recordLog('POST', tokenEndpoint, 500, Date.now() - startTime, { client_id: config.clientId }, null, err.message);
    throw err;
  }
}

// ---------------- API ROUTES ----------------

app.get('/api/config', (_req: Request, res: Response) => {
  res.json({
    pipelineIds: config.pipelineIds,
    apiBaseUrl: config.apiBaseUrl,
    hasClientSecret: Boolean(config.clientSecret),
  });
});

app.get('/api/logs', (_req: Request, res: Response) => {
  res.json(apiLogs);
});

app.delete('/api/logs', (_req: Request, res: Response) => {
  apiLogs.length = 0;
  res.json({ success: true, count: 0 });
});

app.post('/api/powerbi/test-connection', async (_req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const token = await getAccessToken();
    const testUrl = `${config.apiBaseUrl}/v1.0/myorg/pipelines`;
    const resp = await fetch(testUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const duration = Date.now() - startTime;
    const data = await resp.json() as any;

    recordLog('GET', testUrl, resp.status, duration, null, data, resp.ok ? undefined : 'Error testing connection');

    if (!resp.ok) {
      res.status(resp.status).json({
        success: false,
        error: data.error?.message || `Power BI API responded with status ${resp.status}`,
      });
      return;
    }

    res.json({
      success: true,
      message: 'Successfully authenticated with Azure Entra ID and verified Power BI REST API access!',
      pipelinesCount: data.value?.length || 0,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/powerbi/pipeline-info', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const token = await getAccessToken();
    const pipelineId = (req.query.pipelineId as string) || config.pipelineIds[0];
    
    if (!pipelineId) {
      throw new Error('Pipeline ID is required. Please set Pipeline ID in the Config tab.');
    }

    const stagesUrl = `${config.apiBaseUrl}/v1.0/myorg/pipelines/${pipelineId}/stages`;
    const stagesResp = await fetch(stagesUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const stagesData = await stagesResp.json() as any;

    recordLog('GET', stagesUrl, stagesResp.status, Date.now() - startTime, null, stagesData);

    if (!stagesResp.ok) {
      throw new Error(stagesData.error?.message || `Failed to fetch pipeline stages (${stagesResp.status})`);
    }

    const stages = stagesData.value || [];
    const stage1 = stages.find((s: any) => s.order === 1);
    const stage2 = stages.find((s: any) => s.order === 2);

    res.json({
      success: true,
      pipeline: {
        id: pipelineId,
        stages,
      },
      stageWorkspace: stage1 ? { id: stage1.workspaceId, name: stage1.workspaceName } : null,
      prodWorkspace: stage2 ? { id: stage2.workspaceId, name: stage2.workspaceName } : null,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/powerbi/stage-artifacts', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const workspaceId = (req.query.workspaceId as string) || config.stageWorkspaceId;

  if (!workspaceId) {
    return res.status(400).json({ success: false, error: 'Stage Workspace ID is missing' });
  }

  try {
    const token = await getAccessToken();
    const reportsUrl = `${config.apiBaseUrl}/v1.0/myorg/groups/${workspaceId}/reports`;
    const datasetsUrl = `${config.apiBaseUrl}/v1.0/myorg/groups/${workspaceId}/datasets`;

    const [reportsResp, datasetsResp] = await Promise.all([
      fetch(reportsUrl, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(datasetsUrl, { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    const reportsData = await reportsResp.json() as any;
    const datasetsData = await datasetsResp.json() as any;

    recordLog('GET', reportsUrl, reportsResp.status, Date.now() - startTime, { workspaceId }, reportsData);
    recordLog('GET', datasetsUrl, datasetsResp.status, Date.now() - startTime, { workspaceId }, datasetsData);

    if (!reportsResp.ok) throw new Error(reportsData.error?.message || 'Failed to list reports');
    if (!datasetsResp.ok) throw new Error(datasetsData.error?.message || 'Failed to list datasets');

    res.json({
      success: true,
      workspaceId,
      reports: reportsData.value || [],
      datasets: datasetsData.value || [],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/powerbi/deploy', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { pipelineId, sourceStageOrder = 1, targetStageOrder = 2, reportIds = [], datasetIds = [], note } = req.body || {};

  try {
    const token = await getAccessToken();
    const targetPipelineId = pipelineId || config.pipelineIds[0];
    
    if (!targetPipelineId) throw new Error("Pipeline ID missing");

    const deployUrl = `${config.apiBaseUrl}/v1.0/myorg/pipelines/${targetPipelineId}/deploy`;
    const deployBody: any = {
      sourceStageOrder,
      options: {
        allowCreateArtifact: true,
        allowOverwriteArtifact: true,
      },
    };

    if (reportIds.length > 0) {
      deployBody.reports = reportIds.map((id: string) => ({ sourceId: id }));
    }
    if (datasetIds.length > 0) {
      deployBody.datasets = datasetIds.map((id: string) => ({ sourceId: id }));
    }
    if (note) {
      deployBody.note = note;
    }

    const deployResp = await fetch(deployUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deployBody),
    });

    const duration = Date.now() - startTime;
    const opHeader = deployResp.headers.get('location') || deployResp.headers.get('operation-id') || deployResp.headers.get('x-ms-request-id');
    let responseData: any = {};
    try {
      responseData = await deployResp.json();
    } catch {
      responseData = { location: opHeader };
    }

    recordLog('POST', deployUrl, deployResp.status, duration, deployBody, responseData);

    if (!deployResp.ok && deployResp.status !== 202) {
      throw new Error(responseData.error?.message || `Deployment failed to trigger (${deployResp.status})`);
    }

    const opId = responseData.id || opHeader?.split('/').pop() || `op-${Date.now()}`;

    res.status(202).json({
      success: true,
      operationId: opId,
      message: 'Deployment triggered successfully. Polling operation status...',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/powerbi/operations/:operationId', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { operationId } = req.params;
  const pipelineId = (req.query.pipelineId as string) || config.pipelineIds[0];

  try {
    const token = await getAccessToken();
    const opUrl = `${config.apiBaseUrl}/v1.0/myorg/pipelines/${pipelineId}/operations/${operationId}`;
    const opResp = await fetch(opUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const opData = await opResp.json() as any;

    recordLog('GET', opUrl, opResp.status, Date.now() - startTime, { operationId }, opData);

    if (!opResp.ok) {
      throw new Error(opData.error?.message || `Failed to check operation status (${opResp.status})`);
    }

    res.json({
      success: true,
      operation: {
        id: opData.id || operationId,
        status: opData.status,
        executionStartTime: opData.executionStartTime,
        executionEndTime: opData.executionEndTime,
        error: opData.error,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/powerbi/datasets/:datasetId/parameters', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { datasetId } = req.params;
  const workspaceId = (req.query.workspaceId as string) || config.prodWorkspaceId;

  try {
    if (!workspaceId) throw new Error("Workspace ID missing");
    const token = await getAccessToken();
    const paramsUrl = `${config.apiBaseUrl}/v1.0/myorg/groups/${workspaceId}/datasets/${datasetId}/parameters`;
    const paramsResp = await fetch(paramsUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const paramsData = await paramsResp.json() as any;

    recordLog('GET', paramsUrl, paramsResp.status, Date.now() - startTime, { workspaceId, datasetId }, paramsData);

    if (!paramsResp.ok) {
      throw new Error(paramsData.error?.message || `Failed to retrieve parameters (${paramsResp.status})`);
    }

    res.json({
      success: true,
      workspaceId,
      datasetId,
      parameters: paramsData.value || [],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/powerbi/datasets/:datasetId/update-parameters', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { datasetId } = req.params;
  const { workspaceId = config.prodWorkspaceId, updateDetails = [] } = req.body || {};

  try {
    if (!workspaceId) throw new Error("Workspace ID missing");
    const token = await getAccessToken();
    const updateUrl = `${config.apiBaseUrl}/v1.0/myorg/groups/${workspaceId}/datasets/${datasetId}/Default.UpdateParameters`;
    const updateResp = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ updateDetails }),
    });

    const duration = Date.now() - startTime;
    let respData: any = {};
    try {
      respData = await updateResp.json();
    } catch {
      respData = { status: updateResp.statusText };
    }

    recordLog('POST', updateUrl, updateResp.status, duration, { updateDetails }, respData);

    if (!updateResp.ok) {
      throw new Error(respData.error?.message || `Failed to update parameters (${updateResp.status})`);
    }

    res.json({
      success: true,
      message: 'Dataset parameters updated successfully in Power BI.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/powerbi/datasets/:datasetId/refresh', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { datasetId } = req.params;
  const { workspaceId = config.prodWorkspaceId } = req.body || {};
  // Forced notification behavior in backend per requirements
  const notifyOption = 'MailOnFailure';

  try {
    if (!workspaceId) throw new Error("Workspace ID missing");
    const token = await getAccessToken();
    const refreshUrl = `${config.apiBaseUrl}/v1.0/myorg/groups/${workspaceId}/datasets/${datasetId}/refreshes`;
    const refreshResp = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notifyOption }),
    });

    const duration = Date.now() - startTime;
    let respData: any = {};
    try {
      respData = await refreshResp.json();
    } catch {
      respData = { status: refreshResp.statusText };
    }

    recordLog('POST', refreshUrl, refreshResp.status, duration, { notifyOption }, respData);

    if (!refreshResp.ok && refreshResp.status !== 202) {
      throw new Error(respData.error?.message || `Failed to trigger refresh (${refreshResp.status})`);
    }

    res.status(202).json({
      success: true,
      message: 'Dataset refresh request accepted (202). Polling refresh status...',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/powerbi/datasets/:datasetId/refresh-status', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { datasetId } = req.params;
  const workspaceId = (req.query.workspaceId as string) || config.prodWorkspaceId;

  try {
    if (!workspaceId) throw new Error("Workspace ID missing");
    const token = await getAccessToken();
    const statusUrl = `${config.apiBaseUrl}/v1.0/myorg/groups/${workspaceId}/datasets/${datasetId}/refreshes?$top=1`;
    const statusResp = await fetch(statusUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const statusData = await statusResp.json() as any;

    recordLog('GET', statusUrl, statusResp.status, Date.now() - startTime, { workspaceId, datasetId }, statusData);

    if (!statusResp.ok) {
      throw new Error(statusData.error?.message || `Failed to fetch refresh status (${statusResp.status})`);
    }

    const latest = (statusData.value && statusData.value[0]) || { status: 'Unknown' };

    res.json({
      success: true,
      refresh: latest,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Power BI Pipeline Deployer Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
