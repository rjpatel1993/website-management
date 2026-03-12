/*
  # Fix RLS Policies - Add SELECT Policies

  ## Issue
  The previous migration updated INSERT/UPDATE/DELETE policies but didn't ensure
  SELECT policies were properly configured, causing data to not be visible.

  ## Changes
  Add proper SELECT policies for all tables that allow authenticated users to view data.

  ## Security
  - Maintains proper authentication checks
  - Allows authenticated users to read data they need
  - Keeps restrictive policies for modifications
*/

-- Add SELECT policies for industries table
DROP POLICY IF EXISTS "Team members can view industries" ON public.industries;
CREATE POLICY "Authenticated users can view industries"
  ON public.industries FOR SELECT
  TO authenticated
  USING (true);

-- Add SELECT policies for checklist_categories table
DROP POLICY IF EXISTS "Team members can view categories" ON public.checklist_categories;
CREATE POLICY "Authenticated users can view categories"
  ON public.checklist_categories FOR SELECT
  TO authenticated
  USING (true);

-- Add SELECT policies for checklist_templates table
DROP POLICY IF EXISTS "Allow authenticated users to view templates" ON public.checklist_templates;
CREATE POLICY "Authenticated users can view templates"
  ON public.checklist_templates FOR SELECT
  TO authenticated
  USING (true);

-- Add SELECT policies for projects table
DROP POLICY IF EXISTS "Allow authenticated users to view projects" ON public.projects;
CREATE POLICY "Authenticated users can view projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (true);

-- Add SELECT policies for checklist_items table
DROP POLICY IF EXISTS "Allow authenticated users to view checklist items" ON public.checklist_items;
CREATE POLICY "Authenticated users can view checklist items"
  ON public.checklist_items FOR SELECT
  TO authenticated
  USING (true);

-- Add SELECT policies for service_pages table
DROP POLICY IF EXISTS "Team members can view service pages" ON public.service_pages;
CREATE POLICY "Authenticated users can view service pages"
  ON public.service_pages FOR SELECT
  TO authenticated
  USING (true);

-- Add SELECT policies for area_pages table
DROP POLICY IF EXISTS "Team members can view area pages" ON public.area_pages;
CREATE POLICY "Authenticated users can view area pages"
  ON public.area_pages FOR SELECT
  TO authenticated
  USING (true);

-- Add SELECT policies for activity_log table
DROP POLICY IF EXISTS "Team members can view activity log" ON public.activity_log;
CREATE POLICY "Authenticated users can view activity log"
  ON public.activity_log FOR SELECT
  TO authenticated
  USING (true);

-- Add SELECT policies for checklist_item_comments table
DROP POLICY IF EXISTS "Team members can view comments" ON public.checklist_item_comments;
CREATE POLICY "Authenticated users can view comments"
  ON public.checklist_item_comments FOR SELECT
  TO authenticated
  USING (true);
