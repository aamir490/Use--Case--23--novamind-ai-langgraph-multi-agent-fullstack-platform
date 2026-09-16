# NovaMind AI — Local Deployment Guide

Complete step-by-step guide to run the full stack on localhost.

---

## Architecture Overview

```
Browser (localhost:5173)
        │
        ▼
  Gateway (port 8000)          ← single entry point for all API calls
        │
        ├──▶ Auth Service    (port 8001)
        ├──▶ Chat Service    (port 8002)
        ├──▶ Agent Service   (port 8003)
        └──▶ Billing Service (port 8004)

Redis   (port 6379)            ← sessions & caching (Docker)
MongoDB Atlas (cloud)          ← database (already configured)
```

**Total terminals needed: 6**
Frontend · Gateway · Auth · Chat · Agent · Billing

---

## Prerequisites

Make sure these are installed before starting:

| Tool | Check command | Min version |
|------|--------------|-------------|
| Node.js | `node -v` | v18+ |
| npm | `npm -v` | v9+ |
| Docker Desktop | `docker -v` | any |
| Git | `git -v` | any |

---
## Step 0 — Start Docker Desktop

```powershell
# start Docker Desktop
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# verify 
docker ps
```

## Step 1 — Start Redis via Docker

Redis is required by the **Auth** and **Agent** services for session management.

Open a terminal and run:

```bash
cd backend
docker compose up -d
```

Verify Redis is running:

```bash
docker ps
```

You should see a container with image `redis` running on port `6379`.

> **Note:** Keep Docker Desktop open whenever running the project.

---

## Step 2 — Install Dependencies

Run this once. You only need to repeat it if `package.json` changes.

Open **5 separate terminals** and run `npm install` in each service:

```bash
# Terminal 1 — Gateway
cd backend/gateway
npm install

# Terminal 2 — Auth
cd backend/services/auth
npm install

# Terminal 3 — Chat
cd backend/services/chat
npm install

# Terminal 4 — Agent
cd backend/services/agent
npm install

# Terminal 5 — Billing
cd backend/services/billing
npm install

# Terminal 6 — Frontend
cd frontend
npm install
```

---

## Step 3 — Verify .env Files

All `.env` files are already configured. Verify these exist and have real values:

| File | Key variables |
|------|--------------|
| `backend/gateway/.env` | `PORT=8000`, all service URLs, `REDIS_URL` |
| `backend/services/auth/.env` | `PORT=8001`, `MONGODB_URI`, `REDIS_URL` |
| `backend/services/chat/.env` | `PORT=8002`, `MONGODB_URI` |
| `backend/services/agent/.env` | `PORT=8003`, `MONGODB_URI`, `GROQ_API_KEY`, `GOOGLE_API_KEY`, AWS keys, Qdrant keys |
| `backend/services/billing/.env` | `PORT=8004`, `MONGODB_URI`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |
| `frontend/.env` | `VITE_FIREBASE_API_KEY`, `VITE_RAZORPAY_KEY_ID`, `VITE_SERVER_URL=http://localhost:8000` |

> **Important:** The `VITE_SERVER_URL` in `frontend/.env` must point to the gateway at `http://localhost:8000`.

---

## Step 4 — Start All Services

Start each in its own terminal **in this exact order** (dependencies come first):

### 4a. Auth Service — Terminal 1
```bash
cd backend/services/auth
npm run dev
```
Expected output: `auth started at 8001` + `db connected`

### 4b. Chat Service — Terminal 2
```bash
cd backend/services/chat
npm run dev
```
Expected output: `chat started at 8002` + `db connected`

### 4c. Agent Service — Terminal 3
```bash
cd backend/services/agent
npm run dev
```
Expected output: `agent started at 8003` + `db connected`

### 4d. Billing Service — Terminal 4
```bash
cd backend/services/billing
npm run dev
```
Expected output: `billing started at 8004` + `db connected`

### 4e. Gateway — Terminal 5
```bash
cd backend/gateway
npm run dev
```
Expected output: `gateway started at 8000`

### 4f. Frontend — Terminal 6
```bash
cd frontend
npm run dev
```
Expected output:
```
VITE v8.x  ready in ~3s
➜  Local:   http://localhost:5173/
```

---

## Step 5 — Open the App

Visit: **http://localhost:5173**

You should see the NovaMind AI login page. Sign in with Google to access the dashboard.

---

## Quick Reference — All Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend (Vite) | 5173 | http://localhost:5173 |
| Gateway | 8000 | http://localhost:8000 |
| Auth | 8001 | http://localhost:8001 |
| Chat | 8002 | http://localhost:8002 |
| Agent | 8003 | http://localhost:8003 |
| Billing | 8004 | http://localhost:8004 |
| Redis | 6379 | (internal only) |

---

## Quick Restart (After First Setup)

Once you've done the full setup once, daily startup is just:

```bash
# 1. Start Redis
cd backend && docker compose up -d

# 2. Start services (each in its own terminal)
cd backend/services/auth    && npm run dev
cd backend/services/chat    && npm run dev
cd backend/services/agent   && npm run dev
cd backend/services/billing && npm run dev
cd backend/gateway          && npm run dev
cd frontend                 && npm run dev
```

---

## Troubleshooting

### "This site can't be reached" on localhost:5173
→ The Vite dev server is not running. Run `npm run dev` inside the `frontend` folder.

### "db error" in a service terminal
→ Check your `MONGODB_URI` in that service's `.env`. Make sure your IP is whitelisted in MongoDB Atlas under **Network Access**.

### Redis connection refused
→ Docker is not running. Open Docker Desktop and run `docker compose up -d` in `backend/`.

### Gateway returns 502 / service errors
→ Make sure the target service (auth/chat/agent/billing) is running first before the gateway tries to proxy to it.

### Firebase auth error on login
→ Check that `serviceAccountKey.json` exists in `backend/services/auth/`. This file is not committed to git and must be added manually from Firebase Console → Project Settings → Service Accounts → Generate New Private Key.

### Agent service crashes on start
→ Verify all API keys in `backend/services/agent/.env` are valid: `GROQ_API_KEY`, `GOOGLE_API_KEY`, `TAVILY_API_KEY`, `OPENROUTER_API_KEY`, AWS credentials, and Qdrant URL/key.

---

## File Structure Reference

```
1.cortexAI/
├── frontend/                    # React + Vite (port 5173)
│   ├── .env
│   └── src/
├── backend/
│   ├── docker-compose.yml       # Redis
│   ├── gateway/                 # API Gateway (port 8000)
│   │   └── .env
│   └── services/
│       ├── auth/                # Auth + Firebase + Redis (port 8001)
│       │   ├── .env
│       │   └── serviceAccountKey.json  ← not in git, add manually
│       ├── chat/                # Chat history (port 8002)
│       │   └── .env
│       ├── agent/               # AI agents + LangGraph (port 8003)
│       │   └── .env
│       └── billing/             # Razorpay billing (port 8004)
│           └── .env
```

---

## How to Stop the Localhost Server

### Stop Individual Services (Nodemon / Vite terminals)

In each terminal where a service is running, press:

```
Ctrl + C
```

Then when prompted `Terminate batch job (Y/N)?`, type:

```
Y
```

Press Enter to confirm. Repeat this for all 6 terminals:

| Terminal | Service | What to press |
|----------|---------|---------------|
| Terminal 1 | Auth Service | `Ctrl + C` → `Y` → Enter |
| Terminal 2 | Chat Service | `Ctrl + C` → `Y` → Enter |
| Terminal 3 | Agent Service | `Ctrl + C` → `Y` → Enter |
| Terminal 4 | Billing Service | `Ctrl + C` → `Y` → Enter |
| Terminal 5 | Gateway | `Ctrl + C` → `Y` → Enter |
| Terminal 6 | Frontend (Vite) | `Ctrl + C` → `Y` → Enter |

---

### Stop Redis (Docker)

After stopping all services, stop the Redis container:

#### PowerShell — backend folder
```powershell
cd "E:\GenAi-Project-Cloudage\1.cortexAI\backend"
docker compose down
```

Expected output:
```
[+] Running 2/2
 ✔ Container backend-redis-1  Removed
 ✔ Network backend_default    Removed
```

Verify Redis is stopped:

```powershell
docker ps
```

Expected: No containers listed (empty table).

---

### Stop Everything at Once (Force Kill — if Ctrl+C doesn't work)

If a terminal is frozen or `Ctrl + C` is not responding, use this to force-kill all Node.js processes:

#### PowerShell — any folder
```powershell
# ⚠️ This kills ALL Node.js processes on your machine
taskkill /F /IM node.exe
```

Then stop Redis:

```powershell
cd "E:\GenAi-Project-Cloudage\1.cortexAI\backend"
docker compose down
```

> **Note:** Only use `taskkill` if `Ctrl + C` fails. It will kill every Node.js process running on your computer, including any other projects.

---

### Verify Everything is Stopped

#### PowerShell — any folder
```powershell
# Check no Node processes are running
Get-Process -Name node -ErrorAction SilentlyContinue
```
Expected: No output (blank) means all Node processes are stopped.

```powershell
# Check no containers are running
docker ps

# output :- CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
```
Expected: Empty table with only headers.

```powershell
# Optional: check no ports are in use
netstat -ano | findstr ":8000 :8001 :8002 :8003 :8004 :5173 :6379"
```
Expected: No output means all ports are free.

---

### Now Quit Docker Desktop 

```powershell
# Yes. From the AWS Kiro PowerShell terminal, you can stop Docker Desktop with:
Stop-Process -Name "Docker Desktop" -Force

# If that doesn't work, use:
taskkill /F /IM "Docker Desktop.exe"


# To verify Docker Desktop is stopped
docker info
docker ps
```


### Quick Stop Summary

```
1. Each service terminal  →  Ctrl + C  →  Y  →  Enter
2. Redis                  →  cd backend  →  docker compose down
3. Verify                 →  Get-Process -Name node
```
