-- =====================================================
-- CLERKSMART ANALYTICS QUERIES
-- Copy and paste these into your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. DAILY CASE METRICS
-- =====================================================

-- Cases completed per day (last 30 days)
SELECT 
  DATE("createdAt") as date,
  COUNT(*) as total_cases_started,
  COUNT(CASE WHEN "isCompleted" = true THEN 1 END) as cases_completed,
  COUNT(CASE WHEN "isCompleted" = false THEN 1 END) as cases_incomplete
FROM cases 
WHERE "createdAt" >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE("createdAt")
ORDER BY date DESC;

-- =====================================================
-- 2. USER METRICS
-- =====================================================

-- Total users and daily new users (last 30 days)
SELECT 
  DATE("createdAt") as date,
  COUNT(*) as new_users,
  SUM(COUNT(*)) OVER (ORDER BY DATE("createdAt")) as cumulative_users
FROM users 
WHERE "createdAt" >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE("createdAt")
ORDER BY date DESC;

-- Total user count (all time)
SELECT COUNT(*) as total_users FROM users;

-- Active users in last 7 days
SELECT COUNT(DISTINCT "userId") as active_users_7d
FROM cases 
WHERE "createdAt" >= CURRENT_DATE - INTERVAL '7 days';

-- Active users in last 30 days
SELECT COUNT(DISTINCT "userId") as active_users_30d
FROM cases 
WHERE "createdAt" >= CURRENT_DATE - INTERVAL '30 days';

-- =====================================================
-- 3. CASE COMPLETION RATE
-- =====================================================

-- Overall completion rate
SELECT 
  COUNT(*) as total_cases,
  COUNT(CASE WHEN "isCompleted" = true THEN 1 END) as completed_cases,
  ROUND(
    (COUNT(CASE WHEN "isCompleted" = true THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
  ) as completion_rate_percent
FROM cases;

-- Completion rate by department
SELECT 
  d.name as department,
  COUNT(*) as total_cases,
  COUNT(CASE WHEN c."isCompleted" = true THEN 1 END) as completed_cases,
  ROUND(
    (COUNT(CASE WHEN c."isCompleted" = true THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
  ) as completion_rate_percent
FROM cases c
JOIN departments d ON c."departmentId" = d.id
GROUP BY d.name
ORDER BY completion_rate_percent DESC;

-- Completion rate over time (last 30 days)
SELECT 
  DATE("createdAt") as date,
  COUNT(*) as total_cases,
  COUNT(CASE WHEN "isCompleted" = true THEN 1 END) as completed_cases,
  ROUND(
    (COUNT(CASE WHEN "isCompleted" = true THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
  ) as completion_rate_percent
FROM cases 
WHERE "createdAt" >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE("createdAt")
ORDER BY date DESC;

-- =====================================================
-- 4. TIME SPENT PER CASE
-- =====================================================

-- Average time spent on completed cases
SELECT 
  AVG(EXTRACT(EPOCH FROM ("completedAt" - "startedAt"))/3600) as avg_hours,
  AVG(EXTRACT(EPOCH FROM ("completedAt" - "startedAt"))/60) as avg_minutes,
  MIN(EXTRACT(EPOCH FROM ("completedAt" - "startedAt"))/60) as min_minutes,
  MAX(EXTRACT(EPOCH FROM ("completedAt" - "startedAt"))/60) as max_minutes
FROM cases 
WHERE "isCompleted" = true AND "completedAt" IS NOT NULL;

-- Time spent by department
SELECT 
  d.name as department,
  AVG(EXTRACT(EPOCH FROM (c."completedAt" - c."startedAt"))/60) as avg_minutes,
  COUNT(*) as completed_cases
FROM cases c
JOIN departments d ON c."departmentId" = d.id
WHERE c."isCompleted" = true AND c."completedAt" IS NOT NULL
GROUP BY d.name
ORDER BY avg_minutes DESC;

-- Time distribution (bins)
WITH time_bins AS (
  SELECT 
    CASE 
      WHEN EXTRACT(EPOCH FROM ("completedAt" - "startedAt"))/60 < 10 THEN '0-10 min'
      WHEN EXTRACT(EPOCH FROM ("completedAt" - "startedAt"))/60 < 20 THEN '10-20 min'
      WHEN EXTRACT(EPOCH FROM ("completedAt" - "startedAt"))/60 < 30 THEN '20-30 min'
      WHEN EXTRACT(EPOCH FROM ("completedAt" - "startedAt"))/60 < 60 THEN '30-60 min'
      ELSE '60+ min'
    END as time_bin,
    CASE 
      WHEN EXTRACT(EPOCH FROM ("completedAt" - "startedAt"))/60 < 10 THEN 1
      WHEN EXTRACT(EPOCH FROM ("completedAt" - "startedAt"))/60 < 20 THEN 2
      WHEN EXTRACT(EPOCH FROM ("completedAt" - "startedAt"))/60 < 30 THEN 3
      WHEN EXTRACT(EPOCH FROM ("completedAt" - "startedAt"))/60 < 60 THEN 4
      ELSE 5
    END as sort_order
  FROM cases 
  WHERE "isCompleted" = true AND "completedAt" IS NOT NULL
)
SELECT 
  time_bin,
  COUNT(*) as case_count
FROM time_bins
GROUP BY time_bin, sort_order
ORDER BY sort_order;

-- =====================================================
-- 5. RETURN USERS
-- =====================================================

-- Users who have completed multiple cases
SELECT 
  "userId",
  COUNT(*) as cases_completed,
  MIN("createdAt") as first_case,
  MAX("createdAt") as last_case
FROM cases 
WHERE "isCompleted" = true
GROUP BY "userId"
HAVING COUNT(*) > 1
ORDER BY cases_completed DESC;

-- Return user rate (users with 2+ cases vs total users)
WITH user_case_counts AS (
  SELECT 
    "userId",
    COUNT(*) as case_count
  FROM cases 
  WHERE "isCompleted" = true
  GROUP BY "userId"
)
SELECT 
  COUNT(*) as total_users_with_cases,
  COUNT(CASE WHEN case_count >= 2 THEN 1 END) as return_users,
  ROUND(
    (COUNT(CASE WHEN case_count >= 2 THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
  ) as return_user_rate_percent
FROM user_case_counts;

-- User engagement levels
WITH user_engagement AS (
  SELECT 
    CASE 
      WHEN case_count = 1 THEN 'One-time users'
      WHEN case_count BETWEEN 2 AND 5 THEN 'Occasional users (2-5 cases)'
      WHEN case_count BETWEEN 6 AND 15 THEN 'Regular users (6-15 cases)'
      WHEN case_count BETWEEN 16 AND 50 THEN 'Active users (16-50 cases)'
      ELSE 'Power users (50+ cases)'
    END as user_category,
    CASE 
      WHEN case_count = 1 THEN 1
      WHEN case_count BETWEEN 2 AND 5 THEN 2
      WHEN case_count BETWEEN 6 AND 15 THEN 3
      WHEN case_count BETWEEN 16 AND 50 THEN 4
      ELSE 5
    END as sort_order
  FROM (
    SELECT "userId", COUNT(*) as case_count
    FROM cases 
    WHERE "isCompleted" = true
    GROUP BY "userId"
  ) user_stats
)
SELECT 
  user_category,
  COUNT(*) as user_count
FROM user_engagement
GROUP BY user_category, sort_order
ORDER BY sort_order;

-- =====================================================
-- 6. PRACTICE VS SIMULATION MODE
-- =====================================================

-- Practice vs simulation usage
SELECT 
  "isPractice",
  COUNT(*) as case_count,
  COUNT(CASE WHEN "isCompleted" = true THEN 1 END) as completed_cases,
  ROUND(
    (COUNT(CASE WHEN "isCompleted" = true THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
  ) as completion_rate_percent
FROM cases 
GROUP BY "isPractice";

-- Practice vs simulation by department
SELECT 
  d.name as department,
  c."isPractice",
  COUNT(*) as case_count,
  ROUND(
    (COUNT(CASE WHEN c."isCompleted" = true THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
  ) as completion_rate_percent
FROM cases c
JOIN departments d ON c."departmentId" = d.id
GROUP BY d.name, c."isPractice"
ORDER BY d.name, c."isPractice";

-- User preference distribution for practice vs simulation
WITH user_preferences AS (
  SELECT 
    "userId",
    COUNT(CASE WHEN "isPractice" = true THEN 1 END) as practice_cases,
    COUNT(CASE WHEN "isPractice" = false THEN 1 END) as simulation_cases,
    CASE 
      WHEN COUNT(CASE WHEN "isPractice" = true THEN 1 END) > COUNT(CASE WHEN "isPractice" = false THEN 1 END) 
      THEN 'Prefers Practice'
      WHEN COUNT(CASE WHEN "isPractice" = false THEN 1 END) > COUNT(CASE WHEN "isPractice" = true THEN 1 END) 
      THEN 'Prefers Simulation'
      ELSE 'Balanced'
    END as preference
  FROM cases 
  WHERE "isCompleted" = true
  GROUP BY "userId"
  HAVING COUNT(*) >= 3
)
SELECT 
  preference,
  COUNT(*) as user_count,
  ROUND(
    (COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM user_preferences)) * 100, 2
  ) as percentage_of_users
FROM user_preferences
GROUP BY preference
ORDER BY 
  CASE preference
    WHEN 'Prefers Practice' THEN 1
    WHEN 'Prefers Simulation' THEN 2
    WHEN 'Balanced' THEN 3
  END;

-- =====================================================
-- 7. DIAGNOSIS ACCURACY
-- =====================================================

-- Overall diagnosis accuracy
SELECT 
  COUNT(*) as total_cases_with_feedback,
  COUNT(CASE WHEN c.diagnosis = f.diagnosis THEN 1 END) as correct_diagnoses,
  ROUND(
    (COUNT(CASE WHEN c.diagnosis = f.diagnosis THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
  ) as accuracy_percent
FROM cases c
JOIN feedback f ON c.id = f."caseId"
WHERE c."isCompleted" = true;

-- Diagnosis accuracy by department
SELECT 
  d.name as department,
  COUNT(*) as total_cases,
  COUNT(CASE WHEN c.diagnosis = f.diagnosis THEN 1 END) as correct_diagnoses,
  ROUND(
    (COUNT(CASE WHEN c.diagnosis = f.diagnosis THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
  ) as accuracy_percent
FROM cases c
JOIN feedback f ON c.id = f."caseId"
JOIN departments d ON c."departmentId" = d.id
WHERE c."isCompleted" = true
GROUP BY d.name
ORDER BY accuracy_percent DESC;

-- Diagnosis accuracy by difficulty level
SELECT 
  "difficultyLevel",
  COUNT(*) as total_cases,
  COUNT(CASE WHEN c.diagnosis = f.diagnosis THEN 1 END) as correct_diagnoses,
  ROUND(
    (COUNT(CASE WHEN c.diagnosis = f.diagnosis THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
  ) as accuracy_percent
FROM cases c
JOIN feedback f ON c.id = f."caseId"
WHERE c."isCompleted" = true
GROUP BY "difficultyLevel"
ORDER BY 
  CASE "difficultyLevel"
    WHEN 'standard' THEN 1
    WHEN 'intermediate' THEN 2
    WHEN 'difficult' THEN 3
    ELSE 4
  END;

-- =====================================================
-- 8. CASE SAVING PATTERNS
-- =====================================================

-- Cases saved (completed cases with isVisible = true)
SELECT 
  COUNT(*) as total_completed_cases,
  COUNT(CASE WHEN c."isVisible" = true THEN 1 END) as saved_cases,
  ROUND(
    (COUNT(CASE WHEN c."isVisible" = true THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
  ) as save_rate_percent
FROM cases c
WHERE c."isCompleted" = true;

-- Save rate by department
SELECT 
  d.name as department,
  COUNT(*) as completed_cases,
  COUNT(CASE WHEN c."isVisible" = true THEN 1 END) as saved_cases,
  ROUND(
    (COUNT(CASE WHEN c."isVisible" = true THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
  ) as save_rate_percent
FROM cases c
JOIN departments d ON c."departmentId" = d.id
WHERE c."isCompleted" = true
GROUP BY d.name
ORDER BY save_rate_percent DESC;

-- Save rate over time (last 30 days)
SELECT 
  DATE(c."createdAt") as date,
  COUNT(*) as completed_cases,
  COUNT(CASE WHEN c."isVisible" = true THEN 1 END) as saved_cases,
  ROUND(
    (COUNT(CASE WHEN c."isVisible" = true THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
  ) as save_rate_percent
FROM cases c
WHERE c."isCompleted" = true 
  AND c."createdAt" >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(c."createdAt")
ORDER BY date DESC;

-- Users who save cases vs don't
SELECT 
  CASE 
    WHEN saved_cases > 0 THEN 'Saves cases'
    ELSE 'Does not save cases'
  END as user_type,
  COUNT(*) as user_count
FROM (
  SELECT 
    c."userId",
    COUNT(CASE WHEN c."isVisible" = true THEN 1 END) as saved_cases
  FROM cases c
  WHERE c."isCompleted" = true
  GROUP BY c."userId"
) user_save_stats
GROUP BY user_type;

-- =====================================================
-- 9. PWA INSTALLATION TRACKING
-- =====================================================

-- Overall PWA installation rate
WITH user_stats AS (
  SELECT 
    COUNT(*) as total_users,
    COUNT("pwaInstalledAt") as pwa_installed_users
  FROM users
)
SELECT 
  total_users,
  pwa_installed_users,
  ROUND(
    (pwa_installed_users::DECIMAL / total_users) * 100, 2
  ) as pwa_installation_rate_percent
FROM user_stats;

-- PWA installations over time (last 30 days)
WITH daily_installations AS (
  SELECT 
    DATE("pwaInstalledAt") as install_date,
    COUNT(*) as daily_installations
  FROM users 
  WHERE "pwaInstalledAt" IS NOT NULL 
    AND "pwaInstalledAt" >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY DATE("pwaInstalledAt")
)
SELECT 
  install_date as date,
  daily_installations as installations,
  SUM(daily_installations) OVER (ORDER BY install_date) as cumulative_installations
FROM daily_installations
ORDER BY install_date DESC;

-- PWA installation by source
WITH installation_sources AS (
  SELECT 
    "pwaInstallSource",
    COUNT(*) as source_count
  FROM users 
  WHERE "pwaInstalledAt" IS NOT NULL
  GROUP BY "pwaInstallSource"
),
total_installations AS (
  SELECT COUNT(*) as total_installed
  FROM users 
  WHERE "pwaInstalledAt" IS NOT NULL
)
SELECT 
  ins."pwaInstallSource",
  ins.source_count as installation_count,
  ROUND(
    (ins.source_count::DECIMAL / ti.total_installed) * 100, 2
  ) as percentage_of_installations
FROM installation_sources ins
CROSS JOIN total_installations ti
ORDER BY ins.source_count DESC;

-- PWA installation vs engagement correlation
WITH user_engagement AS (
  SELECT 
    u.id,
    u."pwaInstalledAt",
    CASE 
      WHEN u."pwaInstalledAt" IS NOT NULL THEN 'PWA Installed'
      ELSE 'PWA Not Installed'
    END as installation_status,
    COALESCE(case_stats.case_count, 0) as case_count,
    COALESCE(completed_stats.completed_count, 0) as completed_count
  FROM users u
  LEFT JOIN (
    SELECT "userId", COUNT(*) as case_count
    FROM cases 
    GROUP BY "userId"
  ) case_stats ON u.id = case_stats."userId"
  LEFT JOIN (
    SELECT "userId", COUNT(*) as completed_count
    FROM cases 
    WHERE "isCompleted" = true
    GROUP BY "userId"
  ) completed_stats ON u.id = completed_stats."userId"
)
SELECT 
  installation_status,
  COUNT(*) as user_count,
  ROUND(AVG(case_count), 2) as avg_cases_per_user,
  ROUND(AVG(completed_count), 2) as avg_completed_cases_per_user
FROM user_engagement
GROUP BY installation_status;

-- =====================================================
-- 10. COMBINED DASHBOARD QUERY
-- =====================================================

-- Daily summary dashboard (last 7 days)
SELECT 
  DATE(c."createdAt") as date,
  COUNT(DISTINCT c."userId") as active_users,
  COUNT(*) as total_cases,
  COUNT(CASE WHEN c."isCompleted" = true THEN 1 END) as completed_cases,
  ROUND(
    (COUNT(CASE WHEN c."isCompleted" = true THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
  ) as completion_rate_percent,
  COUNT(CASE WHEN c."isPractice" = true THEN 1 END) as practice_cases,
  COUNT(CASE WHEN c."isPractice" = false THEN 1 END) as simulation_cases,
  COUNT(CASE WHEN c."isVisible" = true THEN 1 END) as saved_cases,
  ROUND(
    (COUNT(CASE WHEN c.diagnosis = f.diagnosis THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
  ) as diagnosis_accuracy_percent
FROM cases c
LEFT JOIN feedback f ON c.id = f."caseId"
WHERE c."createdAt" >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(c."createdAt")
ORDER BY date DESC;
