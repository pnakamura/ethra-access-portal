
-- Remover todas as políticas RLS problemáticas da tabela usuarios
DROP POLICY IF EXISTS "Users can view own profile, admins can view all" ON public.usuarios;
DROP POLICY IF EXISTS "Users can update own profile, admins can update all" ON public.usuarios;
DROP POLICY IF EXISTS "Only admins can delete users" ON public.usuarios;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.usuarios;

-- Criar função auxiliar para verificar se é o usuário atual (evita recursão)
CREATE OR REPLACE FUNCTION public.is_current_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN auth.uid() = user_id;
END;
$function$;

-- Corrigir a função get_current_user_role para evitar recursão
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
DECLARE
  user_papel text;
  user_tipo text;
BEGIN
  -- Fazer uma única consulta para buscar os valores
  SELECT papel, tipo_usuario::text INTO user_papel, user_tipo 
  FROM public.usuarios 
  WHERE id = auth.uid();
  
  -- Retornar o papel se existir, senão o tipo_usuario
  RETURN COALESCE(user_papel, user_tipo);
END;
$function$;

-- Recriar políticas RLS usando apenas funções SECURITY DEFINER (sem recursão)
CREATE POLICY "Users can view own profile, admins can view all"
ON public.usuarios
FOR SELECT
USING (
  public.is_current_user(id) OR 
  public.is_admin()
);

CREATE POLICY "Users can update own profile, admins can update all"
ON public.usuarios
FOR UPDATE
USING (
  public.is_current_user(id) OR 
  public.is_admin()
);

CREATE POLICY "Only admins can delete users"
ON public.usuarios
FOR DELETE
USING (public.is_admin());

CREATE POLICY "Users can create their own profile"
ON public.usuarios
FOR INSERT
WITH CHECK (public.is_current_user(id));

-- Verificar se as políticas foram aplicadas corretamente
SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'usuarios' AND schemaname = 'public';
