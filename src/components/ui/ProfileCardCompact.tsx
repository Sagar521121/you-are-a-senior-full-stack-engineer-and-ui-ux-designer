import { Heart, GraduationCap, BookOpen } from 'lucide-react';
import { Badge } from './badge';
import { Button } from './button';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface ProfileCardCompactProps {
  profile: Profile;
  onInvite: (profile: Profile) => void;
  isLoading?: boolean;
}

export const ProfileCardCompact = ({ profile, onInvite, isLoading }: ProfileCardCompactProps) => {
  const yearLabels: Record<string, string> = {
    '1st': 'Freshman',
    '2nd': 'Sophomore',
    '3rd': 'Junior',
    '4th': 'Senior'
  };

  return (
    <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden hover:shadow-elevated transition-shadow duration-300 animate-fade-in">
      {/* Header */}
      <div className="h-16 gradient-primary relative">
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
          {(profile as any).avatar_url ? (
            <img
              src={(profile as any).avatar_url}
              alt={profile.first_name}
              className="w-16 h-16 rounded-full object-cover shadow-md border-3 border-card"
            />
          ) : (
            <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center shadow-md border-3 border-card">
              <span className="text-2xl font-serif font-bold text-primary">
                {profile.first_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pt-10 pb-4 px-4 text-center">
        <h3 className="text-lg font-serif font-bold text-foreground">
          {profile.first_name}
        </h3>
        
        <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <GraduationCap className="w-3 h-3" />
            <span>{yearLabels[profile.year] || profile.year}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            <span className="truncate max-w-[80px]">{profile.stream}</span>
          </div>
        </div>

        {/* Interests - show first 3 */}
        {(profile as any).interests && (profile as any).interests.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-1">
            {(profile as any).interests.slice(0, 3).map((interest: string) => (
              <Badge key={interest} variant="secondary" className="text-[10px] px-1.5 py-0">
                {interest}
              </Badge>
            ))}
            {(profile as any).interests.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                +{(profile as any).interests.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Action */}
        <Button
          size="sm"
          onClick={() => onInvite(profile)}
          disabled={isLoading}
          className="w-full mt-4 rounded-xl gradient-primary hover:opacity-90 text-sm shadow-glow"
        >
          <Heart className="w-4 h-4 mr-1" />
          Invite
        </Button>
      </div>
    </div>
  );
};
