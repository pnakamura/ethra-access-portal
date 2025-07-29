-- Update RLS policies for usuarios table to use the new function
ALTER POLICY "usuarios_select_policy" ON public.usuarios 
USING (
  is_current_user(id) OR 
  is_admin() OR 
  is_socio() OR 
  can_gestor_access_user(id)
);

ALTER POLICY "usuarios_update_policy" ON public.usuarios 
USING (
  is_current_user(id) OR 
  is_admin() OR 
  is_socio() OR 
  can_gestor_access_user(id)
);

ALTER POLICY "usuarios_delete_policy" ON public.usuarios 
USING (
  is_admin() OR 
  is_socio() OR 
  (get_current_user_role() = 'gestor' AND can_gestor_access_user(id) AND id != auth.uid())
);