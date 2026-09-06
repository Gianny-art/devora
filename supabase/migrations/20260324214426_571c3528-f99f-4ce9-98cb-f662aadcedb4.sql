-- Allow project creators to delete their projects
CREATE POLICY "Creator can delete projects"
ON public.projects
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Allow project members to update project_businesses (for sharing audits/sites)
CREATE POLICY "Members can update project businesses"
ON public.project_businesses
FOR UPDATE
TO authenticated
USING (is_project_member(auth.uid(), project_id));

-- Allow members to update messages (for read_by)
CREATE POLICY "Members can update messages read_by"
ON public.project_messages
FOR UPDATE
TO authenticated
USING (is_project_member(auth.uid(), project_id));

-- Allow project creators to delete members
CREATE POLICY "Creator can remove members"
ON public.project_members
FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_members.project_id AND projects.created_by = auth.uid()));

-- Allow generated_sites update by owner or project members sharing
CREATE POLICY "Users can update own sites"
ON public.generated_sites
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
