# Scaling (20k+ concurrent users)

## Bottleneck

Execution is **CPU-bound** in Docker. The API tier stays light (enqueue only).

## Horizontal scale

1. **API replicas** — stateless Express behind load balancer
2. **Redis** — managed Redis (ElastiCache, Memorystore) with persistence
3. **Worker replicas** — `N` processes or pods, each running `compiler:worker`
4. **Concurrency** — tune `Worker` `concurrency` per host based on CPU cores

## Capacity planning

Rough: 1 sandbox ≈ 2–10s, 1 worker @ concurrency 4 ≈ ~24–120 runs/min.

For 10k runs/min → hundreds of parallel sandboxes across a worker fleet.

## Autoscaling signal

- BullMQ queue depth (`waiting` count)
- p95 job duration
- Worker CPU %

Kubernetes HPA example (future):

```yaml
# Scale workers when queue depth > 100
metric: bullmq_waiting_jobs
```

## Multi-region

- Redis: single primary per region or dedicated queue per region
- Workers: same region as Redis to minimize latency
- DB: submission rows in Postgres (existing cluster)
