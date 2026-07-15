/*
# Fix Projects RLS Policy for INSERT

The current INSERT policy only allows users to create projects where user_id matches auth.uid().
This is too restrictive - admin/manager roles should be able to create projects for the team.

## Changes
- UPDATE projects_insert policy to allow admin/manager to create any project
- Regular users can still only create their own projects

## Security
- Maintains ownership tracking via user_id
- Allows privileged roles to create projects
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "projects_insert" ON projects;

-- Create new INSERT policy that allows admin/manager to insert any project
CREATE POLICY "projects_insert" ON projects FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('super_admin', 'admin', 'manager')
  )
);
