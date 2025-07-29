-- Fix infinite recursion in RLS policies by using security definer functions

-- Drop the problematic policies
DROP POLICY IF EXISTS "socios_can_view_all_users" ON public.usuarios;
DROP POLICY IF EXISTS "gestores_can_view_managed_users" ON public.usuarios;
DROP POLICY IF EXISTS "users_can_view_own_profile" ON public.usuarios;
DROP POLICY IF EXISTS "socios_can_update_all_users" ON public.usuarios;
DROP POLICY IF EXISTS "gestores_can_update_managed_users" ON public.usuarios;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.usuarios;
DROP POLICY IF EXISTS "socios_can_delete_users" ON public.usuarios;
DROP POLICY IF EXISTS "gestores_can_delete_managed_users" ON public.usuarios;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON public.usuarios;

-- Create new policies using security definer functions to avoid recursion

-- SELECT policies
CREATE POLICY "socios_can_view_all_users" 
ON public.usuarios 
FOR SELECT 
USING (is_socio());

CREATE POLICY "gestores_can_view_managed_users" 
ON public.usuarios 
FOR SELECT 
USING (can_gestor_access_user(id));

CREATE POLICY "users_can_view_own_profile" 
ON public.usuarios 
FOR SELECT 
USING (auth.uid() = id);

-- UPDATE policies
CREATE POLICY "socios_can_update_all_users" 
ON public.usuarios 
FOR UPDATE 
USING (is_socio());

CREATE POLICY "gestores_can_update_managed_users" 
ON public.usuarios 
FOR UPDATE 
USING (can_gestor_access_user(id));

CREATE POLICY "users_can_update_own_profile" 
ON public.usuarios 
FOR UPDATE 
USING (auth.uid() = id);

-- DELETE policies
CREATE POLICY "socios_can_delete_users" 
ON public.usuarios 
FOR DELETE 
USING (id != auth.uid() AND is_socio());

CREATE POLICY "gestores_can_delete_managed_users" 
ON public.usuarios 
FOR DELETE 
USING (id != auth.uid() AND can_gestor_access_user(id));

-- INSERT policy
CREATE POLICY "users_can_insert_own_profile" 
ON public.usuarios 
FOR INSERT 
WITH CHECK (auth.uid() = id);