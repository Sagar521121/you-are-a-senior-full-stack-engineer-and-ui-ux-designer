import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];

export const getOppositeGender = (gender: 'boy' | 'girl'): 'boy' | 'girl' => {
  return gender === 'boy' ? 'girl' : 'boy';
};

export const fetchRandomProfile = async (
  currentUserId: string,
  currentProfile: Profile,
  preferences: UserPreferences | null
): Promise<Profile | null> => {
  const oppositeGender = getOppositeGender(currentProfile.gender);
  
  // Get list of users to exclude (already invited, rejected, matched, skipped, blocked)
  const [invitesResult, matchesResult, skippedResult, blockedResult] = await Promise.all([
    supabase.from('invites').select('to_user_id, from_user_id').or(`from_user_id.eq.${currentUserId},to_user_id.eq.${currentUserId}`),
    supabase.from('matches').select('user1_id, user2_id').or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`),
    supabase.from('skipped_profiles').select('skipped_user_id').eq('user_id', currentUserId),
    supabase.from('blocked_users').select('blocked_user_id').eq('user_id', currentUserId)
  ]);

  const excludeUserIds = new Set<string>([currentUserId]);
  
  // Add invited users
  invitesResult.data?.forEach(invite => {
    excludeUserIds.add(invite.to_user_id);
    excludeUserIds.add(invite.from_user_id);
  });
  
  // Add matched users
  matchesResult.data?.forEach(match => {
    excludeUserIds.add(match.user1_id);
    excludeUserIds.add(match.user2_id);
  });
  
  // Add skipped users
  skippedResult.data?.forEach(skip => excludeUserIds.add(skip.skipped_user_id));
  
  // Add blocked users
  blockedResult.data?.forEach(block => excludeUserIds.add(block.blocked_user_id));

  // Build query for eligible profiles
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('gender', oppositeGender)
    .eq('university', currentProfile.university);

  // Exclude users
  const excludeArray = Array.from(excludeUserIds);
  if (excludeArray.length > 0) {
    query = query.not('user_id', 'in', `(${excludeArray.join(',')})`);
  }

  const { data: eligibleProfiles, error } = await query;

  if (error || !eligibleProfiles || eligibleProfiles.length === 0) {
    return null;
  }

  // Get current user's interests
  const currentInterests: string[] = (currentProfile as any).interests || [];

  // Apply soft preference filtering (weighted random)
  let weightedProfiles = eligibleProfiles.map(profile => {
    let weight = 1;
    
    if (preferences) {
      // Year preference
      if (preferences.preferred_year === 'same' && profile.year === currentProfile.year) {
        weight += 2;
      }
      
      // Stream preference
      if (preferences.preferred_stream === 'same' && profile.stream === currentProfile.stream) {
        weight += 2;
      } else if (preferences.preferred_stream === 'different' && profile.stream !== currentProfile.stream) {
        weight += 1;
      }
    }
    
    // Interest-based matching - add weight for each shared interest
    const profileInterests: string[] = (profile as any).interests || [];
    const sharedInterests = currentInterests.filter(i => profileInterests.includes(i));
    weight += sharedInterests.length * 1.5; // 1.5 weight per shared interest
    
    return { profile, weight };
  });

  // Weighted random selection
  const totalWeight = weightedProfiles.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const { profile, weight } of weightedProfiles) {
    random -= weight;
    if (random <= 0) {
      return profile;
    }
  }

  // Fallback to first profile if weighted selection fails
  return weightedProfiles[0]?.profile || null;
};

export const sendInvite = async (fromUserId: string, toUserId: string) => {
  // Check if there's an existing invite from the other user
  const { data: existingInvite } = await supabase
    .from('invites')
    .select('*')
    .eq('from_user_id', toUserId)
    .eq('to_user_id', fromUserId)
    .single();

  if (existingInvite) {
    // It's a match! Update the existing invite and create a match
    await supabase
      .from('invites')
      .update({ status: 'accepted' })
      .eq('id', existingInvite.id);

    // Create the match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        user1_id: fromUserId < toUserId ? fromUserId : toUserId,
        user2_id: fromUserId < toUserId ? toUserId : fromUserId
      })
      .select()
      .single();

    return { isMatch: true, match, error: matchError };
  }

  // Create new invite
  const { error } = await supabase
    .from('invites')
    .insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      status: 'pending'
    });

  // Increment daily invites used
  await supabase
    .from('profiles')
    .update({ daily_invites_used: supabase.rpc ? undefined : 1 })
    .eq('user_id', fromUserId);

  return { isMatch: false, error };
};

export const skipProfile = async (userId: string, skippedUserId: string) => {
  return supabase
    .from('skipped_profiles')
    .insert({ user_id: userId, skipped_user_id: skippedUserId });
};

export const validateUniversityEmail = (email: string): { isValid: boolean; university: string | null } => {
  // Common university email patterns
  const eduPatterns = [
    /\.edu$/i,
    /\.edu\.[a-z]{2}$/i,
    /\.ac\.[a-z]{2}$/i,
    /\.university\./i,
    /\.college\./i
  ];

  const isEdu = eduPatterns.some(pattern => pattern.test(email));
  
  if (!isEdu) {
    // For demo purposes, allow common emails but extract domain as "university"
    // In production, you'd have a whitelist of allowed university domains
  }

  // Extract university from email domain
  const domain = email.split('@')[1];
  const universityName = domain?.split('.')[0] || 'Unknown University';
  
  return {
    isValid: true, // For demo, allow all emails. In prod: isValid: isEdu
    university: universityName.charAt(0).toUpperCase() + universityName.slice(1)
  };
};

// Abusive word filter (basic implementation)
const abusiveWords = ['spam', 'hate', 'abuse']; // Add more as needed

export const filterContent = (content: string): string => {
  let filtered = content;
  abusiveWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '***');
  });
  return filtered;
};
