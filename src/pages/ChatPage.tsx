import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Sparkles, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { filterContent } from '@/lib/supabase-helpers';
import type { Database } from '@/integrations/supabase/types';

type Message = Database['public']['Tables']['messages']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

const ChatPage = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!matchId || !user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch match details
        const { data: match } = await supabase
          .from('matches')
          .select('*')
          .eq('id', matchId)
          .single();

        if (!match) {
          toast.error('Match not found');
          navigate('/matches');
          return;
        }

        // Get partner profile
        const partnerId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        const { data: partnerProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', partnerId)
          .single();

        setPartner(partnerProfile);

        // Fetch messages
        const { data: messagesData } = await supabase
          .from('messages')
          .select('*')
          .eq('match_id', matchId)
          .order('created_at', { ascending: true });

        setMessages(messagesData || []);
      } catch (error) {
        console.error('Error fetching chat:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, user, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !matchId || !user) return;

    setSending(true);
    try {
      const filteredContent = filterContent(newMessage.trim());
      
      const { error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: user.id,
          content: filteredContent
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error: any) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  messages.forEach((msg) => {
    const date = formatDate(msg.created_at);
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup.date === date) {
      lastGroup.messages.push(msg);
    } else {
      groupedMessages.push({ date, messages: [msg] });
    }
  });

  if (loading) {
    return (
      <AppLayout showNav={false}>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showNav={false}>
      {/* Chat Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/50">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/matches')}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <span className="text-lg font-serif font-bold text-primary-foreground">
              {partner?.first_name.charAt(0)}
            </span>
          </div>
          
          <div className="flex-1">
            <h2 className="font-semibold text-foreground">{partner?.first_name}</h2>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3" />
              Prom Partner
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="pt-20 pb-24 px-1">
        {groupedMessages.length > 0 ? (
          groupedMessages.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <span className="px-3 py-1 rounded-full bg-muted text-xs text-muted-foreground">
                  {group.date}
                </span>
              </div>

              {/* Messages */}
              {group.messages.map((message, index) => {
                const isOwn = message.sender_id === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                        isOwn
                          ? 'gradient-primary text-primary-foreground rounded-br-md'
                          : 'bg-card border border-border/50 text-foreground rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p className={`text-[10px] mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-secondary flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">Start the Conversation!</h3>
            <p className="text-sm text-muted-foreground">
              Say hi to {partner?.first_name} and start planning your prom night! 🎉
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50 safe-area-pb">
        <div className="container max-w-lg mx-auto px-4 py-3">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                maxLength={500}
                className="h-12 rounded-xl pr-12 bg-card border-border/50"
              />
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={!newMessage.trim() || sending}
              className="w-12 h-12 rounded-xl gradient-primary hover:opacity-90 shadow-glow shrink-0"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
          
          <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            <span>Keep it respectful and fun!</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ChatPage;
