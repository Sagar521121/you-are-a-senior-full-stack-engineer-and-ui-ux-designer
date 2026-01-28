import { Heart, X, Sparkles, GraduationCap, BookOpen, Quote, Star } from 'lucide-react';
import { Badge } from './badge';
import { Button } from './button';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface ProfileCardProps {
  profile: Profile;
  onInvite: () => void;
  onSkip: () => void;
  isLoading?: boolean;
}

export const ProfileCard = ({ profile, onInvite, onSkip, isLoading }: ProfileCardProps) => {
  const yearLabels: Record<string, string> = {
    '1st': 'Freshman',
    '2nd': 'Sophomore',
    '3rd': 'Junior',
    '4th': 'Senior'
  };

  return (
    <div className="relative w-full max-w-sm mx-auto animate-scale-in">
      {/* Decorative elements */}
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full gradient-primary opacity-20 blur-2xl animate-float" />
      <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-accent opacity-20 blur-2xl animate-float" style={{ animationDelay: '1s' }} />
      
      {/* Card */}
      <div className="relative bg-card rounded-3xl shadow-elevated border border-border/50 overflow-hidden">
        {/* Header gradient */}
        <div className="h-24 gradient-primary relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary-foreground/50 animate-sparkle" />
          </div>
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
            {(profile as any).avatar_url ? (
              <img
                src={(profile as any).avatar_url}
                alt={profile.first_name}
                className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-card"
              />
            ) : (
              <div className="w-24 h-24 rounded-full gradient-gold flex items-center justify-center shadow-lg border-4 border-card">
                <span className="text-4xl font-serif font-bold text-primary">
                  {profile.first_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="pt-16 pb-6 px-6 text-center">
          <h2 className="text-2xl font-serif font-bold text-foreground mb-1">
            {profile.first_name}
          </h2>
          
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <GraduationCap className="w-4 h-4" />
              <span className="text-sm">{yearLabels[profile.year] || profile.year}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-border" />
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm">{profile.stream}</span>
            </div>
          </div>

          {/* Interests */}
          {(profile as any).interests && (profile as any).interests.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {(profile as any).interests.map((interest: string) => (
                <Badge key={interest} variant="secondary" className="text-xs">
                  {interest}
                </Badge>
              ))}
            </div>
          )}

          {profile.fun_prompt && (
            <div className="mt-6 p-4 rounded-2xl gradient-secondary border border-border/50">
              <Quote className="w-4 h-4 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-foreground italic leading-relaxed">
                "{profile.fun_prompt}"
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={onSkip}
            disabled={isLoading}
            className="flex-1 rounded-xl border-border hover:bg-muted group transition-all duration-300"
          >
            <X className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            Skip
          </Button>
          <Button
            size="lg"
            onClick={onInvite}
            disabled={isLoading}
            className="flex-1 rounded-xl gradient-primary hover:opacity-90 group transition-all duration-300 shadow-glow"
          >
            <Heart className="w-5 h-5 mr-2 group-hover:scale-110 group-hover:animate-heart-beat transition-transform" />
            Invite
          </Button>
        </div>
      </div>
    </div>
  );
};
