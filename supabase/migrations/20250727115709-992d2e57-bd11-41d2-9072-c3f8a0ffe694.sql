-- Fix infinite recursion in RLS policies by using existing security definer functions

-- 1. Fix usuarios_select_policy
DROP POLICY IF EXISTS "usuarios_select_policy" ON public.usuarios;
CREATE POLICY "usuarios_select_policy" 
ON public.usuarios 
FOR SELECT 
USING (
  is_current_user(id) OR 
  is_admin() OR 
  is_socio() OR
  (get_current_user_role() = 'gestor' AND tipo_usuario = 'dependente')
);

-- 2. Fix usuarios_update_policy  
DROP POLICY IF EXISTS "usuarios_update_policy" ON public.usuarios;
CREATE POLICY "usuarios_update_policy" 
ON public.usuarios 
FOR UPDATE 
USING (
  is_current_user(id) OR 
  is_admin() OR 
  is_socio() OR
  (get_current_user_role() = 'gestor' AND tipo_usuario = 'dependente')
);

-- 3. Fix usuarios_delete_policy
DROP POLICY IF EXISTS "usuarios_delete_policy" ON public.usuarios;
CREATE POLICY "usuarios_delete_policy" 
ON public.usuarios 
FOR DELETE 
USING (
  is_admin() OR 
  is_socio() OR
  (get_current_user_role() = 'gestor' AND tipo_usuario = 'dependente')
);