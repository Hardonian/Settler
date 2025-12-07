-- Migration: seed_demo_data
-- Created: 2025-11-30
-- Description: Seed realistic demo data for ecosystem tables
-- Note: This is clearly demo/sample data for development and demonstration purposes

BEGIN;

-- ============================================================================
-- DEMO DATA: Profiles
-- ============================================================================
-- Note: These profiles reference auth.users which may not exist in demo
-- In production, profiles are created via Server Actions during sign-up
-- For demo purposes, we'll create sample profiles that can be linked later

-- Insert demo profiles (only if they don't already exist)
-- In a real scenario, these would be created via the sign-up flow
INSERT INTO profiles (id, user_id, email, name, bio, role, impact_score, created_at)
SELECT 
  gen_random_uuid(),
  gen_random_uuid(),
  'demo.user' || generate_series || '@example.com',
  CASE (generate_series % 5)
    WHEN 0 THEN 'Alex Developer'
    WHEN 1 THEN 'Sam Engineer'
    WHEN 2 THEN 'Jordan Designer'
    WHEN 3 THEN 'Casey Product'
    WHEN 4 THEN 'Taylor DevOps'
  END,
  'Demo community member interested in financial reconciliation automation',
  CASE (generate_series % 3)
    WHEN 0 THEN 'community_member'
    WHEN 1 THEN 'contributor'
    WHEN 2 THEN 'maintainer'
  END,
  (random() * 100)::integer,
  NOW() - (random() * INTERVAL '30 days')
FROM generate_series(1, 75)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DEMO DATA: Posts
-- ============================================================================

-- Get existing profile IDs for foreign key references
DO $$
DECLARE
  profile_ids UUID[];
  profile_id UUID;
  i INTEGER;
BEGIN
  -- Get array of profile IDs
  SELECT ARRAY_AGG(id) INTO profile_ids FROM profiles LIMIT 10;
  
  -- Create demo posts
  FOR i IN 1..25 LOOP
    profile_id := profile_ids[1 + (i % array_length(profile_ids, 1))];
    
    INSERT INTO posts (
      user_id,
      title,
      content,
      post_type,
      status,
      views,
      upvotes,
      downvotes,
      comments_count,
      created_at
    ) VALUES (
      profile_id,
      CASE (i % 5)
        WHEN 0 THEN 'How to integrate Settler with Stripe webhooks'
        WHEN 1 THEN 'Best practices for reconciliation accuracy'
        WHEN 2 THEN 'QuickBooks adapter setup guide'
        WHEN 3 THEN 'Handling multi-currency transactions'
        WHEN 4 THEN 'Real-time dashboard implementation tips'
      END,
      'This is a demo post showcasing community engagement. In a real scenario, this would contain valuable content from community members sharing their experiences, questions, and solutions.',
      CASE (i % 4)
        WHEN 0 THEN 'post'
        WHEN 1 THEN 'question'
        WHEN 2 THEN 'announcement'
        WHEN 3 THEN 'answer'
      END,
      'published',
      (random() * 500 + 50)::integer,
      (random() * 50 + 5)::integer,
      (random() * 5)::integer,
      (random() * 20)::integer,
      NOW() - (random() * INTERVAL '7 days')
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ============================================================================
-- DEMO DATA: Activity Log
-- ============================================================================

DO $$
DECLARE
  profile_ids UUID[];
  post_ids UUID[];
  profile_id UUID;
  post_id UUID;
  activity_types TEXT[] := ARRAY['signup', 'login', 'post_view', 'post_upvote', 'scroll', 'click', 'feedback_submit'];
  i INTEGER;
BEGIN
  -- Get arrays of IDs
  SELECT ARRAY_AGG(id) INTO profile_ids FROM profiles LIMIT 10;
  SELECT ARRAY_AGG(id) INTO post_ids FROM posts LIMIT 10;
  
  -- Create demo activity logs (last 24 hours, with higher concentration in last hour)
  FOR i IN 1..150 LOOP
    profile_id := profile_ids[1 + (i % array_length(profile_ids, 1))];
    post_id := post_ids[1 + (i % array_length(post_ids, 1))];
    
    INSERT INTO activity_log (
      user_id,
      activity_type,
      entity_type,
      entity_id,
      metadata,
      created_at
    ) VALUES (
      CASE WHEN random() > 0.3 THEN profile_id ELSE NULL END, -- 30% anonymous
      activity_types[1 + (random() * array_length(activity_types, 1))::integer],
      CASE (i % 3)
        WHEN 0 THEN 'post'
        WHEN 1 THEN 'profile'
        WHEN 2 THEN 'page'
      END,
      CASE WHEN random() > 0.5 THEN post_id ELSE NULL END,
      jsonb_build_object(
        'source', 'web',
        'timestamp', NOW()
      ),
      -- More recent activities (last hour gets 60% of entries)
      CASE 
        WHEN random() < 0.6 THEN NOW() - (random() * INTERVAL '1 hour')
        ELSE NOW() - (random() * INTERVAL '24 hours')
      END
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ============================================================================
-- DEMO DATA: Positioning Feedback
-- ============================================================================

DO $$
DECLARE
  profile_ids UUID[];
  profile_id UUID;
  five_word_vps TEXT[] := ARRAY[
    'Automate financial reconciliation instantly',
    'One API all platforms real-time',
    'Developer-first reconciliation as service',
    'Connect Stripe Shopify QuickBooks seamlessly',
    'Reconcile transactions with confidence scoring'
  ];
  persona_pains TEXT[] := ARRAY[
    'Developers struggle with manual reconciliation across multiple payment platforms',
    'Finance teams waste hours matching transactions between systems',
    'SaaS companies need reliable reconciliation without complex integrations',
    'E-commerce businesses require real-time visibility into payment discrepancies',
    'Startups need affordable reconciliation without building custom solutions'
  ];
  i INTEGER;
BEGIN
  SELECT ARRAY_AGG(id) INTO profile_ids FROM profiles LIMIT 10;
  
  FOR i IN 1..20 LOOP
    profile_id := profile_ids[1 + (i % array_length(profile_ids, 1))];
    
    INSERT INTO positioning_feedback (
      user_id,
      five_word_vp,
      target_persona_pain,
      clarity_rating,
      feedback_text,
      created_at
    ) VALUES (
      CASE WHEN random() > 0.4 THEN profile_id ELSE NULL END, -- 40% anonymous
      five_word_vps[1 + (random() * array_length(five_word_vps, 1))::integer],
      persona_pains[1 + (random() * array_length(persona_pains, 1))::integer],
      (random() * 5 + 5)::integer, -- Rating between 5-10
      CASE 
        WHEN random() > 0.5 THEN 'This is helpful feedback that would help improve our positioning clarity. In a real scenario, this would contain specific, actionable insights from community members.'
        ELSE NULL
      END,
      NOW() - (random() * INTERVAL '14 days')
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ============================================================================
-- DEMO DATA: Notifications
-- ============================================================================

DO $$
DECLARE
  profile_ids UUID[];
  feedback_ids UUID[];
  profile_id UUID;
  feedback_id UUID;
  i INTEGER;
BEGIN
  SELECT ARRAY_AGG(id) INTO profile_ids FROM profiles LIMIT 10;
  SELECT ARRAY_AGG(id) INTO feedback_ids FROM positioning_feedback LIMIT 10;
  
  FOR i IN 1..30 LOOP
    profile_id := profile_ids[1 + (i % array_length(profile_ids, 1))];
    feedback_id := feedback_ids[1 + (i % array_length(feedback_ids, 1))];
    
    INSERT INTO notifications (
      user_id,
      notification_type,
      title,
      message,
      entity_type,
      entity_id,
      read,
      created_at
    ) VALUES (
      profile_id,
      CASE (i % 3)
        WHEN 0 THEN 'impact_score_update'
        WHEN 1 THEN 'new_post'
        WHEN 2 THEN 'upvote'
      END,
      CASE (i % 3)
        WHEN 0 THEN 'Impact Score Updated'
        WHEN 1 THEN 'New Post Published'
        WHEN 2 THEN 'Your Post Got Upvoted'
      END,
      CASE (i % 3)
        WHEN 0 THEN 'Your positioning feedback earned you ' || (random() * 50 + 10)::integer || ' impact points!'
        WHEN 1 THEN 'A new post was published in the community'
        WHEN 2 THEN 'Someone upvoted your recent post'
      END,
      CASE (i % 3)
        WHEN 0 THEN 'positioning_feedback'
        WHEN 1 THEN 'post'
        WHEN 2 THEN 'post'
      END,
      CASE (i % 3)
        WHEN 0 THEN feedback_id
        ELSE NULL
      END,
      random() > 0.6, -- 40% read
      NOW() - (random() * INTERVAL '7 days')
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

COMMIT;
