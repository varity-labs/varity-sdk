import { Router, Request, Response } from 'express';
import { ensureSchema, ensureTable } from '../schema';
import { validateAppToken } from '../auth';
import { quoteIdent, parseJsonbData } from '../utils';
import { DatabaseQuery, DatabaseResponse } from '../types';
import { config } from '../config';
import pool from '../pool';

const isProduction = config.server.env === 'production';

const router = Router();

// Validation patterns
const COLLECTION_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{0,62}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_ORDER_COLUMNS = ['created_at', 'updated_at', 'id'];
const ALLOWED_DIRECTIONS = ['ASC', 'DESC'];

export function validateCollection(collection: string): string | null {
  if (!COLLECTION_REGEX.test(collection)) {
    return 'Invalid collection name. Must start with a letter, contain only alphanumeric characters and underscores, max 63 chars.';
  }
  return null;
}

export function validateId(id: string): string | null {
  if (!UUID_REGEX.test(id)) {
    return 'Invalid document ID. Must be a valid UUID.';
  }
  return null;
}

export function parseOrderBy(raw: string): { column: string; direction: string } | null {
  let column = raw;
  let direction = 'ASC';

  if (column.startsWith('-')) {
    direction = 'DESC';
    column = column.substring(1);
  }

  if (!ALLOWED_ORDER_COLUMNS.includes(column)) {
    return null;
  }
  if (!ALLOWED_DIRECTIONS.includes(direction)) {
    return null;
  }

  return { column, direction };
}

// Apply auth middleware to all routes
router.use(validateAppToken);

/**
 * POST /db/:collection/add
 * Insert a document into a collection
 */
router.post('/:collection/add', async (req: Request, res: Response) => {
  try {
    const collection = req.params.collection as string;
    const collectionError = validateCollection(collection);
    if (collectionError) {
      res.status(400).json({ success: false, error: collectionError });
      return;
    }

    const data = req.body;
    const { schema } = req.appContext!;

    await ensureSchema(schema);
    await ensureTable(schema, collection);

    const s = quoteIdent(schema);
    const t = quoteIdent(collection);
    const result = await pool.query(
      `INSERT INTO ${s}.${t} (data) VALUES ($1) RETURNING id, data, created_at, updated_at`,
      [JSON.stringify(data)]
    );

    const response: DatabaseResponse = {
      success: true,
      data: {
        id: result.rows[0].id,
        ...parseJsonbData(result.rows[0].data),
        created_at: result.rows[0].created_at,
        updated_at: result.rows[0].updated_at,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error inserting document:', error);
    const response: DatabaseResponse = {
      success: false,
      error: isProduction ? 'Internal server error' : (error instanceof Error ? error.message : 'Unknown error'),
    };
    res.status(500).json(response);
  }
});

/**
 * GET /db/:collection/get
 * Query documents from a collection
 */
router.get('/:collection/get', async (req: Request, res: Response) => {
  try {
    const collection = req.params.collection as string;
    const collectionError = validateCollection(collection);
    if (collectionError) {
      res.status(400).json({ success: false, error: collectionError });
      return;
    }

    const { schema } = req.appContext!;

    const query: DatabaseQuery = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      orderBy: req.query.orderBy as string | undefined,
    };

    await ensureSchema(schema);
    await ensureTable(schema, collection);

    const s = quoteIdent(schema);
    const t = quoteIdent(collection);
    let sql = `SELECT id, data, created_at, updated_at FROM ${s}.${t}`;
    const params: any[] = [];

    // Validate and apply ORDER BY (prevent SQL injection)
    if (query.orderBy) {
      const parsed = parseOrderBy(query.orderBy);
      if (!parsed) {
        res.status(400).json({
          success: false,
          error: `Invalid orderBy. Allowed columns: ${ALLOWED_ORDER_COLUMNS.join(', ')}. Prefix with - for DESC.`,
        });
        return;
      }
      sql += ` ORDER BY ${quoteIdent(parsed.column)} ${parsed.direction}`;
    } else {
      sql += ` ORDER BY created_at DESC`;
    }

    if (query.limit) {
      sql += ` LIMIT $${params.length + 1}`;
      params.push(query.limit);
    }

    if (query.offset) {
      sql += ` OFFSET $${params.length + 1}`;
      params.push(query.offset);
    }

    const result = await pool.query(sql, params);

    const documents = result.rows.map((row) => ({
      id: row.id,
      ...parseJsonbData(row.data),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    const response: DatabaseResponse = {
      success: true,
      data: documents,
    };

    res.json(response);
  } catch (error) {
    console.error('Error querying documents:', error);
    const response: DatabaseResponse = {
      success: false,
      error: isProduction ? 'Internal server error' : (error instanceof Error ? error.message : 'Unknown error'),
    };
    res.status(500).json(response);
  }
});

/**
 * PUT /db/:collection/update/:id
 * Update a document by ID
 */
router.put('/:collection/update/:id', async (req: Request, res: Response) => {
  try {
    const collection = req.params.collection as string;
    const id = req.params.id as string;
    const collectionError = validateCollection(collection);
    if (collectionError) {
      res.status(400).json({ success: false, error: collectionError });
      return;
    }
    const idError = validateId(id);
    if (idError) {
      res.status(400).json({ success: false, error: idError });
      return;
    }

    const data = req.body;
    const { schema } = req.appContext!;

    await ensureSchema(schema);
    await ensureTable(schema, collection);

    const s = quoteIdent(schema);
    const t = quoteIdent(collection);
    const result = await pool.query(
      `UPDATE ${s}.${t}
       SET data = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, data, created_at, updated_at`,
      [JSON.stringify(data), id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }

    const response: DatabaseResponse = {
      success: true,
      data: {
        id: result.rows[0].id,
        ...parseJsonbData(result.rows[0].data),
        created_at: result.rows[0].created_at,
        updated_at: result.rows[0].updated_at,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating document:', error);
    const response: DatabaseResponse = {
      success: false,
      error: isProduction ? 'Internal server error' : (error instanceof Error ? error.message : 'Unknown error'),
    };
    res.status(500).json(response);
  }
});

/**
 * DELETE /db/:collection/delete/:id
 * Delete a document by ID
 */
router.delete('/:collection/delete/:id', async (req: Request, res: Response) => {
  try {
    const collection = req.params.collection as string;
    const id = req.params.id as string;
    const collectionError = validateCollection(collection);
    if (collectionError) {
      res.status(400).json({ success: false, error: collectionError });
      return;
    }
    const idError = validateId(id);
    if (idError) {
      res.status(400).json({ success: false, error: idError });
      return;
    }

    const { schema } = req.appContext!;

    await ensureSchema(schema);
    await ensureTable(schema, collection);

    const s = quoteIdent(schema);
    const t = quoteIdent(collection);
    const result = await pool.query(
      `DELETE FROM ${s}.${t} WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }

    const response: DatabaseResponse = {
      success: true,
      data: { deleted: true, id },
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting document:', error);
    const response: DatabaseResponse = {
      success: false,
      error: isProduction ? 'Internal server error' : (error instanceof Error ? error.message : 'Unknown error'),
    };
    res.status(500).json(response);
  }
});

export default router;
