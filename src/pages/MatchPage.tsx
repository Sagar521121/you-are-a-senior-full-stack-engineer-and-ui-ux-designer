import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProfileCard } from '@/components/ui/ProfileCard';
import { MatchDialog } from '@/components/ui/MatchDialog';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, Heart, Crown, Loader2 } from 'lucide-react';
import { fetchRandomProfile, sendInvite, skipProfile } from '@/lib/supabase-helpers';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

const MatchPage = () => {
  const { user, profile, preferences, refreshProfile } = useAuth();
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [matchDialog, setMatchDialog] = useState<{ isOpen: boolean; matchedUserName: string; matchId: string }>({
    isOpen: false,
    matchedUserName: '',
    matchId: ''
  });

  const MAX_FREE_INVITES = 5;
  const remainingInvites = profile ? MAX_FREE_INVITES - (profile.daily_invites_used || 0) : 0;
  const canSendInvite = profile?.is_premium || remainingInvites > 0;

  const loadNextProfile = useCallback(async () => {
    if (!user || !profile) return;
    
    setLoading(true);
    try {
      const nextProfile = await fetchRandomProfile(user.id, profile, preferences);
      setCurrentProfile(nextProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  }, [user, profile, preferences]);

  useEffect(() => {
    if (profile) {
      loadNextProfile();
    }
  }, [profile, loadNextProfile]);

  const handleInvite = async () => {
    if (!user || !currentProfile || !canSendInvite) {
      if (!canSendInvite) {
        toast.error('No invites remaining. Upgrade to Premium for unlimited invites!');
      }
      return;
    }

    setActionLoading(true);
    try {
      // Update daily invites count first
      if (!profile?.is_premium) {
        await supabase
          .from('profiles')
          .update({ daily_invites_used: (profile?.daily_invites_used || 0) + 1 })
          .eq('user_id', user.id);
        await refreshProfile();
      }

      const result = await sendInvite(user.id, currentProfile.user_id);
      
      if (result.isMatch && result.match) {
        setMatchDialog({
          isOpen: true,
          matchedUserName: currentProfile.first_name,
          matchId: result.match.id
        });
        toast.success('🎉 It\'s a match!');
      } else {
        toast.success(`Invite sent to ${currentProfile.first_name}!`);
      }
      
      await loadNextProfile();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invite');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!user || !currentProfile) return;

    setActionLoading(true);
    try {
      await skipProfile(user.id, currentProfile.user_id);
      await loadNextProfile();
    } catch (error) {
      console.error('Error skipping profile:', error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Countdown */}
        <CountdownTimer />

        {/* Invite counter for free users */}
        {profile && !profile.is_premium && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border/50 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Daily Invites</p>
                <p className="text-xs text-muted-foreground">{remainingInvites} remaining today</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-accent text-accent hover:bg-accent hover:text-accent-foreground"
            >
              <Crown className="w-4 h-4 mr-1" />
              Go Premium
            </Button>
          </div>
        )}

        {/* Main content */}
        <div className="min-h-[400px] flex items-center justify-center">
          {loading ? (
            <div className="text-center animate-fade-in">
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Finding your next match...</p>
            </div>
          ) : currentProfile ? (
            <ProfileCard
              profile={currentProfile}
              onInvite={handleInvite}
              onSkip={handleSkip}
              isLoading={actionLoading}
            />
          ) : (
            <div className="text-center max-w-xs animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full gradient-secondary flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-serif font-semibold mb-2">No More Profiles</h3>
              <p className="text-muted-foreground text-sm mb-6">
                You've seen everyone available! Check back later for new faces.
              </p>
              <Button
                onClick={loadNextProfile}
                variant="outline"
                className="rounded-xl"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            💡 Tip: Your preferences help us show better matches, but you'll still see everyone!
          </p>
        </div>
      </div>

      {/* Match Dialog */}
      <MatchDialog
        isOpen={matchDialog.isOpen}
        onClose={() => setMatchDialog({ ...matchDialog, isOpen: false })}
        matchedUserName={matchDialog.matchedUserName}
        matchId={matchDialog.matchId}
      />
    </AppLayout>
  );
};

export default MatchPage;
