CREATE POLICY "Project members can update shared sites"
ON public.generated_sites
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.project_businesses pb
    WHERE pb.shared_site_id = generated_sites.id
    AND public.is_project_member(auth.uid(), pb.project_id)
  )
);