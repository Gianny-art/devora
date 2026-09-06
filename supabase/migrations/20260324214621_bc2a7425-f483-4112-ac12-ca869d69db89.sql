-- Allow users to delete their own collaboration requests (both sender and receiver)
CREATE POLICY "Users can delete own collab requests"
ON public.collaboration_requests
FOR DELETE
TO authenticated
USING ((auth.uid() = sender_id) OR (auth.uid() = receiver_id));
