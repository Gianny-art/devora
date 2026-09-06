
-- Add enhanced chat columns to project_messages
ALTER TABLE public.project_messages 
  ADD COLUMN IF NOT EXISTS reply_to uuid REFERENCES public.project_messages(id),
  ADD COLUMN IF NOT EXISTS is_important boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_type text,
  ADD COLUMN IF NOT EXISTS voice_url text,
  ADD COLUMN IF NOT EXISTS read_by uuid[] NOT NULL DEFAULT '{}';

-- Add shared_audit and shared_site columns to project_businesses
ALTER TABLE public.project_businesses
  ADD COLUMN IF NOT EXISTS shared_audit_id uuid REFERENCES public.audits(id),
  ADD COLUMN IF NOT EXISTS shared_site_id uuid REFERENCES public.generated_sites(id);

-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true) ON CONFLICT DO NOTHING;

-- RLS for chat-attachments bucket
CREATE POLICY "Authenticated users can upload chat attachments" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chat-attachments');
CREATE POLICY "Anyone can view chat attachments" ON storage.objects FOR SELECT USING (bucket_id = 'chat-attachments');

-- Function to notify on new project message
CREATE OR REPLACE FUNCTION public.notify_project_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  SELECT pm.user_id, 'Nouveau message', 
    'Nouveau message dans le projet ' || p.name,
    'message'
  FROM public.project_members pm
  JOIN public.projects p ON p.id = NEW.project_id
  WHERE pm.project_id = NEW.project_id AND pm.user_id != NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_project_message_insert
AFTER INSERT ON public.project_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_project_message();

-- Function to notify on collaboration request
CREATE OR REPLACE FUNCTION public.notify_collab_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name text;
BEGIN
  SELECT COALESCE(full_name, email, 'Quelqu''un') INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (NEW.receiver_id, 'Demande de collaboration', sender_name || ' vous a envoyé une demande de collaboration', 'collab_request');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_collab_request_insert
AFTER INSERT ON public.collaboration_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_collab_request();
