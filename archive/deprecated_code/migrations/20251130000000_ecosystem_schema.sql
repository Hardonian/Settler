-- Migration: ecosystem_schema
-- Created: 2025-11-30
-- Description: Ecosystem tables for community building, positioning clarity, and real-time metrics
-- Part of: Vercel & Supabase Living System Blueprint

BEGIN;

-- ============================================================================
-- 1. PROFILES TABLE (User profiles linked to Supabase Auth)
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  role VARCHAR(50) DEFAULT 'community_member',
  impact_score INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_impact_score ON profiles(impact_score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- ============================================================================
-- 2. POSTS TABLE (Community posts/content)
-- ============================================================================

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  post_type VARCHAR(50) DEFAULT 'post', -- 'post', 'announcement', 'question', 'answer'
  status VARCHAR(50) DEFAULT 'published', -- 'draft', 'published', 'archived'
  views INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_views ON posts(views DESC);
CREATE INDEX IF NOT EXISTS idx_posts_upvotes ON posts(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_posts_engagement ON posts((views + upvotes * 2) DESC);
CREATE INDEX IF NOT EXISTS idx_posts_metadata_gin ON posts USING GIN (metadata);

-- Enable realtime for posts
ALTER PUBLICATION supabase_realtime ADD TABLE posts;

-- ============================================================================
-- 3. ACTIVITY_LOG TABLE (Track all user interactions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  activity_type VARCHAR(100) NOT NULL, -- 'signup', 'login', 'post_view', 'post_upvote', 'scroll', 'click', 'feedback_submit'
  entity_type VARCHAR(50), -- 'post', 'profile', 'page', 'dashboard'
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_created ON activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_metadata_gin ON activity_log USING GIN (metadata);

-- ============================================================================
-- 4. POSITIONING_FEEDBACK TABLE (Community positioning clarity input)
-- ============================================================================

CREATE TABLE IF NOT EXISTS positioning_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  five_word_vp VARCHAR(255), -- 5-word value proposition
  target_persona_pain TEXT, -- Target persona pain point
  clarity_rating INTEGER CHECK (clarity_rating >= 1 AND clarity_rating <= 10),
  feedback_text TEXT,
  impact_score INTEGER DEFAULT 0, -- Calculated by function
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_positioning_feedback_user_id ON positioning_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_positioning_feedback_created_at ON positioning_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_positioning_feedback_impact_score ON positioning_feedback(impact_score DESC);
CREATE INDEX IF NOT EXISTS idx_positioning_feedback_clarity_rating ON positioning_feedback(clarity_rating DESC);

-- ============================================================================
-- 5. NOTIFICATIONS TABLE (For real-time notifications)
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- 'new_post', 'upvote', 'comment', 'impact_score_update'
  title VARCHAR(255) NOT NULL,
  message TEXT,
  entity_type VARCHAR(50),
  entity_id UUID,
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================================================
-- 6. FUNCTIONS
-- ============================================================================

-- Function: Calculate impact score for positioning feedback
CREATE OR REPLACE FUNCTION calculate_positioning_impact_score(
  p_feedback_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_feedback RECORD;
  v_user_profile RECORD;
BEGIN
  -- Get feedback data
  SELECT * INTO v_feedback
  FROM positioning_feedback
  WHERE id = p_feedback_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Base score from clarity rating (1-10 scale, multiply by 10)
  v_score := COALESCE(v_feedback.clarity_rating, 0) * 10;
  
  -- Bonus if 5-word VP is provided (max 20 points)
  IF v_feedback.five_word_vp IS NOT NULL AND LENGTH(TRIM(v_feedback.five_word_vp)) > 0 THEN
    v_score := v_score + 20;
  END IF;
  
  -- Bonus if target persona pain is provided (max 15 points)
  IF v_feedback.target_persona_pain IS NOT NULL AND LENGTH(TRIM(v_feedback.target_persona_pain)) > 50 THEN
    v_score := v_score + 15;
  END IF;
  
  -- Bonus if feedback text is detailed (max 15 points)
  IF v_feedback.feedback_text IS NOT NULL AND LENGTH(TRIM(v_feedback.feedback_text)) > 100 THEN
    v_score := v_score + 15;
  END IF;
  
  -- Get user profile for additional scoring
  IF v_feedback.user_id IS NOT NULL THEN
    SELECT * INTO v_user_profile
    FROM profiles
    WHERE id = v_feedback.user_id;
    
    -- Bonus for users with higher existing impact scores
    IF v_user_profile.impact_score > 50 THEN
      v_score := v_score + 10;
    ELSIF v_user_profile.impact_score > 20 THEN
      v_score := v_score + 5;
    END IF;
  END IF;
  
  -- Cap score at 100
  v_score := LEAST(v_score, 100);
  
  RETURN v_score;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Update impact score trigger
CREATE OR REPLACE FUNCTION update_positioning_impact_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.impact_score := calculate_positioning_impact_score(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update impact score on positioning feedback changes
DROP TRIGGER IF EXISTS trigger_update_positioning_impact_score ON positioning_feedback;
CREATE TRIGGER trigger_update_positioning_impact_score
  BEFORE INSERT OR UPDATE ON positioning_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_positioning_impact_score();

-- Function: Update profile impact score when feedback is submitted
CREATE OR REPLACE FUNCTION update_profile_impact_from_feedback()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    UPDATE profiles
    SET impact_score = impact_score + NEW.impact_score,
        updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update profile impact score when feedback is created
DROP TRIGGER IF EXISTS trigger_update_profile_impact_from_feedback ON positioning_feedback;
CREATE TRIGGER trigger_update_profile_impact_from_feedback
  AFTER INSERT ON positioning_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_impact_from_feedback();

-- Function: Create notification for impact score update
CREATE OR REPLACE FUNCTION notify_impact_score_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND NEW.impact_score > 0 THEN
    INSERT INTO notifications (
      user_id,
      notification_type,
      title,
      message,
      entity_type,
      entity_id,
      metadata
    ) VALUES (
      NEW.user_id,
      'impact_score_update',
      'Impact Score Updated',
      'Your positioning feedback earned you ' || NEW.impact_score || ' impact points!',
      'positioning_feedback',
      NEW.id,
      jsonb_build_object('impact_score', NEW.impact_score)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Create notification when feedback impact score is calculated
DROP TRIGGER IF EXISTS trigger_notify_impact_score_update ON positioning_feedback;
CREATE TRIGGER trigger_notify_impact_score_update
  AFTER INSERT ON positioning_feedback
  FOR EACH ROW
  EXECUTE FUNCTION notify_impact_score_update();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE positioning_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS profiles_select_own ON profiles;
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS profiles_select_public ON profiles;
CREATE POLICY profiles_select_public ON profiles
  FOR SELECT USING (true); -- Public profiles are readable

DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS profiles_insert_own ON profiles;
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Posts policies
DROP POLICY IF EXISTS posts_select_public ON posts;
CREATE POLICY posts_select_public ON posts
  FOR SELECT USING (status = 'published'); -- Only published posts are public

DROP POLICY IF EXISTS posts_select_own ON posts;
CREATE POLICY posts_select_own ON posts
  FOR SELECT USING (auth.uid() = user_id); -- Users can see their own drafts

DROP POLICY IF EXISTS posts_insert_authenticated ON posts;
CREATE POLICY posts_insert_authenticated ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS posts_update_own ON posts;
CREATE POLICY posts_update_own ON posts
  FOR UPDATE USING (auth.uid() = user_id);

-- Activity log policies
DROP POLICY IF EXISTS activity_log_insert_authenticated ON activity_log;
CREATE POLICY activity_log_insert_authenticated ON activity_log
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR user_id IS NULL -- Allow anonymous activity
  );

DROP POLICY IF EXISTS activity_log_select_own ON activity_log;
CREATE POLICY activity_log_select_own ON activity_log
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Positioning feedback policies
DROP POLICY IF EXISTS positioning_feedback_insert_authenticated ON positioning_feedback;
CREATE POLICY positioning_feedback_insert_authenticated ON positioning_feedback
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR user_id IS NULL -- Allow anonymous feedback
  );

DROP POLICY IF EXISTS positioning_feedback_select_own ON positioning_feedback;
CREATE POLICY positioning_feedback_select_own ON positioning_feedback
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Notifications policies
DROP POLICY IF EXISTS notifications_select_own ON notifications;
CREATE POLICY notifications_select_own ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS notifications_update_own ON notifications;
CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 8. SQL VIEWS FOR KPIs (All-Cylinder Firing Check)
-- ============================================================================

-- KPI 1: New Users This Week (threshold: > 50)
CREATE OR REPLACE VIEW kpi_new_users_week AS
SELECT COUNT(*) as count
FROM profiles
WHERE created_at > NOW() - INTERVAL '7 days';

-- KPI 2: Actions Completed in Last Hour (threshold: > 100)
CREATE OR REPLACE VIEW kpi_actions_last_hour AS
SELECT COUNT(*) as count
FROM activity_log
WHERE created_at > NOW() - INTERVAL '1 hour';

-- KPI 3: Most Engaged Post of the Day (threshold: total engagement > 100)
CREATE OR REPLACE VIEW kpi_most_engaged_post_today AS
SELECT 
  id,
  title,
  user_id,
  views,
  upvotes,
  (views + upvotes * 2) as total_engagement
FROM posts
WHERE created_at::date = CURRENT_DATE
  AND status = 'published'
ORDER BY total_engagement DESC
LIMIT 1;

-- Combined KPI Health Check View
CREATE OR REPLACE VIEW kpi_health_status AS
SELECT 
  (SELECT count FROM kpi_new_users_week) as new_users_week,
  (SELECT count FROM kpi_actions_last_hour) as actions_last_hour,
  (SELECT COALESCE(total_engagement, 0) FROM kpi_most_engaged_post_today) as top_post_engagement,
  CASE
    WHEN (SELECT count FROM kpi_new_users_week) > 50 
      AND (SELECT count FROM kpi_actions_last_hour) > 100
      AND (SELECT COALESCE(total_engagement, 0) FROM kpi_most_engaged_post_today) > 100
    THEN true
    ELSE false
  END as all_cylinders_firing
;

COMMIT;
