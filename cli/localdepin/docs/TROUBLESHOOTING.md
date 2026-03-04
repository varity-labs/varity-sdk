# LocalDePin Troubleshooting Guide

This guide helps you diagnose and fix common issues with the LocalDePin network.

## Table of Contents

1. [General Troubleshooting](#general-troubleshooting)
2. [Service-Specific Issues](#service-specific-issues)
3. [Performance Issues](#performance-issues)
4. [Data Issues](#data-issues)
5. [Network Issues](#network-issues)

## General Troubleshooting

### Network Won't Start

**Symptom**: `./scripts/start.sh` fails or hangs

**Solutions**:

1. **Check Docker is running**
   ```bash
   docker info
   ```
   If Docker is not running, start Docker Desktop or Docker daemon.

2. **Check for port conflicts**
   ```bash
   # Check if ports are already in use
   lsof -i :8547  # Arbitrum
   lsof -i :5001  # IPFS API
   lsof -i :8081  # IPFS Gateway
   lsof -i :3001  # Varity API
   lsof -i :3002  # Pinata Mock
   lsof -i :3003  # Akash Simulator
   lsof -i :26658 # Celestia RPC
   lsof -i :26659 # Celestia Gateway
   lsof -i :5432  # PostgreSQL
   lsof -i :6379  # Redis
   ```
   Kill conflicting processes or change ports in `docker-compose.yml`.

3. **Check Docker resources**
   ```bash
   docker system df
   ```
   Ensure you have enough disk space, memory, and CPU allocated to Docker.

4. **Reset the network**
   ```bash
   ./scripts/reset.sh
   ```

### Services Failing Health Checks

**Symptom**: Health check script reports services as unhealthy

**Solutions**:

1. **Check service logs**
   ```bash
   ./scripts/logs.sh <service-name>
   ```

2. **Restart specific service**
   ```bash
   docker-compose restart <service-name>
   ```

3. **Increase health check timeout**
   Edit `scripts/healthcheck.sh` and increase `MAX_ATTEMPTS` or `ATTEMPT_INTERVAL`.

4. **Check service dependencies**
   Some services depend on others. Ensure infrastructure services (postgres, redis, ipfs, arbitrum) are running before application services.

### Docker Compose Errors

**Symptom**: `docker-compose` command not found or errors

**Solutions**:

1. **Check Docker Compose installation**
   ```bash
   docker-compose --version
   # or
   docker compose version
   ```

2. **Use Docker Compose V2**
   If using Docker Compose V2, replace `docker-compose` with `docker compose` in scripts.

3. **Update Docker Compose**
   ```bash
   # macOS
   brew upgrade docker-compose

   # Linux
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

## Service-Specific Issues

### Arbitrum Node Issues

**Symptom**: RPC not responding or blockchain not producing blocks

**Solutions**:

1. **Check node logs**
   ```bash
   ./scripts/logs.sh arbitrum-node
   ```

2. **Verify chain ID**
   ```bash
   curl -X POST http://localhost:8547 \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
   ```
   Should return: `"result":"0x66aee"` (421614 in hex)

3. **Check block production**
   ```bash
   curl -X POST http://localhost:8547 \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
   ```
   Block number should increase every 2 seconds.

4. **Restart node**
   ```bash
   docker-compose restart arbitrum-node
   ```

### IPFS Node Issues

**Symptom**: Cannot upload or retrieve files

**Solutions**:

1. **Check IPFS daemon**
   ```bash
   curl http://localhost:5001/api/v0/version
   ```

2. **Check IPFS logs**
   ```bash
   ./scripts/logs.sh ipfs-node
   ```

3. **Test upload**
   ```bash
   echo "test" | curl -F "file=@-" http://localhost:5001/api/v0/add
   ```

4. **Check storage**
   ```bash
   curl http://localhost:5001/api/v0/stats/repo
   ```

5. **Garbage collection**
   ```bash
   docker exec localdepin-ipfs-node-1 ipfs repo gc
   ```

### Pinata Mock Issues

**Symptom**: Pinata API returns errors

**Solutions**:

1. **Check service health**
   ```bash
   curl http://localhost:3002/health
   ```

2. **Check IPFS connectivity**
   ```bash
   ./scripts/logs.sh pinata-mock
   ```
   Look for IPFS connection errors.

3. **Rebuild service**
   ```bash
   docker-compose build pinata-mock
   docker-compose up -d pinata-mock
   ```

### Akash Simulator Issues

**Symptom**: LLM inference fails or deployments don't work

**Solutions**:

1. **Check service health**
   ```bash
   curl http://localhost:3003/health
   ```

2. **Test inference**
   ```bash
   curl -X POST http://localhost:3003/compute/run-model \
     -H "Content-Type: application/json" \
     -d '{"prompt": "test", "industry": "iso-merchant"}'
   ```

3. **Check deployments**
   ```bash
   curl http://localhost:3003/deployments
   ```

4. **Rebuild service**
   ```bash
   docker-compose build akash-simulator
   docker-compose up -d akash-simulator
   ```

### PostgreSQL Issues

**Symptom**: Database connection errors

**Solutions**:

1. **Check database health**
   ```bash
   docker exec localdepin-postgres-1 pg_isready -U varity
   ```

2. **Connect to database**
   ```bash
   docker exec -it localdepin-postgres-1 psql -U varity -d varity_indexer
   ```

3. **Check tables**
   ```sql
   \dt varity.*
   \dt indexer.*
   ```

4. **Reinitialize database**
   ```bash
   docker-compose down postgres
   docker volume rm localdepin_postgres-data
   docker-compose up -d postgres
   ```

### Redis Issues

**Symptom**: Cache not working or connection errors

**Solutions**:

1. **Check Redis health**
   ```bash
   docker exec localdepin-redis-1 redis-cli ping
   ```

2. **Check memory usage**
   ```bash
   docker exec localdepin-redis-1 redis-cli info memory
   ```

3. **Flush cache**
   ```bash
   docker exec localdepin-redis-1 redis-cli FLUSHALL
   ```

4. **Restart Redis**
   ```bash
   docker-compose restart redis
   ```

### Celestia Node Issues

**Symptom**: Celestia DA not available

**Solutions**:

1. **Check node status**
   ```bash
   curl http://localhost:26659/head
   ```

2. **Check logs**
   ```bash
   ./scripts/logs.sh celestia-node
   ```

3. **Restart node**
   ```bash
   docker-compose restart celestia-node
   ```

**Note**: Celestia is optional for basic functionality. Most operations will work without it.

## Performance Issues

### Slow Startup Time

**Symptom**: Network takes > 3 minutes to start

**Solutions**:

1. **Allocate more resources to Docker**
   - Docker Desktop → Preferences → Resources
   - Increase CPU, Memory, and Disk

2. **Use SSD storage**
   Docker volumes should be on SSD for better performance.

3. **Pull images beforehand**
   ```bash
   docker-compose pull
   ```

4. **Disable unnecessary services**
   Comment out services you don't need in `docker-compose.yml`.

### Slow Block Production

**Symptom**: Blocks taking > 2 seconds

**Solutions**:

1. **Check Arbitrum node logs**
   ```bash
   ./scripts/logs.sh arbitrum-node
   ```

2. **Allocate more CPU to Docker**

3. **Reduce load on network**
   Stop unnecessary services or reduce concurrent transactions.

### Slow IPFS Operations

**Symptom**: File uploads/downloads taking too long

**Solutions**:

1. **Increase IPFS memory**
   Edit `docker-compose.yml` and add:
   ```yaml
   ipfs-node:
     deploy:
       resources:
         limits:
           memory: 2G
   ```

2. **Disable replication**
   For local testing, replication is unnecessary.

3. **Use smaller files**
   Test with smaller files first.

## Data Issues

### Data Corruption

**Symptom**: Services crashing or data inconsistencies

**Solutions**:

1. **Reset network**
   ```bash
   ./scripts/reset.sh
   ```

2. **Check Docker volumes**
   ```bash
   docker volume ls
   docker volume inspect localdepin_<volume-name>
   ```

3. **Remove corrupted volumes**
   ```bash
   docker-compose down
   docker volume rm localdepin_<corrupted-volume>
   docker-compose up -d
   ```

### Out of Disk Space

**Symptom**: Services failing with "no space left" errors

**Solutions**:

1. **Check disk usage**
   ```bash
   docker system df
   ```

2. **Clean Docker**
   ```bash
   docker system prune -a --volumes
   ```
   ⚠️ This removes ALL unused Docker data.

3. **Clean LocalDePin volumes**
   ```bash
   ./scripts/stop.sh
   docker volume prune --filter "label=com.docker.compose.project=localdepin"
   ```

4. **Allocate more disk to Docker**
   Docker Desktop → Preferences → Resources → Disk

### Lost Data

**Symptom**: Data disappeared after restart

**Solutions**:

1. **Check if volumes exist**
   ```bash
   docker volume ls | grep localdepin
   ```

2. **Check if stopped without volumes**
   ```bash
   # Correct way (preserves data)
   ./scripts/stop.sh

   # Wrong way (removes data)
   docker-compose down -v
   ```

3. **Restore from backup** (if you have one)

**Prevention**:
- Use `./scripts/stop.sh` instead of `docker-compose down -v`
- Don't use `./scripts/reset.sh` unless you want to delete data

## Network Issues

### Cannot Connect to Services

**Symptom**: Services not accessible from host

**Solutions**:

1. **Check containers are running**
   ```bash
   docker-compose ps
   ```

2. **Check port mappings**
   ```bash
   docker-compose port <service-name> <port>
   ```

3. **Check firewall**
   Ensure firewall is not blocking Docker ports.

4. **Check Docker network**
   ```bash
   docker network inspect localdepin_localdepin
   ```

### Services Cannot Communicate

**Symptom**: Services cannot reach each other

**Solutions**:

1. **Check Docker network**
   ```bash
   docker network ls
   docker network inspect localdepin_localdepin
   ```

2. **Verify service DNS**
   ```bash
   docker exec localdepin-varity-api-local-1 ping postgres
   ```

3. **Recreate network**
   ```bash
   docker-compose down
   docker network prune
   docker-compose up -d
   ```

## Advanced Debugging

### Enable Debug Logging

Edit `docker-compose.yml` and add:
```yaml
environment:
  - LOG_LEVEL=debug
  - DEBUG=*
```

### Access Container Shell

```bash
docker exec -it localdepin-<service-name>-1 sh
```

### View Real-time Stats

```bash
docker stats
```

### Export Logs

```bash
./scripts/logs.sh > localdepin-logs.txt
```

### Check Resource Limits

```bash
docker inspect localdepin-<service-name>-1 | grep -A 10 "Resources"
```

## Getting Help

If none of these solutions work:

1. **Collect diagnostic info**
   ```bash
   ./scripts/status.sh > status.txt
   ./scripts/logs.sh > logs.txt
   docker system info > docker-info.txt
   ```

2. **Create an issue** on GitHub with:
   - Description of the problem
   - Steps to reproduce
   - Log files
   - System information

3. **Join Discord** for real-time help

## Common Error Messages

### "port is already allocated"
→ Another service is using the port. Change port in `docker-compose.yml` or stop conflicting service.

### "no space left on device"
→ Run `docker system prune -a --volumes` or allocate more disk to Docker.

### "network not found"
→ Run `docker network prune` then `./scripts/start.sh`.

### "exec format error"
→ Docker image not compatible with your CPU architecture. Check if you need ARM or x86 images.

### "permission denied"
→ Run `chmod +x scripts/*.sh` to make scripts executable.

### "container failed to start"
→ Check logs with `./scripts/logs.sh <service-name>`.

---

**Still having issues?** Open an issue at https://github.com/varity/varietykit/issues
