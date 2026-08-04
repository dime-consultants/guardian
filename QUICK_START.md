# Quick Start Guide - K+N Finance Automation

## 🚀 Get Running in 5 Minutes

### Prerequisites
- Node.js 18+
- pnpm, npm, or yarn

### Installation

```bash
# 1. Clone & install
git clone <your-repo>
cd kn-finance-automation
pnpm install

# 2. Setup environment
cp .env.example .env.local

# 3. Add Grok API key (for demo mode chat)
# Edit .env.local:
# XAI_API_KEY=your_xai_api_key_here

# 4. Start development server
pnpm dev

# 5. Open browser
open http://localhost:3000
```

## 📋 Features You Can Try

### Demo Mode (No Backend Required)
```
1. Dashboard shows demo statistics
2. Chat works with Grok AI
3. Upload and process files
4. Download processed results
5. Toggle theme (light/dark)
```

### Enable Backend Connection
```
1. Go to Settings
2. Enter backend URL: http://localhost:8000
3. Dashboard loads real data from backend
4. Chat sends messages to backend
5. All pages show backend data
```

## 📁 File Processing

### Upload & Download
```
1. Click chat assistant → Chat Assistant
2. Click 📎 paperclip to upload file
3. Type: "Convert this CSV to Excel"
4. AI processes file
5. Click "Download XLSX File"
```

### Supported Formats
- **Upload**: CSV, TXT, XLSX, XLS, JSON, PDF, DOCX
- **Download**: CSV, XLSX, JSON, TXT, PDF, DOCX

## 🎨 Customization

### Theme Toggle
- Click sun/moon icon in header
- Choose: Light, Dark, or System

### Demo Data Toggle
- Click "Demo" button in header
- Toggles between demo data and live backend
- Settings page has more controls

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `README.md` | Full setup and project overview |
| `BACKEND_API.md` | API contract for backend implementation |
| `FILE_PROCESSING.md` | Complete file processing guide |
| `IMPLEMENTATION_SUMMARY.md` | Full technical implementation details |
| `QUICK_START.md` | This guide |

## 🔧 Environment Variables

```bash
# Grok AI Configuration
XAI_API_KEY=your_xai_api_key_here

# Backend Configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Demo Mode Default
NEXT_PUBLIC_DEFAULT_DEMO_MODE=true
```

## 📱 Pages & Features

| Page | Features |
|------|----------|
| **Dashboard** | Stats cards, activity charts, quick actions |
| **Chat** | AI chat, file upload, processing, download |
| **Analytics** | Performance metrics, trends, insights |
| **Reports** | Report management and generation |
| **File Manager** | Upload, organize, manage files |
| **Tools** | Data processing tools |
| **Users** | User management (with backend) |
| **Settings** | Configuration, theme, backend URL |

## 🐛 Troubleshooting

### Chat not responding?
```
→ Check XAI_API_KEY in Settings > Vars
→ Ensure "Demo Mode" is enabled
→ Check browser console for errors
```

### Backend not connecting?
```
→ Verify backend URL in Settings
→ Ensure backend is running
→ Check CORS configuration on backend
→ View console logs for connection errors
```

### File upload failing?
```
→ Check file size (max 5MB)
→ Verify file format is supported
→ Try a different file
→ Clear browser cache
```

## 💡 Tips

1. **Test Prompts for Chat**
   - "Convert this CSV to Excel"
   - "Analyze this invoice data"
   - "Generate a summary report"
   - "Clean and deduplicate this data"

2. **Backend Setup**
   - Start backend on port 8000
   - Add CORS headers
   - Implement endpoints from BACKEND_API.md

3. **Demo Data**
   - Toggle on/off to test UI
   - When off: Shows empty states
   - When on: Shows sample data

4. **Theme Testing**
   - System: Follows OS preference
   - Light: Light background, dark text
   - Dark: Dark background, light text

## 🚢 Deployment

### Vercel (Recommended)
```bash
git push origin main
# Deploy via Vercel dashboard
# Add environment variables in project settings
```

### Self-Hosted
```bash
pnpm build
pnpm start
# Access at http://localhost:3000
```

## 📖 Next Steps

1. **Read Full Documentation**
   - `README.md` - Comprehensive setup guide
   - `FILE_PROCESSING.md` - File operation details

2. **Implement Backend**
   - Follow `BACKEND_API.md`
   - Implement Django endpoints
   - Test integration

3. **Customize**
   - Update branding in components
   - Modify colors in `globals.css`
   - Add custom pages/features

4. **Deploy**
   - Push to GitHub
   - Deploy to Vercel or self-hosted
   - Monitor in production

## 📞 Support

For detailed information:
- Setup issues → See `README.md`
- Backend integration → See `BACKEND_API.md`
- File processing → See `FILE_PROCESSING.md`
- Architecture details → See `IMPLEMENTATION_SUMMARY.md`

## 🎯 Common Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm lint             # Check code quality
pnpm type-check       # TypeScript check

# Production
pnpm build            # Build for production
pnpm start            # Run production server

# Utilities
pnpm setup            # Run setup script
```

---

**Ready to go?** Start with `pnpm dev` and visit `http://localhost:3000` 🚀
