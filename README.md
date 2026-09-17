<div align="center">

<img src="frontend/src/assets/novamind_ai_logo.jpg" alt="NovaMind AI" width="140" style="border-radius:16px"/>

# NovaMind AI

### Your all-in-one AI workspace — chat, code, search, and create.

[![Node.js](https://img.shields.io/badge/Node.js-22+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![LangGraph](https://img.shields.io/badge/LangGraph-1.x-FF6B6B?style=flat)](https://langchain-ai.github.io/langgraphjs/)
[![AWS](https://img.shields.io/badge/AWS-ECS%20%7C%20S3%20%7C%20CloudFront-FF9900?style=flat&logo=amazon-aws&logoColor=white)](https://aws.amazon.com)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=flat&logo=docker&logoColor=white)](https://docker.com)

**Built by [Aamir](https://github.com/aamir490)** · [GitHub](https://github.com/aamir490) · [LinkedIn](https://www.linkedin.com/in/aamir-imran)

</div>

---

## Project Overview

**NovaMind AI** is a production-grade, full-stack **multi-agent AI platform** that gives users access to 8 specialized AI agents through a single, unified conversational interface. Users can chat with an AI, generate and debug code, search the web in real time, analyze images, generate PDF reports and PowerPoint presentations, and chat with their own documents — all within one application.

### Problem Solved

Most AI tools are single-purpose. You need one tool for coding, another for search, another for document analysis. NovaMind AI solves this by building a **single platform where an intelligent router automatically selects the correct AI agent** based on what you ask. Users never have to think about which tool to use — the system decides.

### Why Agentic AI?

The platform is built on **LangGraph**, a stateful agent orchestration framework. Rather than making a single LLM call, requests flow through a directed acyclic graph of specialized nodes. This enables:
- **Multi-step reasoning** — the Search agent feeds results into the Chat agent for grounded answers
- **File-aware routing** — uploaded PDFs auto-route to the RAG agent, images to the Vision analyzer
- **Isolated concerns** — each agent has its own prompt, tools, and credit cost, making the system independently extensible
- **State management** — agent state is typed and shared across the graph execution

---

## Key Features

### 8 Specialized AI Agents

| Agent | Capability | LLM | Credit Cost |
|-------|-----------|-----|------------|
| **Chat** | General conversation, explanations, learning | Groq | 1 |
| **Search** | Real-time web search with grounded answers | Groq + Tavily | 5 |
| **Coding** | Multi-file code generation, debugging, review, optimization | Groq + DeepSeek | 10 |
| **PDF Generator** | Structured PDF reports from a text prompt | Groq + PDFKit | 10 |
| **PDF RAG** | Upload a PDF and ask questions about its content | Groq + Qdrant + Gemini Embeddings | 10 |
| **PPT Generator** | 6-slide PowerPoint presentations | Groq + PptxGenJS | 10 |
| **Vision** | AI image generation from text prompts | Groq + Pollinations.ai | 10 |
| **Image Analyzer** | Upload an image and analyze/describe its content | Google Gemini 2.5 Flash | 10 |

### Platform Features
- **Intelligent Auto-routing** — LLM-based intent classification routes requests to the correct agent when set to "Auto"
- **Live Code Preview** — Coding agent outputs render in a sandboxed iframe alongside a Monaco Editor
- **Conversation Memory** — Redis-backed sliding window (last 20 messages) provides LLM context continuity
- **Voice Input** — Web Speech API enables hands-free prompt entry
- **File Upload** — Upload PDFs (for RAG) or images (for analysis) directly in the chat input
- **Google Authentication** — Firebase Auth with session-based backend sessions
- **Credit System** — Metered access with free tier (100 credits) and paid plans
- **Razorpay Billing** — In-app payment processing (₹199 Starter, ₹499 Pro)
- **Admin Panel** — Full user management, payment history, and usage analytics dashboard

---

## Architecture Overview

NovaMind AI is a **microservices application** — 5 independent Node.js services communicate through a central API Gateway. The frontend never talks to services directly.

```
┌─────────────────────────────────────────────────────┐
│                React SPA (Vite + Redux)              │
└───────────────────────────┬─────────────────────────┘
                            │  HTTPS + session cookie
                            ▼
┌─────────────────────────────────────────────────────┐
│              API Gateway  (Express :8000)            │
│   CORS guard · cookie auth · proxy routing           │
└──┬──────────┬──────────┬──────────┬─────────────────┘
   │          │          │          │
:8001      :8002      :8003      :8004
Auth      Chat       Agent     Billing
Service   Service   Service    Service
   │          │          │          │
   └──────────┴────┬─────┴──────────┘
                   │
        ┌──────────┼───────────────┐
        ▼          ▼               ▼
  MongoDB Atlas  Redis       AWS S3
  (4 databases) (sessions,  (PDFs, PPTs,
                 memory,     images)
                 rate limits)
                   
  External: Firebase · Groq · Gemini · OpenRouter
            Tavily · Qdrant Cloud · Razorpay
```

---

## Application Workflow

```
User types "Write a React todo app"
        │
        ▼
Frontend (ChatInput.jsx)
  → builds FormData {prompt, conversationId, agent:"auto"}
  → POST /api/agent/chat (with session cookie)
        │
        ▼
API Gateway (protect middleware)
  → validates session cookie against Redis
  → injects x-user-id header
  → proxies to Agent Service :8003
        │
        ▼
Agent Controller
  → saves user message to Chat Service (MongoDB)
  → invokes LangGraph graph.invoke({prompt, agent:"auto", ...})
        │
        ▼
LangGraph Router Node
  → agent === "auto" → calls Groq LLM
  → LLM returns: "coding"
        │
        ▼
Coding Agent Node
  → Groq classifies intent → CODE_GENERATION
  → DeepSeek generates {files:[{name, content}]}
  → checkAgentLimit (Redis rate check)
  → deductCredits (POST Auth Service)
  → returns {aiResponse, artifacts}
        │
        ▼
Agent Controller
  → saves AI response + artifacts to Chat Service
  → updates Redis memory (sliding window)
  → returns {answer, artifacts} to Gateway → Frontend
        │
        ▼
Frontend (MessageBubble + Artifact panel)
  → renders Markdown response
  → opens Monaco Editor + live iframe preview
```

---

## Technology Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Frontend** | React | 19 | UI framework |
| **Frontend Build** | Vite | 8 | Dev server + bundler |
| **Frontend State** | Redux Toolkit | 2.x | Global state management |
| **Frontend Routing** | React Router DOM | 7 | SPA routing |
| **Frontend Styling** | Tailwind CSS | 4 | Utility-first CSS |
| **Frontend Animation** | Framer Motion | 12 | UI animations |
| **Code Editor** | Monaco Editor | 4.x | In-app code rendering |
| **Markdown** | react-markdown + remark-gfm | 10.x | AI response rendering |
| **Backend Runtime** | Node.js | 22 | Server runtime |
| **Backend Framework** | Express | 5 | HTTP framework (all services) |
| **API Gateway** | express-http-proxy | 2.x | Reverse proxy |
| **Agent Framework** | LangGraph | 1.x | Stateful agent orchestration |
| **LLM (Chat/Routing)** | Groq — gpt-oss-120b | — | Primary LLM |
| **LLM (Coding)** | OpenRouter — DeepSeek | — | Code generation |
| **LLM (Vision)** | Google Gemini 2.5 Flash | — | Image analysis |
| **Embeddings** | Gemini Embedding 001 | — | PDF RAG vector embeddings |
| **Web Search** | Tavily Search API | — | Real-time web retrieval |
| **Image Generation** | Pollinations.ai | — | Free text-to-image |
| **Vector Database** | Qdrant Cloud | — | PDF RAG similarity search |
| **Document Generation** | PDFKit | 0.x | PDF report generation |
| **Presentation** | PptxGenJS | 4.x | PPTX generation |
| **Database** | MongoDB Atlas | — | Persistent storage (4 DBs) |
| **Session Store** | Redis (ElastiCache) | — | Sessions + memory + rate limits |
| **Authentication** | Firebase Auth | 12.x | Google OAuth identity |
| **Payments** | Razorpay | 2.x | INR payment processing |
| **File Storage** | AWS S3 | — | Generated file storage |
| **CDN** | AWS CloudFront | — | Frontend delivery + HTTPS |
| **Container Registry** | AWS ECR | — | Docker image storage |
| **Compute** | AWS ECS (Fargate) | — | Serverless containers |
| **Containerization** | Docker | — | Service packaging |
| **CI/CD** | GitHub Actions | — | Automated deployment |

---

## Project Structure

```
1.cortexAI/
│
├── frontend/                        # React SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Main app + login modal
│   │   │   └── AdminPage.jsx        # Admin panel (3 tabs)
│   │   ├── components/
│   │   │   ├── SideBar.jsx          # Nav, conversations, user card
│   │   │   ├── ChatArea.jsx         # Message area wrapper
│   │   │   ├── ChatInput.jsx        # Input bar + agent pills + file upload
│   │   │   ├── MessageList.jsx      # Message thread + welcome screen
│   │   │   ├── MessageBubble.jsx    # Individual message rendering
│   │   │   ├── Artifact.jsx         # Code panel (Monaco + live preview)
│   │   │   ├── BillingDrawer.jsx    # Plan upgrade + Razorpay
│   │   │   ├── LoadingAnimation.jsx # LangGraph "thinking" animation
│   │   │   └── Nav.jsx              # Top conversation title bar
│   │   ├── redux/                   # RTK slices (user, conversation, message)
│   │   ├── features/                # API call functions
│   │   └── assets/                  # Logo, images
│   ├── utils/
│   │   ├── axios.js                 # Axios instance (baseURL + credentials)
│   │   └── firebase.js              # Firebase client config
│   └── .env.example
│
├── backend/
│   ├── docker-compose.yml           # Redis (local dev only)
│   ├── shared/
│   │   └── redis/redis.js           # Shared ioredis client
│   ├── gateway/                     # API Gateway :8000
│   │   ├── index.js                 # CORS, routing, auth middleware
│   │   ├── middleware/auth.middleware.js
│   │   ├── controllers/user.controller.js
│   │   ├── utils/proxyWithHeader.js
│   │   └── Dockerfile
│   └── services/
│       ├── auth/                    # Auth + Admin :8001
│       │   ├── controllers/
│       │   │   ├── auth.controller.js   # login/logout/credits
│       │   │   └── admin.controller.js  # admin dashboard API
│       │   ├── middleware/admin.middleware.js
│       │   ├── models/user.model.js
│       │   ├── config/firebase.js
│       │   └── Dockerfile
│       ├── chat/                    # Conversation persistence :8002
│       │   ├── controllers/chat.controller.js
│       │   ├── models/              # Conversation, Message
│       │   └── Dockerfile
│       ├── agent/                   # AI orchestration :8003
│       │   ├── graph/
│       │   │   ├── graph.js         # LangGraph StateGraph topology
│       │   │   ├── router.js        # Agent routing logic
│       │   │   └── state.js         # Typed graph state
│       │   ├── agents/              # 8 specialized AI agents
│       │   ├── config/              # LLM models, S3, Redis, Qdrant, etc.
│       │   ├── controllers/agent.controller.js
│       │   ├── utils/               # S3, PDF, PPT, credit utils
│       │   └── Dockerfile
│       └── billing/                 # Razorpay billing :8004
│           ├── controllers/billing.controller.js
│           ├── models/payment.model.js
│           ├── config/Plans.js
│           └── Dockerfile
│
├── .github/workflows/deploy.yml     # CI/CD pipeline (ECR + ECS + S3)
├── README.md
├── Architecture.md
├── deploy_on_aws_guide.md
└── steps_to_do_deploy_localhost.md
```

---

## AI / GenAI Architecture

### LangGraph State Machine

Every user request creates a typed state object and passes it through a compiled `StateGraph`:

```
{prompt, agent, conversationId, userId, file}
              │
              ▼
        [Router Node]
              │
    ┌─────────┼──────────────────────┐
    │         │                      │
  chat     search              coding / pdf
  agent    agent               ppt / vision
    │         │                pdfRag / imageAnalyzer
    │         ▼
    │     [Chat Node]   ← search results injected
    │         │
    └─────────┘
              ▼
           __end__
         {aiResponse, images, artifacts}
```

### Agent Dispatch Logic (Router)

1. **Explicit selection** — User chose agent from UI pill → pass through unchanged
2. **File type** — PDF attachment → `pdfRag`, image attachment → `imageAnalyzer`
3. **LLM classification** — Groq classifies free-text prompts into one of: `chat | search | coding | pdf | ppt | vision`

### Conversation Memory

- **Layer 1 (Hot):** Redis key `messages-{conversationId}` — sliding window of last 20 messages, 24-hour TTL. Read before every LLM call.
- **Layer 2 (Persistent):** MongoDB via Chat Service — every message saved permanently. Used on cache miss.

### RAG Pipeline (PDF Agent)

```
Upload PDF → pdf-parse → RecursiveCharacterTextSplitter (1000/200)
          → Qdrant collection (pdf-{timestamp})
          → Gemini Embedding 001 (vector indexing)
          → Similarity search (top-5 chunks)
          → Groq answers from retrieved context only
```

### Multi-Provider LLM Strategy

The platform uses different models for different tasks based on their strengths:

| Task | Model | Reason |
|------|-------|--------|
| Conversation, routing, PDF/PPT | Groq gpt-oss-120b | Fast inference, low latency |
| Code generation | DeepSeek via OpenRouter | Stronger code generation benchmarks |
| Image understanding | Gemini 2.5 Flash | Native multimodal support |
| RAG embeddings | Gemini Embedding 001 | High-quality semantic embeddings |
| Image generation | Pollinations.ai | Free, no API key required |

---

## AWS Services Used

| Service | Component | Purpose |
|---------|-----------|---------|
| **ECS Fargate** | All 5 backend services | Serverless container execution |
| **ECR** | All 5 Docker images | Private container registry |
| **S3** (app bucket) | Agent Service | Stores generated PDFs, PPTs, AI images |
| **S3** (frontend bucket) | Frontend | Hosts React static build |
| **CloudFront** | Frontend | HTTPS, global CDN, SPA routing support |
| **ElastiCache (Redis)** | All services | Sessions, conversation memory, rate limiting |
| **Application Load Balancer** | Gateway | HTTPS termination, internet entry point |
| **Secrets Manager** | All services | API keys, DB URIs, Firebase credentials |
| **CloudWatch** | All services | Container logs and monitoring |
| **VPC + NAT Gateway** | All services | Private networking |

### CI/CD Flow
```
git push main
     │
     ▼
GitHub Actions
  ├── docker build (5 images)
  ├── docker push → ECR
  ├── aws ecs update-service --force-new-deployment (5 services)
  ├── npm run build (Vite)
  ├── aws s3 sync dist/ → S3
  └── aws cloudfront create-invalidation
```

---

## Local Setup

### Prerequisites
- Node.js 22+
- Docker Desktop
- Git

### 1. Clone the repository
```bash
git clone https://github.com/aamir490/novamind-ai-langgraph-multi-agent-fullstack-platform.git
cd novamind-ai-langgraph-multi-agent-fullstack-platform
```

### 2. Start Redis
```powershell
cd backend
docker compose up -d
```

### 3. Configure environment variables

Copy `.env.example` to `.env` in each service directory and fill in the values:

```powershell
# Gateway
Copy-Item backend/gateway/.env.example backend/gateway/.env

# Services
Copy-Item backend/services/auth/.env.example    backend/services/auth/.env
Copy-Item backend/services/chat/.env.example    backend/services/chat/.env
Copy-Item backend/services/agent/.env.example   backend/services/agent/.env
Copy-Item backend/services/billing/.env.example backend/services/billing/.env

# Frontend
Copy-Item frontend/.env.example frontend/.env
```

Add the Firebase Admin SDK service account key:
```
backend/services/auth/serviceAccountKey.json
```
Download from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key

### 4. Start all services (6 terminals)

```powershell
# Terminal 1 — Auth
cd backend/services/auth && npm install && npm run dev

# Terminal 2 — Chat
cd backend/services/chat && npm install && npm run dev

# Terminal 3 — Agent
cd backend/services/agent && npm install && npm run dev

# Terminal 4 — Billing
cd backend/services/billing && npm install && npm run dev

# Terminal 5 — Gateway
cd backend/gateway && npm install && npm run dev

# Terminal 6 — Frontend
cd frontend && npm install && npm run dev
```

### 5. Open the app
```
http://localhost:5173
```

---

## Configuration

### Required Environment Variables

#### API Gateway (`backend/gateway/.env`)
```env
PORT=8000
FRONTEND_URL=http://localhost:5173
AUTH_SERVICE=http://localhost:8001
CHAT_SERVICE=http://localhost:8002
AGENT_SERVICE=http://localhost:8003
BILLING_SERVICE=http://localhost:8004
REDIS_URL=redis://localhost:6379
```

#### Auth Service (`backend/services/auth/.env`)
```env
PORT=8001
MONGODB_URI=YOUR_MONGODB_ATLAS_URI
REDIS_URL=redis://localhost:6379
ADMIN_EMAIL=your_admin_gmail@gmail.com
BILLING_MONGODB_URI=YOUR_BILLING_DB_URI
CHAT_MONGODB_URI=YOUR_CHAT_DB_URI
```

#### Agent Service (`backend/services/agent/.env`)
```env
PORT=8003
MONGODB_URI=YOUR_MONGODB_ATLAS_URI
REDIS_URL=redis://localhost:6379
GROQ_API_KEY=YOUR_GROQ_API_KEY
GOOGLE_API_KEY=YOUR_GOOGLE_GEMINI_KEY
OPENROUTER_API_KEY=YOUR_OPENROUTER_KEY
TAVILY_API_KEY=YOUR_TAVILY_KEY
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=YOUR_AWS_KEY_ID
AWS_SECRET_KEY=YOUR_AWS_SECRET
AWS_BUCKET_NAME=YOUR_S3_BUCKET
QDRANT_URL=YOUR_QDRANT_CLUSTER_URL
QDRANT_API_KEY=YOUR_QDRANT_KEY
CHAT_SERVICE=http://localhost:8002
AUTH_SERVICE=http://localhost:8001
```

#### Billing Service (`backend/services/billing/.env`)
```env
PORT=8004
MONGODB_URI=YOUR_MONGODB_ATLAS_URI
AUTH_SERVICE=http://localhost:8001
RAZORPAY_KEY_ID=YOUR_RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_SECRET
```

#### Frontend (`frontend/.env`)
```env
VITE_FIREBASE_API_KEY=YOUR_FIREBASE_WEB_API_KEY
VITE_RAZORPAY_KEY_ID=YOUR_RAZORPAY_KEY_ID
VITE_SERVER_URL=http://localhost:8000
VITE_ADMIN_EMAIL=your_admin_gmail@gmail.com
```

---

## Security

### Implemented
- **httpOnly session cookies** — Session token never accessible to JavaScript
- **Redis session store** — Sessions invalidated server-side on logout
- **Firebase token verification** — Every login verifies a cryptographically signed Google token via firebase-admin SDK
- **Header injection pattern** — `x-user-id` injected by gateway after session validation; downstream services never trust the frontend directly
- **Admin email guard** — Admin routes protected by both frontend route guard and backend middleware
- **CORS restricted** — Gateway allows requests only from `FRONTEND_URL`
- **Razorpay HMAC verification** — Payment webhook signatures verified before processing
- **Per-user rate limiting** — Redis-backed request throttling per agent per user per minute
- **Credit gating** — Every AI agent verifies sufficient credits before executing

### Known Gaps (Non-Production)
- `cookie.secure = false` — Must be `true` in production for HTTPS-only cookies
- `cookie.sameSite = "strict"` — Must be `"none"` in production if frontend and API are on different subdomains
- Internal service-to-service calls (agent → auth for credit deduction) have no authentication — rely entirely on network isolation
- No HTTPS in any service — TLS termination must happen at the ALB

---

## Testing

**No automated test suite is currently implemented.**

`backend/package.json` contains the placeholder:
```json
"test": "echo \"Error: no test specified\" && exit 1"
```

Manual testing is currently done by running the application locally and exercising each agent through the UI.

---

## Limitations

| Limitation | Impact | Notes |
|-----------|--------|-------|
| `Date.now` not invoked in multer config | Broken temp filenames | Works functionally but produces garbage filenames |
| Qdrant collections never cleaned up | Storage cost accumulates | Each PDF RAG request creates an orphaned collection |
| Presigned URL expiry inconsistency | User-facing "10 minutes" is wrong | PPT: 24hrs, PDF: 24mins actual expiry |
| No automated tests | Cannot CI/CD safely | Manual testing only |
| No retry logic on LLM calls | Single-point failures | If Groq/Gemini timeout, request fails |
| Agent message saved before graph | Orphaned user messages on graph failure | Message saved even if AI response never comes |
| `cookie.secure = false` | Session cookies sent over HTTP | Production security risk |
| No message ownership check | Any logged-in user can fetch messages by ID | Minor data isolation concern |

---

## Future Improvements

> These are proposed improvements, not implemented features.

- **Streaming responses** — Stream LLM tokens to the frontend via SSE for perceived latency improvement
- **Agent memory persistence** — Move conversation memory from Redis (ephemeral) to a persistent vector store
- **Multi-modal chat history** — Preserve images and artifacts in the context window
- **Qdrant collection cleanup** — Add TTL-based or scheduled cleanup for orphaned PDF collections
- **Rate limit UI feedback** — Show real-time countdown in the UI when rate-limited
- **Test suite** — Vitest for frontend, Node test runner for service integration tests
- **Observability** — Structured logging (Winston/Pino), distributed tracing (OpenTelemetry)
- **Streaming agent progress** — Show which agent/node is executing in real time
- **User-uploaded conversation context** — Allow users to bring their own data sources
- **Multi-tenant isolation** — Separate Qdrant namespaces per user for PDF RAG

---

## Project Highlights

This project demonstrates the following engineering concepts in a single codebase:

| Concept | Implementation |
|---------|---------------|
| **Agentic AI** | LangGraph StateGraph with 9 nodes, conditional edges, and multi-step agent chains |
| **Multi-provider LLM** | Groq, Google Gemini, and DeepSeek via OpenRouter — different models for different tasks |
| **RAG Pipeline** | PDF upload → chunk → embed (Gemini) → vector store (Qdrant) → semantic retrieval → grounded answer |
| **Microservices** | 5 independently deployable Node.js services with clear domain boundaries |
| **API Gateway Pattern** | Single entry point with session validation, header injection, and reverse proxying |
| **Redis-based Session Auth** | Stateless gateway with O(1) session lookup; sessions invalidated server-side |
| **AWS Full Stack** | ECS Fargate + ECR + S3 + CloudFront + ElastiCache + ALB + Secrets Manager |
| **CI/CD Pipeline** | GitHub Actions → Docker build → ECR push → ECS rolling deploy + S3 sync |
| **Credit-based Metering** | Per-agent cost model with real-time deduction and session cache refresh |
| **In-app Code Execution** | Monaco Editor + sandboxed iframe live preview for generated HTML/CSS/JS |
| **Real-time Voice** | Web Speech API integration for continuous voice-to-text |

---

<div align="center">

Made with ❤️ by **Aamir** · [GitHub](https://github.com/aamir490) · [LinkedIn](https://www.linkedin.com/in/aamir-imran)

</div>
