import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, GraduationCap, BookOpen, Sparkles, Settings, Check, Heart, X } from 'lucide-react';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { toast } from 'sonner';
import { validateUniversityEmail } from '@/lib/supabase-helpers';
import type { Database } from '@/integrations/supabase/types';

type GenderType = Database['public']['Enums']['gender_type'];
type YearType = Database['public']['Enums']['year_type'];
type PreferenceType = Database['public']['Enums']['preference_type'];

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, profile, preferences, refreshProfile, refreshPreferences } = useAuth();
  
  const [firstName, setFirstName] = useState('');
  const [gender, setGender] = useState<GenderType>('boy');
  const [year, setYear] = useState<YearType>('1st');
  const [stream, setStream] = useState('');
  const [funPrompt, setFunPrompt] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [prefYear, setPrefYear] = useState<PreferenceType>('any');
  const [prefStream, setPrefStream] = useState<PreferenceType>('any');
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name);
      setGender(profile.gender);
      setYear(profile.year);
      setStream(profile.stream);
      setFunPrompt(profile.fun_prompt || '');
      setInterests((profile as any).interests || []);
      setAvatarUrl((profile as any).avatar_url || null);
    }
    if (preferences) {
      setPrefYear(preferences.preferred_year || 'any');
      setPrefStream(preferences.preferred_stream || 'any');
    }
  }, [profile, preferences]);

  const handleImageCropped = (blob: Blob) => {
    setAvatarBlob(blob);
    setAvatarUrl(URL.createObjectURL(blob));
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarBlob) return avatarUrl;

    const fileExt = 'jpg';
    const fileName = `${userId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, avatarBlob, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return `${data.publicUrl}?t=${Date.now()}`;
  };

  const isNewProfile = !profile;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const { university } = validateUniversityEmail(user.email || '');
      
      // Upload avatar if changed
      const newAvatarUrl = await uploadAvatar(user.id);
      
      if (profile) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update({
            first_name: firstName,
            gender,
            year,
            stream,
            fun_prompt: funPrompt || null,
            interests,
            avatar_url: newAvatarUrl
          } as any)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new profile
        const { error } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            first_name: firstName,
            gender,
            year,
            stream,
            university: university || 'Unknown',
            fun_prompt: funPrompt || null,
            interests,
            avatar_url: newAvatarUrl
          } as any);

        if (error) throw error;
      }

      // Handle preferences
      if (preferences) {
        const { error } = await supabase
          .from('user_preferences')
          .update({
            preferred_year: prefYear,
            preferred_stream: prefStream
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            preferred_year: prefYear,
            preferred_stream: prefStream
          });

        if (error) throw error;
      }

      // Refresh profile and preferences, then navigate
      await refreshProfile();
      await refreshPreferences();
      toast.success('Profile saved successfully!');
      
      // Navigate after state is updated - use isNewProfile which was captured before profile might change
      if (isNewProfile) {
        // Small delay to ensure state propagation
        setTimeout(() => {
          navigate('/match', { replace: true });
        }, 100);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const streams = [
    'Computer Science',
    'Engineering',
    'Business',
    'Arts',
    'Science',
    'Medicine',
    'Law',
    'Education',
    'Design',
    'Other'
  ];

  const funPromptSuggestions = [
    "My ideal prom night includes...",
    "The song I'd love to dance to is...",
    "Three words that describe me...",
    "I'm secretly good at...",
    "My go-to dance move is..."
  ];

  const availableInterests = [
    'Music', 'Dancing', 'Sports', 'Gaming', 'Movies', 'Reading', 
    'Travel', 'Food', 'Photography', 'Art', 'Fitness', 'Fashion',
    'Tech', 'Nature', 'Cooking', 'Netflix', 'Concerts', 'Coffee'
  ];

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else if (interests.length < 5) {
      setInterests([...interests, interest]);
    } else {
      toast.error('Maximum 5 interests allowed');
    }
  };

  return (
    <AppLayout showNav={!!profile}>
      <div className="max-w-md mx-auto animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
            {profile ? <Settings className="w-8 h-8 text-primary-foreground" /> : <User className="w-8 h-8 text-primary-foreground" />}
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground mb-1">
            {profile ? 'Edit Profile' : 'Create Your Profile'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {profile ? 'Update your information' : 'Tell us a bit about yourself'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Upload Card */}
          <div className="bg-card rounded-2xl shadow-card border border-border/50 p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2 justify-center">
              <User className="w-4 h-4 text-primary" />
              Profile Photo
            </h3>

            <ImageUpload
              currentImageUrl={avatarUrl}
              onImageCropped={handleImageCropped}
              disabled={loading}
            />
          </div>

          {/* Basic Info Card */}
          <div className="bg-card rounded-2xl shadow-card border border-border/50 p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Basic Info
            </h3>

            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Your first name"
                required
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>I am a...</Label>
              <div className="grid grid-cols-2 gap-3">
                {(['boy', 'girl'] as GenderType[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      gender === g
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="text-2xl mb-1 block">{g === 'boy' ? '👨' : '👩'}</span>
                    <span className="text-sm font-medium capitalize">{g}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Academic Info Card */}
          <div className="bg-card rounded-2xl shadow-card border border-border/50 p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              Academic Info
            </h3>

            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={year} onValueChange={(v) => setYear(v as YearType)}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st">Freshman (1st Year)</SelectItem>
                  <SelectItem value="2nd">Sophomore (2nd Year)</SelectItem>
                  <SelectItem value="3rd">Junior (3rd Year)</SelectItem>
                  <SelectItem value="4th">Senior (4th Year)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Stream / Major</Label>
              <Select value={stream} onValueChange={setStream}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Select your major" />
                </SelectTrigger>
                <SelectContent>
                  {streams.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Interests Card */}
          <div className="bg-card rounded-2xl shadow-card border border-border/50 p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              Your Interests
            </h3>
            <p className="text-xs text-muted-foreground">Select up to 5 interests to help find better matches</p>

            <div className="flex flex-wrap gap-2">
              {availableInterests.map((interest) => {
                const isSelected = interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-primary/10'
                    }`}
                  >
                    {interest}
                    {isSelected && <X className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">{interests.length}/5 selected</p>
          </div>

          {/* Fun Prompt Card */}
          <div className="bg-card rounded-2xl shadow-card border border-border/50 p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              Fun Prompt (Optional)
            </h3>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 mb-3">
                {funPromptSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setFunPrompt(suggestion)}
                    className="text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-primary/10 transition-colors"
                  >
                    {suggestion.slice(0, 25)}...
                  </button>
                ))}
              </div>
              <Textarea
                value={funPrompt}
                onChange={(e) => setFunPrompt(e.target.value)}
                placeholder="Share something fun about yourself..."
                maxLength={200}
                rows={3}
                className="rounded-xl resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">{funPrompt.length}/200</p>
            </div>
          </div>

          {/* Preferences Card */}
          <div className="bg-card rounded-2xl shadow-card border border-border/50 p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Your Preferences
            </h3>
            <p className="text-xs text-muted-foreground">These help us find better matches but don't limit your options!</p>

            <div className="space-y-2">
              <Label>Preferred Year</Label>
              <Select value={prefYear} onValueChange={(v) => setPrefYear(v as PreferenceType)}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Year</SelectItem>
                  <SelectItem value="same">Same as Mine</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Preferred Stream</Label>
              <Select value={prefStream} onValueChange={(v) => setPrefStream(v as PreferenceType)}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Stream</SelectItem>
                  <SelectItem value="same">Same as Mine</SelectItem>
                  <SelectItem value="different">Different from Mine</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || !firstName || !stream}
            className="w-full h-14 rounded-xl gradient-primary hover:opacity-90 text-lg font-medium shadow-glow"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                {profile ? 'Save Changes' : 'Complete Profile'}
              </>
            )}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
