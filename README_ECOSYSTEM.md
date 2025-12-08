# 🚀 Vercel & Supabase Living System Blueprint

This document outlines the complete ecosystem implementation for the Settler application, connecting Vercel/Next.js frontend with Supabase backend as a single, data-driven entity.

## 📋 Quick Start

### 1. Database Setup

Run the Supabase migrations in order:

```bash
# Apply all migrations
supabase db push

# Or apply individually:
supabase migration up
```

Migrations included:
- `20251130000000_ecosystem_schema.sql` - Core ecosystem tables
- `20251130000001_seed_demo_data.sql` - Demo data seeding
- `20251130000002_kpi_rpc_function.sql` - KPI health check function

### 2. Environment Variables

Ensure these are set in your `.env.local`:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Run the Application

```bash
cd packages/web
npm run dev
```

## 🏗️ Architecture Overview

### Core Positioning

- **5-Word VP**: "Automate financial reconciliation instantly"
- **Target Persona**: Developers and finance teams at SaaS/e-commerce companies
- **Interdependence**: Vercel (skin) ↔ Supabase (lifeblood) ↔ Server Actions (nerves)

### Data Flow

```
User Action (Form/Click)
    ↓
Next.js Server Action
    ↓
Supabase Table (RLS Check)
    ↓
Trigger/Function (if needed)
    ↓
Real-time Update (if subscribed)
    ↓
UI Refresh (Server Component or Realtime)
```

## 📊 Key Features

### 1. User Sign-up Flow

**File**: `packages/web/src/app/signup/page.tsx`
**Action**: `packages/web/src/app/actions/auth.ts`

- Creates Supabase auth user
- Creates profile in `profiles` table
- Logs activity in `activity_log` table
- Enforces RLS policies

### 2. Public Dashboard

**File**: `packages/web/src/app/dashboard/page.tsx`

Displays:
- Real-time KPI metrics
- New users this week
- Actions in last hour
- Most engaged post
- External API metrics (GitHub, NPM)

### 3. Positioning Feedback

**Component**: `packages/web/src/app/components/PositioningFeedbackForm.tsx`
**Action**: `packages/web/src/app/actions/positioning.ts`

- Users submit positioning clarity feedback
- Supabase function calculates impact score
- Profile impact score is updated
- Notification is created

### 4. Real-time Posts

**Component**: `packages/web/src/app/components/RealtimePosts.tsx`

- Subscribes to Supabase Realtime
- Displays live post updates
- Shows views, upvotes, engagement

### 5. Health Status Endpoint

**File**: `packages/web/src/app/api/status/health/route.ts`

Returns `"Status: Loud and High ✓"` when all 3 KPIs pass:
- New users this week > 50
- Actions last hour > 100
- Top post engagement > 100

## 🗄️ Database Schema

### Core Tables

- **profiles**: User profiles linked to Supabase Auth
- **posts**: Community posts/content
- **activity_log**: All user interactions
- **positioning_feedback**: Positioning clarity input
- **notifications**: Real-time notifications

### SQL Views

- `kpi_new_users_week`: Count of new users in last 7 days
- `kpi_actions_last_hour`: Count of actions in last hour
- `kpi_most_engaged_post_today`: Most engaged post today
- `kpi_health_status`: Combined health check view

### Functions

- `calculate_positioning_impact_score()`: Calculates impact score for feedback
- `get_kpi_health_status()`: RPC function for health endpoint

## 🔐 Security (RLS)

All tables have Row-Level Security enabled:

- **profiles**: Public read, own write
- **posts**: Published posts public, drafts private
- **activity_log**: Own activity only
- **positioning_feedback**: Own feedback only
- **notifications**: Own notifications only

## 📡 External API Integration

**File**: `packages/web/src/lib/api/external.ts`

- GitHub API for repository stats
- NPM API for package download stats
- Graceful fallback to demo data when APIs unavailable
- All demo data clearly labeled

## 🧪 Demo Data

The `seed_demo_data.sql` migration creates:
- 75 demo profiles
- 25 demo posts
- 150 activity log entries
- 20 positioning feedback entries
- 30 notifications

All demo data is realistic and clearly marked.

## 🚦 KPIs & Health Checks

### KPI Thresholds

1. **New Users This Week**: > 50
2. **Actions Last Hour**: > 100
3. **Top Post Engagement**: > 100

### Health Check

```bash
curl http://localhost:3000/api/status/health
```

Returns JSON with status and KPI details.

## 📝 Next Steps

1. Implement authentication (login/logout)
2. Add post creation/editing
3. Build notification center
4. Create user profile pages
5. Add search and filtering
6. Implement upvote/downvote
7. Add comment system

## 📚 Documentation

- [Ecosystem Positioning](./docs/ECOSYSTEM_POSITIONING.md) - Detailed positioning and architecture
- [Main README](./README.md) - Project overview

## 🔗 Key Routes

- `/dashboard` - Public dashboard with metrics
- `/signup` - User sign-up page
- `/community` - Community hub with feedback form and posts
- `/api/status/health` - Health check endpoint

## 🛠️ Development

### Adding New Features

1. Create Supabase migration for new tables
2. Add RLS policies
3. Create Server Actions for writes
4. Create Server Components for reads
5. Add Client Components for interactivity (if needed)
6. Subscribe to Realtime (if needed)

### Testing

- Test Server Actions with form submissions
- Verify RLS policies work correctly
- Check real-time subscriptions update UI
- Validate KPI calculations

## 📞 Support

For issues or questions, see the main [README](./README.md) for support channels.
