/*
  # Add Automatic Page Count Triggers

  ## Overview
  This migration adds database triggers to automatically keep service_pages_count 
  and area_pages_count in sync with actual page data. It also backfills existing counts.

  ## Changes
  
  1. Trigger Functions Created
    - `update_service_pages_count()` - Updates service_pages_count when service_pages change
    - `update_area_pages_count()` - Updates area_pages_count when area_pages change
    
  2. Triggers Created
    - `trigger_update_service_pages_count` - Fires on INSERT/UPDATE/DELETE of service_pages
    - `trigger_update_area_pages_count` - Fires on INSERT/UPDATE/DELETE of area_pages
    
  3. Data Backfill
    - Updates all existing projects with correct counts from service_pages table
    - Updates all existing projects with correct counts from area_pages table

  ## Notes
  - Triggers ensure counts stay accurate automatically
  - No manual count updates needed going forward
  - Backfill ensures existing data is corrected
*/

-- Function to update service_pages_count
CREATE OR REPLACE FUNCTION update_service_pages_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    UPDATE projects 
    SET service_pages_count = (
      SELECT COUNT(*) FROM service_pages WHERE project_id = OLD.project_id
    )
    WHERE id = OLD.project_id;
    RETURN OLD;
  ELSE
    UPDATE projects 
    SET service_pages_count = (
      SELECT COUNT(*) FROM service_pages WHERE project_id = NEW.project_id
    )
    WHERE id = NEW.project_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update area_pages_count
CREATE OR REPLACE FUNCTION update_area_pages_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    UPDATE projects 
    SET area_pages_count = (
      SELECT COUNT(*) FROM area_pages WHERE project_id = OLD.project_id
    )
    WHERE id = OLD.project_id;
    RETURN OLD;
  ELSE
    UPDATE projects 
    SET area_pages_count = (
      SELECT COUNT(*) FROM area_pages WHERE project_id = NEW.project_id
    )
    WHERE id = NEW.project_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for service_pages
DROP TRIGGER IF EXISTS trigger_update_service_pages_count ON service_pages;
CREATE TRIGGER trigger_update_service_pages_count
  AFTER INSERT OR UPDATE OR DELETE ON service_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_service_pages_count();

-- Create trigger for area_pages
DROP TRIGGER IF EXISTS trigger_update_area_pages_count ON area_pages;
CREATE TRIGGER trigger_update_area_pages_count
  AFTER INSERT OR UPDATE OR DELETE ON area_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_area_pages_count();

-- Backfill existing service_pages_count
UPDATE projects p
SET service_pages_count = (
  SELECT COUNT(*) 
  FROM service_pages sp 
  WHERE sp.project_id = p.id
);

-- Backfill existing area_pages_count
UPDATE projects p
SET area_pages_count = (
  SELECT COUNT(*) 
  FROM area_pages ap 
  WHERE ap.project_id = p.id
);