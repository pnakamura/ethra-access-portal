-- Update RLS policies to reflect correct hierarchy: Socio > Gestor > Cliente/Dependente

-- 1. Update usuarios_select_policy - Sócios can see all, gestores only dependents
DROP POLICY IF EXISTS "usuarios_select_policy" ON public.usuarios;
CREATE POLICY "usuarios_select_policy" 
ON public.usuarios 
FOR SELECT 
USING (
  is_current_user(id) OR 
  is_admin() OR 
  (is_socio() AND auth.uid() IS NOT NULL) OR
  (
    EXISTS (
      SELECT 1 FROM public.usuarios u 
      WHERE u.id = auth.uid() 
      AND u.tipo_usuario = 'gestor'
    ) 
    AND tipo_usuario = 'dependente'
  )
);

-- 2. Update usuarios_update_policy - Sócios can edit all, gestores only dependents
DROP POLICY IF EXISTS "usuarios_update_policy" ON public.usuarios;
CREATE POLICY "usuarios_update_policy" 
ON public.usuarios 
FOR UPDATE 
USING (
  is_current_user(id) OR 
  is_admin() OR 
  (is_socio() AND auth.uid() IS NOT NULL) OR
  (
    EXISTS (
      SELECT 1 FROM public.usuarios u 
      WHERE u.id = auth.uid() 
      AND u.tipo_usuario = 'gestor'
    ) 
    AND tipo_usuario = 'dependente'
  )
);

-- 3. Update usuarios_delete_policy - Sócios can delete all, gestores only dependents  
DROP POLICY IF EXISTS "usuarios_delete_policy" ON public.usuarios;
CREATE POLICY "usuarios_delete_policy" 
ON public.usuarios 
FOR DELETE 
USING (
  is_admin() OR 
  (is_socio() AND auth.uid() IS NOT NULL) OR
  (
    EXISTS (
      SELECT 1 FROM public.usuarios u 
      WHERE u.id = auth.uid() 
      AND u.tipo_usuario = 'gestor'
    ) 
    AND tipo_usuario = 'dependente'
  )
);

-- 4. Create helper function to check if current user can manage a specific user type
CREATE OR REPLACE FUNCTION public.can_manage_user_type(target_user_type text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_user_type text;
BEGIN
  SELECT tipo_usuario::text INTO current_user_type 
  FROM public.usuarios 
  WHERE id = auth.uid();
  
  -- Sócios podem gerenciar qualquer tipo
  IF current_user_type = 'socio' THEN
    RETURN true;
  END IF;
  
  -- Gestores podem gerenciar apenas dependentes
  IF current_user_type = 'gestor' AND target_user_type = 'dependente' THEN
    RETURN true;
  END IF;
  
  -- Admins podem gerenciar tudo
  IF current_user_type = 'gestor' AND is_admin() THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$function$;

-- 5. Create function to check hierarchy permissions
CREATE OR REPLACE FUNCTION public.has_higher_or_equal_privilege(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_user_type text;
  target_user_type text;
BEGIN
  -- Get current user type
  SELECT tipo_usuario::text INTO current_user_type 
  FROM public.usuarios 
  WHERE id = auth.uid();
  
  -- Get target user type
  SELECT tipo_usuario::text INTO target_user_type 
  FROM public.usuarios 
  WHERE id = target_user_id;
  
  -- Hierarchy: socio > gestor > cliente = dependente
  
  -- Sócios podem editar qualquer um
  IF current_user_type = 'socio' THEN
    RETURN true;
  END IF;
  
  -- Gestores podem editar apenas dependentes e clientes
  IF current_user_type = 'gestor' AND target_user_type IN ('dependente', 'cliente') THEN
    RETURN true;
  END IF;
  
  -- Clientes e dependentes podem editar apenas a si mesmos
  IF target_user_id = auth.uid() THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$function$;