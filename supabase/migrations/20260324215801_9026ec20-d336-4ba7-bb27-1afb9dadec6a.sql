-- Fix notify_collab_request to handle null profiles
CREATE OR REPLACE FUNCTION public.notify_collab_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sender_name text;
BEGIN
  SELECT COALESCE(full_name, email, 'Quelqu''un') INTO sender_name 
  FROM public.profiles WHERE id = NEW.sender_id;
  
  IF sender_name IS NULL THEN
    sender_name := 'Un utilisateur';
  END IF;
  
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (NEW.receiver_id, 'Demande de collaboration', sender_name || ' vous a envoyé une demande de collaboration', 'collab_request');
  RETURN NEW;
END;
$$;

-- Create triggers if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_collab_request') THEN
    CREATE TRIGGER on_collab_request
    AFTER INSERT ON public.collaboration_requests
    FOR EACH ROW EXECUTE FUNCTION public.notify_collab_request();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_project_message') THEN
    CREATE TRIGGER on_project_message
    AFTER INSERT ON public.project_messages
    FOR EACH ROW EXECUTE FUNCTION public.notify_project_message();
  END IF;
END $$;

-- Allow members to delete their own messages
CREATE POLICY "Users can delete own messages"
ON public.project_messages
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);