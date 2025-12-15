-- CreateTable: Analytics Events
CREATE TABLE IF NOT EXISTS "analytics_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "user_id" UUID,
    "session_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable: SDK Downloads
CREATE TABLE IF NOT EXISTS "sdk_downloads" (
    "id" TEXT NOT NULL PRIMARY KEY,
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

-- CreateTable: Playground Usage
CREATE TABLE IF NOT EXISTS "playground_usage" (
    "id" TEXT NOT NULL PRIMARY KEY,
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

-- CreateTable: Chatbot Conversations
CREATE TABLE IF NOT EXISTS "chatbot_conversations" (
    "id" TEXT NOT NULL PRIMARY KEY,
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

-- CreateTable: Chatbot Analytics
CREATE TABLE IF NOT EXISTS "chatbot_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "session_id" TEXT,
    "user_id" UUID,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable: Newsletter Subscriptions
CREATE TABLE IF NOT EXISTS "newsletter_subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT,
    "source" TEXT,
    "tags" TEXT[],
    "resend_contact_id" TEXT,
    "subscribed" BOOLEAN NOT NULL DEFAULT true,
    "unsubscribed_at" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndexes
CREATE INDEX IF NOT EXISTS "analytics_events_type_idx" ON "analytics_events"("type");
CREATE INDEX IF NOT EXISTS "analytics_events_user_id_idx" ON "analytics_events"("user_id");
CREATE INDEX IF NOT EXISTS "analytics_events_session_id_idx" ON "analytics_events"("session_id");
CREATE INDEX IF NOT EXISTS "analytics_events_timestamp_idx" ON "analytics_events"("timestamp");

CREATE INDEX IF NOT EXISTS "sdk_downloads_package_name_idx" ON "sdk_downloads"("package_name");
CREATE INDEX IF NOT EXISTS "sdk_downloads_timestamp_idx" ON "sdk_downloads"("timestamp");
CREATE INDEX IF NOT EXISTS "sdk_downloads_user_id_idx" ON "sdk_downloads"("user_id");

CREATE INDEX IF NOT EXISTS "playground_usage_feature_idx" ON "playground_usage"("feature");
CREATE INDEX IF NOT EXISTS "playground_usage_timestamp_idx" ON "playground_usage"("timestamp");
CREATE INDEX IF NOT EXISTS "playground_usage_user_id_idx" ON "playground_usage"("user_id");

CREATE INDEX IF NOT EXISTS "chatbot_conversations_conversation_id_idx" ON "chatbot_conversations"("conversation_id");
CREATE INDEX IF NOT EXISTS "chatbot_conversations_timestamp_idx" ON "chatbot_conversations"("timestamp");
CREATE INDEX IF NOT EXISTS "chatbot_conversations_user_id_idx" ON "chatbot_conversations"("user_id");

CREATE INDEX IF NOT EXISTS "chatbot_analytics_type_idx" ON "chatbot_analytics"("type");
CREATE INDEX IF NOT EXISTS "chatbot_analytics_timestamp_idx" ON "chatbot_analytics"("timestamp");
CREATE INDEX IF NOT EXISTS "chatbot_analytics_session_id_idx" ON "chatbot_analytics"("session_id");

CREATE INDEX IF NOT EXISTS "newsletter_subscriptions_email_idx" ON "newsletter_subscriptions"("email");
CREATE INDEX IF NOT EXISTS "newsletter_subscriptions_subscribed_idx" ON "newsletter_subscriptions"("subscribed");
