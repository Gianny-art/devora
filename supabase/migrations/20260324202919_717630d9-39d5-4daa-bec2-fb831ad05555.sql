
-- Fix projects SELECT policy to also allow creator to see the project
DROP POLICY IF EXISTS "Members can view projects" ON public.projects;
CREATE POLICY "Members can view projects" ON public.projects
FOR SELECT TO authenticated
USING (is_project_member(auth.uid(), id) OR auth.uid() = created_by);

-- Fix project_members INSERT policy (the old one had a bug with self-referencing project_id)
DROP POLICY IF EXISTS "Project creator can add members" ON public.project_members;
CREATE POLICY "Project creator can add members" ON public.project_members
FOR INSERT TO authenticated
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_members.project_id
    AND projects.created_by = auth.uid()
  ))
  OR (auth.uid() = user_id)
);
