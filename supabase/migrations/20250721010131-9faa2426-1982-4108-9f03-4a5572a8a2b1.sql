
-- Remover o campo papel da tabela usuarios
ALTER TABLE public.usuarios DROP COLUMN papel;

-- Atualizar a função is_admin para usar apenas tipo_usuario
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

-- Atualizar a função handle_new_user para remover papel
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.usuarios (id, nome_completo, email, tipo_usuario, atualizado_em)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        new.email,
        'cliente',  -- tipo_usuario padrão
        now()       -- atualizado_em
    );
    RETURN new;
END;
$function$;

-- Atualizar a função get_current_user_role para retornar apenas tipo_usuario
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
DECLARE
  user_tipo text;
BEGIN
  SELECT tipo_usuario::text INTO user_tipo 
  FROM public.usuarios 
  WHERE id = auth.uid();
  
  RETURN user_tipo;
END;
$function$;

-- Atualizar a função make_user_admin para usar apenas tipo_usuario
CREATE OR REPLACE FUNCTION public.make_user_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.usuarios 
  SET tipo_usuario = 'gestor'
  WHERE email = user_email;
END;
$function$;
