
-- Corrigir a função handle_new_user() para incluir o valor correto para atualizado_em
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
        'cliente',  -- tipo_usuario padrão
        now()       -- atualizado_em
    );
    RETURN new;
END;
$function$;
