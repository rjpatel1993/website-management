/*
  # Add Team Collaboration Features

  ## Changes
  
  1. New Tables
    - `users` - Team member profiles
    - `industries` - Industry types with default services
    - `service_pages` - Track service pages per project
    - `area_pages` - Track area/suburb pages per project  
    - `activity_log` - Track all changes
  
  2. Modified Tables
    - `projects` - Add industry_id, assigned_to, created_by, launch_date
    - `checklist_items` - Rename to project_tasks and add assignment fields
  
  3. Security
    - Enable RLS on all new tables
    - Add policies for team collaboration
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create industries table
CREATE TABLE IF NOT EXISTS industries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  default_services jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE industries ENABLE ROW LEVEL SECURITY;

-- Create service_pages table
CREATE TABLE IF NOT EXISTS service_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  service_name text NOT NULL,
  slug text NOT NULL,
  is_completed boolean DEFAULT false,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE service_pages ENABLE ROW LEVEL SECURITY;

-- Create area_pages table
CREATE TABLE IF NOT EXISTS area_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  area_name text NOT NULL,
  slug text NOT NULL,
  is_completed boolean DEFAULT false,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE area_pages ENABLE ROW LEVEL SECURITY;

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('project', 'task', 'service_page', 'area_page')),
  entity_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Add new columns to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'industry_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN industry_id uuid REFERENCES industries(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE projects ADD COLUMN assigned_to uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE projects ADD COLUMN created_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'launch_date'
  ) THEN
    ALTER TABLE projects ADD COLUMN launch_date date;
  END IF;
END $$;

-- Add new columns to checklist_items (will become project_tasks)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklist_items' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE checklist_items ADD COLUMN assigned_to uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklist_items' AND column_name = 'completed_by'
  ) THEN
    ALTER TABLE checklist_items ADD COLUMN completed_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklist_items' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE checklist_items ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_industry ON projects(industry_id);
CREATE INDEX IF NOT EXISTS idx_projects_assigned ON projects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_checklist_items_assigned ON checklist_items(assigned_to);
CREATE INDEX IF NOT EXISTS idx_service_pages_project ON service_pages(project_id);
CREATE INDEX IF NOT EXISTS idx_area_pages_project ON area_pages(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_project ON activity_log(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);

-- RLS Policies for users
CREATE POLICY "Team members can view all team members"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for industries
CREATE POLICY "Team members can view industries"
  ON industries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team members can manage industries"
  ON industries FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for service_pages
CREATE POLICY "Team members can view service pages"
  ON service_pages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team members can manage service pages"
  ON service_pages FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for area_pages
CREATE POLICY "Team members can view area pages"
  ON area_pages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team members can manage area pages"
  ON area_pages FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for activity_log
CREATE POLICY "Team members can view activity"
  ON activity_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team members can log activity"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default industries
INSERT INTO industries (name, default_services) VALUES
  ('Pest Control', '["Termite Control", "Rodent Removal", "Bed Bug Treatment", "Cockroach Control", "Ant Removal", "Spider Control", "Wasp Removal", "General Pest Control"]'::jsonb),
  ('Possum Removal', '["Possum Removal", "Possum Proofing", "Roof Inspection", "Emergency Possum Removal", "Humane Possum Relocation"]'::jsonb),
  ('Cleaning', '["House Cleaning", "Office Cleaning", "Carpet Cleaning", "Window Cleaning", "End of Lease Cleaning", "Deep Cleaning", "Commercial Cleaning"]'::jsonb),
  ('Water Damage', '["Water Extraction", "Flood Damage Restoration", "Mold Remediation", "Structural Drying", "Emergency Water Removal", "Leak Detection"]'::jsonb)
ON CONFLICT (name) DO NOTHING;