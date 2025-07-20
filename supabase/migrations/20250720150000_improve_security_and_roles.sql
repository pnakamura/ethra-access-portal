
-- Add role column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user'));

-- Create function to check if user is admin (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = $1 AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update RLS policies for profiles table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.profiles;

-- New policies: admins can see all, users can only see their own
CREATE POLICY "Users can view own profile, admins can view all" 
  ON public.profiles FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    public.is_admin()
  );

CREATE POLICY "Users can update own profile, admins can update all" 
  ON public.profiles FOR UPDATE 
  USING (
    auth.uid() = user_id OR 
    public.is_admin()
  );

CREATE POLICY "Only admins can delete profiles" 
  ON public.profiles FOR DELETE 
  USING (public.is_admin());

-- Update the handle_new_user function to fix security issues
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, email, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        new.email,
        'user'  -- Default role is user
    );
    RETURN new;
END;
$$;

-- Create an admin user function (for initial setup)
CREATE OR REPLACE FUNCTION public.make_user_admin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET role = 'admin' 
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
