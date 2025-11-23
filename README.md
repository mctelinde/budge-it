# Budge-it

A modern, responsive personal finance management application built with React and Material-UI.

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript)
![Material-UI](https://img.shields.io/badge/Material--UI-7.3.4-007FFF?style=flat&logo=mui)

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

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies
3. Start the development server
4. Open <http://localhost:3000>

## Tech Stack

- React 19.2.0
- TypeScript
- Material-UI v7.3.4
- React Router DOM 7.9.4
- Supabase (PostgreSQL database & authentication)
- Recharts (data visualization)
- Righteous & Inter fonts

## Deployment

### Local Production Deployment

The app can be built and served locally for personal use:

#### 1. Build the Production App

```bash
npm run build
```

#### 2. Install Serve (if not already installed)

```bash
npm install -g serve
```

#### 3. Serve the App

```bash
serve -s build -l 3000
```

The app will be available at `http://localhost:3000`

#### 4. Auto-Start on Windows Boot

For automatic startup, you can:

**Option A: Use the provided batch file**
- Run `start-budge-it.bat` to start the server in a minimized window
- Copy this file to your Windows Startup folder (`Win+R` → `shell:startup`) for auto-start on boot

**Option B: Use Windows Task Scheduler**
- Create a new task to run `start-budge-it.bat` at system startup
- Set it to run with highest privileges

#### 5. Remote Access with Tailscale

Once running locally, you can access the app from anywhere using [Tailscale](https://tailscale.com/):
- Install Tailscale on your server and devices
- Access the app via your Tailscale IP: `http://[tailscale-ip]:3000`
- Optional: Set up a MagicDNS name for easier access

### Cloud Deployment Options

For cloud hosting, the app works with:
- **Vercel** (recommended - free tier, automatic deployments)
- **Netlify** (free tier, GitHub integration)
- **Cloudflare Pages** (free, fast CDN)
- **AWS Amplify** (scalable, integrates with AWS services)

### Environment Variables

Required environment variables (set in `.env.local` for development or in your deployment platform):

```
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup

Run the SQL migrations in the `database/migrations/` folder in your Supabase SQL Editor:
1. `001_add_display_order.sql` - Adds budget ordering capability
2. `002_add_pinned.sql` - Adds budget pinning feature

See `database/README.md` for detailed migration instructions.

## Author

Chris Telinde

Built with React, Material-UI, and Supabase
