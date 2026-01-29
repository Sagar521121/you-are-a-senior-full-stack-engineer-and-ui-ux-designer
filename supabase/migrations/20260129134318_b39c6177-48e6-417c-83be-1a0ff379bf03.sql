-- Fix 1: Add access control to get_user_university function
-- This function should only return data for the calling user's own profile
-- The RLS policy already uses this function correctly - it only calls it with auth.uid()
-- But we should restrict the function to only work with auth.uid() to prevent abuse

CREATE OR REPLACE FUNCTION public.get_user_university(user_uuid UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- Only return university if querying own profile
  -- This prevents enumeration attacks while still allowing RLS to work
  SELECT university FROM public.profiles 
  WHERE user_id = user_uuid 
  AND user_uuid = auth.uid()
  LIMIT 1;
$$;

-- Fix 2: Add explicit SELECT policy on reports table to prevent access
-- Reports should never be readable by regular users - only by admins or service role
CREATE POLICY "Reports are not viewable by users"
ON public.reports
FOR SELECT
USING (false);

-- Fix 3: For the profiles exposure issue - this is by design for a dating app
-- Users need to see other profiles to match with them
-- However, we should note this is intentional for the app's core functionality
-- The existing policy already restricts to same-university users only