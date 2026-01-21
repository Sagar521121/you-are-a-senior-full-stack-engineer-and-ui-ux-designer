import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, MessageCircle, Clock, Check, X, Sparkles, Bell } from 'lucide-react';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Match = Database['public']['Tables']['matches']['Row'];
type Invite = Database['public']['Tables']['invites']['Row'];

interface MatchWithProfile extends Match {
  partner: Profile;
}

interface InviteWithProfile extends Invite {
  sender: Profile;
}

const MatchesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchWithProfile[]>([]);
  const [pendingInvites, setPendingInvites] = useState<InviteWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch matches
        const { data: matchesData } = await supabase
          .from('matches')
          .select('*')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (matchesData) {
          const matchesWithProfiles = await Promise.all(
            matchesData.map(async (match) => {
              const partnerId = match.user1_id === user.id ? match.user2_id : match.user1_id;
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', partnerId)
                .single();
              return { ...match, partner: profile! };
            })
          );
          setMatches(matchesWithProfiles.filter(m => m.partner));
        }

        // Fetch pending invites (received)
        const { data: invitesData } = await supabase
          .from('invites')
          .select('*')
          .eq('to_user_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (invitesData) {
          const invitesWithProfiles = await Promise.all(
            invitesData.map(async (invite) => {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', invite.from_user_id)
                .single();
              return { ...invite, sender: profile! };
            })
          );
          setPendingInvites(invitesWithProfiles.filter(i => i.sender));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleAcceptInvite = async (invite: InviteWithProfile) => {
    if (!user) return;

    try {
      // Update invite status
      await supabase
        .from('invites')
        .update({ status: 'accepted' })
        .eq('id', invite.id);

      // Create match
      const { data: match } = await supabase
        .from('matches')
        .insert({
          user1_id: invite.from_user_id < user.id ? invite.from_user_id : user.id,
          user2_id: invite.from_user_id < user.id ? user.id : invite.from_user_id
        })
        .select()
        .single();

      toast.success(`You matched with ${invite.sender.first_name}! 🎉`);
      
      // Refresh data
      setPendingInvites(prev => prev.filter(i => i.id !== invite.id));
      if (match) {
        setMatches(prev => [{ ...match, partner: invite.sender }, ...prev]);
      }
    } catch (error: any) {
      toast.error('Failed to accept invite');
    }
  };

  const handleRejectInvite = async (invite: InviteWithProfile) => {
    try {
      await supabase
        .from('invites')
        .update({ status: 'rejected' })
        .eq('id', invite.id);

      setPendingInvites(prev => prev.filter(i => i.id !== invite.id));
      toast.success('Invite declined');
    } catch (error) {
      toast.error('Failed to decline invite');
    }
  };

  const yearLabels: Record<string, string> = {
    '1st': 'Freshman',
    '2nd': 'Sophomore',
    '3rd': 'Junior',
    '4th': 'Senior'
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold text-foreground mb-1">Your Matches</h1>
          <p className="text-muted-foreground text-sm">Your prom connections</p>
        </div>

        <Tabs defaultValue="matches" className="w-full">
          <TabsList className="w-full grid grid-cols-2 rounded-xl bg-secondary p-1">
            <TabsTrigger value="matches" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Heart className="w-4 h-4 mr-2" />
              Matches ({matches.length})
            </TabsTrigger>
            <TabsTrigger value="invites" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm relative">
              <Bell className="w-4 h-4 mr-2" />
              Invites
              {pendingInvites.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {pendingInvites.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matches" className="mt-6 space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : matches.length > 0 ? (
              matches.map((match) => (
                <div
                  key={match.id}
                  className="p-4 rounded-2xl bg-card border border-border/50 shadow-card flex items-center gap-4 animate-fade-in"
                >
                  <div className="w-14 h-14 rounded-xl gradient-gold flex items-center justify-center shadow-md">
                    <span className="text-2xl font-serif font-bold text-primary">
                      {match.partner.first_name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{match.partner.first_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {yearLabels[match.partner.year]} • {match.partner.stream}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/chat/${match.id}`)}
                    className="rounded-xl gradient-primary hover:opacity-90"
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Chat
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-secondary flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">No Matches Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Keep discovering to find your prom partner!
                </p>
                <Button onClick={() => navigate('/match')} className="rounded-xl gradient-primary">
                  <Heart className="w-4 h-4 mr-2" />
                  Find Matches
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="invites" className="mt-6 space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : pendingInvites.length > 0 ? (
              pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="p-4 rounded-2xl bg-card border border-border/50 shadow-card animate-fade-in"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                      <span className="text-xl font-serif font-bold text-primary-foreground">
                        {invite.sender.first_name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{invite.sender.first_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {yearLabels[invite.sender.year]} • {invite.sender.stream}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      New
                    </div>
                  </div>
                  {invite.sender.fun_prompt && (
                    <p className="text-sm text-muted-foreground italic mb-3 pl-16">
                      "{invite.sender.fun_prompt}"
                    </p>
                  )}
                  <div className="flex gap-2 pl-16">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectInvite(invite)}
                      className="flex-1 rounded-xl"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAcceptInvite(invite)}
                      className="flex-1 rounded-xl gradient-primary hover:opacity-90"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-secondary flex items-center justify-center">
                  <Bell className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">No Pending Invites</h3>
                <p className="text-sm text-muted-foreground">
                  When someone sends you an invite, it'll appear here!
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default MatchesPage;
