-- Add interests column to profiles table (stored as text array)
ALTER TABLE public.profiles
ADD COLUMN interests text[] DEFAULT '{}';

-- Create an index for faster interest-based queries
CREATE INDEX idx_profiles_interests ON public.profiles USING GIN(interests);