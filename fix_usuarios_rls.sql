-- Fix RLS policies for usuarios table to allow socios to view all users
-- This script should be executed in Supabase SQL Editor

-- Drop existing policies for usuarios table
DROP POLICY IF EXISTS "Usuarios podem ver seus proprios dados" ON public.usuarios;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Users can view profiles they have access to" ON public.usuarios;

-- Create new SELECT policy using can_gestor_access_user
CREATE POLICY "Users can view profiles they have access to"
ON public.usuarios
FOR SELECT
USING (public.can_gestor_access_user(id));

-- Keep existing policies for INSERT, UPDATE, DELETE (if they exist)
-- Usually only admins or the user themselves should be able to modify
DROP POLICY IF EXISTS "Users can update their own profile" ON public.usuarios;
CREATE POLICY "Users can update their own profile"
ON public.usuarios
FOR UPDATE
USING (auth.uid() = id);

-- Policy for vinculos_usuarios table to allow managers and partners to see links
DROP POLICY IF EXISTS "Users can view their own vinculos" ON public.vinculos_usuarios;
DROP POLICY IF EXISTS "Users can view vinculos they have access to" ON public.vinculos_usuarios;

CREATE POLICY "Users can view vinculos they have access to"
ON public.vinculos_usuarios
FOR SELECT
USING (
  -- User can see vinculos where they are the principal
  auth.uid() = usuario_principal_id
  OR
  -- User can see vinculos where they are linked
  auth.uid() = usuario_id
  OR
  -- Socios can see all vinculos
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND tipo_usuario = 'socio'
  )
);

-- Policy for assinaturas table
DROP POLICY IF EXISTS "Users can view their own assinaturas" ON public.assinaturas;
DROP POLICY IF EXISTS "Users can view assinaturas they have access to" ON public.assinaturas;

CREATE POLICY "Users can view assinaturas they have access to"
ON public.assinaturas
FOR SELECT
USING (public.can_gestor_access_user(usuario_id));

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('usuarios', 'vinculos_usuarios', 'assinaturas')
ORDER BY tablename, policyname;
