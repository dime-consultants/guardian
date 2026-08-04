# Kuehne+Nagel Finance Automation Platform - Frontend

A Next.js 16 frontend for the K+N Finance Automation Platform, providing AI-powered invoice reconciliation, data processing, and report generation.

## Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm/yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd kn-finance-automation

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local and add your configuration
# - XAI_API_KEY: For Grok AI chat (optional, for demo mode)
# - NEXT_PUBLIC_BACKEND_URL: Your Django backend URL

# Start development server
pnpm dev
```

The app will be available at `http://localhost:3000`

## Project Structure

```
├── app/                      # Next.js App Router pages
│   ├── api/
│   │   └── chat/            # Grok AI chat API route
│   ├── ai-engine/           # AI Engine page
│   ├── analytics/           # Analytics dashboard
│   ├── chat/                # Chat interface
│   ├── reports/             # Reports management
│   ├── settings/            # App settings
│   ├── tools/               # Data processing tools
│   ├── uploads/             # File manager
│   ├── users/               # User management
│   └── page.tsx             # Dashboard home
├── components/
│   ├── dashboard/           # Dashboard components
│   ├── layout/              # Sidebar, Header
│   ├── pages/               # Page-specific components
│   └── ui/                  # shadcn/ui components
├── contexts/
│   └── app-context.tsx      # Global app state (demo mode, backend URL)
├── lib/
│   └── utils.ts             # Utility functions
└── types/
    └── api.ts               # TypeScript types for backend API
```

## Features

### Demo Mode

The app supports a **Demo Mode** toggle that allows you to:
- View the UI with sample/fake data when backend is not connected
- Test the chat interface using Grok AI (requires `XAI_API_KEY`)
- Prototype file processing capabilities

Toggle demo mode via:
- The header toggle button
- Settings page

### Chat Interface

When backend is disconnected, the chat can:
- Use Grok AI for intelligent responses (requires API key)
- Upload and process files locally (in-memory, not stored)
- Download processed results

### Theme Support

- Light, Dark, and System themes
- Persists preference to localStorage

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `XAI_API_KEY` | No | Grok API key for AI chat in demo mode |
| `NEXT_PUBLIC_BACKEND_URL` | No | Django backend URL |
| `NEXT_PUBLIC_DEFAULT_DEMO_MODE` | No | Default demo mode state |

## Backend Integration

See `docs/BACKEND_API.md` for the complete API contract that the Django backend must implement.

## Development

```bash
# Run development server
pnpm dev

# Type checking
pnpm type-check

# Linting
pnpm lint

# Build for production
pnpm build
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Set environment variables
4. Deploy

### Self-hosted

```bash
pnpm build
pnpm start
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui
- **Charts**: Recharts
- **AI**: AI SDK with Grok (xAI)
- **State**: React Context + localStorage
