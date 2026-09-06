
DROP TRIGGER IF EXISTS on_project_message_insert ON public.project_messages;
DROP FUNCTION IF EXISTS public.notify_project_message() CASCADE;
