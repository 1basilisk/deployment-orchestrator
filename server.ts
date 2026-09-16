import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { ApiTransaction, DeploymentConfig } from './src/types.js';

const app = express();
const PORT = 3000;
app.use(express.json());

// In-memory configuration store
let config: DeploymentConfig = {
  tenantId: 'mock-tenant-id',
  clientId: 'mock-client-id',
  clientSecret: 'mock-client-secret',
  pipelineIds: ['mock-pipeline-123'],
  apiBaseUrl: 'https://api.powerbi.com',
  stageWorkspaceId: 'mock-stage-ws',
  prodWorkspaceId: 'mock-prod-ws',
};

// In-memory API transaction log
const apiLogs: ApiTransaction[] = [];

function recordLog(
  requestType: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  url: string,
  status: number,
  durationMs: number,
  requestPayload: any,
  responsePayload: any,
  error?: string
) {
  const safeClone = (obj: any) => {
    try {
      return obj ? JSON.parse(JSON.stringify(obj)) : undefined;
    } catch (e) {
      return { _error: 'Unserializable payload' };
    }
  };

  const logItem: ApiTransaction = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    requestType,
    method,
    url,
    status,
    durationMs,
    requestPayload: safeClone(requestPayload),
    responsePayload: safeClone(responsePayload),
    error,
  };
  apiLogs.unshift(logItem);
  if (apiLogs.length > 250) {
    apiLogs.length = 250;
  }
  return logItem;
}

// ---------------------------------------------------------
// MOCK DATA
// ---------------------------------------------------------

const mockStageReports = [
  { id: "r-stage-1", name: "Finance Analytics", datasetId: "ds-stage-1", reportType: "PowerBIReport", modifiedDateTime: new Date().toISOString() },
  { id: "r-stage-2", name: "Sales Dashboard", datasetId: "ds-stage-2", reportType: "PowerBIReport", modifiedDateTime: new Date().toISOString() },
  { id: "r-stage-3", name: "Employee Activity", datasetId: "ds-stage-3", reportType: "PowerBIReport", modifiedDateTime: new Date().toISOString() },
];

const mockStageDatasets = [
  { id: "ds-stage-1", name: "Finance Analytics", isRefreshable: true },
  { id: "ds-stage-2", name: "Sales Dashboard", isRefreshable: true },
  { id: "ds-stage-3", name: "Employee Activity", isRefreshable: true },
];

const mockProdReports = [
  { id: "r-prod-1", name: "Finance Analytics", datasetId: "ds-prod-1", reportType: "PowerBIReport", modifiedDateTime: new Date().toISOString() },
  { id: "r-prod-2", name: "Sales Dashboard", datasetId: "ds-prod-2", reportType: "PowerBIReport", modifiedDateTime: new Date().toISOString() },
];

const mockProdDatasets = [
  { id: "ds-prod-1", name: "Finance Analytics", isRefreshable: true },
  { id: "ds-prod-2", name: "Sales Dashboard", isRefreshable: true },
  { id: "ds-prod-1-dup", name: "Finance Analytics", isRefreshable: true }, // Simulating duplicate
];

const mockParamsData: Record<string, any> = {
  "ds-stage-1": [
    { name: "ServerUrl", type: "Text", currentValue: "stage-db-1.internal", isRequired: true },
    { name: "Database", type: "Text", currentValue: "finance_stage", isRequired: true }
  ],
  "ds-stage-2": [
    { name: "ServerUrl", type: "Text", currentValue: "stage-db-2.internal", isRequired: true },
    { name: "Database", type: "Text", currentValue: "sales_stage", isRequired: true }
  ],
  "ds-prod-1": [
    { name: "ServerUrl", type: "Text", currentValue: "prod-db-1.internal", isRequired: true },
    { name: "Database", type: "Text", currentValue: "finance_prod", isRequired: true }
  ],
  "ds-prod-2": [
    { name: "ServerUrl", type: "Text", currentValue: "prod-db-2.internal", isRequired: true },
    { name: "Database", type: "Text", currentValue: "sales_prod", isRequired: true }
  ],
  "ds-prod-1-dup": [
    { name: "ServerUrl", type: "Text", currentValue: "prod-db-1-dup.internal", isRequired: true },
    { name: "Database", type: "Text", currentValue: "finance_prod_old", isRequired: true }
  ]
};

const deploymentOperations: Record<string, any> = {};
const refreshes: Record<string, any> = {};

// ---------------------------------------------------------
// API ROUTES
// ---------------------------------------------------------

app.get('/api/config', (req: Request, res: Response) => {
  res.json({
    ...config,
    hasClientSecret: true,
  });
});

app.post('/api/config', (req: Request, res: Response) => {
  config = { ...config, ...req.body };
  res.json({ success: true, message: 'Configuration updated successfully.' });
});

app.get('/api/logs', (req: Request, res: Response) => {
  res.json(apiLogs);
});

app.get('/api/powerbi/pipeline-info', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const pipelineId = req.query.pipelineId as string || 'mock-pipeline-123';
  
  setTimeout(() => {
    const pipeline = {
      id: pipelineId,
      displayName: 'Mock Deployment Pipeline',
      stages: [
        { order: 0, displayName: 'Development', workspaceId: 'mock-dev-ws', workspaceName: 'Mock Dev Workspace' },
        { order: 1, displayName: 'Test (Stage)', workspaceId: 'mock-stage-ws', workspaceName: 'Mock Stage Workspace' },
        { order: 2, displayName: 'Production', workspaceId: 'mock-prod-ws', workspaceName: 'Mock Prod Workspace' },
      ]
    };

    recordLog('Fetch Pipeline Info', 'GET', `/api/powerbi/pipeline-info?pipelineId=${pipelineId}`, 200, Date.now() - startTime, null, { pipeline });
    
    res.json({
      success: true,
      pipeline,
      stageWorkspace: pipeline.stages[1],
      prodWorkspace: pipeline.stages[2]
    });
  }, 300);
});

app.get('/api/powerbi/stage-artifacts', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const workspaceId = req.query.workspaceId as string || 'mock-stage-ws';
  
  setTimeout(() => {
    const isStage = workspaceId.includes('stage');
    const reports = isStage ? mockStageReports : mockProdReports;
    const datasets = isStage ? mockStageDatasets : mockProdDatasets;

    recordLog('Fetch Workspace Artifacts', 'GET', `/api/powerbi/stage-artifacts?workspaceId=${workspaceId}`, 200, Date.now() - startTime, null, { reports, datasets });
    
    res.json({
      success: true,
      workspaceId,
      reports,
      datasets
    });
  }, 600);
});

app.post('/api/powerbi/deploy', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { sourceWorkspaceId, targetWorkspaceId, datasets, reports } = req.body;
  
  const opId = `op-mock-${Date.now()}`;
  
  deploymentOperations[opId] = {
    id: opId,
    status: 'Executing',
    executionStartTime: new Date().toISOString(),
  };

  // Simulate deployment completion after 3 seconds
  setTimeout(() => {
    deploymentOperations[opId].status = 'Succeeded';
    deploymentOperations[opId].executionEndTime = new Date().toISOString();
    
    // Auto-update prod mocks with deployed items if they didn't exist
    datasets?.forEach((ds: any) => {
      const existing = mockProdDatasets.find(d => d.name === ds.name);
      if (!existing) {
        mockProdDatasets.push({ ...ds, id: `ds-prod-new-${Date.now()}` });
      }
    });
    reports?.forEach((rp: any) => {
      const existing = mockProdReports.find(r => r.name === rp.name);
      if (!existing) {
        mockProdReports.push({ ...rp, id: `r-prod-new-${Date.now()}` });
      }
    });

  }, 3000);

  recordLog('Trigger Deployment', 'POST', '/api/powerbi/deploy', 202, Date.now() - startTime, req.body, { operationId: opId });

  res.status(202).json({
    success: true,
    operationId: opId,
    message: 'Mock deployment triggered.',
  });
});

app.get('/api/powerbi/operations/:operationId', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { operationId } = req.params;
  
  const op = deploymentOperations[operationId] || {
    id: operationId,
    status: 'Failed',
    error: { message: 'Mock operation not found' }
  };

  recordLog('Check Deploy Operation', 'GET', `/api/powerbi/operations/${operationId}`, 200, Date.now() - startTime, null, op);

  res.json({
    success: true,
    operation: op
  });
});

app.get('/api/powerbi/datasets/:datasetId/parameters', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { datasetId } = req.params;
  
  setTimeout(() => {
    const parameters = mockParamsData[datasetId] || [
      { name: "MockServerUrl", type: "Text", currentValue: "mock.database.windows.net", isRequired: true }
    ];

    recordLog('Fetch Dataset Parameters', 'GET', `/api/powerbi/datasets/${datasetId}/parameters`, 200, Date.now() - startTime, null, { parameters });

    res.json({
      success: true,
      datasetId,
      parameters
    });
  }, 400);
});

app.post('/api/powerbi/datasets/:datasetId/update-parameters', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { datasetId } = req.params;
  const { updateDetails } = req.body;
  
  setTimeout(() => {
    if (mockParamsData[datasetId]) {
      updateDetails.forEach((update: any) => {
        const p = mockParamsData[datasetId].find((p: any) => p.name === update.name);
        if (p) p.currentValue = update.newValue;
      });
    }

    recordLog('Update Parameters', 'POST', `/api/powerbi/datasets/${datasetId}/update-parameters`, 200, Date.now() - startTime, req.body, { success: true });

    res.json({
      success: true,
      message: 'Mock parameters updated successfully.'
    });
  }, 500);
});

app.post('/api/powerbi/datasets/:datasetId/refresh', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { datasetId } = req.params;
  
  const refreshId = `ref-mock-${Date.now()}`;
  
  refreshes[datasetId] = {
    id: refreshId,
    status: 'Executing',
    startTime: new Date().toISOString()
  };

  setTimeout(() => {
    if (refreshes[datasetId]) {
      refreshes[datasetId].status = 'Completed';
      refreshes[datasetId].endTime = new Date().toISOString();
    }
  }, 2500);

  recordLog('Trigger Semantic Refresh', 'POST', `/api/powerbi/datasets/${datasetId}/refresh`, 202, Date.now() - startTime, null, { refreshId });

  res.status(202).json({
    success: true,
    message: 'Mock refresh triggered.'
  });
});

app.get('/api/powerbi/datasets/:datasetId/refresh-status', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { datasetId } = req.params;
  
  const refresh = refreshes[datasetId] || { status: 'Unknown' };

  recordLog('Check Refresh Status', 'GET', `/api/powerbi/datasets/${datasetId}/refresh-status`, 200, Date.now() - startTime, null, { refresh });

  res.json({
    success: true,
    refresh
  });
});


app.post('/api/powerbi/workspace/:workspaceId/datasets/takeover', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { workspaceId } = req.params;
  const { datasetIds = [] } = req.body || {};

  setTimeout(() => {
    const results = datasetIds.map((datasetId: string) => ({
      datasetId,
      success: true
    }));

    recordLog('Take Over Datasets', 'POST', `/api/powerbi/workspace/${workspaceId}/datasets/takeover`, 200, Date.now() - startTime, req.body, { results });

    res.json({
      success: true,
      message: 'Mock datasets taken over successfully',
      results
    });
  }, 800);
});

// ---------------------------------------------------------
// FRONTEND SERVING
// ---------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.get('*', async (req: Request, res: Response, next: any) => {
      try {
        console.log(`[Mock Server] Intercepting request for ${req.originalUrl}`);
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Power BI Pipeline Deployer [MOCK SERVER] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
