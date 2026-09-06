
-- Add profile fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Make profiles searchable by other authenticated users (for collaboration search)
CREATE POLICY "Authenticated users can search profiles" ON public.profiles
FOR SELECT TO authenticated USING (true);

-- Drop the old restrictive select policy
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

-- Avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Users can upload own avatar" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatar" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'avatars');

-- Collaboration requests
CREATE TABLE public.collaboration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);
ALTER TABLE public.collaboration_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own collab requests" ON public.collaboration_requests
FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send collab requests" ON public.collaboration_requests
FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received requests" ON public.collaboration_requests
FOR UPDATE TO authenticated USING (auth.uid() = receiver_id);

-- Projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Project members
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Security definer function to check project membership
CREATE OR REPLACE FUNCTION public.is_project_member(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.project_members WHERE user_id = _user_id AND project_id = _project_id)
$$;

CREATE POLICY "Members can view projects" ON public.projects
FOR SELECT TO authenticated USING (public.is_project_member(auth.uid(), id));

CREATE POLICY "Authenticated can create projects" ON public.projects
FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Members can update projects" ON public.projects
FOR UPDATE TO authenticated USING (public.is_project_member(auth.uid(), id));

CREATE POLICY "Members can view members" ON public.project_members
FOR SELECT TO authenticated USING (public.is_project_member(auth.uid(), project_id));

CREATE POLICY "Project creator can add members" ON public.project_members
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = project_members.project_id AND user_id = auth.uid() AND role = 'owner')
  OR auth.uid() = user_id
);

-- Project businesses (link leads to projects)
CREATE TABLE public.project_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, lead_id)
);
ALTER TABLE public.project_businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view project businesses" ON public.project_businesses
FOR SELECT TO authenticated USING (public.is_project_member(auth.uid(), project_id));

CREATE POLICY "Members can add businesses" ON public.project_businesses
FOR INSERT TO authenticated WITH CHECK (public.is_project_member(auth.uid(), project_id));

CREATE POLICY "Members can remove businesses" ON public.project_businesses
FOR DELETE TO authenticated USING (public.is_project_member(auth.uid(), project_id));

-- Project chat messages
CREATE TABLE public.project_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view messages" ON public.project_messages
FOR SELECT TO authenticated USING (public.is_project_member(auth.uid(), project_id));

CREATE POLICY "Members can send messages" ON public.project_messages
FOR INSERT TO authenticated WITH CHECK (public.is_project_member(auth.uid(), project_id) AND auth.uid() = user_id);

-- Enable realtime for chat and collab requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collaboration_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
