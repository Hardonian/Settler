-- Script to check and remove duplicate indexes and policies
-- Run this to clean up any duplicates before migrations

-- Check for duplicate indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    COUNT(*) as count
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY schemaname, tablename, indexname
HAVING COUNT(*) > 1;

-- Check for duplicate policies
SELECT 
    schemaname,
    tablename,
    policyname,
    COUNT(*) as count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename, policyname
HAVING COUNT(*) > 1;
