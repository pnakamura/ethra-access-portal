-- Fix infinite recursion in RLS policies by creating SECURITY DEFINER functions

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.can_manage_dependents();
DROP FUNCTION IF EXISTS public.is_socio(uuid);

-- Create SECURITY DEFINER functions to bypass RLS
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

-- Drop existing policies on usuarios table
DROP POLICY IF EXISTS "Users can view own profile, admins and socios can view all" ON public.usuarios;
DROP POLICY IF EXISTS "Users can update own profile, admins can update all" ON public.usuarios;
DROP POLICY IF EXISTS "Only admins can delete users" ON public.usuarios;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.usuarios;

-- Create new simplified RLS policies
CREATE POLICY "Users can view own profile, admins and socios can view all"
ON public.usuarios
FOR SELECT
TO authenticated
USING (is_current_user(id) OR is_admin() OR is_socio());

CREATE POLICY "Users can update own profile, admins can update all"
ON public.usuarios
FOR UPDATE
TO authenticated
USING (is_current_user(id) OR is_admin());

CREATE POLICY "Only admins can delete users"
ON public.usuarios
FOR DELETE
TO authenticated
USING (is_admin());

CREATE POLICY "Users can create their own profile"
ON public.usuarios
FOR INSERT
TO authenticated
WITH CHECK (is_current_user(id));