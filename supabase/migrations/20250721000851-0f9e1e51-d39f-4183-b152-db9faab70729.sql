
-- 1. Corrigir a função handle_new_user() para inserir em usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.usuarios (id, nome_completo, email, papel, tipo_usuario, atualizado_em)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        new.email,
        'cliente',  -- papel padrão
        'cliente'   -- tipo_usuario padrão
    );
    RETURN new;
END;
$function$;

-- 2. Migrar dados existentes da tabela profiles para usuarios (se existirem)
INSERT INTO public.usuarios (id, nome_completo, email, papel, tipo_usuario, atualizado_em)
SELECT 
  p.user_id,
  p.full_name,
  p.email,
  CASE 
    WHEN p.role = 'admin' THEN 'admin'
    ELSE 'cliente'
  END as papel,
  CASE 
    WHEN p.role = 'admin' THEN 'gestor'::tipo_usuario
    ELSE 'cliente'::tipo_usuario
  END as tipo_usuario,
  now()
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.usuarios u WHERE u.id = p.user_id
);

-- 3. Atualizar as funções do sistema para usar usuarios
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = $1 AND (papel = 'admin' OR tipo_usuario = 'gestor')
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN (
    SELECT COALESCE(papel, tipo_usuario::text) FROM public.usuarios 
    WHERE id = auth.uid()
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.make_user_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.usuarios 
  SET papel = 'admin', tipo_usuario = 'gestor'
  WHERE email = user_email;
END;
$function$;

-- 4. Atualizar audit log para referenciar usuarios
ALTER TABLE public.admin_audit_log
DROP CONSTRAINT IF EXISTS admin_audit_log_admin_user_id_fkey;

ALTER TABLE public.admin_audit_log
ADD CONSTRAINT admin_audit_log_admin_user_id_fkey 
FOREIGN KEY (admin_user_id) REFERENCES public.usuarios(id);

-- 5. Atualizar políticas RLS da tabela usuarios
DROP POLICY IF EXISTS "Usuarios podem gerenciar seu proprio perfil" ON public.usuarios;

CREATE POLICY "Users can view own profile, admins can view all"
ON public.usuarios
FOR SELECT
USING (
  (auth.uid() = id) OR 
  (
    SELECT papel FROM public.usuarios WHERE id = auth.uid()
  ) = 'admin' OR
  (
    SELECT tipo_usuario FROM public.usuarios WHERE id = auth.uid()
  ) = 'gestor'
);

CREATE POLICY "Users can update own profile, admins can update all"
ON public.usuarios
FOR UPDATE
USING (
  (auth.uid() = id) OR 
  (
    SELECT papel FROM public.usuarios WHERE id = auth.uid()
  ) = 'admin' OR
  (
    SELECT tipo_usuario FROM public.usuarios WHERE id = auth.uid()
  ) = 'gestor'
);

CREATE POLICY "Only admins can delete users"
ON public.usuarios
FOR DELETE
USING (
  (
    SELECT papel FROM public.usuarios WHERE id = auth.uid()
  ) = 'admin' OR
  (
    SELECT tipo_usuario FROM public.usuarios WHERE id = auth.uid()
  ) = 'gestor'
);

CREATE POLICY "Users can create their own profile"
ON public.usuarios
FOR INSERT
WITH CHECK (auth.uid() = id);
