import { Router, Request, Response } from 'express';
import { fetchAllDomains } from '../services/resolver';

export const telemetryRouter = Router();

// ---------------------------------------------------------------------------
// In-memory telemetry store — ring buffer capped at 1000 events.
// Events are written by varitykit (POST /api/telemetry/deploy) and consumed
// by the Extraction Worker (GET /api/telemetry/deploy/events).  Persists
// across requests; lost on Gateway restart (Extraction Worker polls every 5 min
// so data is in WM well before any planned restart).
// ---------------------------------------------------------------------------

interface DeployEvent {
  run_id: string;
  received_at: string;
  orchestration_run: Record<string, unknown>;
  deploy_outcome: Record<string, unknown>;
}

const MAX_EVENTS = 1000;
const _deployEvents: DeployEvent[] = [];

function storeEvent(event: DeployEvent): void {
  _deployEvents.push(event);
  if (_deployEvents.length > MAX_EVENTS) {
    _deployEvents.splice(0, _deployEvents.length - MAX_EVENTS);
  }
}

// ---------------------------------------------------------------------------
// POST /api/telemetry/deploy — varitykit writes one event per deploy
// ---------------------------------------------------------------------------

telemetryRouter.post('/api/telemetry/deploy', (req: Request, res: Response) => {
  const body = req.body as {
    run_id?: string;
    orchestration_run?: Record<string, unknown>;
    deploy_outcome?: Record<string, unknown>;
  };

  if (!body?.run_id || !body?.orchestration_run) {
    res.status(400).json({ error: 'run_id and orchestration_run are required' });
    return;
  }

  storeEvent({
    run_id: body.run_id,
    received_at: new Date().toISOString(),
    orchestration_run: body.orchestration_run,
    deploy_outcome: body.deploy_outcome ?? {},
  });

  res.status(202).json({ ok: true, run_id: body.run_id });
});

// ---------------------------------------------------------------------------
// GET /api/telemetry/deploy/events — Extraction Worker polls this to sync to WM
// Query params:
//   after  — ISO timestamp; only events received after this time are returned
//   limit  — max results (default 100)
// ---------------------------------------------------------------------------

telemetryRouter.get('/api/telemetry/deploy/events', (req: Request, res: Response) => {
  const { after, limit } = req.query;
  const limitNum = Math.min(parseInt(String(limit ?? '100'), 10) || 100, 500);
  const afterDate = after ? new Date(String(after)) : null;

  let events = afterDate
    ? _deployEvents.filter((e) => new Date(e.received_at) > afterDate)
    : _deployEvents;

  events = events.slice(-limitNum);
  res.json({ count: events.length, events });
});

// ---------------------------------------------------------------------------
// GET /api/telemetry/deploy/patterns — aggregate view for MCP + developer portal
// Prefers actual telemetry events; falls back to domain records for counts.
// ---------------------------------------------------------------------------

telemetryRouter.get('/api/telemetry/deploy/patterns', async (req: Request, res: Response) => {
  const { framework, success, limit } = req.query;
  const limitNum = Math.min(parseInt(String(limit ?? '100'), 10) || 100, 500);

  type EventRecord = {
    id: string;
    framework: string;
    success: boolean;
    coldStartMs: number | null;
    createdAt: string;
    migrateFromVercel: boolean;
  };

  try {
    // Prefer actual telemetry events when available
    let events: EventRecord[] = [];

    if (_deployEvents.length > 0) {
      events = _deployEvents.map((e) => ({
        id: e.run_id,
        framework: String(e.orchestration_run.project_type ?? 'unknown'),
        success: Boolean(e.deploy_outcome.success),
        coldStartMs: typeof e.deploy_outcome.duration_seconds === 'number'
          ? Math.round((e.deploy_outcome.duration_seconds as number) * 1000)
          : null,
        createdAt: e.received_at,
        migrateFromVercel: false,
      }));
    } else {
      // Fallback: derive from registered domains (no framework granularity)
      const domains = await fetchAllDomains();
      events = domains.map((d) => ({
        id: d.id,
        framework: d.deploymentType ?? 'unknown',
        success: true,
        coldStartMs: null,
        createdAt: d.createdAt,
        migrateFromVercel: false,
      }));
    }

    if (framework && typeof framework === 'string') {
      events = events.filter((e) => e.framework === framework);
    }
    if (success !== undefined) {
      const successBool = success === 'true';
      events = events.filter((e) => e.success === successBool);
    }

    const limitedEvents = events.slice(0, limitNum);

    const frameworkBreakdown: Record<string, {
      total: number;
      success: number;
      avgColdStartMs: number;
      coldStartSamples: number;
    }> = {};

    for (const e of limitedEvents) {
      if (!frameworkBreakdown[e.framework]) {
        frameworkBreakdown[e.framework] = { total: 0, success: 0, avgColdStartMs: 0, coldStartSamples: 0 };
      }
      frameworkBreakdown[e.framework].total++;
      if (e.success) frameworkBreakdown[e.framework].success++;
      if (e.coldStartMs !== null) {
        const fb = frameworkBreakdown[e.framework];
        fb.avgColdStartMs = Math.round(
          (fb.avgColdStartMs * fb.coldStartSamples + e.coldStartMs) / (fb.coldStartSamples + 1)
        );
        fb.coldStartSamples++;
      }
    }

    const vercelMigrations = limitedEvents.filter((e) => e.migrateFromVercel).length;
    const overrideRate = 0;

    res.json({
      totalEvents: limitedEvents.length,
      frameworkBreakdown,
      vercelMigrations,
      overrideRate,
      events: limitedEvents,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[telemetry] deploy patterns error:', message);
    res.status(502).json({ error: message });
  }
});
