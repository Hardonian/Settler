-- Chatbot tables for conversation history and analytics
-- Run this to enable full chatbot functionality

-- Main conversation storage
CREATE TABLE IF NOT EXISTS chatbot_messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chatbot_messages_conv ON chatbot_messages(conversation_id, created_at);

-- Interaction analytics
CREATE TABLE IF NOT EXISTS chatbot_interactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  conversation_id TEXT NOT NULL,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  should_escalate BOOLEAN DEFAULT FALSE,
  confidence DECIMAL(3,2) DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chatbot_interactions_user ON chatbot_interactions(user_id, created_at);

-- RLS
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own messages" ON chatbot_messages
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert messages" ON chatbot_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role full access" ON chatbot_messages
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can insert interactions" ON chatbot_interactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role full access" ON chatbot_interactions
  FOR ALL USING (auth.role() = 'service_role');
