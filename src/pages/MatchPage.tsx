import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProfileCard } from '@/components/ui/ProfileCard';
import { ProfileCardCompact } from '@/components/ui/ProfileCardCompact';
import { MatchDialog } from '@/components/ui/MatchDialog';

import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, Heart, Crown, Loader2, LayoutGrid, Square } from 'lucide-react';
import { fetchRandomProfile, fetchAllProfiles, sendInvite, skipProfile } from '@/lib/supabase-helpers';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

type ViewMode = 'single' | 'grid';

const MatchPage = () => {
  const { user, profile, preferences, refreshProfile } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [invitingProfileId, setInvitingProfileId] = useState<string | null>(null);
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

  const loadAllProfiles = useCallback(async () => {
    if (!user || !profile) return;
    
    setLoading(true);
    try {
      const profiles = await fetchAllProfiles(user.id, profile, preferences);
      setAllProfiles(profiles);
    } catch (error) {
      console.error('Error loading profiles:', error);
      toast.error('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  }, [user, profile, preferences]);

  useEffect(() => {
    if (profile) {
      if (viewMode === 'single') {
        loadNextProfile();
      } else {
        loadAllProfiles();
      }
    }
  }, [profile, viewMode, loadNextProfile, loadAllProfiles]);

  const handleInvite = async (targetProfile?: Profile) => {
    const profileToInvite = targetProfile || currentProfile;
    if (!user || !profileToInvite || !canSendInvite) {
      if (!canSendInvite) {
        toast.error('No invites remaining. Upgrade to Premium for unlimited invites!');
      }
      return;
    }

    if (targetProfile) {
      setInvitingProfileId(targetProfile.user_id);
    } else {
      setActionLoading(true);
    }

    try {
      // Update daily invites count first
      if (!profile?.is_premium) {
        await supabase
          .from('profiles')
          .update({ daily_invites_used: (profile?.daily_invites_used || 0) + 1 })
          .eq('user_id', user.id);
        await refreshProfile();
      }

      const result = await sendInvite(user.id, profileToInvite.user_id);
      
      if (result.isMatch && result.match) {
        setMatchDialog({
          isOpen: true,
          matchedUserName: profileToInvite.first_name,
          matchId: result.match.id
        });
        toast.success('🎉 It\'s a match!');
      } else {
        toast.success(`Invite sent to ${profileToInvite.first_name}!`);
      }
      
      if (viewMode === 'single') {
        await loadNextProfile();
      } else {
        // Remove the invited profile from the grid
        setAllProfiles(prev => prev.filter(p => p.user_id !== profileToInvite.user_id));
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invite');
    } finally {
      setActionLoading(false);
      setInvitingProfileId(null);
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

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'single' ? 'grid' : 'single');
  };

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* View Toggle & Invite Counter */}
        <div className="flex items-center justify-between gap-4">
          {/* View mode toggle */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-muted">
            <Button
              variant={viewMode === 'single' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('single')}
              className={`rounded-lg ${viewMode === 'single' ? 'gradient-primary shadow-sm' : ''}`}
            >
              <Square className="w-4 h-4 mr-1" />
              Single
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`rounded-lg ${viewMode === 'grid' ? 'gradient-primary shadow-sm' : ''}`}
            >
              <LayoutGrid className="w-4 h-4 mr-1" />
              All
            </Button>
          </div>

          {/* Invite counter for free users */}
          {profile && !profile.is_premium && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border/50">
                <Heart className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{remainingInvites} left</span>
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
        </div>

        {/* Main content */}
        {viewMode === 'single' ? (
          <div className="min-h-[400px] flex items-center justify-center">
            {loading ? (
              <div className="text-center animate-fade-in">
                <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground">Finding your next match...</p>
              </div>
            ) : currentProfile ? (
              <ProfileCard
                profile={currentProfile}
                onInvite={() => handleInvite()}
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
        ) : (
          <div className="min-h-[400px]">
            {loading ? (
              <div className="text-center py-12 animate-fade-in">
                <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground">Loading all profiles...</p>
              </div>
            ) : allProfiles.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  {allProfiles.length} {allProfiles.length === 1 ? 'profile' : 'profiles'} available
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {allProfiles.map((p) => (
                    <ProfileCardCompact
                      key={p.id}
                      profile={p}
                      onInvite={handleInvite}
                      isLoading={invitingProfileId === p.user_id}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 animate-fade-in">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full gradient-secondary flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-serif font-semibold mb-2">No Profiles Available</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  You've interacted with everyone! Check back later for new faces.
                </p>
                <Button
                  onClick={loadAllProfiles}
                  variant="outline"
                  className="rounded-xl"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            💡 Tip: {viewMode === 'single' 
              ? 'Your preferences help us show better matches, but you\'ll still see everyone!' 
              : 'Profiles are sorted by compatibility based on your preferences and shared interests.'}
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
