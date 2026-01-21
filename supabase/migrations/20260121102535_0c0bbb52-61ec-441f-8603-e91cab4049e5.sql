-- Create custom types
CREATE TYPE public.gender_type AS ENUM ('boy', 'girl');
CREATE TYPE public.year_type AS ENUM ('1st', '2nd', '3rd', '4th');
CREATE TYPE public.preference_type AS ENUM ('same', 'different', 'any');
CREATE TYPE public.invite_status AS ENUM ('pending', 'accepted', 'rejected');

-- Profiles table (no photos as per requirement)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  gender gender_type NOT NULL,
  year year_type NOT NULL,
  stream TEXT NOT NULL,
  university TEXT NOT NULL,
  fun_prompt TEXT,
  is_premium BOOLEAN DEFAULT false,
  daily_invites_used INTEGER DEFAULT 0,
  last_invite_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- User preferences table
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  preferred_year preference_type DEFAULT 'any',
  preferred_stream preference_type DEFAULT 'any',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Invites table (for prom invitations)
CREATE TABLE public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status invite_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(from_user_id, to_user_id)
);

-- Matches table (created when both users accept)
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user1_id, user2_id)
);

-- Messages table for chat
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Skipped profiles (to avoid showing again)
CREATE TABLE public.skipped_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skipped_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, skipped_user_id)
);

-- Reports table for safety
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Blocked users table
CREATE TABLE public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  blocked_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, blocked_user_id)
);

-- Event settings table (for prom date, countdown, etc.)
CREATE TABLE public.event_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prom_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Insert default event settings (prom date 3 months from now)
INSERT INTO public.event_settings (prom_date) VALUES (now() + interval '3 months');

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skipped_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles from same university" ON public.profiles
  FOR SELECT USING (
    university = (SELECT university FROM public.profiles WHERE user_id = auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for user_preferences
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences" ON public.user_preferences
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for invites
CREATE POLICY "Users can view their own invites" ON public.invites
  FOR SELECT USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can send invites" ON public.invites
  FOR INSERT WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Users can update invites sent to them" ON public.invites
  FOR UPDATE USING (to_user_id = auth.uid());

-- RLS Policies for matches
CREATE POLICY "Users can view their own matches" ON public.matches
  FOR SELECT USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Authenticated users can insert matches" ON public.matches
  FOR INSERT WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their matches" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches 
      WHERE id = match_id 
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their matches" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.matches 
      WHERE id = match_id 
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

-- RLS Policies for skipped_profiles
CREATE POLICY "Users can view their skipped profiles" ON public.skipped_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can skip profiles" ON public.skipped_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for reports
CREATE POLICY "Users can submit reports" ON public.reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- RLS Policies for blocked_users
CREATE POLICY "Users can view their blocked list" ON public.blocked_users
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can block users" ON public.blocked_users
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unblock users" ON public.blocked_users
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for event_settings (public read)
CREATE POLICY "Anyone can view event settings" ON public.event_settings
  FOR SELECT USING (true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invites_updated_at
  BEFORE UPDATE ON public.invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to reset daily invites
CREATE OR REPLACE FUNCTION public.reset_daily_invites()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_invite_reset_date < CURRENT_DATE THEN
    NEW.daily_invites_used = 0;
    NEW.last_invite_reset_date = CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reset_daily_invites_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.reset_daily_invites();