import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health';
import { domainsRouter } from './routes/domains';
import { cardRouter } from './routes/card';
import { proxyRouterV2 as proxyRouter } from './routes/proxy-v2';
import { subgraphRouter } from './routes/subgraph';
import { akashRouter } from './routes/akash';
import { deploymentsRouter } from './routes/deployments';
import { dbProxyRouter } from './routes/db-proxy';
import { paymentsRouter } from './routes/payments';
import { deployRouter } from './routes/deploy';
import { telemetryRouter } from './routes/telemetry';

const ALLOWED_ORIGINS = [
  /^https?:\/\/(.+\.)?varity\.so$/,
  /^https?:\/\/(.+\.)?varity\.app$/,
  /^https?:\/\/(.+\.)?4everland\.\w+$/,
  /^https?:\/\/localhost(:\d+)?$/,
];

const app = express();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.some((re) => re.test(origin))) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
}));

app.use(express.json());

// ---------------------------------------------------------------------------
// Routes (order matters — health first, then domain API, then proxy catch-all)
// ---------------------------------------------------------------------------

app.use(healthRouter);
app.use(dbProxyRouter);    // HTTPS frontend for DB Proxy (before catch-all)
app.use(paymentsRouter);   // Stripe checkout & customer status
app.use(deployRouter);       // Deploy from GitHub (new deploy flow)
app.use(deploymentsRouter); // Deployment list with live Akash status
app.use(telemetryRouter);  // Telemetry aggregates
app.use(subgraphRouter);   // Before catch-all proxy
app.use(akashRouter);      // Before catch-all proxy
app.use(domainsRouter);
app.use(cardRouter);
app.use(proxyRouter);

export { app };
