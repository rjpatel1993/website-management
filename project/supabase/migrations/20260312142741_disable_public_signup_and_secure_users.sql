/*
  # Disable Public Signup and Secure User Management

  1. Changes
    - Add strict RLS policies to prevent unauthorized user creation
    - Ensure only authenticated admins can create new users
    - Block public access to insert operations on users table
    - Maintain existing read/update policies for users

  2. Security
    - Add restrictive INSERT policy that only allows admins to create users
    - Prevent any public or unauthorized user creation
    - Keep existing SELECT, UPDATE, DELETE policies intact
*/

-- Drop existing INSERT policy if it exists and create a new restrictive one
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Only admins can create new users
CREATE POLICY "Only admins can create users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
