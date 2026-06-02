# Budge-it

A modern, responsive personal finance management application built with React, TypeScript, and Vite.

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?style=flat&logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat&logo=vite)

## Features

### Transaction Management

- Add, edit, and delete transactions
- Support for both income and expense tracking
- Categorize transactions
- Multiple account support
- Real-time search and filtering
- CSV import for bulk uploads
- Date-based sorting

### User Interface

- Modern teal gradient theme with dark/light mode
- Fully responsive design
- Collapsible sidebar navigation
- Interactive hover effects and animations
- Sticky table headers
- Customizable pagination (25, 50, 100 rows)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Development

1. Clone the repository
2. Install dependencies in both root and app:
   ```bash
   npm install
   cd app
   npm install
   cd ..
   ```
3. Copy `.env.local` (or create it with Supabase credentials)
4. Start the development server:
   ```bash
   cd app
   npm run dev
   ```
5. Open <https://localhost:5173>

### Production Build

Build the app for production:

```bash
npm run build
```

This builds app and outputs to `app/dist/`.

## Tech Stack

- React 19
- TypeScript
- Vite (fast build tool)
- Tailwind CSS v4
- shadcn/ui (Radix UI components)
- React Router DOM 7
- Supabase (PostgreSQL database & authentication)
- Recharts (data visualization)
- Geist & Inter fonts
- PM2 (process management)

## Deployment

### Local Production Deployment

The app can be built and served locally for personal use.

#### 1. Build and Deploy

```bash
npm run deploy
```

This runs the production build and starts the PM2 daemon. The app will be available at **https://localhost:3000**

#### 2. Management Commands

```bash
npm run serve      # Start the server (if stopped)
npm run stop       # Stop the server
npm run restart    # Restart without rebuilding
npm run status     # Show PM2 process status
npm run logs       # View server logs
```

#### 3. Auto-Start on Windows Boot

To make the app auto-start on Windows login:

```bash
pm2 startup
pm2 save
```

Then follow PM2's instructions to install the startup script.

#### 4. SSL Certificates

The server runs on HTTPS using self-signed certificates at `certs/cert.pem` and `certs/key.pem`. These are auto-generated in the codebase. In your browser, you'll see a certificate warning—this is expected and safe to ignore for local development.

#### 5. Remote Access with Tailscale

Once running locally, you can access the app from anywhere using [Tailscale](https://tailscale.com/):
- Install Tailscale on your server and devices
- Access the app via your Tailscale IP: `https://[tailscale-ip]:3000`
- Optional: Set up a MagicDNS name for easier access

### Cloud Deployment Options

For cloud hosting, the app works with:
- **Vercel** (recommended - free tier, automatic deployments)
- **Netlify** (free tier, GitHub integration)
- **Cloudflare Pages** (free, fast CDN)
- **AWS Amplify** (scalable, integrates with AWS services)

### Environment Variables

Required environment variables (set in `.env.local` for development, `app/.env.local` for Vite):

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup

Run the SQL migrations in the `database/migrations/` folder in your Supabase SQL Editor:
1. `001_add_display_order.sql` - Adds budget ordering capability
2. `002_add_pinned.sql` - Adds budget pinning feature

See `database/README.md` for detailed migration instructions.

## Project Structure

```
budge-it/
├── app/                    # Main Vite + React app (the active app)
│   ├── src/
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── dist/               # Production build output
├── src/                    # Shared utilities and types
│   ├── types/             # Shared TypeScript types
│   ├── utils/             # Shared utility functions
│   └── services/          # Shared database service layer
├── certs/                 # SSL certificates for local HTTPS
├── database/              # Database migrations
├── ecosystem.config.js    # PM2 configuration
├── start-serve.sh        # Shell script to start the production server
└── package.json          # Root-level build and deployment scripts
```

## Author

Chris Telinde

Built with React, TypeScript, Vite, Tailwind CSS, and Supabase
