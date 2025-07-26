-- Atualizar política RLS para usuarios - permitir que sócios vejam todos os usuários
DROP POLICY IF EXISTS "Users can view own profile, admins can view all" ON public.usuarios;

CREATE POLICY "Users can view own profile, admins and socios can view all" 
ON public.usuarios 
FOR SELECT 
USING (
  is_current_user(id) OR 
  is_admin() OR 
  (SELECT tipo_usuario FROM public.usuarios WHERE id = auth.uid()) = 'socio'
);

-- Criar função para verificar se usuário é gestor ou sócio
CREATE OR REPLACE FUNCTION public.can_manage_dependents()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  user_tipo text;
BEGIN
  SELECT tipo_usuario::text INTO user_tipo 
  FROM public.usuarios 
  WHERE id = auth.uid();
  
  RETURN user_tipo IN ('gestor', 'socio');
END;
$$;