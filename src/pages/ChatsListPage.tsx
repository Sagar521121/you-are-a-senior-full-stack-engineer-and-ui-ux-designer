import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { MessageCircle, Sparkles } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Match = Database['public']['Tables']['matches']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

interface ChatPreview {
  match: Match;
  partner: Profile;
  lastMessage: Message | null;
}

const ChatsListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchChats = async () => {
      setLoading(true);
      try {
        // Fetch all matches
        const { data: matches } = await supabase
          .from('matches')
          .select('*')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (!matches) {
          setChats([]);
          return;
        }

        // Fetch partner profiles and last messages
        const chatPreviews = await Promise.all(
          matches.map(async (match) => {
            const partnerId = match.user1_id === user.id ? match.user2_id : match.user1_id;
            
            const [profileResult, messageResult] = await Promise.all([
              supabase.from('profiles').select('*').eq('user_id', partnerId).single(),
              supabase.from('messages').select('*').eq('match_id', match.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
            ]);

            return {
              match,
              partner: profileResult.data!,
              lastMessage: messageResult.data
            };
          })
        );

        // Sort by last message time (or match creation if no messages)
        const sorted = chatPreviews
          .filter(c => c.partner)
          .sort((a, b) => {
            const timeA = a.lastMessage?.created_at || a.match.created_at;
            const timeB = b.lastMessage?.created_at || b.match.created_at;
            return new Date(timeB).getTime() - new Date(timeA).getTime();
          });

        setChats(sorted);
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [user]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold text-foreground mb-1">Chats</h1>
          <p className="text-muted-foreground text-sm">Messages with your prom partners</p>
        </div>

        {/* Chat List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : chats.length > 0 ? (
          <div className="space-y-3">
            {chats.map((chat) => (
              <button
                key={chat.match.id}
                onClick={() => navigate(`/chat/${chat.match.id}`)}
                className="w-full p-4 rounded-2xl bg-card border border-border/50 shadow-card flex items-center gap-4 text-left hover:border-primary/30 transition-colors animate-fade-in"
              >
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center shadow-md shrink-0">
                  <span className="text-2xl font-serif font-bold text-primary-foreground">
                    {chat.partner.first_name.charAt(0)}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground">{chat.partner.first_name}</h3>
                    <span className="text-xs text-muted-foreground">
                      {chat.lastMessage 
                        ? formatTime(chat.lastMessage.created_at)
                        : formatTime(chat.match.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.lastMessage 
                      ? (chat.lastMessage.sender_id === user?.id ? 'You: ' : '') + chat.lastMessage.content
                      : 'Start the conversation! 💬'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-secondary flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No Chats Yet</h3>
            <p className="text-sm text-muted-foreground">
              Match with someone to start chatting!
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ChatsListPage;
