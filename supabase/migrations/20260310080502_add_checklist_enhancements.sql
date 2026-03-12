/*
  # Add Checklist Enhancement Features

  ## Overview
  This migration adds enhanced checklist management features including due dates, priorities,
  comments, categories, and template improvements for better organization and collaboration.

  ## Changes

  1. New Tables
    - `checklist_categories` - Manage custom checklist categories with colors and ordering
    - `checklist_item_comments` - Add threaded comments to checklist items for collaboration

  2. Modified Tables - checklist_items
    - Add `due_date` (timestamptz) - Set deadlines for tasks
    - Add `priority` (text) - High/Medium/Low priority levels
    - Add `is_active` (boolean) - Soft delete/archive capability

  3. Modified Tables - checklist_templates
    - Add `industry_id` (uuid) - Link templates to specific industries
    - Add `color` (text) - Visual categorization with hex colors
    - Add `is_active` (boolean) - Enable/disable templates

  4. Security
    - Enable RLS on all new tables
    - Add policies for authenticated team members to collaborate
    - Restrict comment editing to comment authors

  5. Indexes
    - Add performance indexes for due dates, priorities, and foreign keys
    - Add indexes for efficient querying of comments and categories

  ## Notes
  - Priority values: 'high', 'medium', 'low' (nullable for backward compatibility)
  - All existing checklist items remain unchanged (nullable fields)
  - Categories are optional and can be created as needed
  - Comments support real-time collaboration between team members
*/

-- Create checklist_categories table
CREATE TABLE IF NOT EXISTS checklist_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  color text DEFAULT '#6366f1',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE checklist_categories ENABLE ROW LEVEL SECURITY;

-- Create checklist_item_comments table
CREATE TABLE IF NOT EXISTS checklist_item_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_item_id uuid REFERENCES checklist_items(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  comment_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE checklist_item_comments ENABLE ROW LEVEL SECURITY;

-- Add new columns to checklist_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklist_items' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE checklist_items ADD COLUMN due_date timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklist_items' AND column_name = 'priority'
  ) THEN
    ALTER TABLE checklist_items ADD COLUMN priority text CHECK (priority IN ('high', 'medium', 'low'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklist_items' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE checklist_items ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Add new columns to checklist_templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklist_templates' AND column_name = 'industry_id'
  ) THEN
    ALTER TABLE checklist_templates ADD COLUMN industry_id uuid REFERENCES industries(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklist_templates' AND column_name = 'color'
  ) THEN
    ALTER TABLE checklist_templates ADD COLUMN color text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklist_templates' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE checklist_templates ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_checklist_items_due_date ON checklist_items(due_date);
CREATE INDEX IF NOT EXISTS idx_checklist_items_priority ON checklist_items(priority);
CREATE INDEX IF NOT EXISTS idx_checklist_items_is_active ON checklist_items(is_active);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_industry ON checklist_templates(industry_id);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_is_active ON checklist_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_comments_checklist_item ON checklist_item_comments(checklist_item_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON checklist_item_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON checklist_item_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_order ON checklist_categories(order_index);

-- RLS Policies for checklist_categories
CREATE POLICY "Team members can view categories"
  ON checklist_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team members can create categories"
  ON checklist_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Team members can update categories"
  ON checklist_categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Team members can delete categories"
  ON checklist_categories FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for checklist_item_comments
CREATE POLICY "Team members can view comments"
  ON checklist_item_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team members can create comments"
  ON checklist_item_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Comment authors can update own comments"
  ON checklist_item_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Comment authors can delete own comments"
  ON checklist_item_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert default checklist categories
INSERT INTO checklist_categories (name, color, order_index) VALUES
  ('Pre-Launch', '#ef4444', 1),
  ('Content', '#f59e0b', 2),
  ('Technical', '#3b82f6', 3),
  ('Marketing', '#8b5cf6', 4),
  ('Post-Launch', '#10b981', 5)
ON CONFLICT (name) DO NOTHING;