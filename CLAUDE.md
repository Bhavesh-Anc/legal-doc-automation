# Legal Doc Automation - Project Documentation

## Overview
A Next.js 14 application for automating legal document generation for family law attorneys. Built with TypeScript, Supabase for authentication and database, and Tailwind CSS for styling.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form + Zod validation
- **UI Components**: Custom components with class-variance-authority

## Project Structure

```
legal-doc-automation/
├── app/
│   ├── (auth)/                      # Auth route group with shared layout
│   │   ├── login/page.tsx          # Login page (password & magic link)
│   │   ├── signup/page.tsx         # Signup with org creation
│   │   └── layout.tsx              # Auth layout wrapper
│   ├── (dashboard)/                # Protected dashboard route group
│   │   ├── dashboard/page.tsx     # Main dashboard with stats & quick actions
│   │   └── layout.tsx              # Dashboard layout with nav & user menu
│   ├── auth/
│   │   ├── callback/route.ts      # OAuth callback handler
│   │   └── signout/route.ts       # Sign out route handler
│   ├── layout.tsx                  # Root layout with metadata
│   ├── page.tsx                    # Landing page
│   └── globals.css                 # Global styles & Tailwind directives
├── components/
│   └── ui/                         # Reusable UI components
│       ├── button.tsx
│       └── input.tsx
├── lib/
│   ├── supabase/                   # Supabase client utilities
│   │   ├── client.ts              # Client-side Supabase client
│   │   ├── server.ts              # Server-side Supabase client
│   │   └── middleware.ts          # Middleware helper
│   └── utils.ts                    # Utility functions (cn helper)
├── types/
│   └── supabase.ts                 # Generated Supabase type definitions
├── middleware.ts                   # Route protection & auth management
├── tailwind.config.ts              # Tailwind configuration
├── tsconfig.json                   # TypeScript configuration
├── next.config.js                  # Next.js configuration
├── postcss.config.js               # PostCSS configuration
├── package.json                    # Dependencies
└── .env.local                      # Environment variables
```

## Database Schema

### Required Tables

#### 1. organizations
```sql
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subscription_tier TEXT CHECK (subscription_tier IN ('trial', 'basic', 'pro')) DEFAULT 'trial',
  subscription_status TEXT CHECK (subscription_status IN ('active', 'cancelled', 'expired')) DEFAULT 'active',
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. user_profiles
```sql
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. documents
```sql
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL,
  case_data JSONB DEFAULT '{}',
  generated_content TEXT,
  status TEXT CHECK (status IN ('draft', 'completed', 'archived')) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Environment Variables

Required variables in `.env.local`:

```env
# Supabase Configuration
# Get these from: https://supabase.com/dashboard/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://svfjstczpuvnclvsmhks.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional - for server-side admin operations
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Where to Get Supabase Credentials:
1. Go to: https://supabase.com/dashboard
2. Select your project: `svfjstczpuvnclvsmhks`
3. Navigate to: **Settings → API**
4. Copy the values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys → anon/public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Project API keys → service_role** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

## Authentication Flow

### Sign Up Flow:
1. User submits email, password, and full name
2. Creates auth user in Supabase
3. Creates organization with 'trial' tier
4. Creates user_profile linked to organization with 'owner' role
5. Redirects to `/dashboard`

### Sign In Flow:
1. **Password Login**: Traditional email/password authentication
2. **Magic Link**: Passwordless email link authentication
3. Both redirect to `/dashboard` on success

### Route Protection:
- `middleware.ts` checks authentication on all routes
- Redirects unauthenticated users from `/dashboard/*` to `/login`
- Redirects authenticated users from `/login` or `/signup` to `/dashboard`
- Uses Supabase SSR for proper cookie handling

## Key Features Implemented

### Landing Page (`app/page.tsx`)
- Hero section with value proposition
- Feature showcase (Lightning Fast, Court-Ready, Secure)
- Call-to-action buttons for signup/login

### Authentication Pages
- Login with password or magic link toggle
- Signup with organization creation
- Email confirmation flow
- Error handling and loading states

### Dashboard (`app/(dashboard)/dashboard/page.tsx`)
- Welcome message with user name
- Trial banner for trial accounts
- Stats cards (Total Documents, This Month, Time Saved)
- Quick action cards for common document types
- Recent documents table with status indicators

### Dashboard Layout (`app/(dashboard)/layout.tsx`)
- Header with navigation and user menu
- Organization name display
- Sign out link
- Responsive design

## Files Fixed/Created

### ✅ Fixed Files:
1. **types/supabase.ts** - Generated TypeScript types for database schema
2. **app/auth/callback/route.ts** - OAuth callback handler for magic link auth
3. **app/auth/signout/route.ts** - Sign out route with GET/POST support
4. **app/(dashboard)/layout.tsx** - Dashboard layout with navigation
5. **app/(dashboard)/dashboard/page.tsx** - Complete dashboard with stats and quick actions

## Development Commands

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

## Deployment Checklist

### Supabase Setup:
- [ ] Create Supabase project
- [ ] Run database migrations (create tables)
- [ ] Enable Row Level Security (RLS)
- [ ] Add RLS policies (see below)
- [ ] Configure Auth settings
- [ ] Add email templates
- [ ] Add allowed redirect URLs

### RLS Policies:

```sql
-- Organizations: Users can read their own organization
CREATE POLICY "Users can read own organization"
ON organizations FOR SELECT
USING (id IN (
  SELECT organization_id FROM user_profiles WHERE id = auth.uid()
));

-- User Profiles: Users can read their own profile
CREATE POLICY "Users can read own profile"
ON user_profiles FOR SELECT
USING (id = auth.uid());

-- User Profiles: Users can read profiles in their organization
CREATE POLICY "Users can read org profiles"
ON user_profiles FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM user_profiles WHERE id = auth.uid()
));

-- Documents: Users can read documents in their organization
CREATE POLICY "Users can read org documents"
ON documents FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM user_profiles WHERE id = auth.uid()
));

-- Documents: Users can create documents in their organization
CREATE POLICY "Users can create documents"
ON documents FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM user_profiles WHERE id = auth.uid()
  )
  AND user_id = auth.uid()
);

-- Documents: Users can update their own documents
CREATE POLICY "Users can update own documents"
ON documents FOR UPDATE
USING (user_id = auth.uid());
```

### Environment Variables:
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` in production
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` in production
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` (if needed)

### Vercel/Hosting:
- [ ] Connect Git repository
- [ ] Configure environment variables
- [ ] Set up custom domain (optional)
- [ ] Enable automatic deployments

## Next Steps / TODO

### Required for MVP:
- [ ] Create document generation pages (`/dashboard/documents/new`)
- [ ] Implement document templates (Divorce Petition, Custody Agreement, etc.)
- [ ] Add PDF generation functionality
- [ ] Create document editing interface
- [ ] Implement document list view (`/dashboard/documents`)
- [ ] Add document detail/view page (`/dashboard/documents/[id]`)

### Nice to Have:
- [ ] Add billing/subscription management
- [ ] Implement team member invitations
- [ ] Add document history/versioning
- [ ] Create email notifications
- [ ] Add document sharing functionality
- [ ] Implement search and filtering
- [ ] Add analytics dashboard
- [ ] Create admin panel
- [ ] Add error boundaries
- [ ] Implement toast notifications
- [ ] Add unit and integration tests

## Common Issues & Solutions

### Issue: TypeScript errors for Supabase types
**Solution**: Run `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts`

### Issue: Authentication not working
**Solution**:
- Check environment variables are set correctly
- Verify Supabase project is active
- Check redirect URLs in Supabase dashboard

### Issue: Database queries failing
**Solution**:
- Ensure tables exist in Supabase
- Check RLS policies are configured
- Verify user is authenticated

### Issue: Middleware redirects not working
**Solution**:
- Check middleware matcher configuration
- Verify Supabase client initialization
- Clear cookies and try again

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)

## Support

For issues or questions:
1. Check this documentation
2. Review Supabase logs in dashboard
3. Check Next.js build logs
4. Review browser console for errors

---

**Project Status**: In Development
**Last Updated**: January 2025
**Version**: 0.1.0
