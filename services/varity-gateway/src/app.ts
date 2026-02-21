import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health';
import { domainsRouter } from './routes/domains';
import { proxyRouter } from './routes/proxy';

const ALLOWED_ORIGINS = [
  /^https?:\/\/(.+\.)?varity\.so$/,
  /^https?:\/\/(.+\.)?varity\.app$/,
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
app.use(domainsRouter);
app.use(proxyRouter);

export { app };
