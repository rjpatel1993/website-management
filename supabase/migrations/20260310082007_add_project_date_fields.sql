/*
  # Add Project Date Fields

  ## Overview
  Add domain registration date and website launch date tracking to projects table.

  ## Changes

  1. Modified Tables - projects
    - Add `domain_registered_date` (date) - Track when the domain was registered
    - Rename existing `launch_date` field (already exists, just documenting)
    
  ## Notes
  - Both dates are optional (nullable) as they may not be known initially
  - Useful for tracking project timelines and domain renewal dates
  - Website launch date (launch_date) already exists in the schema
*/

-- Add domain registration date to projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'domain_registered_date'
  ) THEN
    ALTER TABLE projects ADD COLUMN domain_registered_date date;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_domain_registered_date ON projects(domain_registered_date);
CREATE INDEX IF NOT EXISTS idx_projects_launch_date ON projects(launch_date);