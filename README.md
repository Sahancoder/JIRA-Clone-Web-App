# Chyra - Modern Project Management Platform

![Chyra](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![License](https://img.shields.io/badge/license-MIT-green)

A modern, free-tier-friendly project management platform inspired by Jira, built with Next.js 16, Hono, Appwrite, and Google Gemini AI.

## ✨ Features

- 🎨 **Beautiful Chyra Brand Design** - Light-mode-only UI with signature blue (#2684FF) and white palette
- 📋 **Kanban Boards** - Drag-and-drop task management with Lexorank positioning
- 📊 **Analytics Dashboard** - Real-time insights into team performance and project metrics
- 🤖 **AI Assistant** - Powered by Google Gemini 1.5 Flash for task generation and project insights
- 📅 **Calendar View** - Track deadlines and milestones
- 👥 **Team Collaboration** - Workspaces, projects, and member management
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- ⚡ **Real-time Updates** - Live collaboration with Appwrite Realtime
- 🔒 **Secure Authentication** - Cookie-based sessions with Appwrite Auth

## 🎨 Brand Colors

Chyra uses a bright, SaaS-style light-mode palette:

| Color | Hex | Usage |
|-------|-----|-------|
| **Primary Blue** | `#2684FF` | Primary buttons, links, active states |
| **Deep Blue** | `#0052CC` | Logo, navigation, emphasis |
| **Navy** | `#253858` | Headings, borders, icons |
| **White** | `#FFFFFF` | Default background, cards |
| **Gray Neutrals** | `#F4F5F7` / `#EBECF0` | Secondary backgrounds, dividers |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- [Appwrite Cloud](https://cloud.appwrite.io) account (free tier)
- [Google AI Studio](https://aistudio.google.com) API key (free tier)
- [Vercel](https://vercel.com) account for deployment (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd chyra-jira
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your credentials:
   ```env
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   APPWRITE_PROJECT_ID=your_project_id
   APPWRITE_API_KEY=your_api_key
   DATABASE_ID=your_database_id
   COLLECTION_WORKSPACES_ID=your_workspace_collection_id
   COLLECTION_MEMBERS_ID=your_members_collection_id
   COLLECTION_PROJECTS_ID=your_projects_collection_id
   COLLECTION_TASKS_ID=your_tasks_collection_id
   GOOGLE_API_KEY=your_google_ai_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📁 Project Structure

```
chyra-jira/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Auth routes (sign-in, sign-up)
│   │   ├── api/                 # Hono API routes
│   │   │   └── [[...route]]/    # Catch-all API handler
│   │   ├── workspaces/          # Workspace pages
│   │   ├── layout.tsx           # Root layout with providers
│   │   └── page.tsx             # Landing page
│   ├── components/              # React components
│   │   ├── providers/           # Context providers (React Query)
│   │   ├── ui/                  # Reusable UI components
│   │   ├── kanban/              # Kanban board components
│   │   └── workspace/           # Workspace-specific components
│   ├── lib/                     # Utilities
│   │   ├── appwrite.ts          # Appwrite client setup
│   │   └── rpc.ts               # Hono RPC client
│   ├── server/                  # Backend logic
│   │   ├── auth.ts              # Authentication routes
│   │   ├── workspaces.ts        # Workspace API
│   │   ├── projects.ts          # Projects API
│   │   ├── tasks.ts             # Tasks API
│   │   ├── ai.ts                # AI integration
│   │   └── repos/               # Data repositories
│   └── types/                   # TypeScript types
│       └── domain.ts            # Domain models
├── public/                      # Static assets
├── .env.local                   # Environment variables (not committed)
├── .env.example                 # Environment template
├── package.json
├── tailwind.config.ts           # Tailwind configuration
├── tsconfig.json                # TypeScript configuration
└── COPILOT_GUIDE.md            # Step-by-step implementation guide
```

## 🛠️ Tech Stack

### Frontend
- **[Next.js 16](https://nextjs.org)** - React framework with App Router
- **[React 19](https://react.dev)** - UI library
- **[TypeScript](https://www.typescriptlang.org)** - Type safety
- **[Tailwind CSS v4](https://tailwindcss.com)** - Utility-first styling
- **[@tanstack/react-query](https://tanstack.com/query)** - Data fetching and caching
- **[@tanstack/react-table](https://tanstack.com/table)** - Table management
- **[@dnd-kit](https://dndkit.com)** - Drag and drop
- **[react-big-calendar](https://github.com/jquense/react-big-calendar)** - Calendar component

### Backend
- **[Hono](https://hono.dev)** - Fast, lightweight web framework
- **[Appwrite](https://appwrite.io)** - Backend as a Service (auth, database, storage)
- **[Zod](https://zod.dev)** - Schema validation

### AI
- **[Google Gemini 1.5 Flash](https://ai.google.dev)** - AI text generation

### Deployment
- **[Vercel](https://vercel.com)** - Hosting and deployment

## 📚 Documentation

- [Copilot Implementation Guide](../COPILOT_GUIDE.md) - Step-by-step guide for building with GitHub Copilot
- API Documentation - Backend API reference (coming soon)
- Deployment Guide - Production deployment instructions (coming soon)

## 🎯 Current Status

### Phase 1: Foundation ✅ (COMPLETED)
- ✅ Next.js 16 + Tailwind CSS v4 setup
- ✅ Chyra brand colors and styling system
- ✅ Hono API infrastructure with RPC client
- ✅ Appwrite client integration
- ✅ React Query providers
- ✅ TypeScript domain models
- ✅ Landing page with brand showcase
- ✅ Environment configuration

### Next Steps: Phase 2 - Authentication
Follow the [COPILOT_GUIDE.md](../COPILOT_GUIDE.md) to implement:
- Sign up / Sign in pages
- Cookie-based sessions
- Auth middleware
- Protected routes

## 🚀 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 🔗 Quick Links

- **Local App**: http://localhost:3000
- **API Health**: http://localhost:3000/api/health
- **Appwrite Console**: https://cloud.appwrite.io
- **Google AI Studio**: https://aistudio.google.com

## 🎨 Using Chyra Colors in Your Code

```tsx
// Tailwind classes
<button className="bg-primary hover:bg-primary-hover text-white">
  Primary Button
</button>

<div className="bg-gray-50 border border-gray-200">
  Card Background
</div>

// CSS variables
const styles = {
  backgroundColor: 'var(--chyra-primary)',
  color: 'var(--chyra-white)',
}
```

## 🤝 Contributing

Contributions are welcome! Please read our Contributing Guide for details.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Inspired by [Atlassian Jira](https://www.atlassian.com/software/jira)
- Brand colors from [Jira Color Palette](https://www.brandcolorcode.com/jira-software)
- Built with ❤️ using free-tier services

---

**Made with ❤️ and GitHub Copilot**
