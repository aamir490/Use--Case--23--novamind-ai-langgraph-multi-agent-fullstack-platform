# NovaMind AI — Complete AWS Deployment Guide

**AWS Account:** `637423369471` | **IAM User:** `mlops-user` | **Region:** `us-east-1`

> **Read this first:**
> - This guide is **documentation only** — no AWS changes are made automatically.
> - Every command specifies exactly where to run it (PowerShell, AWS Console, etc.).
> - Real secrets are never shown — replace `<SECRET>` with your actual values.
> - Commands marked ⚠️ **DESTRUCTIVE** permanently delete resources.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Current Local Architecture](#2-current-local-architecture)
3. [Current Local Run Instructions](#3-current-local-run-instructions)
4. [Recommended AWS Architecture](#4-recommended-aws-architecture)
5. [AWS Prerequisites](#5-aws-prerequisites)
6. [Pre-Deployment Code Changes](#6-pre-deployment-code-changes-required)
7. [Step-by-Step Deployment](#7-step-by-step-deployment)
8. [Frontend Deployment (S3 + CloudFront)](#8-frontend-deployment-s3--cloudfront)
9. [Backend Deployment (ECS Fargate)](#9-backend-deployment-ecs-fargate)
10. [Database Configuration](#10-database-configuration)
11. [Authentication Configuration](#11-authentication-configuration)
12. [AI / GenAI Configuration](#12-ai--genai-configuration)
13. [Environment Variables Reference](#13-environment-variables-reference)
14. [Security](#14-security)
15. [Cost Estimate](#15-cost-estimate)
16. [Production Testing Checklist](#16-production-testing-checklist)
17. [Troubleshooting](#17-troubleshooting)
18. [Rollback](#18-rollback)
19. [Cleanup (Destroy Resources)](#19-cleanup-destroy-resources)
20. [Final Deployment Checklist](#20-final-deployment-checklist)

---

## 1. Project Overview

**NovaMind AI** is a full-stack AI-powered chat application with multiple specialized AI agents.

### What it does
Users log in with Google, start conversations, and interact with 8 AI agents:
- **Chat** — general-purpose LLM chat (Groq)
- **Search** — real-time web search via Tavily, synthesized by Groq
- **Coding** — code generation/debugging via DeepSeek (OpenRouter)
- **PDF** — generates downloadable PDF reports
- **PPT** — creates PowerPoint presentations (uploaded to S3)
- **Vision** — generates AI images via Pollinations.ai, analyzes images with Gemini
- **PDF RAG** — chat with uploaded PDF documents using Qdrant vector search
- **Image Analyzer** — analyzes uploaded images using Google Gemini

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8 + Tailwind CSS 4 |
| API Gateway | Node.js + Express 5 (port 8000) |
| Auth Service | Node.js + Express 5 + Firebase Admin SDK (port 8001) |
| Chat Service | Node.js + Express 5 + Mongoose (port 8002) |
| Agent Service | Node.js + Express 5 + LangGraph + LangChain (port 8003) |
| Billing Service | Node.js + Express 5 + Razorpay (port 8004) |
| Session store | Redis (port 6379) |
| Database | MongoDB Atlas (cloud, 4 separate databases) |
| Authentication | Firebase Auth (Google sign-in) |
| File storage | AWS S3 bucket (`cretexainovamind`, region `ap-south-1`) |
| Vector DB | Qdrant Cloud (EU West 1) |
| LLMs | Groq, Google Gemini, OpenRouter/DeepSeek |
| Search | Tavily API |
| Payments | Razorpay |

---

## 2. Current Local Architecture

```
Browser (localhost:5173)
    │
    │  HTTPS + session cookie (withCredentials: true)
    │  Base URL: VITE_SERVER_URL = http://localhost:8000
    ▼
┌─────────────────────────────────────────────┐
│           API Gateway  :8000                │
│  CORS: only http://localhost:5173            │
│  Cookie auth via Redis session lookup        │
│                                             │
│  /api/auth    → proxy  → Auth    :8001      │  (no auth)
│  /api/chat    → protect → Chat   :8002      │  (session required)
│  /api/agent   → protect → Agent  :8003      │  (session required)
│  /api/billing → protect → Billing:8004      │  (session required)
│  /api/me      → getCurrentUser              │
└─────────────────────────────────────────────┘
         │               │
         ▼               ▼
    [Redis :6379]   [MongoDB Atlas]
    (sessions,       (4 databases:
     memory cache,    auth / chat /
     rate limits)     billing / agent)
         │
         ├── Auth Service :8001
         │     Firebase Admin SDK verifies Google token
         │     Creates user in MongoDB
         │     Sets httpOnly session cookie
         │
         ├── Chat Service :8002
         │     Stores conversations & messages in MongoDB
         │
         ├── Agent Service :8003
         │     LangGraph routes request to correct agent
         │     Groq / Gemini / OpenRouter / Tavily / Pollinations
         │     Uploads PPT/images to AWS S3 (ap-south-1)
         │     PDF RAG → Qdrant Cloud (eu-west-1)
         │     Calls Chat Service to save messages
         │     Calls Auth Service to deduct credits
         │
         └── Billing Service :8004
               Razorpay payment processing
               Calls Auth Service to update plan/credits
```

---

## 3. Current Local Run Instructions

### Prerequisites
- Node.js v18+, npm v9+, Docker Desktop

### Step 1 — Start Redis

#### PowerShell — backend folder
```powershell
cd "E:\GenAi-Project-Cloudage\1.cortexAI\backend"
docker compose up -d
```
Expected: Redis container running on port 6379.

### Step 2 — Start all 5 backend services (each in its own terminal)

#### PowerShell — Terminal 1: Auth Service
```powershell
cd "E:\GenAi-Project-Cloudage\1.cortexAI\backend\services\auth"
npm install
npm run dev
```
Expected: `auth started at 8001` + `db connected`

#### PowerShell — Terminal 2: Chat Service
```powershell
cd "E:\GenAi-Project-Cloudage\1.cortexAI\backend\services\chat"
npm install
npm run dev
```
Expected: `chat started at 8002` + `db connected`

#### PowerShell — Terminal 3: Agent Service
```powershell
cd "E:\GenAi-Project-Cloudage\1.cortexAI\backend\services\agent"
npm install
npm run dev
```
Expected: `agent started at 8003` + `db connected`

#### PowerShell — Terminal 4: Billing Service
```powershell
cd "E:\GenAi-Project-Cloudage\1.cortexAI\backend\services\billing"
npm install
npm run dev
```
Expected: `billing started at 8004` + `db connected`

#### PowerShell — Terminal 5: Gateway
```powershell
cd "E:\GenAi-Project-Cloudage\1.cortexAI\backend\gateway"
npm install
npm run dev
```
Expected: `gateway started at 8000`

### Step 3 — Start Frontend

#### PowerShell — Terminal 6: Frontend
```powershell
cd "E:\GenAi-Project-Cloudage\1.cortexAI\frontend"
npm install
npm run dev
```
Expected: `http://localhost:5173/`

---

## 4. Recommended AWS Architecture

### Architecture Diagram

```
Users
  │
  ▼
CloudFront CDN  (HTTPS, global)
  │
  ├── /  → S3 Bucket (React static build)
  │
  └── /api/* → Application Load Balancer (ALB)
                    │
                    ▼
              ECS Fargate Cluster
              ┌─────────────────────────────┐
              │  [Gateway Task    :8000]     │
              │  [Auth Task       :8001]     │
              │  [Chat Task       :8002]     │
              │  [Agent Task      :8003]     │
              │  [Billing Task    :8004]     │
              └─────────────────────────────┘
                    │
        ┌───────────┼───────────────┐
        ▼           ▼               ▼
  ElastiCache   MongoDB Atlas   AWS S3
  Redis         (external,      cretexainovamind
  (sessions)     keep as-is)    (ap-south-1)
                                    
              External Services (no change):
              Firebase Auth, Groq, Gemini,
              OpenRouter, Tavily, Qdrant Cloud, Razorpay
```

### AWS Services Decision Table

| Project Component | AWS Service | Why |
|------------------|-------------|-----|
| React frontend | S3 + CloudFront | Static build, global CDN, HTTPS, cheap |
| API Gateway | ECS Fargate (container) | Already Dockerized, stateless proxy |
| Auth Service | ECS Fargate (container) | Already Dockerized, needs Firebase Admin SDK |
| Chat Service | ECS Fargate (container) | Already Dockerized, simple REST |
| Agent Service | ECS Fargate (container) | Already Dockerized, handles file uploads |
| Billing Service | ECS Fargate (container) | Already Dockerized, Razorpay integration |
| Load balancing | Application Load Balancer | HTTPS termination, routes to Gateway |
| Redis sessions | ElastiCache for Redis | Managed Redis, same VPC as ECS |
| Container images | ECR (Elastic Container Registry) | Stores Docker images for ECS |
| Secrets | AWS Secrets Manager | API keys, Firebase JSON, DB passwords |
| Logs | CloudWatch Logs | Container stdout/stderr |
| Networking | VPC + private subnets | Services hidden from internet |
| DNS (optional) | Route 53 | Custom domain |

### Services that stay external (no migration needed)

| Service | Reason |
|---------|--------|
| MongoDB Atlas | Already cloud-hosted, all 4 databases configured, cheap at current scale |
| Firebase Auth | Google identity provider, cannot self-host reasonably |
| Groq API | External LLM provider |
| Google Gemini | External LLM provider |
| OpenRouter / DeepSeek | External LLM provider |
| Tavily | External search API |
| Qdrant Cloud | External vector DB, already configured |
| Razorpay | Payment processor, India-based, must stay external |
| Pollinations.ai | Free image generation service |

---

## 5. AWS Prerequisites

### 5.1 — Install AWS CLI

#### AWS Console
Go to: https://aws.amazon.com/cli/
Download and install the Windows installer.

Verify installation:

#### PowerShell — any folder
```powershell
aws --version
```
Expected output:
```
aws-cli/2.x.x Python/3.x.x Windows/10 exe/AMD64
```

### 5.2 — Configure AWS CLI with your IAM credentials

#### AWS Console — Get credentials
1. Go to https://console.aws.amazon.com/iam/
2. Navigate to: **IAM → Users → mlops-user → Security credentials**
3. Click **Create access key** → choose **CLI** use case
4. Download the CSV — you only see the secret once

#### PowerShell — any folder
```powershell
aws configure
```
When prompted, enter:
```
AWS Access Key ID:     [your mlops-user access key]
AWS Secret Access Key: [your mlops-user secret key]
Default region name:   us-east-1
Default output format: json
```

Verify it works:

#### PowerShell — any folder
```powershell
aws sts get-caller-identity
```
Expected output:
```json
{
    "UserId": "AIDAXXXXXXXXXXXXXXXXX",
    "Account": "637423369471",
    "Arn": "arn:aws:iam::637423369471:user/mlops-user"
}
```

### 5.3 — Install Docker Desktop

Docker is required to build container images.

#### AWS Console (download page)
Go to: https://www.docker.com/products/docker-desktop
Download and install for Windows.

Verify:

#### PowerShell — any folder
```powershell
docker --version
```
Expected: `Docker version 24.x.x`

### 5.4 — Install Node.js 22

#### AWS Console (download page)
Go to: https://nodejs.org → download Node.js 22 LTS (Windows installer)

Verify:

#### PowerShell — any folder
```powershell
node --version
npm --version
```
Expected: `v22.x.x` and `10.x.x`

### 5.5 — Verify IAM Permissions for mlops-user

The `mlops-user` needs these IAM policies attached. Check them:

#### AWS Console
1. Go to https://console.aws.amazon.com/iam/
2. Navigate to: **IAM → Users → mlops-user → Permissions**
3. Verify these policies are attached (or add them):

| Policy | Why needed |
|--------|-----------|
| `AmazonECS_FullAccess` | Create ECS clusters, tasks, services |
| `AmazonEC2ContainerRegistryFullAccess` | Push Docker images to ECR |
| `ElastiCacheFullAccess` | Create Redis cluster |
| `AmazonS3FullAccess` | Create S3 bucket for frontend |
| `CloudFrontFullAccess` | Create CDN distribution |
| `AWSSecretsManagerReadWrite` | Store and read secrets |
| `CloudWatchFullAccess` | View logs |
| `AmazonVPCFullAccess` | Create VPC, subnets, security groups |
| `ElasticLoadBalancingFullAccess` | Create ALB |
| `IAMFullAccess` | Create task roles for ECS |

---

## 6. Pre-Deployment Code Changes Required

> **These changes must be made before deploying. Do not deploy without them.**

### Change 1 — Fix cookie `secure` flag in Auth Service

**File:** `backend/services/auth/controllers/auth.controller.js`

Find this line (around line 43):
```javascript
res.cookie("session", sessionId, {
    httpOnly: true,
    secure: false,        // ← MUST CHANGE TO true FOR HTTPS
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
})
```

Change to:
```javascript
res.cookie("session", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",  // true in AWS, false locally
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
})
```

**Why:** HTTPS cookies require `secure: true`. `sameSite: "none"` is needed if your frontend (`app.domain.com`) and API (`api.domain.com`) are on different subdomains.

### Change 2 — Pin Node.js base image in all Dockerfiles

**Files:** All 5 Dockerfiles (`gateway`, `auth`, `chat`, `agent`, `billing`)

Change `FROM node` to:
```dockerfile
FROM node:22-alpine
```

**Why:** `FROM node` uses the latest unstable version. Pinning ensures reproducible builds.

### Change 3 — Add `serviceAccountKey.json` injection for Auth Service

The Firebase Admin SDK requires the service account JSON file. In AWS, you'll store it in Secrets Manager and inject it at container startup. The Dockerfile does not need changing now, but you'll need a startup script (detailed in Step 9).

### Change 4 — Add `NODE_ENV=production` to all service environment variables

In each service's `.env` (for local dev) and ECS task definitions (for AWS), add:
```
NODE_ENV=production
```

---

## 7. Step-by-Step Deployment

The deployment order is:

```
1. Create ECR repositories  (image registry)
2. Create VPC + networking  (private network)
3. Create ElastiCache Redis (sessions)
4. Push Docker images to ECR
5. Create ECS Cluster
6. Create Secrets Manager entries
7. Create ECS Task Definitions (one per service)
8. Create ECS Services
9. Create Application Load Balancer
10. Deploy Frontend to S3 + CloudFront
11. Update environment variables
12. Test everything
```

---

## Step 1 — Create ECR Repositories

ECR stores your Docker images. You need one repository per service.

### Where to run
**PowerShell — Kiro Terminal**

### Folder
```
Any folder (these are AWS CLI commands, not project commands)
```

### Commands

```powershell
# Create ECR repositories for all 5 services
aws ecr create-repository --repository-name novamind-gateway  --region us-east-1
aws ecr create-repository --repository-name novamind-auth     --region us-east-1
aws ecr create-repository --repository-name novamind-chat     --region us-east-1
aws ecr create-repository --repository-name novamind-agent    --region us-east-1
aws ecr create-repository --repository-name novamind-billing  --region us-east-1
```

### What this does
Creates 5 private Docker image registries in your AWS account. Think of them as private Docker Hub repositories.

### Expected result
```json
{
    "repository": {
        "repositoryArn": "arn:aws:ecr:us-east-1:637423369471:repository/novamind-gateway",
        "repositoryUri": "637423369471.dkr.ecr.us-east-1.amazonaws.com/novamind-gateway",
        ...
    }
}
```

### Verify

#### PowerShell — any folder
```powershell
aws ecr describe-repositories --region us-east-1 --query "repositories[*].repositoryName"
```
You should see all 5 repository names listed.

---

## Step 2 — Create VPC and Networking

Your ECS tasks and ElastiCache must run in a private VPC.

### Where to do it
**AWS Console**

### Navigation
1. Go to https://console.aws.amazon.com/vpc/
2. Click **Create VPC**
3. Choose **VPC and more** (creates VPC + subnets + internet gateway automatically)
4. Configure:
   - Name: `novamind-vpc`
   - IPv4 CIDR: `10.0.0.0/16`
   - Availability Zones: `2`
   - Public subnets: `2` (for ALB)
   - Private subnets: `2` (for ECS tasks and ElastiCache)
   - NAT gateways: `1` (required for ECS tasks in private subnet to reach internet)
   - Click **Create VPC**

### What this creates
- 1 VPC
- 2 public subnets (for the ALB that faces the internet)
- 2 private subnets (for ECS tasks — hidden from internet)
- 1 NAT gateway (allows ECS tasks to reach external APIs like Groq, Firebase, etc.)
- Route tables and internet gateway

### Verify

#### AWS Console
Go to **VPC → Your VPCs** — you should see `novamind-vpc` with CIDR `10.0.0.0/16`.

---

## Step 3 — Create Security Groups

Security groups are firewalls for your AWS resources.

### Where to do it
**AWS Console → VPC → Security Groups → Create security group**

Create these 3 security groups in `novamind-vpc`:

#### Security Group 1: `novamind-alb-sg` (for the Load Balancer)
| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| HTTP | TCP | 80 | 0.0.0.0/0 | Public web traffic |
| HTTPS | TCP | 443 | 0.0.0.0/0 | Public HTTPS traffic |

#### Security Group 2: `novamind-ecs-sg` (for ECS containers)
| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| Custom TCP | TCP | 8000-8004 | `novamind-alb-sg` | Only ALB can reach containers |

#### Security Group 3: `novamind-redis-sg` (for ElastiCache)
| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| Custom TCP | TCP | 6379 | `novamind-ecs-sg` | Only ECS tasks can reach Redis |

---

## Step 4 — Create ElastiCache Redis

All backend services share one Redis instance for sessions, conversation memory, and rate limiting.

### Where to do it
**AWS Console → ElastiCache → Create cluster**

### Navigation
1. Go to https://console.aws.amazon.com/elasticache/
2. Click **Create cluster** → **Redis OSS**
3. Configure:
   - Cluster name: `novamind-redis`
   - Node type: `cache.t3.micro` (cheapest — $0.016/hour)
   - Number of replicas: `0` (dev/staging) or `1` (production)
   - VPC: `novamind-vpc`
   - Subnets: select your 2 **private** subnets
   - Security group: `novamind-redis-sg`
4. Click **Create**

Creation takes 5-10 minutes.

### Verify

#### AWS Console
Go to **ElastiCache → Clusters → novamind-redis** — Status should be **available**.

Note the **Primary endpoint** — it will look like:
```
novamind-redis.xxxxxx.0001.use1.cache.amazonaws.com:6379
```

You'll use this as `REDIS_URL=redis://novamind-redis.xxxxxx.0001.use1.cache.amazonaws.com:6379`

---

## Step 5 — Store Secrets in AWS Secrets Manager

Never store secrets in environment variables in plain text on AWS. Use Secrets Manager.

### Where to do it
**AWS Console → Secrets Manager → Store a new secret**

OR use PowerShell:

#### PowerShell — any folder

```powershell
# MongoDB URI for Auth
aws secretsmanager create-secret `
    --name "novamind/auth/mongodb-uri" `
    --secret-string "mongodb+srv://<user>:<password>@cluster0.ig23zmc.mongodb.net/?appName=Cluster0/auth" `
    --region us-east-1

# MongoDB URI for Chat
aws secretsmanager create-secret `
    --name "novamind/chat/mongodb-uri" `
    --secret-string "mongodb+srv://<user>:<password>@cluster0.ig23zmc.mongodb.net/?appName=Cluster0/chat" `
    --region us-east-1

# MongoDB URI for Agent
aws secretsmanager create-secret `
    --name "novamind/agent/mongodb-uri" `
    --secret-string "mongodb+srv://<user>:<password>@cluster0.ig23zmc.mongodb.net/?appName=Cluster0/agent" `
    --region us-east-1

# MongoDB URI for Billing
aws secretsmanager create-secret `
    --name "novamind/billing/mongodb-uri" `
    --secret-string "mongodb+srv://<user>:<password>@cluster0.ig23zmc.mongodb.net/?appName=Cluster0/billing" `
    --region us-east-1

# Groq API Key
aws secretsmanager create-secret `
    --name "novamind/agent/groq-api-key" `
    --secret-string "<your-groq-api-key>" `
    --region us-east-1

# Google API Key
aws secretsmanager create-secret `
    --name "novamind/agent/google-api-key" `
    --secret-string "<your-google-api-key>" `
    --region us-east-1

# OpenRouter API Key
aws secretsmanager create-secret `
    --name "novamind/agent/openrouter-api-key" `
    --secret-string "<your-openrouter-api-key>" `
    --region us-east-1

# Tavily API Key
aws secretsmanager create-secret `
    --name "novamind/agent/tavily-api-key" `
    --secret-string "<your-tavily-api-key>" `
    --region us-east-1

# Razorpay Key Secret
aws secretsmanager create-secret `
    --name "novamind/billing/razorpay-key-secret" `
    --secret-string "<your-razorpay-secret>" `
    --region us-east-1

# Qdrant API Key
aws secretsmanager create-secret `
    --name "novamind/agent/qdrant-api-key" `
    --secret-string "<your-qdrant-api-key>" `
    --region us-east-1
```

### Store Firebase serviceAccountKey.json

This is the most critical secret. Store the entire JSON as one secret:

#### PowerShell — auth service folder
```powershell
# Read the file content and store as a secret
$content = Get-Content "E:\GenAi-Project-Cloudage\1.cortexAI\backend\services\auth\serviceAccountKey.json" -Raw
aws secretsmanager create-secret `
    --name "novamind/auth/firebase-service-account" `
    --secret-string $content `
    --region us-east-1
```

### Verify

#### PowerShell — any folder
```powershell
aws secretsmanager list-secrets --region us-east-1 --query "SecretList[*].Name"
```
You should see all the secret names you just created.

---

## Step 6 — Build and Push Docker Images to ECR

### Where to run
**PowerShell — Kiro Terminal**

### 6.1 — Authenticate Docker to ECR

#### PowerShell — any folder
```powershell
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 637423369471.dkr.ecr.us-east-1.amazonaws.com
```
Expected: `Login Succeeded`

### 6.2 — Build and push each service

Run these from the `backend` folder. Each Dockerfile copies from the workspace root so you must build from `backend/`:

#### PowerShell — backend folder
```powershell
cd "E:\GenAi-Project-Cloudage\1.cortexAI\backend"
```

#### Gateway
```powershell
docker build -f gateway/Dockerfile -t 637423369471.dkr.ecr.us-east-1.amazonaws.com/novamind-gateway:latest .
docker push 637423369471.dkr.ecr.us-east-1.amazonaws.com/novamind-gateway:latest
```

#### Auth Service
```powershell
docker build -f services/auth/Dockerfile -t 637423369471.dkr.ecr.us-east-1.amazonaws.com/novamind-auth:latest .
docker push 637423369471.dkr.ecr.us-east-1.amazonaws.com/novamind-auth:latest
```

#### Chat Service
```powershell
docker build -f services/chat/Dockerfile -t 637423369471.dkr.ecr.us-east-1.amazonaws.com/novamind-chat:latest .
docker push 637423369471.dkr.ecr.us-east-1.amazonaws.com/novamind-chat:latest
```

#### Agent Service
```powershell
docker build -f services/agent/Dockerfile -t 637423369471.dkr.ecr.us-east-1.amazonaws.com/novamind-agent:latest .
docker push 637423369471.dkr.ecr.us-east-1.amazonaws.com/novamind-agent:latest
```

#### Billing Service
```powershell
docker build -f services/billing/Dockerfile -t 637423369471.dkr.ecr.us-east-1.amazonaws.com/novamind-billing:latest .
docker push 637423369471.dkr.ecr.us-east-1.amazonaws.com/novamind-billing:latest
```

### Expected result
Each push shows:
```
latest: digest: sha256:xxxxxxxx size: xxxx
```

### Verify

#### PowerShell — any folder
```powershell
aws ecr list-images --repository-name novamind-gateway --region us-east-1
```
You should see `imageTag: latest`.

---

## Step 7 — Create ECS Cluster

### Where to run
**PowerShell — Kiro Terminal**

### Command

```powershell
aws ecs create-cluster `
    --cluster-name novamind-cluster `
    --region us-east-1
```

### Expected result
```json
{
    "cluster": {
        "clusterName": "novamind-cluster",
        "status": "ACTIVE"
    }
}
```

---

## Step 8 — Create IAM Roles for ECS

ECS tasks need permissions to pull images, write logs, and access Secrets Manager.

### Where to do it
**AWS Console → IAM → Roles**

#### Create `ecsTaskExecutionRole` (if it doesn't exist)
1. Go to **IAM → Roles → Create role**
2. Trusted entity type: **AWS service**
3. Use case: **Elastic Container Service Task**
4. Attach policies:
   - `AmazonECSTaskExecutionRolePolicy` (required for ECS)
   - `SecretsManagerReadWrite` (to read secrets at task startup)
5. Name: `ecsTaskExecutionRole`
6. Click **Create role**

#### Create `novamindTaskRole` (app permissions)
1. Go to **IAM → Roles → Create role**
2. Trusted entity type: **AWS service**
3. Use case: **Elastic Container Service Task**
4. Attach policies:
   - `AmazonS3FullAccess` (agent service needs S3)
   - `CloudWatchLogsFullAccess` (logging)
5. Name: `novamindTaskRole`
6. Click **Create role**

> **Why two roles?**
> `ecsTaskExecutionRole` is used by ECS itself to start the container (pull image, inject secrets).
> `novamindTaskRole` is used by your application code at runtime (S3 uploads, CloudWatch).

---

## 8. Frontend Deployment (S3 + CloudFront)

### 8.1 — Build the Frontend

You must set the correct API URL before building.

#### Step 1 — Update `frontend/.env` for production

Edit `frontend/.env` and change `VITE_SERVER_URL` to your ALB URL (you'll get this after Step 9):
```
VITE_FIREBASE_API_KEY=<your-firebase-api-key>
VITE_RAZORPAY_KEY_ID=<your-razorpay-key-id>
VITE_SERVER_URL=https://api.your-domain.com
```

> Note: `VITE_SERVER_URL` must point to your ALB DNS name or custom API domain.
> For testing without a domain: use `http://your-alb-dns.us-east-1.elb.amazonaws.com`

#### Step 2 — Build

#### PowerShell — frontend folder
```powershell
cd "E:\GenAi-Project-Cloudage\1.cortexAI\frontend"
npm run build
```
Expected: Creates `frontend/dist/` folder with optimized static files.

Verify the build succeeded:
```powershell
Get-ChildItem "E:\GenAi-Project-Cloudage\1.cortexAI\frontend\dist"
```
You should see `index.html`, `assets/` folder.

### 8.2 — Create S3 Bucket for Frontend

#### PowerShell — any folder
```powershell
# Create the bucket (bucket name must be globally unique)
aws s3 mb s3://novamind-frontend-prod --region us-east-1

# Disable block public access (required for static website hosting)
aws s3api put-public-access-block `
    --bucket novamind-frontend-prod `
    --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Enable static website hosting
aws s3 website s3://novamind-frontend-prod `
    --index-document index.html `
    --error-document index.html
```

Apply a bucket policy for public read:

```powershell
$policy = '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::novamind-frontend-prod/*"}]}'
aws s3api put-bucket-policy `
    --bucket novamind-frontend-prod `
    --policy $policy
```

### 8.3 — Upload Build Files to S3

#### PowerShell — frontend folder
```powershell
cd "E:\GenAi-Project-Cloudage\1.cortexAI\frontend"
aws s3 sync dist/ s3://novamind-frontend-prod --delete
```

Expected:
```
upload: dist/index.html to s3://novamind-frontend-prod/index.html
upload: dist/assets/index-xxxx.js to s3://...
...
```

### 8.4 — Create CloudFront Distribution

CloudFront provides HTTPS and global CDN for the S3 frontend.

#### AWS Console
1. Go to https://console.aws.amazon.com/cloudfront/
2. Click **Create distribution**
3. Configure:
   - **Origin domain:** Select `novamind-frontend-prod.s3-website-us-east-1.amazonaws.com` (S3 website endpoint, NOT the S3 REST endpoint)
   - **Protocol:** HTTP only (CloudFront handles HTTPS)
   - **Viewer protocol policy:** Redirect HTTP to HTTPS
   - **Cache policy:** `CachingOptimized`
   - **Default root object:** `index.html`
4. Under **Error pages** add:
   - HTTP error code: `403` → Response page: `/index.html` → HTTP 200
   - HTTP error code: `404` → Response page: `/index.html` → HTTP 200
   (This handles React Router client-side routing)
5. Click **Create distribution**

Creation takes 5-15 minutes.

### Verify

#### AWS Console
Go to **CloudFront → Distributions** — Status should be **Enabled**.
Note the **Distribution domain name** (e.g., `dxxxxxxxxxxxx.cloudfront.net`) — this is your frontend URL.

Test:
```
https://dxxxxxxxxxxxx.cloudfront.net
```
You should see the NovaMind AI login page.

---

## 9. Backend Deployment (ECS Fargate)

For each service, you will:
1. Create a Task Definition (what container to run + env vars + secrets)
2. Create a Service (how many copies to run + networking)

### 9.1 — Create Application Load Balancer

The ALB receives all API traffic and routes it to the Gateway ECS service.

#### AWS Console
1. Go to **EC2 → Load Balancers → Create load balancer**
2. Choose **Application Load Balancer**
3. Configure:
   - Name: `novamind-alb`
   - Scheme: **Internet-facing**
   - VPC: `novamind-vpc`
   - Subnets: select your 2 **public** subnets
   - Security group: `novamind-alb-sg`
4. Create a **Target Group:**
   - Target type: **IP** (required for Fargate)
   - Name: `novamind-gateway-tg`
   - Protocol: HTTP, Port: 8000
   - Health check path: `/`
5. Add **Listener:** HTTP:80 → Forward to `novamind-gateway-tg`
6. Click **Create load balancer**

Note the ALB DNS name — you'll use this as the API base URL in the frontend `.env`.

### 9.2 — Gateway Service Task Definition

#### AWS Console — ECS → Task Definitions → Create new task definition

Configure:
- Family name: `novamind-gateway`
- Launch type: **AWS Fargate**
- CPU: `0.5 vCPU`, Memory: `1 GB`
- Task role: `novamindTaskRole`
- Task execution role: `ecsTaskExecutionRole`

Container configuration:
- Image URI: `637423369471.dkr.ecr.us-east-1.amazonaws.com/novamind-gateway:latest`
- Port: `8000`
- Environment variables (add these as **ValueFrom** from Secrets Manager where sensitive, or plain **Value** where not sensitive):

| Key | Value | Type |
|-----|-------|------|
| `PORT` | `8000` | Value |
| `NODE_ENV` | `production` | Value |
| `FRONTEND_URL` | `https://dxxxxxxxxxxxx.cloudfront.net` | Value |
| `AUTH_SERVICE` | `http://novamind-auth.internal:8001` | Value |
| `CHAT_SERVICE` | `http://novamind-chat.internal:8002` | Value |
| `AGENT_SERVICE` | `http://novamind-agent.internal:8003` | Value |
| `BILLING_SERVICE` | `http://novamind-billing.internal:8004` | Value |
| `REDIS_URL` | `redis://your-elasticache-endpoint:6379` | Value |

> **Note on inter-service URLs:** With ECS Service Discovery, services can reach each other by DNS name. Set up Service Discovery (AWS Cloud Map) and use names like `novamind-auth.novamind.local:8001`.

Log configuration:
- Log driver: `awslogs`
- Log group: `/ecs/novamind-gateway`
- Region: `us-east-1`
- Stream prefix: `gateway`

### 9.3 — Auth Service Task Definition

Same pattern as gateway, with:
- Family name: `novamind-auth`
- Image: `637423369471.dkr.ecr.us-east-1.amazonaws.com/novamind-auth:latest`
- Port: `8001`

Environment variables:
| Key | Value | Type |
|-----|-------|------|
| `PORT` | `8001` | Value |
| `NODE_ENV` | `production` | Value |
| `MONGODB_URI` | ARN of `novamind/auth/mongodb-uri` | Secrets Manager |
| `REDIS_URL` | `redis://your-elasticache-endpoint:6379` | Value |

**Critical — Firebase service account injection:**

Add a startup command to fetch the secret and write it to disk. In the task definition container command:
```json
["sh", "-c", "aws secretsmanager get-secret-value --secret-id novamind/auth/firebase-service-account --region us-east-1 --query SecretString --output text > /app/services/auth/serviceAccountKey.json && npm start"]
```

This fetches the Firebase JSON from Secrets Manager at container startup and writes it to the expected file path before the Node.js app starts.

### 9.4 — Chat Service Task Definition

- Family name: `novamind-chat`
- Image: `637423369471.dkr.ecr.us-east-1.amazonaws.com/novamind-chat:latest`
- Port: `8002`

Environment variables:
| Key | Value | Type |
|-----|-------|------|
| `PORT` | `8002` | Value |
| `NODE_ENV` | `production` | Value |
| `MONGODB_URI` | ARN of `novamind/chat/mongodb-uri` | Secrets Manager |

### 9.5 — Agent Service Task Definition

This service uses the most resources (LLM calls, file processing).

- Family name: `novamind-agent`
- Image: `637423369471.dkr.ecr.us-east-1.amazonaws.com/novamind-agent:latest`
- Port: `8003`
- CPU: `1 vCPU`, Memory: `2 GB` (increased for LangGraph + LLM calls)

Environment variables:
| Key | Value | Type |
|-----|-------|------|
| `PORT` | `8003` | Value |
| `NODE_ENV` | `production` | Value |
| `MONGODB_URI` | ARN of `novamind/agent/mongodb-uri` | Secrets Manager |
| `REDIS_URL` | `redis://your-elasticache-endpoint:6379` | Value |
| `GROQ_API_KEY` | ARN of `novamind/agent/groq-api-key` | Secrets Manager |
| `GOOGLE_API_KEY` | ARN of `novamind/agent/google-api-key` | Secrets Manager |
| `OPENROUTER_API_KEY` | ARN of `novamind/agent/openrouter-api-key` | Secrets Manager |
| `TAVILY_API_KEY` | ARN of `novamind/agent/tavily-api-key` | Secrets Manager |
| `QDRANT_API_KEY` | ARN of `novamind/agent/qdrant-api-key` | Secrets Manager |
| `QDRANT_URL` | `https://f60929db-7749-4dec-802c-170b249f394e.eu-west-1-0.aws.cloud.qdrant.io` | Value |
| `AWS_REGION` | `ap-south-1` | Value |
| `AWS_BUCKET_NAME` | `cretexainovamind` | Value |
| `CHAT_SERVICE` | `http://novamind-chat.internal:8002` | Value |
| `AUTH_SERVICE` | `http://novamind-auth.internal:8001` | Value |

> **Note on S3 credentials:** Since the agent service runs on AWS, attach the `novamindTaskRole` with `AmazonS3FullAccess`. Remove `AWS_ACCESS_KEY_ID` and `AWS_SECRET_KEY` from the task definition — the SDK will automatically use the IAM task role instead, which is more secure than static credentials.

### 9.6 — Billing Service Task Definition

- Family name: `novamind-billing`
- Image: `637423369471.dkr.ecr.us-east-1.amazonaws.com/novamind-billing:latest`
- Port: `8004`

Environment variables:
| Key | Value | Type |
|-----|-------|------|
| `PORT` | `8004` | Value |
| `NODE_ENV` | `production` | Value |
| `MONGODB_URI` | ARN of `novamind/billing/mongodb-uri` | Secrets Manager |
| `AUTH_SERVICE` | `http://novamind-auth.internal:8001` | Value |
| `RAZORPAY_KEY_ID` | `rzp_test_Tce3KzaAQlK513` | Value |
| `RAZORPAY_KEY_SECRET` | ARN of `novamind/billing/razorpay-key-secret` | Secrets Manager |

### 9.7 — Create ECS Services

For each task definition, create an ECS Service:

#### AWS Console — ECS → Clusters → novamind-cluster → Services → Create

Configure (same pattern for all 5 services):
- Launch type: **Fargate**
- Task definition: select the one you just created
- Service name: `novamind-gateway` (or auth/chat/agent/billing)
- Number of tasks: `1`
- VPC: `novamind-vpc`
- Subnets: select your 2 **private** subnets
- Security group: `novamind-ecs-sg`
- Auto-assign public IP: **DISABLED** (private subnet uses NAT Gateway)

For Gateway only — add Load Balancer:
- Load balancer: `novamind-alb`
- Target group: `novamind-gateway-tg`

For all other services — enable **Service Discovery** (AWS Cloud Map):
- Namespace: `novamind.local`
- Service name: `novamind-auth` / `novamind-chat` / etc.
- DNS record type: A
- TTL: 10

This creates DNS entries like `novamind-auth.novamind.local` that the gateway uses to reach other services.

---

## 10. Database Configuration

### Current Setup
MongoDB Atlas is already configured with 4 databases:
- `auth` — user accounts
- `chat` — conversations and messages
- `billing` — payment records
- `agent` — (agent state, if any)

### What needs to change for AWS

**1. Whitelist ECS NAT Gateway IP in MongoDB Atlas**

Your ECS tasks run in private subnets and use a NAT Gateway to reach the internet. You must whitelist the NAT Gateway's public IP in MongoDB Atlas.

#### PowerShell — find your NAT Gateway IP
```powershell
aws ec2 describe-nat-gateways --region us-east-1 --query "NatGateways[*].NatGatewayAddresses[*].PublicIp"
```

#### AWS Console — MongoDB Atlas
1. Go to https://cloud.mongodb.com/
2. Navigate to: **Network Access → IP Access List**
3. Click **Add IP Address**
4. Enter your NAT Gateway public IP
5. Click **Confirm**

**2. Keep MongoDB Atlas external**

Do not migrate to DocumentDB. Reasons:
- MongoDB Atlas is free at current usage tier
- All connection strings are already configured
- Mongoose ODM is fully compatible
- DocumentDB migration would require code changes

---

## 11. Authentication Configuration

### Current Auth Flow
1. Firebase client SDK (frontend) → Google sign-in → Firebase ID token
2. Firebase Admin SDK (auth service backend) → verifies the token
3. Session cookie set by auth service, stored in Redis

### Firebase Console Changes Required for Production

#### AWS Console (Firebase)
1. Go to https://console.firebase.google.com/
2. Select project: **cortexnovamind**
3. Navigate to: **Authentication → Settings → Authorized domains**
4. Add your production domains:
   - `dxxxxxxxxxxxx.cloudfront.net` (CloudFront URL)
   - `your-custom-domain.com` (if you have one)
5. Click **Save**

**Why this matters:** Firebase will reject authentication requests from domains not on this list. Without this step, Google login will fail in production with an "unauthorized domain" error.

### Cookie Security Changes Required

In `backend/services/auth/controllers/auth.controller.js`, the cookie `secure: false` must be changed before deploying (see Section 6, Change 1).

After the change, the cookie will be:
- `secure: true` — only sent over HTTPS
- `sameSite: "none"` — allows cross-subdomain cookie sharing (required when frontend is on CloudFront and API is on ALB)

---

## 12. AI / GenAI Configuration

All AI providers are external and stay external. No AWS Bedrock is used by this project.

| Provider | Used For | Key Variable | AWS Storage |
|----------|----------|-------------|-------------|
| **Groq** | Chat, Search routing, PDF/PPT/Vision LLM | `GROQ_API_KEY` | Secrets Manager |
| **Google Gemini** | Image analysis, embeddings for RAG | `GOOGLE_API_KEY` | Secrets Manager |
| **OpenRouter (DeepSeek)** | Coding agent | `OPENROUTER_API_KEY` | Secrets Manager |
| **Tavily** | Web search | `TAVILY_API_KEY` | Secrets Manager |
| **Qdrant Cloud** | PDF RAG vector storage | `QDRANT_URL` + `QDRANT_API_KEY` | Secrets Manager |
| **Pollinations.ai** | Image generation | None (free, no key) | N/A |

### Important: Qdrant Region Mismatch

Your Qdrant cluster is in `eu-west-1` but your ECS cluster will be in `us-east-1`. This means PDF RAG queries will have cross-Atlantic latency (~100-150ms extra per query). For production, consider creating a new Qdrant cluster in `us-east-1`.

### AWS S3 (already AWS-managed)

The agent service already uses your `cretexainovamind` bucket in `ap-south-1`. On ECS, you can remove the static `AWS_ACCESS_KEY_ID` and `AWS_SECRET_KEY` environment variables and use the IAM task role instead — it's more secure.

---

## 13. Environment Variables Reference

Replace `<SECRET>` with actual values. Never commit real values to git.

### Gateway
| Variable | Purpose | Secret? | Local Value | AWS Location |
|----------|---------|---------|-------------|-------------|
| `PORT` | Server port | No | `8000` | ECS task env var |
| `NODE_ENV` | Environment | No | `development` | ECS: `production` |
| `FRONTEND_URL` | CORS allowed origin | No | `http://localhost:5173` | CloudFront URL |
| `AUTH_SERVICE` | Auth service URL | No | `http://localhost:8001` | Service Discovery DNS |
| `CHAT_SERVICE` | Chat service URL | No | `http://localhost:8002` | Service Discovery DNS |
| `AGENT_SERVICE` | Agent service URL | No | `http://localhost:8003` | Service Discovery DNS |
| `BILLING_SERVICE` | Billing service URL | No | `http://localhost:8004` | Service Discovery DNS |
| `REDIS_URL` | Redis connection | No | `redis://localhost:6379` | ElastiCache endpoint |

### Auth Service
| Variable | Purpose | Secret? | Local Value | AWS Location |
|----------|---------|---------|-------------|-------------|
| `PORT` | Server port | No | `8001` | ECS task env var |
| `MONGODB_URI` | MongoDB Atlas URI | **Yes** | `<SECRET>` | Secrets Manager |
| `REDIS_URL` | Redis connection | No | `redis://localhost:6379` | ElastiCache endpoint |
| `serviceAccountKey.json` | Firebase Admin SDK | **Yes** | File on disk | Secrets Manager → injected at startup |

### Chat Service
| Variable | Purpose | Secret? | Local Value | AWS Location |
|----------|---------|---------|-------------|-------------|
| `PORT` | Server port | No | `8002` | ECS task env var |
| `MONGODB_URI` | MongoDB Atlas URI | **Yes** | `<SECRET>` | Secrets Manager |

### Agent Service
| Variable | Purpose | Secret? | Local Value | AWS Location |
|----------|---------|---------|-------------|-------------|
| `PORT` | Server port | No | `8003` | ECS task env var |
| `MONGODB_URI` | MongoDB Atlas URI | **Yes** | `<SECRET>` | Secrets Manager |
| `REDIS_URL` | Redis connection | No | `redis://localhost:6379` | ElastiCache endpoint |
| `GROQ_API_KEY` | Groq LLM API | **Yes** | `<SECRET>` | Secrets Manager |
| `GOOGLE_API_KEY` | Gemini + embeddings | **Yes** | `<SECRET>` | Secrets Manager |
| `OPENROUTER_API_KEY` | DeepSeek coding LLM | **Yes** | `<SECRET>` | Secrets Manager |
| `TAVILY_API_KEY` | Web search | **Yes** | `<SECRET>` | Secrets Manager |
| `QDRANT_URL` | Qdrant Cloud URL | No | `https://...qdrant.io` | ECS task env var |
| `QDRANT_API_KEY` | Qdrant auth | **Yes** | `<SECRET>` | Secrets Manager |
| `AWS_REGION` | S3 bucket region | No | `ap-south-1` | ECS task env var |
| `AWS_BUCKET_NAME` | S3 bucket name | No | `cretexainovamind` | ECS task env var |
| `AWS_ACCESS_KEY_ID` | S3 credentials | **Yes** | `<SECRET>` | Remove; use IAM role |
| `AWS_SECRET_KEY` | S3 credentials | **Yes** | `<SECRET>` | Remove; use IAM role |
| `CHAT_SERVICE` | Chat service URL | No | `http://localhost:8002` | Service Discovery DNS |
| `AUTH_SERVICE` | Auth service URL | No | `http://localhost:8001` | Service Discovery DNS |

### Billing Service
| Variable | Purpose | Secret? | Local Value | AWS Location |
|----------|---------|---------|-------------|-------------|
| `PORT` | Server port | No | `8004` | ECS task env var |
| `MONGODB_URI` | MongoDB Atlas URI | **Yes** | `<SECRET>` | Secrets Manager |
| `AUTH_SERVICE` | Auth service URL | No | `http://localhost:8001` | Service Discovery DNS |
| `RAZORPAY_KEY_ID` | Razorpay public key | No | `rzp_test_...` | ECS task env var |
| `RAZORPAY_KEY_SECRET` | Razorpay secret | **Yes** | `<SECRET>` | Secrets Manager |

### Frontend (build-time only)
| Variable | Purpose | Secret? | Local Value | AWS Location |
|----------|---------|---------|-------------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase client | No (public) | `AIzaSy...` | frontend `.env` before build |
| `VITE_RAZORPAY_KEY_ID` | Razorpay public key | No (public) | `rzp_test_...` | frontend `.env` before build |
| `VITE_SERVER_URL` | API gateway URL | No | `http://localhost:8000` | ALB DNS or custom domain |

---

## 14. Security

### IAM — Least Privilege
- Create dedicated IAM roles per ECS service — do not give all services full S3 access
- Only the agent service needs S3; only the auth service needs Secrets Manager for the Firebase JSON
- `mlops-user` should have only the policies listed in Section 5.5

### Security Groups
- ALB accepts traffic only on ports 80 and 443 from `0.0.0.0/0`
- ECS tasks accept traffic only from the ALB security group
- ElastiCache accepts traffic only from the ECS security group
- No ECS task or Redis instance is directly accessible from the internet

### HTTPS / TLS
- ALB handles TLS termination — request an ACM (AWS Certificate Manager) certificate for your domain
- All traffic from the internet goes through ALB over HTTPS
- Internal ECS-to-ECS traffic is HTTP (inside private VPC — acceptable)

### Cookie Security
- Change `secure: false` to `secure: true` in `auth.controller.js` before deploying (see Section 6)
- Change `sameSite: "strict"` to `sameSite: "none"` if frontend and API use different subdomains

### Secrets Management
- All API keys and database passwords stored in AWS Secrets Manager
- No secrets in Dockerfiles or environment variable plain text in ECS console
- `serviceAccountKey.json` injected at runtime from Secrets Manager — never baked into Docker image

### CORS
- Gateway CORS is restricted to `process.env.FRONTEND_URL` — update this to your CloudFront/custom domain
- `credentials: true` is set — do not change the origin to `*` when credentials is true (browsers block this)

### `.gitignore`
Ensure these are in `.gitignore` (verify before any git push):
```
.env
serviceAccountKey.json
node_modules/
dist/
```

### MongoDB Atlas
- Whitelist only the NAT Gateway IP — not `0.0.0.0/0`
- Use a dedicated Atlas database user with least privilege (read/write only, no admin)

---

## 15. Cost Estimate

All prices approximate for `us-east-1` at low/moderate traffic.

| Resource | Config | Monthly Cost |
|----------|--------|-------------|
| ECS Fargate — Gateway | 0.5 vCPU, 1 GB, 1 task | ~$15 |
| ECS Fargate — Auth | 0.5 vCPU, 1 GB, 1 task | ~$15 |
| ECS Fargate — Chat | 0.5 vCPU, 1 GB, 1 task | ~$15 |
| ECS Fargate — Agent | 1 vCPU, 2 GB, 1 task | ~$30 |
| ECS Fargate — Billing | 0.5 vCPU, 1 GB, 1 task | ~$15 |
| ElastiCache Redis | cache.t3.micro | ~$12 |
| Application Load Balancer | 1 ALB | ~$17 |
| NAT Gateway | 1 NAT GW | ~$33 |
| S3 (frontend) | <1 GB + requests | ~$1 |
| CloudFront | Low traffic | ~$1 |
| ECR (image storage) | 5 images ~2 GB | ~$0.20 |
| Secrets Manager | 10 secrets | ~$0.40 |
| CloudWatch Logs | Low volume | ~$1 |
| Data transfer | Moderate | ~$5 |
| **Total** | | **~$160/month** |

### Cost reduction options
- **Biggest saving:** NAT Gateway costs $0.045/GB + $0.045/hour. Consider using a VPC endpoint for ECR and S3 to reduce NAT data transfer.
- Scale ECS tasks to 0 when not needed (set desired count to 0 via console or CLI)
- Use `cache.t3.micro` for Redis (already included above)
- MongoDB Atlas Free Tier is $0

### What generates charges even when idle
- NAT Gateway — charged by the hour (~$33/month just for existing)
- ALB — charged by the hour (~$17/month just for existing)
- ElastiCache — charged by the hour (~$12/month just for existing)
- ECS Fargate tasks — charged per vCPU-second and GB-second (scale to 0 to stop)

### To stop charges temporarily (testing)

#### PowerShell — any folder
```powershell
# Scale all ECS services to 0 (stops billing for compute, NOT for ALB/NAT/Redis)
aws ecs update-service --cluster novamind-cluster --service novamind-gateway  --desired-count 0 --region us-east-1
aws ecs update-service --cluster novamind-cluster --service novamind-auth     --desired-count 0 --region us-east-1
aws ecs update-service --cluster novamind-cluster --service novamind-chat     --desired-count 0 --region us-east-1
aws ecs update-service --cluster novamind-cluster --service novamind-agent    --desired-count 0 --region us-east-1
aws ecs update-service --cluster novamind-cluster --service novamind-billing  --desired-count 0 --region us-east-1
```

---

## 16. Production Testing Checklist

### Frontend Loads
- Open `https://dxxxxxxxxxxxx.cloudfront.net` in browser
- Expected: NovaMind AI login page with logo visible
- Verify: No console errors in browser dev tools (F12)

### Google Authentication
- Click "Continue With Google"
- Expected: Google sign-in popup appears
- Expected: After sign-in, redirected to chat dashboard
- If fails: Check Firebase authorized domains in Firebase Console

### API Connectivity
- Open browser dev tools → Network tab
- Sign in and observe the request to `/api/auth/login`
- Expected: `200 OK` response with user data

### Backend Health Check

#### PowerShell — any folder
```powershell
# Replace with your ALB DNS name
Invoke-WebRequest -Uri "http://your-alb-dns.us-east-1.elb.amazonaws.com/" -UseBasicParsing
```
Expected: `{"message":"hello from gateway v5"}`

### Database Connectivity
- After login, if user data loads (name, avatar, plan) → MongoDB auth DB is working
- Start a conversation → if conversation appears in sidebar → MongoDB chat DB is working

### AI Agent Test
- Type "Hello" → click Send
- Expected: AI response appears within 5-10 seconds
- Expected: Chat agent (Groq) responds

### File Upload Test
- Click paperclip icon → upload a PDF
- Expected: PDF name shown in the input area
- Expected: AI can answer questions about the PDF

### Code Agent Test
- Select **Coding** agent pill
- Type "Write a hello world in Python"
- Expected: Code block appears with syntax highlighting

### PPT Generator Test
- Select **PPT** agent
- Type "Create a presentation about AI"
- Expected: Download link returned after ~15-20 seconds

### Vision Agent Test
- Select **Vision** agent
- Type "Generate an image of a sunset"
- Expected: Image appears in response

### Logs Check

#### AWS Console
1. Go to **CloudWatch → Log groups**
2. Open `/ecs/novamind-gateway`
3. Verify request logs are appearing
4. Check `/ecs/novamind-agent` for LLM call logs

---

## 17. Troubleshooting

### "This site can't be reached" on CloudFront URL
- CloudFront distribution may still be deploying (takes 5-15 min)
- Verify S3 bucket has `index.html` at root
- Verify bucket policy allows public read
- Verify CloudFront origin is the S3 **website endpoint** (not REST endpoint)

### Google Login fails — "unauthorized domain"
- Add your CloudFront domain to Firebase Console → Authentication → Authorized domains
- Exact match required — `https://` prefix not needed in Firebase

### Cookie not sent — 401 Unauthorized after login
- `secure: false` was not changed to `secure: true` — apply Section 6 Change 1
- `sameSite` mismatch — if frontend and API are on different domains, set `sameSite: "none"`
- CORS: `FRONTEND_URL` in gateway must exactly match the CloudFront URL including `https://`

### ECS Tasks failing to start (STOPPED status)
1. Go to **ECS → Clusters → novamind-cluster → Tasks**
2. Click the stopped task → **Logs** tab
3. Common causes:
   - Wrong ECR image URI → push image again
   - Missing environment variable → add to task definition
   - `serviceAccountKey.json` not found → verify the Secrets Manager injection command in auth task
   - Port binding error → verify the container port matches the task definition

### MongoDB connection refused
- NAT Gateway IP not whitelisted in Atlas → add it (see Section 10)
- Wrong `MONGODB_URI` format → verify connection string in Secrets Manager
- Atlas cluster paused → unpause from Atlas console

### Redis connection refused
- ElastiCache security group not allowing inbound from ECS security group → verify `novamind-redis-sg`
- Wrong `REDIS_URL` → verify endpoint from ElastiCache console (include port `:6379`)

### Agent service OOM (out of memory)
- Increase ECS task memory from 2 GB to 4 GB for the agent service task definition
- LangGraph + multiple LLM calls can be memory intensive

### S3 upload fails (from agent service)
- Verify IAM task role has `AmazonS3FullAccess`
- Verify `AWS_BUCKET_NAME` and `AWS_REGION` env vars are set correctly
- If using static credentials: verify `AWS_SECRET_KEY` (not `AWS_SECRET_ACCESS_KEY`) in agent task definition

### CORS errors in browser console
- `FRONTEND_URL` in gateway env var must exactly match the browser origin
- Example: if browser requests from `https://dxxxx.cloudfront.net`, then `FRONTEND_URL` must be `https://dxxxx.cloudfront.net` (no trailing slash)
- `credentials: true` requires exact origin — wildcard `*` will not work

### Docker build fails on Windows
- Ensure Docker Desktop is running before building
- Line ending issues: if Dockerfiles have Windows CRLF line endings, add `.dockerignore` with `*.bat` and use Git with `core.autocrlf=false`

### ESM import errors in Node.js
- All services use `"type": "module"` — ensure `FROM node:22-alpine` is used in Dockerfiles (avoids ESM incompatibilities in older Node)

### Qdrant API key not found
- The `@langchain/qdrant` package reads `QDRANT_API_KEY` from environment automatically when connecting
- Verify the secret name and value in Secrets Manager

---

## 18. Rollback

### Rollback to previous ECS task version

If a new deployment breaks something, roll back by pointing the service to the previous task definition revision.

#### PowerShell — any folder
```powershell
# List task definition revisions for gateway
aws ecs list-task-definitions --family-prefix novamind-gateway --region us-east-1

# Roll back to revision 1 (replace :2 with the broken revision number)
aws ecs update-service `
    --cluster novamind-cluster `
    --service novamind-gateway `
    --task-definition novamind-gateway:1 `
    --region us-east-1
```

Repeat for any service that needs to roll back.

### Verify rollback

#### PowerShell — any folder
```powershell
aws ecs describe-services `
    --cluster novamind-cluster `
    --services novamind-gateway `
    --region us-east-1 `
    --query "services[0].taskDefinition"
```
Verify it shows the previous revision number.

### Rollback frontend (S3)

If you pushed a bad frontend build, re-deploy the previous build:

#### PowerShell — frontend folder
```powershell
cd "E:\GenAi-Project-Cloudage\1.cortexAI\frontend"
# Checkout the previous working commit
git checkout <previous-commit-hash>
npm run build
aws s3 sync dist/ s3://novamind-frontend-prod --delete
```

Invalidate CloudFront cache after re-deploying:

#### PowerShell — any folder
```powershell
aws cloudfront create-invalidation `
    --distribution-id <your-cloudfront-distribution-id> `
    --paths "/*" `
    --region us-east-1
```

---

## 19. Cleanup (Destroy Resources)

> ⚠️ **WARNING: All commands in this section are DESTRUCTIVE and IRREVERSIBLE.**
> Only run these when you want to permanently delete all AWS resources.
> Verify each resource in the AWS Console before deleting.

### Step 1 — Scale down ECS services first

#### PowerShell — any folder
```powershell
# ⚠️ DESTRUCTIVE: Stops all running containers
foreach ($svc in @("novamind-gateway","novamind-auth","novamind-chat","novamind-agent","novamind-billing")) {
    aws ecs update-service --cluster novamind-cluster --service $svc --desired-count 0 --region us-east-1
}
```

Wait 2-3 minutes for tasks to drain, then delete services:

```powershell
# ⚠️ DESTRUCTIVE: Deletes ECS services
foreach ($svc in @("novamind-gateway","novamind-auth","novamind-chat","novamind-agent","novamind-billing")) {
    aws ecs delete-service --cluster novamind-cluster --service $svc --region us-east-1
}
```

### Step 2 — Delete ECS Cluster

```powershell
# ⚠️ DESTRUCTIVE: Deletes the ECS cluster
aws ecs delete-cluster --cluster novamind-cluster --region us-east-1
```

### Step 3 — Delete ECR repositories and images

```powershell
# ⚠️ DESTRUCTIVE: Deletes all Docker images permanently
foreach ($repo in @("novamind-gateway","novamind-auth","novamind-chat","novamind-agent","novamind-billing")) {
    aws ecr delete-repository --repository-name $repo --force --region us-east-1
}
```

### Step 4 — Delete S3 Frontend Bucket

```powershell
# ⚠️ DESTRUCTIVE: Deletes all frontend files
aws s3 rm s3://novamind-frontend-prod --recursive
aws s3 rb s3://novamind-frontend-prod
```

### Step 5 — Delete Secrets Manager secrets

```powershell
# ⚠️ DESTRUCTIVE: Deletes all secrets (7 day recovery window by default)
foreach ($secret in @(
    "novamind/auth/mongodb-uri",
    "novamind/chat/mongodb-uri",
    "novamind/agent/mongodb-uri",
    "novamind/billing/mongodb-uri",
    "novamind/auth/firebase-service-account",
    "novamind/agent/groq-api-key",
    "novamind/agent/google-api-key",
    "novamind/agent/openrouter-api-key",
    "novamind/agent/tavily-api-key",
    "novamind/agent/qdrant-api-key",
    "novamind/billing/razorpay-key-secret"
)) {
    aws secretsmanager delete-secret --secret-id $secret --force-delete-without-recovery --region us-east-1
}
```

### Step 6 — Delete remaining resources via AWS Console

These are easier to delete through the console than CLI because they have dependencies:

#### AWS Console — delete in this order:
1. **CloudFront** → Distributions → Disable → wait ~5 min → Delete
2. **EC2 → Load Balancers** → Select `novamind-alb` → Actions → Delete
3. **EC2 → Target Groups** → Select `novamind-gateway-tg` → Actions → Delete
4. **ElastiCache** → Clusters → Select `novamind-redis` → Delete
5. **VPC** → Your VPCs → Select `novamind-vpc` → Actions → Delete VPC (this also deletes subnets, route tables, NAT gateway, internet gateway)

> ⚠️ **Note:** NAT Gateway takes ~5 minutes to delete. The VPC delete will fail if the NAT Gateway is still deleting — wait and retry.

### Verify cleanup

#### PowerShell — any folder
```powershell
# Verify no ECS clusters remain
aws ecs list-clusters --region us-east-1

# Verify no ECR repos remain
aws ecr describe-repositories --region us-east-1

# Verify S3 bucket is gone
aws s3 ls s3://novamind-frontend-prod
```

---

## 20. Final Deployment Checklist

```
PRE-DEPLOYMENT
[ ] AWS CLI installed and configured (aws sts get-caller-identity works)
[ ] Docker Desktop installed and running
[ ] mlops-user IAM permissions verified (all policies in Section 5.5)
[ ] Node.js 22 installed

CODE CHANGES
[ ] Cookie secure flag changed (secure: process.env.NODE_ENV === "production")
[ ] sameSite changed to "none" for cross-domain
[ ] All Dockerfiles updated to FROM node:22-alpine
[ ] NODE_ENV=production added to all services

AWS INFRASTRUCTURE
[ ] ECR repositories created (5 repos)
[ ] VPC created with public + private subnets
[ ] Security groups created (ALB, ECS, Redis)
[ ] ElastiCache Redis cluster created and available
[ ] Application Load Balancer created
[ ] ECS cluster created
[ ] IAM roles created (ecsTaskExecutionRole, novamindTaskRole)

SECRETS
[ ] All MongoDB URIs stored in Secrets Manager
[ ] Firebase serviceAccountKey.json stored in Secrets Manager
[ ] All API keys stored in Secrets Manager (Groq, Google, OpenRouter, Tavily, Qdrant, Razorpay)

DOCKER IMAGES
[ ] Docker authenticated to ECR
[ ] All 5 images built and pushed to ECR
[ ] Images verified in ECR console

ECS DEPLOYMENT
[ ] All 5 task definitions created
[ ] Auth task has Firebase JSON injection command
[ ] Agent task uses IAM role for S3 (no static AWS credentials)
[ ] All 5 ECS services created and running (status: ACTIVE)
[ ] All tasks in RUNNING state (not STOPPED)

FRONTEND
[ ] VITE_SERVER_URL updated to ALB DNS or custom domain
[ ] npm run build completed successfully
[ ] dist/ folder uploaded to S3
[ ] S3 bucket policy allows public read
[ ] CloudFront distribution created and deployed
[ ] CloudFront custom error pages configured for 403/404 → index.html

AUTHENTICATION
[ ] Firebase authorized domains updated with CloudFront URL
[ ] Cookie secure and sameSite settings deployed

DATABASE
[ ] NAT Gateway IP whitelisted in MongoDB Atlas
[ ] MongoDB connection verified (user data loads after login)

TESTING
[ ] Frontend loads at CloudFront URL
[ ] Google login works
[ ] Chat agent responds
[ ] Code agent works
[ ] File upload works
[ ] PPT generation works
[ ] Billing drawer opens
[ ] CloudWatch logs receiving data

SECURITY
[ ] No secrets in plaintext in ECS task definitions
[ ] No secrets committed to git
[ ] .env files in .gitignore
[ ] serviceAccountKey.json in .gitignore
[ ] Security groups verified (no open 0.0.0.0/0 on internal services)

FINAL
[ ] Cost estimate reviewed
[ ] CloudWatch alarms set for errors
[ ] Team notified of production URL
```

---

*Guide created for NovaMind AI — AWS Account 637423369471 — Region us-east-1*
*Project: E:\GenAi-Project-Cloudage\1.cortexAI*
