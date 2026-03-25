import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health';
import { domainsRouter } from './routes/domains';
import { cardRouter } from './routes/card';
import { proxyRouter } from './routes/proxy';
import { subgraphRouter } from './routes/subgraph';
import { akashRouter } from './routes/akash';
import { dbProxyRouter } from './routes/db-proxy';

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
app.use(subgraphRouter);   // Before catch-all proxy
app.use(akashRouter);      // Before catch-all proxy
app.use(domainsRouter);
app.use(cardRouter);
app.use(proxyRouter);

export { app };
