# Supabase AI Chatbot Prompt: Implement Analytics & Chatbot Schema

Copy and paste this entire prompt into Supabase AI chatbot to implement all Prisma schema additions for analytics and chatbot functionality.

---

## Prompt for Supabase AI Chatbot

```
I need to add new database tables and migrations for analytics tracking and chatbot functionality to my Supabase PostgreSQL database. Please implement the following schema additions:

## New Tables Required

### 1. analytics_events
Track general analytics events with the following structure:
- id: TEXT PRIMARY KEY (use cuid() or uuid())
- type: TEXT NOT NULL (event type like 'sdk_download', 'playground_usage', etc.)
- data: JSONB NOT NULL DEFAULT '{}' (event data payload)
- user_id: UUID (optional, foreign key to users table if exists)
- session_id: TEXT (optional, for session tracking)
- timestamp: TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- metadata: JSONB DEFAULT '{}' (additional metadata)
- created_at: TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

Required indexes:
- Index on type column
- Index on user_id column
- Index on session_id column
- Index on timestamp column

### 2. sdk_downloads
Track SDK package downloads with:
- id: TEXT PRIMARY KEY
- package_name: TEXT NOT NULL (e.g., '@settler/sdk')
- version: TEXT NOT NULL (package version)
- package_manager: TEXT NOT NULL ('npm', 'yarn', 'pnpm', 'other')
- user_id: UUID (optional)
- session_id: TEXT (optional)
- user_agent: TEXT (optional, browser user agent)
- referrer: TEXT (optional, HTTP referrer)
- ip_address: TEXT (optional, client IP)
- timestamp: TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- created_at: TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

Required indexes:
- Index on package_name column
- Index on timestamp column
- Index on user_id column

### 3. playground_usage
Track playground feature usage with:
- id: TEXT PRIMARY KEY
- feature: TEXT NOT NULL ('reconcile', 'receipts', 'flags', 'convert', 'cli')
- action: TEXT NOT NULL (specific action taken)
- integration: TEXT (optional, integration name like 'stripe', 'shopify')
- duration_ms: INTEGER (optional, action duration in milliseconds)
- success: BOOLEAN (optional, whether action succeeded)
- user_id: UUID (optional)
- session_id: TEXT (optional)
- metadata: JSONB DEFAULT '{}' (additional context)
- timestamp: TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- created_at: TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

Required indexes:
- Index on feature column
- Index on timestamp column
- Index on user_id column

### 4. chatbot_conversations
Store chatbot conversation messages with:
- id: TEXT PRIMARY KEY
- conversation_id: TEXT NOT NULL (unique conversation identifier)
- message: TEXT NOT NULL (user message)
- response: TEXT NOT NULL (AI assistant response)
- user_id: UUID (optional)
- session_id: TEXT (optional)
- device_info: JSONB DEFAULT '{}' (device/browser info)
- metadata: JSONB DEFAULT '{}' (conversation metadata)
- timestamp: TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- created_at: TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

Required indexes:
- Index on conversation_id column
- Index on timestamp column
- Index on user_id column

### 5. chatbot_analytics
Track chatbot interaction analytics with:
- id: TEXT PRIMARY KEY
- type: TEXT NOT NULL ('chat_opened', 'chat_closed', 'message_sent', 'message_received', 'file_uploaded', 'error')
- data: JSONB NOT NULL DEFAULT '{}' (event data)
- session_id: TEXT (optional)
- user_id: UUID (optional)
- timestamp: TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- created_at: TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

Required indexes:
- Index on type column
- Index on timestamp column
- Index on session_id column

### 6. newsletter_subscriptions
Manage newsletter email subscriptions with:
- id: TEXT PRIMARY KEY
- email: TEXT NOT NULL UNIQUE (subscriber email)
- name: TEXT (optional, subscriber name)
- source: TEXT (optional, subscription source)
- tags: TEXT[] (array of tags for segmentation)
- resend_contact_id: TEXT (optional, Resend API contact ID)
- subscribed: BOOLEAN NOT NULL DEFAULT true
- unsubscribed_at: TIMESTAMP (optional, when unsubscribed)
- metadata: JSONB DEFAULT '{}' (additional data)
- created_at: TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- updated_at: TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

Required indexes:
- Index on email column (unique constraint)
- Index on subscribed column

## Implementation Requirements

1. Create all tables with proper data types (TEXT for IDs, UUID for user references, JSONB for flexible data, TIMESTAMP for dates)

2. Add all specified indexes for query performance

3. Use appropriate constraints:
   - PRIMARY KEY on id columns
   - UNIQUE constraint on newsletter_subscriptions.email
   - NOT NULL constraints where specified
   - DEFAULT values where specified

4. Use JSONB for flexible schema fields (data, metadata, device_info) to allow storing varying structures

5. Use TIMESTAMP(3) for precise timestamp tracking

6. Map table names using snake_case:
   - analytics_events
   - sdk_downloads
   - playground_usage
   - chatbot_conversations
   - chatbot_analytics
   - newsletter_subscriptions

7. Create a migration file that can be run in Supabase SQL editor

8. Ensure all tables are compatible with Prisma ORM (if using Prisma, these will map to camelCase model names)

## SQL Migration Script

Please generate a complete SQL migration script that:
- Creates all 6 tables
- Adds all indexes
- Includes proper constraints
- Uses IF NOT EXISTS to prevent errors on re-run
- Is compatible with PostgreSQL (Supabase uses PostgreSQL)

## Additional Notes

- user_id columns should reference your existing users table if you have one (add foreign key constraint if users table exists)
- All timestamp fields should use TIMESTAMP(3) for millisecond precision
- JSONB fields should default to '{}' empty object, not NULL
- Consider adding RLS (Row Level Security) policies if needed for multi-tenant scenarios
- All tables should have created_at for audit trail

Please provide:
1. Complete SQL migration script
2. Verification queries to check table creation
3. Sample INSERT queries for testing each table
```

---

## Alternative: Direct SQL Migration

If you prefer to run the SQL directly, here's the complete migration:

```sql
-- ============================================================================
-- ANALYTICS & CHATBOT SCHEMA MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Analytics Events Table
CREATE TABLE IF NOT EXISTS "analytics_events" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "user_id" UUID,
    "session_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "analytics_events_type_idx" ON "analytics_events"("type");
CREATE INDEX IF NOT EXISTS "analytics_events_user_id_idx" ON "analytics_events"("user_id");
CREATE INDEX IF NOT EXISTS "analytics_events_session_id_idx" ON "analytics_events"("session_id");
CREATE INDEX IF NOT EXISTS "analytics_events_timestamp_idx" ON "analytics_events"("timestamp");

-- 2. SDK Downloads Table
CREATE TABLE IF NOT EXISTS "sdk_downloads" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "package_name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "package_manager" TEXT NOT NULL,
    "user_id" UUID,
    "session_id" TEXT,
    "user_agent" TEXT,
    "referrer" TEXT,
    "ip_address" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "sdk_downloads_package_name_idx" ON "sdk_downloads"("package_name");
CREATE INDEX IF NOT EXISTS "sdk_downloads_timestamp_idx" ON "sdk_downloads"("timestamp");
CREATE INDEX IF NOT EXISTS "sdk_downloads_user_id_idx" ON "sdk_downloads"("user_id");

-- 3. Playground Usage Table
CREATE TABLE IF NOT EXISTS "playground_usage" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "feature" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "integration" TEXT,
    "duration_ms" INTEGER,
    "success" BOOLEAN,
    "user_id" UUID,
    "session_id" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "playground_usage_feature_idx" ON "playground_usage"("feature");
CREATE INDEX IF NOT EXISTS "playground_usage_timestamp_idx" ON "playground_usage"("timestamp");
CREATE INDEX IF NOT EXISTS "playground_usage_user_id_idx" ON "playground_usage"("user_id");

-- 4. Chatbot Conversations Table
CREATE TABLE IF NOT EXISTS "chatbot_conversations" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "conversation_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "user_id" UUID,
    "session_id" TEXT,
    "device_info" JSONB DEFAULT '{}',
    "metadata" JSONB DEFAULT '{}',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "chatbot_conversations_conversation_id_idx" ON "chatbot_conversations"("conversation_id");
CREATE INDEX IF NOT EXISTS "chatbot_conversations_timestamp_idx" ON "chatbot_conversations"("timestamp");
CREATE INDEX IF NOT EXISTS "chatbot_conversations_user_id_idx" ON "chatbot_conversations"("user_id");

-- 5. Chatbot Analytics Table
CREATE TABLE IF NOT EXISTS "chatbot_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "session_id" TEXT,
    "user_id" UUID,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "chatbot_analytics_type_idx" ON "chatbot_analytics"("type");
CREATE INDEX IF NOT EXISTS "chatbot_analytics_timestamp_idx" ON "chatbot_analytics"("timestamp");
CREATE INDEX IF NOT EXISTS "chatbot_analytics_session_id_idx" ON "chatbot_analytics"("session_id");

-- 6. Newsletter Subscriptions Table
CREATE TABLE IF NOT EXISTS "newsletter_subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT,
    "source" TEXT,
    "tags" TEXT[] DEFAULT '{}',
    "resend_contact_id" TEXT,
    "subscribed" BOOLEAN NOT NULL DEFAULT true,
    "unsubscribed_at" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "newsletter_subscriptions_email_idx" ON "newsletter_subscriptions"("email");
CREATE INDEX IF NOT EXISTS "newsletter_subscriptions_subscribed_idx" ON "newsletter_subscriptions"("subscribed");

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'analytics_events',
    'sdk_downloads',
    'playground_usage',
    'chatbot_conversations',
    'chatbot_analytics',
    'newsletter_subscriptions'
)
ORDER BY table_name;

-- Check indexes
SELECT
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
    'analytics_events',
    'sdk_downloads',
    'playground_usage',
    'chatbot_conversations',
    'chatbot_analytics',
    'newsletter_subscriptions'
)
ORDER BY tablename, indexname;

-- ============================================================================
-- SAMPLE INSERT QUERIES FOR TESTING
-- ============================================================================

-- Test analytics_events
INSERT INTO analytics_events (type, data, session_id)
VALUES ('test_event', '{"test": true}', 'test_session_123')
RETURNING *;

-- Test sdk_downloads
INSERT INTO sdk_downloads (package_name, version, package_manager, session_id)
VALUES ('@settler/sdk', '1.0.0', 'npm', 'test_session_123')
RETURNING *;

-- Test playground_usage
INSERT INTO playground_usage (feature, action, integration, success, session_id)
VALUES ('reconcile', 'test_reconciliation', 'stripe', true, 'test_session_123')
RETURNING *;

-- Test chatbot_conversations
INSERT INTO chatbot_conversations (conversation_id, message, response, session_id)
VALUES ('conv_test_123', 'Hello', 'Hi! How can I help?', 'test_session_123')
RETURNING *;

-- Test chatbot_analytics
INSERT INTO chatbot_analytics (type, data, session_id)
VALUES ('chat_opened', '{"source": "homepage"}', 'test_session_123')
RETURNING *;

-- Test newsletter_subscriptions
INSERT INTO newsletter_subscriptions (email, name, source, tags)
VALUES ('test@example.com', 'Test User', 'homepage', ARRAY['developer', 'trial'])
RETURNING *;
```

---

## Usage Instructions

### Option 1: Use Supabase AI Chatbot

1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Click on "AI Assistant" or chat icon
4. Paste the prompt from the "Prompt for Supabase AI Chatbot" section above
5. Review and execute the generated SQL

### Option 2: Direct SQL Execution

1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Paste the complete SQL migration from "Alternative: Direct SQL Migration" section
4. Click "Run" to execute
5. Verify using the verification queries

### Option 3: Prisma Migration (if using Prisma)

1. Add the models from `prisma/schema-additions.prisma` to your main `schema.prisma`
2. Run: `npx prisma migrate dev --name add_analytics_and_chatbot`
3. Generate client: `npx prisma generate`

---

## Post-Migration Steps

1. **Verify Tables**: Run verification queries to confirm all tables and indexes were created
2. **Test Inserts**: Run sample INSERT queries to ensure tables work correctly
3. **Update Prisma Schema**: If using Prisma, add the models to your schema.prisma file
4. **Generate Prisma Client**: Run `npx prisma generate` to update TypeScript types
5. **Update Application Code**: Ensure your application code uses the new tables

---

## Row Level Security (Optional)

If you need RLS policies for multi-tenant scenarios, add these after table creation:

```sql
-- Enable RLS on analytics tables
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdk_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_analytics ENABLE ROW LEVEL SECURITY;

-- Example policy: Users can only see their own data
CREATE POLICY "Users can view own analytics" ON analytics_events
    FOR SELECT USING (auth.uid() = user_id);

-- Add similar policies for other tables as needed
```

---

**Last Updated**: January 2026  
**Status**: Ready to use with Supabase AI Chatbot
