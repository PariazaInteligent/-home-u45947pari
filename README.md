# Pariaza Inteligent

Production-ready value betting platform with immersive 3D UI, double-entry ledger, and pro-rata distribution system.

## Architecture

**Monorepo Structure:**
- `public_html/` - Production code (deploy this to cPanel)
  - `apps/web-public/` - Public website (Next.js)
  - `apps/web-investor/` - Investor dashboard (Next.js)
  - `apps/web-admin/` - Admin panel (Next.js)
  - `apps/api/` - Backend API (Fastify + TypeScript)
  - `packages/database/` - Prisma schema + migrations
  - `packages/ui/` - Shared UI components (3D futuristic design)
  - `_ai/` - AI memory system (task tracking)

- `docker/` - Local development infrastructure (not deployed)

## Local Development Setup

### Prerequisites
- Node.js 20+
- pnpm 9+
- Docker Desktop

### Quick Start

1. **Start infrastructure:**
```bash
cd docker
docker-compose up -d
```

Services:
- MySQL: `localhost:3306`
- PHPMyAdmin: `http://localhost:8080`
- Redis: `localhost:6379`
- Minio: `http://localhost:9000` (console: `http://localhost:9001`)

2. **Install dependencies:**
```bash
cd public_html
pnpm install
```

3. **Setup environment:**
```bash
cp ../docker/.env.example .env.local
```

4. **Run database migrations:**
```bash
pnpm db:migrate
pnpm db:seed
```

5. **Start development servers:**
```bash
pnpm dev
```

Applications:
- Public site: `http://localhost:3000`
- Investor app: `http://localhost:3002`
- Admin app: `http://localhost:3003`
- API: `http://localhost:3001`

## Production Deployment (cPanel)

1. Build applications:
```bash
cd public_html
pnpm build
```

2. Upload `public_html/` contents to cPanel hosting

3. Configure environment variables in cPanel:
   - Point `DATABASE_URL` to cPanel MySQL
   - Point `REDIS_URL` to cPanel Redis (if available)
   - Set production `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
   - Configure S3 bucket for production storage

4. Run migrations:
```bash
pnpm db:migrate deploy
```

## AI Memory System

The `public_html/_ai/` directory contains JSON files that track:
- `task_board.json` - Current task, pending tasks, completed tasks
- `decisions.json` - Architectural decisions and their impacts
- `progress_log.json` - Detailed build history

These files are used by the AI agent to maintain context across sessions.

## Key Features

### Financial Core
- Double-entry ledger with immutable audit trail
- Pro-rata distribution calculations
- Units & NAV system
- Trade lifecycle management (create → settle → distribute)
- Withdrawal cooldown + approval flow

### Security
- JWT access + refresh tokens
- RBAC (Guest, Investor, Admin, Super Admin)
- 2FA support (TOTP)
- Audit logging (IP, user-agent, before/after state)
- Rate limiting
- Input validation

### 3D UI
- Three.js futuristic components
- Glass morphism + glow effects
- Scroll-based animations
- WebGL with fallback to enhanced 2D
- Framer Motion state transitions

## Testing

```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e
```

## Stack

- **Frontend:** Next.js 14 + React + TypeScript
- **Backend:** Fastify + TypeScript + OpenAPI
- **Database:** MySQL 8 / MariaDB + Prisma ORM
- **Cache:** Redis 7
- **Jobs:** BullMQ
- **Storage:** S3 compatible (Minio local, AWS S3 prod)
- **UI:** Tailwind + shadcn/ui + Framer Motion + Three.js
- **Monorepo:** pnpm workspaces + Turbo

## License

Proprietary - All rights reserved
