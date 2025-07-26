-- Fix infinite recursion in RLS policies - Complete cleanup and recreation
-- Step 1: Explicitly drop ALL existing policies on usuarios table
DROP POLICY IF EXISTS "Users can view own profile, admins and socios can view all" ON public.usuarios;
DROP POLICY IF EXISTS "Users can update own profile, admins can update all" ON public.usuarios; 
DROP POLICY IF EXISTS "Only admins can delete users" ON public.usuarios;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Users can view own profile, admins can view all" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios podem gerenciar seu proprio perfil" ON public.usuarios;

-- Step 2: Drop and recreate helper functions with SECURITY DEFINER
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_socio(uuid) CASCADE; 
DROP FUNCTION IF EXISTS public.can_manage_dependents() CASCADE;

-- Create is_admin function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = $1 AND tipo_usuario = 'gestor'
  );
END;
$function$;

-- Create is_socio function with SECURITY DEFINER  
CREATE OR REPLACE FUNCTION public.is_socio(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = $1 AND tipo_usuario = 'socio'
  );
END;
$function$;

-- Create can_manage_dependents function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.can_manage_dependents()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
DECLARE
  user_tipo text;
BEGIN
  SELECT tipo_usuario::text INTO user_tipo 
  FROM public.usuarios 
  WHERE id = auth.uid();
  
  RETURN user_tipo IN ('gestor', 'socio');
END;
$function$;

-- Step 3: Create completely new RLS policies for usuarios table
CREATE POLICY "usuarios_select_policy"
ON public.usuarios
FOR SELECT
TO authenticated
USING (is_current_user(id) OR is_admin() OR is_socio());

CREATE POLICY "usuarios_update_policy" 
ON public.usuarios
FOR UPDATE
TO authenticated
USING (is_current_user(id) OR is_admin());

CREATE POLICY "usuarios_delete_policy"
ON public.usuarios
FOR DELETE
TO authenticated
USING (is_admin());

CREATE POLICY "usuarios_insert_policy"
ON public.usuarios
FOR INSERT
TO authenticated
WITH CHECK (is_current_user(id));