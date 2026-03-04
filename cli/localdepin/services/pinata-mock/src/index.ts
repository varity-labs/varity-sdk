import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import cors from 'cors';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3002;
const IPFS_API_URL = process.env.IPFS_API_URL || 'http://localhost:5001';
const IPFS_GATEWAY_URL = process.env.IPFS_GATEWAY_URL || 'http://localhost:8080';

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

// In-memory storage for pinned items
interface PinnedItem {
  id: string;
  ipfsHash: string;
  size: number;
  timestamp: string;
  name?: string;
  metadata?: Record<string, any>;
}

const pinnedItems: Map<string, PinnedItem> = new Map();

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'pinata-mock-server',
    ipfsConnection: IPFS_API_URL,
    timestamp: new Date().toISOString()
  });
});

// Upload file to IPFS
async function uploadToIPFS(fileBuffer: Buffer, filename: string): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', fileBuffer, filename);

    const response = await axios.post(`${IPFS_API_URL}/api/v0/add`, formData, {
      headers: formData.getHeaders(),
      params: {
        pin: true,
        'cid-version': 1,
      },
    });

    return response.data.Hash;
  } catch (error: any) {
    console.error('IPFS upload error:', error.message);
    throw new Error(`Failed to upload to IPFS: ${error.message}`);
  }
}

// Upload JSON to IPFS
async function uploadJSONToIPFS(jsonData: any): Promise<string> {
  try {
    const jsonString = JSON.stringify(jsonData, null, 2);
    const buffer = Buffer.from(jsonString, 'utf-8');

    const formData = new FormData();
    formData.append('file', buffer, 'data.json');

    const response = await axios.post(`${IPFS_API_URL}/api/v0/add`, formData, {
      headers: formData.getHeaders(),
      params: {
        pin: true,
        'cid-version': 1,
      },
    });

    return response.data.Hash;
  } catch (error: any) {
    console.error('IPFS JSON upload error:', error.message);
    throw new Error(`Failed to upload JSON to IPFS: ${error.message}`);
  }
}

// Pinata API: Pin file to IPFS
app.post('/pinning/pinFileToIPFS', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const cid = await uploadToIPFS(req.file.buffer, req.file.originalname);

    const pinnedItem: PinnedItem = {
      id: uuidv4(),
      ipfsHash: cid,
      size: req.file.size,
      timestamp: new Date().toISOString(),
      name: req.file.originalname,
      metadata: req.body.pinataMetadata ? JSON.parse(req.body.pinataMetadata) : {},
    };

    pinnedItems.set(cid, pinnedItem);

    console.log(`📌 Pinned file: ${req.file.originalname} -> ${cid}`);

    res.json({
      IpfsHash: cid,
      PinSize: req.file.size,
      Timestamp: pinnedItem.timestamp,
      isDuplicate: false,
    });
  } catch (error: any) {
    console.error('Pin file error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Pinata API: Pin JSON to IPFS
app.post('/pinning/pinJSONToIPFS', async (req: Request, res: Response) => {
  try {
    const jsonData = req.body.pinataContent || req.body;
    const metadata = req.body.pinataMetadata || {};

    const cid = await uploadJSONToIPFS(jsonData);
    const jsonString = JSON.stringify(jsonData);
    const size = Buffer.byteLength(jsonString, 'utf8');

    const pinnedItem: PinnedItem = {
      id: uuidv4(),
      ipfsHash: cid,
      size,
      timestamp: new Date().toISOString(),
      name: metadata.name || 'json-data',
      metadata,
    };

    pinnedItems.set(cid, pinnedItem);

    console.log(`📌 Pinned JSON: ${metadata.name || 'unnamed'} -> ${cid}`);

    res.json({
      IpfsHash: cid,
      PinSize: size,
      Timestamp: pinnedItem.timestamp,
      isDuplicate: false,
    });
  } catch (error: any) {
    console.error('Pin JSON error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Pinata API: Unpin from IPFS
app.delete('/pinning/unpin/:hashToUnpin', async (req: Request, res: Response) => {
  try {
    const { hashToUnpin } = req.params;

    // Remove from local storage
    const deleted = pinnedItems.delete(hashToUnpin);

    if (!deleted) {
      return res.status(404).json({ error: 'Hash not found in pinned items' });
    }

    // Unpin from IPFS
    try {
      await axios.post(`${IPFS_API_URL}/api/v0/pin/rm`, null, {
        params: { arg: hashToUnpin },
      });
    } catch (error: any) {
      console.warn(`Warning: Could not unpin from IPFS: ${error.message}`);
    }

    console.log(`🗑️  Unpinned: ${hashToUnpin}`);

    res.json({ message: 'Unpinned successfully' });
  } catch (error: any) {
    console.error('Unpin error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Pinata API: List pinned items
app.get('/data/pinList', (req: Request, res: Response) => {
  try {
    const rows = Array.from(pinnedItems.values()).map(item => ({
      id: item.id,
      ipfs_pin_hash: item.ipfsHash,
      size: item.size,
      date_pinned: item.timestamp,
      metadata: {
        name: item.name,
        ...item.metadata,
      },
    }));

    res.json({
      count: rows.length,
      rows,
    });
  } catch (error: any) {
    console.error('List pins error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test authentication (mock)
app.get('/data/testAuthentication', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  res.json({
    message: 'Congratulations! You are communicating with the Pinata API!',
  });
});

// Gateway: Retrieve file from IPFS
app.get('/ipfs/:cid', async (req: Request, res: Response) => {
  try {
    const { cid } = req.params;
    const response = await axios.get(`${IPFS_GATEWAY_URL}/ipfs/${cid}`, {
      responseType: 'stream',
    });

    response.data.pipe(res);
  } catch (error: any) {
    console.error('Gateway error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stats endpoint
app.get('/stats', (req: Request, res: Response) => {
  const totalSize = Array.from(pinnedItems.values()).reduce((sum, item) => sum + item.size, 0);

  res.json({
    totalPins: pinnedItems.size,
    totalSize,
    totalSizeFormatted: formatBytes(totalSize),
    ipfsNode: IPFS_API_URL,
    uptime: process.uptime(),
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: err.message,
    service: 'pinata-mock-server',
  });
});

// Utility: Format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Pinata Mock Server running on port ${PORT}`);
  console.log(`📡 IPFS API: ${IPFS_API_URL}`);
  console.log(`🌐 IPFS Gateway: ${IPFS_GATEWAY_URL}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
});

export default app;
