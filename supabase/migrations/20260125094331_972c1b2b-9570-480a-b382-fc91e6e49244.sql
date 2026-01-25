-- Drop the problematic recursive SELECT policy
DROP POLICY IF EXISTS "Users can view profiles from same university" ON public.profiles;

-- Create a SECURITY DEFINER function to get user's university without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_university(user_uuid UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT university FROM public.profiles WHERE user_id = user_uuid LIMIT 1;
$$;

-- Create a new non-recursive SELECT policy using the function
CREATE POLICY "Users can view profiles from same university"
ON public.profiles FOR SELECT
USING (
  user_id = auth.uid()
  OR university = public.get_user_university(auth.uid())
);