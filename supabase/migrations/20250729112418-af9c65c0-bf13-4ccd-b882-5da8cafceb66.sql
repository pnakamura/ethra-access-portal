-- Fix RLS policies for usuarios table to allow proper access for socios and gestores

-- Drop existing policies
DROP POLICY IF EXISTS "usuarios_select_policy" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update_policy" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_delete_policy" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_insert_policy" ON public.usuarios;

-- Create new improved policies
-- Sócios can view all users
CREATE POLICY "socios_can_view_all_users" 
ON public.usuarios 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios u 
    WHERE u.id = auth.uid() AND u.tipo_usuario = 'socio'
  )
);

-- Gestores can view users they manage + themselves
CREATE POLICY "gestores_can_view_managed_users" 
ON public.usuarios 
FOR SELECT 
USING (
  -- They are viewing themselves
  auth.uid() = id 
  OR 
  -- They are a gestor viewing a user they manage
  EXISTS (
    SELECT 1 FROM public.usuarios gu
    WHERE gu.id = auth.uid() 
    AND gu.tipo_usuario = 'gestor'
    AND (
      -- Can view linked users through vinculos_usuarios
      EXISTS (
        SELECT 1 FROM public.vinculos_usuarios vu 
        WHERE vu.usuario_principal_id = auth.uid() 
        AND vu.usuario_id = usuarios.id 
        AND vu.ativo = true
      )
      OR 
      -- Can view their own record
      usuarios.id = auth.uid()
    )
  )
);

-- Users can view their own profile
CREATE POLICY "users_can_view_own_profile" 
ON public.usuarios 
FOR SELECT 
USING (auth.uid() = id);

-- Sócios can update any user
CREATE POLICY "socios_can_update_all_users" 
ON public.usuarios 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios u 
    WHERE u.id = auth.uid() AND u.tipo_usuario = 'socio'
  )
);

-- Gestores can update users they manage + themselves
CREATE POLICY "gestores_can_update_managed_users" 
ON public.usuarios 
FOR UPDATE 
USING (
  auth.uid() = id 
  OR 
  EXISTS (
    SELECT 1 FROM public.usuarios gu
    WHERE gu.id = auth.uid() 
    AND gu.tipo_usuario = 'gestor'
    AND EXISTS (
      SELECT 1 FROM public.vinculos_usuarios vu 
      WHERE vu.usuario_principal_id = auth.uid() 
      AND vu.usuario_id = usuarios.id 
      AND vu.ativo = true
    )
  )
);

-- Users can update their own profile
CREATE POLICY "users_can_update_own_profile" 
ON public.usuarios 
FOR UPDATE 
USING (auth.uid() = id);

-- Sócios can delete any user (except themselves)
CREATE POLICY "socios_can_delete_users" 
ON public.usuarios 
FOR DELETE 
USING (
  usuarios.id != auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.usuarios u 
    WHERE u.id = auth.uid() AND u.tipo_usuario = 'socio'
  )
);

-- Gestores can delete users they manage (but not themselves)
CREATE POLICY "gestores_can_delete_managed_users" 
ON public.usuarios 
FOR DELETE 
USING (
  usuarios.id != auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.usuarios gu
    WHERE gu.id = auth.uid() 
    AND gu.tipo_usuario = 'gestor'
    AND EXISTS (
      SELECT 1 FROM public.vinculos_usuarios vu 
      WHERE vu.usuario_principal_id = auth.uid() 
      AND vu.usuario_id = usuarios.id 
      AND vu.ativo = true
    )
  )
);

-- Users can insert their own profile when registering
CREATE POLICY "users_can_insert_own_profile" 
ON public.usuarios 
FOR INSERT 
WITH CHECK (auth.uid() = id);