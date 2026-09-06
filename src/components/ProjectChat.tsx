import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Send, Paperclip, Mic, MicOff, Reply, Star, StarOff, X, FileText,
  Check, CheckCheck, Trash2
} from 'lucide-react';

type Message = {
  id: string; user_id: string; message: string; created_at: string;
  reply_to: string | null; is_important: boolean;
  attachment_url: string | null; attachment_type: string | null;
  voice_url: string | null; read_by: string[];
};

type Props = {
  projectId: string;
  memberProfiles: Record<string, { full_name: string | null; email: string | null; avatar_url: string | null }>;
  members: { id: string; user_id: string; role: string }[];
};

export function ProjectChat({ projectId, memberProfiles, members }: Props) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchMessages(); }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    const channel = supabase
      .channel(`chat-${projectId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'project_messages', filter: `project_id=eq.${projectId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'project_messages', filter: `project_id=eq.${projectId}` }, (payload) => {
        setMessages(prev => prev.map(m => m.id === (payload.new as Message).id ? payload.new as Message : m));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'project_messages', filter: `project_id=eq.${projectId}` }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== (payload.old as any).id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (user && messages.length > 0) {
      const unread = messages.filter(m => m.user_id !== user.id && !m.read_by?.includes(user.id));
      unread.forEach(m => {
        supabase.from('project_messages').update({ read_by: [...(m.read_by || []), user.id] }).eq('id', m.id).then();
      });
    }
  }, [messages, user]);

  const fetchMessages = async () => {
    const { data } = await supabase.from('project_messages')
      .select('*').eq('project_id', projectId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as unknown as Message[]);
  };

  const sendMessage = async (opts?: { attachUrl?: string; attachType?: string; voiceUrl?: string }) => {
    if (!newMsg.trim() && !opts?.attachUrl && !opts?.voiceUrl) return;
    if (!user) return;
    setSending(true);
    await supabase.from('project_messages').insert({
      project_id: projectId,
      user_id: user.id,
      message: newMsg.trim() || (opts?.voiceUrl ? '🎤 Message vocal' : '📎 Fichier'),
      reply_to: replyTo?.id || null,
      attachment_url: opts?.attachUrl || null,
      attachment_type: opts?.attachType || null,
      voice_url: opts?.voiceUrl || null,
    } as any);
    setNewMsg('');
    setReplyTo(null);
    setSending(false);
  };

  const toggleImportant = async (msg: Message) => {
    await supabase.from('project_messages').update({ is_important: !msg.is_important } as any).eq('id', msg.id);
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_important: !m.is_important } : m));
  };

  const deleteMessage = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('project_messages').delete().eq('id', deleteTarget.id);
    if (!error) {
      setMessages(prev => prev.filter(m => m.id !== deleteTarget.id));
      toast({ title: 'Message supprimé' });
    }
    setDeleteTarget(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = file.name.split('.').pop();
    const path = `${projectId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('chat-attachments').upload(path, file, { upsert: true });
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    const { data: urlData } = supabase.storage.from('chat-attachments').getPublicUrl(path);
    await sendMessage({ attachUrl: urlData.publicUrl, attachType: file.type.startsWith('image/') ? 'image' : 'file' });
    e.target.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const path = `${projectId}/voice_${Date.now()}.webm`;
        const { error } = await supabase.storage.from('chat-attachments').upload(path, blob, { upsert: true });
        if (error) return;
        const { data: urlData } = supabase.storage.from('chat-attachments').getPublicUrl(path);
        await sendMessage({ voiceUrl: urlData.publicUrl });
      };
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch {
      toast({ title: 'Erreur', description: 'Microphone non disponible', variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setRecording(false);
    setMediaRecorder(null);
  };

  const getProfile = (uid: string) => memberProfiles[uid];
  const getReplied = (id: string | null) => id ? messages.find(m => m.id === id) : null;

  const getReadStatus = (msg: Message) => {
    if (msg.user_id !== user?.id) return null;
    const otherMembers = members.filter(m => m.user_id !== user?.id);
    const readCount = otherMembers.filter(m => msg.read_by?.includes(m.user_id)).length;
    if (readCount === 0) return 'sent';
    if (readCount >= otherMembers.length) return 'read_all';
    return 'read_some';
  };

  const getReadNames = (msg: Message) => {
    if (!msg.read_by?.length) return [];
    return msg.read_by
      .filter(id => id !== user?.id)
      .map(id => {
        const p = getProfile(id);
        return p?.full_name || p?.email || '?';
      });
  };

  return (
    <>
      <div className="glass rounded-lg flex flex-col" style={{ height: 'calc(100dvh - 260px)' }}>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">{t('collab.noMessages')}</p>
          )}
          {messages.map(msg => {
            const isMe = msg.user_id === user?.id;
            const profile = getProfile(msg.user_id);
            const replied = getReplied(msg.reply_to);
            const repliedProfile = replied ? getProfile(replied.user_id) : null;
            const readStatus = getReadStatus(msg);
            const readNames = getReadNames(msg);

            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''} group`}>
                <Avatar className="w-6 h-6 shrink-0">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                    {(profile?.full_name || profile?.email || '?').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-[75%] space-y-0.5">
                  {replied && (
                    <div className={`text-[9px] px-2 py-0.5 rounded border-l-2 border-primary/40 bg-muted/50 truncate ${isMe ? 'text-right' : ''}`}>
                      <span className="font-semibold">{repliedProfile?.full_name || repliedProfile?.email}</span>: {replied.message}
                    </div>
                  )}
                  <div className={`rounded-lg px-3 py-1.5 text-xs relative ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'} ${msg.is_important ? 'ring-1 ring-yellow-500/60' : ''}`}>
                    {msg.is_important && <Star className="w-2.5 h-2.5 text-yellow-500 absolute -top-1 -right-1 fill-yellow-500" />}
                    {!isMe && <p className="text-[9px] font-semibold mb-0.5 opacity-70">{profile?.full_name || profile?.email}</p>}
                    
                    {msg.voice_url && (
                      <audio controls className="h-8 w-full max-w-[200px]" src={msg.voice_url} />
                    )}
                    
                    {msg.attachment_url && msg.attachment_type === 'image' && (
                      <img src={msg.attachment_url} alt="attachment" className="rounded max-w-[200px] max-h-[150px] object-cover mb-1" />
                    )}
                    {msg.attachment_url && msg.attachment_type === 'file' && (
                      <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] underline mb-1">
                        <FileText className="w-3 h-3" /> Fichier joint
                      </a>
                    )}

                    {!msg.voice_url && <p>{msg.message}</p>}
                    
                    <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'justify-end' : ''}`}>
                      <span className={`text-[8px] ${isMe ? 'text-primary-foreground/50' : 'text-muted-foreground'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {readStatus === 'sent' && <Check className="w-2.5 h-2.5 text-primary-foreground/50" />}
                      {readStatus === 'read_some' && (
                        <span title={`Vu par: ${readNames.join(', ')}`}>
                          <CheckCheck className="w-2.5 h-2.5 text-primary-foreground/50" />
                        </span>
                      )}
                      {readStatus === 'read_all' && (
                        <span title={`Vu par: ${readNames.join(', ')}`}>
                          <CheckCheck className="w-2.5 h-2.5 text-blue-400" />
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className={`flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'justify-end' : ''}`}>
                    <button onClick={() => setReplyTo(msg)} className="p-0.5 rounded hover:bg-muted"><Reply className="w-3 h-3 text-muted-foreground" /></button>
                    <button onClick={() => toggleImportant(msg)} className="p-0.5 rounded hover:bg-muted">
                      {msg.is_important ? <StarOff className="w-3 h-3 text-yellow-500" /> : <Star className="w-3 h-3 text-muted-foreground" />}
                    </button>
                    {isMe && (
                      <button onClick={() => setDeleteTarget(msg)} className="p-0.5 rounded hover:bg-muted">
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {replyTo && (
          <div className="px-3 py-1.5 border-t border-border/50 flex items-center gap-2 bg-muted/30">
            <Reply className="w-3 h-3 text-primary shrink-0" />
            <span className="text-[10px] truncate flex-1">
              {getProfile(replyTo.user_id)?.full_name || getProfile(replyTo.user_id)?.email}: {replyTo.message}
            </span>
            <button onClick={() => setReplyTo(null)}><X className="w-3 h-3" /></button>
          </div>
        )}

        <div className="p-2 border-t border-border/50 flex gap-1.5 items-center">
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
          <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className={`h-8 w-8 shrink-0 ${recording ? 'text-destructive animate-pulse' : ''}`}
            onClick={recording ? stopRecording : startRecording}>
            {recording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </Button>
          <Input
            placeholder={t('collab.typeMessage')}
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            className="text-xs h-8 flex-1"
          />
          <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => sendMessage()} disabled={sending || (!newMsg.trim())}>
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce message ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={deleteMessage} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
