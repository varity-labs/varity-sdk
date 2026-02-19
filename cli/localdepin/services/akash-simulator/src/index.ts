import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3003;
const LLM_MODEL = process.env.LLM_MODEL || 'gemini-2.5-flash-mock';
const COMPUTE_UNITS = parseInt(process.env.COMPUTE_UNITS || '1000', 10);

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));

// In-memory storage for deployments
interface Deployment {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'stopped' | 'failed';
  image: string;
  resources: {
    cpu: number;
    memory: number;
    storage: number;
  };
  url?: string;
  createdAt: string;
  updatedAt: string;
}

interface LLMInference {
  id: string;
  model: string;
  prompt: string;
  response: string;
  tokens: number;
  duration: number;
  timestamp: string;
}

const deployments: Map<string, Deployment> = new Map();
const inferences: Map<string, LLMInference> = new Map();

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'akash-simulator',
    model: LLM_MODEL,
    computeUnits: COMPUTE_UNITS,
    activeDeployments: deployments.size,
    timestamp: new Date().toISOString()
  });
});

// Deploy application to Akash
app.post('/deploy', async (req: Request, res: Response) => {
  try {
    const { name, image, resources } = req.body;

    if (!name || !image) {
      return res.status(400).json({ error: 'Name and image are required' });
    }

    const deploymentId = `akash-local-${uuidv4().substring(0, 8)}`;

    const deployment: Deployment = {
      id: deploymentId,
      name,
      image,
      status: 'pending',
      resources: resources || {
        cpu: 1,
        memory: 512,
        storage: 1024,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    deployments.set(deploymentId, deployment);

    // Simulate deployment delay
    setTimeout(() => {
      deployment.status = 'running';
      deployment.url = `http://localhost:${9000 + deployments.size}`;
      deployment.updatedAt = new Date().toISOString();
      console.log(`✅ Deployment ${deploymentId} is now running at ${deployment.url}`);
    }, 2000);

    console.log(`🚀 Deploying ${name} (${image}) as ${deploymentId}`);

    res.json({
      deployment_id: deploymentId,
      status: 'pending',
      message: 'Deployment initiated',
      estimated_time: '2-3 seconds',
    });
  } catch (error: any) {
    console.error('Deploy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get deployment status
app.get('/deployment/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deployment = deployments.get(id);

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    res.json(deployment);
  } catch (error: any) {
    console.error('Get deployment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List all deployments
app.get('/deployments', (req: Request, res: Response) => {
  try {
    const allDeployments = Array.from(deployments.values());
    res.json({
      count: allDeployments.length,
      deployments: allDeployments,
    });
  } catch (error: any) {
    console.error('List deployments error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stop deployment
app.post('/deployment/:id/stop', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deployment = deployments.get(id);

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    deployment.status = 'stopped';
    deployment.updatedAt = new Date().toISOString();

    console.log(`🛑 Stopped deployment ${id}`);

    res.json({
      message: 'Deployment stopped',
      deployment,
    });
  } catch (error: any) {
    console.error('Stop deployment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete deployment
app.delete('/deployment/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = deployments.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    console.log(`🗑️  Deleted deployment ${id}`);

    res.json({ message: 'Deployment deleted' });
  } catch (error: any) {
    console.error('Delete deployment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mock LLM responses
const mockLLMResponses: Record<string, (prompt: string) => string> = {
  'iso-merchant': (prompt: string) => {
    if (prompt.toLowerCase().includes('pci compliance')) {
      return 'PCI DSS compliance requires: 1) Secure network configuration, 2) Cardholder data protection, 3) Vulnerability management program, 4) Access control measures, 5) Network monitoring, 6) Security policy maintenance.';
    }
    if (prompt.toLowerCase().includes('onboarding')) {
      return 'Merchant onboarding steps: 1) Business verification, 2) Risk assessment, 3) Pricing setup, 4) Integration configuration, 5) Testing, 6) Go-live approval.';
    }
    return 'This is a mock response from the ISO merchant services model. Your query has been processed successfully.';
  },
  'finance': (prompt: string) => {
    if (prompt.toLowerCase().includes('regulation')) {
      return 'Key financial regulations include: Dodd-Frank Act, Basel III, MiFID II, GDPR for data protection, and various anti-money laundering (AML) requirements.';
    }
    return 'Financial analysis complete. This is a mock response from the finance model.';
  },
  'healthcare': (prompt: string) => {
    if (prompt.toLowerCase().includes('hipaa')) {
      return 'HIPAA compliance requires: 1) Privacy Rule compliance, 2) Security Rule implementation, 3) Breach notification procedures, 4) Business associate agreements, 5) Regular risk assessments.';
    }
    return 'Healthcare query processed. This is a mock response from the healthcare model.';
  },
  'retail': (prompt: string) => {
    if (prompt.toLowerCase().includes('inventory')) {
      return 'Inventory management best practices: 1) ABC analysis, 2) Just-in-time ordering, 3) Safety stock calculation, 4) Regular audits, 5) Demand forecasting.';
    }
    return 'Retail analysis complete. This is a mock response from the retail model.';
  },
};

// LLM inference endpoint
app.post('/compute/run-model', async (req: Request, res: Response) => {
  try {
    const { model, prompt, temperature, max_tokens, industry } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const startTime = Date.now();

    // Simulate processing delay based on prompt length
    const processingDelay = Math.min(100 + prompt.length * 2, 2000);
    await new Promise(resolve => setTimeout(resolve, processingDelay));

    // Generate mock response based on industry
    const responseGenerator = mockLLMResponses[industry || 'iso-merchant'] || mockLLMResponses['iso-merchant'];
    const responseText = responseGenerator(prompt);

    const duration = Date.now() - startTime;
    const tokens = Math.ceil((prompt.length + responseText.length) / 4);

    const inference: LLMInference = {
      id: uuidv4(),
      model: model || LLM_MODEL,
      prompt,
      response: responseText,
      tokens,
      duration,
      timestamp: new Date().toISOString(),
    };

    inferences.set(inference.id, inference);

    console.log(`🧠 LLM inference completed in ${duration}ms (${tokens} tokens)`);

    res.json({
      id: inference.id,
      model: inference.model,
      response: inference.response,
      usage: {
        prompt_tokens: Math.ceil(prompt.length / 4),
        completion_tokens: Math.ceil(responseText.length / 4),
        total_tokens: tokens,
      },
      duration,
      timestamp: inference.timestamp,
    });
  } catch (error: any) {
    console.error('LLM inference error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Chat completion endpoint (OpenAI-compatible)
app.post('/v1/chat/completions', async (req: Request, res: Response) => {
  try {
    const { messages, model, temperature, max_tokens } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const lastMessage = messages[messages.length - 1];
    const prompt = lastMessage.content;

    const startTime = Date.now();
    const processingDelay = Math.min(100 + prompt.length * 2, 2000);
    await new Promise(resolve => setTimeout(resolve, processingDelay));

    const responseText = mockLLMResponses['iso-merchant'](prompt);
    const duration = Date.now() - startTime;
    const tokens = Math.ceil((prompt.length + responseText.length) / 4);

    res.json({
      id: `chatcmpl-${uuidv4()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model || LLM_MODEL,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: responseText,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: Math.ceil(prompt.length / 4),
        completion_tokens: Math.ceil(responseText.length / 4),
        total_tokens: tokens,
      },
    });
  } catch (error: any) {
    console.error('Chat completion error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get inference history
app.get('/inferences', (req: Request, res: Response) => {
  try {
    const allInferences = Array.from(inferences.values());
    res.json({
      count: allInferences.length,
      inferences: allInferences,
    });
  } catch (error: any) {
    console.error('Get inferences error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stats endpoint
app.get('/stats', (req: Request, res: Response) => {
  const totalInferences = inferences.size;
  const totalTokens = Array.from(inferences.values()).reduce((sum, inf) => sum + inf.tokens, 0);
  const avgDuration = inferences.size > 0
    ? Array.from(inferences.values()).reduce((sum, inf) => sum + inf.duration, 0) / inferences.size
    : 0;

  res.json({
    model: LLM_MODEL,
    computeUnits: COMPUTE_UNITS,
    activeDeployments: deployments.size,
    totalInferences,
    totalTokens,
    avgDuration: Math.round(avgDuration),
    uptime: process.uptime(),
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: err.message,
    service: 'akash-simulator',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Akash Simulator running on port ${PORT}`);
  console.log(`🧠 LLM Model: ${LLM_MODEL}`);
  console.log(`💻 Compute Units: ${COMPUTE_UNITS}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
});

export default app;
