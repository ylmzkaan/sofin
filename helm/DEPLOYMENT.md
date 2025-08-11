# Social Finance Application Deployment Guide

This guide explains how to deploy the Social Finance application to Kubernetes using Helm.

## Prerequisites

Before deploying the application, ensure you have the following installed and configured:

- **Kubernetes Cluster**: A running Kubernetes cluster (local or cloud-based)
- **kubectl**: Kubernetes command-line tool
- **Helm**: Kubernetes package manager (version 3.x)
- **Docker**: For building container images (if building locally)

## Quick Start

### 1. Build and Push Images

First, build and push your Docker images to a container registry:

```bash
# Build backend image
docker build -t your-registry/social-finance-backend:latest backend/

# Build frontend image
docker build -t your-registry/social-finance-frontend:latest frontend/

# Push images
docker push your-registry/social-finance-backend:latest
docker push your-registry/social-finance-frontend:latest
```

### 2. Update Configuration

Update the `values.yaml` file with your specific configuration:

```yaml
# Update image repositories
backend:
  image:
    repository: your-registry/social-finance-backend
    tag: latest

frontend:
  image:
    repository: your-registry/social-finance-frontend
    tag: latest

# Update Stripe keys
stripe:
  secretKey: sk_live_your_stripe_secret_key
  publishableKey: pk_live_your_stripe_publishable_key
  webhookSecret: whsec_your_webhook_secret

# Update JWT secret
jwt:
  secretKey: your-super-secret-jwt-key-change-in-production

# Update database credentials
postgres:
  db:
    password: your-secure-database-password
```

### 3. Deploy Using Helm

Use the provided deployment script:

```bash
# Deploy the application
./deploy.sh deploy

# Check deployment status
./deploy.sh status

# View logs
./deploy.sh logs backend
./deploy.sh logs frontend
```

Or deploy manually:

```bash
# Create namespace
kubectl create namespace social-finance

# Install the chart
helm install social-finance ./social-finance \
  --namespace social-finance \
  --values values.yaml \
  --wait \
  --timeout 10m
```

## Configuration

### Environment Variables

The application uses the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Auto-generated |
| `REDIS_URL` | Redis connection string | Auto-generated |
| `JWT_SECRET_KEY` | JWT signing secret | From values.yaml |
| `STRIPE_SECRET_KEY` | Stripe secret key | From values.yaml |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | From values.yaml |
| `UPLOAD_DIR` | File upload directory | `/app/uploads` |
| `MAX_FILE_SIZE` | Maximum file size | `10485760` (10MB) |

### Resource Requirements

Default resource requirements for each component:

#### Backend
- **CPU**: 100m (request) / 500m (limit)
- **Memory**: 128Mi (request) / 512Mi (limit)

#### Frontend
- **CPU**: 50m (request) / 200m (limit)
- **Memory**: 64Mi (request) / 256Mi (limit)

#### PostgreSQL
- **CPU**: 100m (request) / 500m (limit)
- **Memory**: 256Mi (request) / 1Gi (limit)
- **Storage**: 10Gi (configurable)

#### Redis
- **CPU**: 50m (request) / 200m (limit)
- **Memory**: 64Mi (request) / 256Mi (limit)
- **Storage**: 5Gi (configurable)

### Scaling

The application supports horizontal pod autoscaling:

```yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
```

## Monitoring and Troubleshooting

### Check Pod Status

```bash
kubectl get pods -n social-finance
```

### View Logs

```bash
# Backend logs
kubectl logs -n social-finance -l app.kubernetes.io/component=backend

# Frontend logs
kubectl logs -n social-finance -l app.kubernetes.io/component=frontend

# Database logs
kubectl logs -n social-finance -l app.kubernetes.io/component=postgres
```

### Check Services

```bash
kubectl get services -n social-finance
```

### Check Ingress

```bash
kubectl get ingress -n social-finance
```

### Check Persistent Volumes

```bash
kubectl get pvc -n social-finance
kubectl get pv
```

## Database Management

### Access PostgreSQL

```bash
# Port forward to access database locally
kubectl port-forward -n social-finance svc/social-finance-postgres 5432:5432

# Connect using psql
psql -h localhost -U postgres -d social_finance
```

### Run Database Migrations

Database migrations are automatically run when the backend starts. If you need to run them manually:

```bash
# Access backend pod
kubectl exec -it -n social-finance deployment/social-finance-backend -- /bin/bash

# Run migrations
alembic upgrade head
```

## Security Considerations

### Secrets Management

Sensitive data is stored in Kubernetes secrets:

- Database passwords
- JWT secrets
- Stripe API keys

### Network Policies

Consider implementing network policies to restrict pod-to-pod communication:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: social-finance-network-policy
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: social-finance
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: social-finance
      ports:
        - protocol: TCP
          port: 80
```

### RBAC

The application runs with default service account permissions. For production, consider creating dedicated service accounts with minimal required permissions.

## Backup and Recovery

### Database Backup

```bash
# Create backup
kubectl exec -n social-finance deployment/social-finance-postgres -- \
  pg_dump -U postgres social_finance > backup.sql

# Restore backup
kubectl exec -i -n social-finance deployment/social-finance-postgres -- \
  psql -U postgres social_finance < backup.sql
```

### Persistent Volume Backup

```bash
# Create volume snapshot (if supported)
kubectl create -f - <<EOF
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: social-finance-backup
spec:
  source:
    persistentVolumeClaimName: social-finance-postgres-pvc
EOF
```

## Upgrading

### Update Application

```bash
# Update images
docker build -t your-registry/social-finance-backend:new-version backend/
docker push your-registry/social-finance-backend:new-version

# Update Helm values
helm upgrade social-finance ./social-finance \
  --namespace social-finance \
  --values values.yaml \
  --wait \
  --timeout 10m
```

### Rollback

```bash
# List releases
helm history social-finance -n social-finance

# Rollback to previous version
helm rollback social-finance 1 -n social-finance
```

## Uninstalling

### Remove Application

```bash
# Uninstall using script
./deploy.sh uninstall

# Or manually
helm uninstall social-finance -n social-finance
kubectl delete namespace social-finance
```

### Clean Up Persistent Data

**Warning**: This will permanently delete all data!

```bash
# Delete PVCs
kubectl delete pvc --all -n social-finance

# Delete PVs (if not automatically cleaned up)
kubectl get pv | grep social-finance
kubectl delete pv <pv-name>
```

## Support

For issues and questions:

1. Check the application logs
2. Verify Kubernetes resources are running
3. Check network connectivity between services
4. Verify configuration values
5. Check resource usage and limits

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://reactjs.org/docs/) 