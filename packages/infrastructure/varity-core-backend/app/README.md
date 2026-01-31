# Varity Core Backend - Gas Tracking API

FastAPI backend for tracking gas usage and billing developers in Varity SDK.

## Quick Start

### 1. Install Dependencies

```bash
cd varity-sdk/packages/infrastructure/varity-core-backend/app
pip install -r requirements.txt
```

### 2. Configure Environment

Create `.env` file:

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/varity_production

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
ENV=development

# CORS Origins
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Billing Configuration
BILLING_DAY=1
INVOICE_DUE_DAYS=30

# Stripe (for production billing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Gas Tracking
GAS_TRACKING_ENABLED=true
```

### 3. Setup MongoDB

```bash
# Start MongoDB locally
docker run -d -p 27017:27017 --name varity-mongo mongo:7.0

# Or use MongoDB Atlas (production)
# Get connection string from https://cloud.mongodb.com
```

### 4. Initialize Database

```python
# Run database setup
python -c "
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.gas_usage import setup_database
import asyncio

async def init():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.varity_production
    await setup_database(db)

asyncio.run(init())
"
```

### 5. Start Server

```bash
# Development (with auto-reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production (with gunicorn)
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### 6. Test API

```bash
# Health check
curl http://localhost:8000/health

# API docs
open http://localhost:8000/docs
```

## API Endpoints

### Gas Tracking

#### POST `/v1/gas-tracking`

Track gas usage event.

```bash
curl -X POST http://localhost:8000/v1/gas-tracking \
  -H "Content-Type: application/json" \
  -d '{
    "app_id": "app_abc123",
    "developer_wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "transaction_hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "gas_sponsored": "0.025000",
    "timestamp": 1737321600000,
    "chain_id": 33529,
    "user_wallet": "0x9876543210fedcba9876543210fedcba98765432"
  }'
```

#### GET `/v1/gas-tracking/{app_id}/usage`

Get app gas usage.

```bash
# Current month
curl http://localhost:8000/v1/gas-tracking/app_abc123/usage

# Specific month
curl http://localhost:8000/v1/gas-tracking/app_abc123/usage?month=2026-01
```

#### GET `/v1/billing/{developer_wallet}/summary`

Get developer billing summary.

```bash
curl http://localhost:8000/v1/billing/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/summary?month=2026-01
```

#### GET `/v1/gas-tracking/health`

Health check for gas tracking service.

```bash
curl http://localhost:8000/v1/gas-tracking/health
```

## Project Structure

```
app/
├── main.py                    # FastAPI application entry point
├── requirements.txt           # Python dependencies
├── README.md                  # This file
│
├── api/                       # API routes
│   ├── __init__.py
│   └── v1/
│       ├── __init__.py
│       └── gas_tracking.py    # Gas tracking endpoints
│
├── models/                    # Database models
│   ├── __init__.py
│   └── gas_usage.py           # MongoDB schemas
│
├── services/                  # Business logic (future)
│   ├── __init__.py
│   ├── billing.py
│   └── analytics.py
│
└── utils/                     # Utilities (future)
    ├── __init__.py
    └── logger.py
```

## Database Schema

### Collections

1. **gas_usage** - Individual gas usage events
2. **billing_cycles** - Monthly billing aggregates

See `app/models/gas_usage.py` for detailed schemas.

### Indexes

```javascript
// gas_usage indexes
db.gas_usage.createIndex({ app_id: 1, billing_month: 1 });
db.gas_usage.createIndex({ developer_wallet: 1, billing_status: 1 });
db.gas_usage.createIndex({ transaction_hash: 1 }, { unique: true });
db.gas_usage.createIndex({ timestamp: -1 });
db.gas_usage.createIndex({ chain_id: 1 });

// billing_cycles indexes
db.billing_cycles.createIndex({ developer_wallet: 1, billing_month: 1 }, { unique: true });
db.billing_cycles.createIndex({ billing_status: 1 });
db.billing_cycles.createIndex({ billing_status: 1, due_date: 1 });
```

## Development

### Run Tests

```bash
# Install dev dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest app/tests/ -v

# Run with coverage
pytest app/tests/ --cov=app --cov-report=html
```

### Code Quality

```bash
# Format code
black app/

# Lint code
ruff check app/

# Type checking
mypy app/
```

### Database Migrations

```bash
# Backup database
mongodump --uri="mongodb://localhost:27017/varity_production" --out=backup/

# Restore database
mongorestore --uri="mongodb://localhost:27017/varity_production" backup/varity_production/
```

## Deployment

### Docker

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

Build and run:

```bash
docker build -t varity-backend .
docker run -p 8000:8000 --env-file .env varity-backend
```

### Kubernetes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: varity-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: varity-backend
  template:
    metadata:
      labels:
        app: varity-backend
    spec:
      containers:
      - name: api
        image: varity/backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: varity-secrets
              key: mongodb-uri
```

### Railway / Render

1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

## Monitoring

### Health Checks

```bash
# API health
curl http://localhost:8000/health

# Gas tracking health
curl http://localhost:8000/v1/gas-tracking/health
```

### Metrics (Future)

- Total gas tracked (USDC)
- Transactions per second
- API response times
- Error rates
- Database query performance

### Logging

```python
import structlog

logger = structlog.get_logger()

logger.info("gas_tracked", app_id=app_id, amount=gas_cost)
logger.error("tracking_failed", error=str(e))
```

## Billing Automation

### Monthly Billing Cron Job

```python
# billing_job.py
from datetime import datetime
from app.models.gas_usage import BillingCycle

async def run_monthly_billing():
    """
    Run on 1st of each month

    1. Aggregate previous month's gas usage
    2. Create billing cycles
    3. Generate invoices (3rd of month)
    4. Send payment reminders (7 days before due)
    """
    last_month = datetime.now().replace(day=1) - timedelta(days=1)
    billing_month = last_month.strftime("%Y-%m")

    # Aggregate gas usage
    for developer in await get_active_developers():
        await aggregate_billing_cycle(developer, billing_month)

    print(f"✓ Monthly billing complete for {billing_month}")
```

Schedule with cron:

```bash
# crontab
0 0 1 * * /usr/bin/python /app/billing_job.py
```

## Security

### API Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/v1/gas-tracking")
@limiter.limit("100/minute")
async def track_gas_usage(event: GasUsageEvent):
    ...
```

### Authentication (Future)

```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def verify_token(token: str = Depends(security)):
    # Verify JWT token
    if not is_valid_token(token):
        raise HTTPException(status_code=401)
```

## Troubleshooting

### MongoDB Connection Issues

```bash
# Check MongoDB is running
docker ps | grep mongo

# Check connection string
echo $MONGODB_URI

# Test connection
mongosh $MONGODB_URI
```

### API Not Responding

```bash
# Check if server is running
ps aux | grep uvicorn

# Check logs
tail -f /var/log/varity-backend.log

# Check port availability
lsof -i :8000
```

### Database Performance

```javascript
// Check slow queries
db.setProfilingLevel(1, { slowms: 100 });
db.system.profile.find({ millis: { $gt: 100 } });

// Analyze query performance
db.gas_usage.find({ app_id: "app_abc123" }).explain("executionStats");
```

## Support

- **Documentation:** https://docs.varity.so/backend
- **Discord:** https://discord.gg/varity
- **Email:** backend@varity.so

---

**Version:** 1.0.0
**Last Updated:** January 20, 2026
