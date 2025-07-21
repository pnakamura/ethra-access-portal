-- Atualizar a função handle_new_user para incluir o campo celular
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.usuarios (id, nome_completo, email, celular, tipo_usuario, atualizado_em)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        new.email,
        COALESCE(new.raw_user_meta_data->>'phone', ''),  -- Adicionar campo celular
        'cliente',  -- tipo_usuario padrão
        now()       -- atualizado_em
    );
    RETURN new;
END;
$function$;