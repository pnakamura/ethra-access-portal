-- Create function to check if a gestor can access a user through vinculos_usuarios
CREATE OR REPLACE FUNCTION public.can_gestor_access_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_user_type text;
BEGIN
  -- Get current user type
  SELECT tipo_usuario::text INTO current_user_type 
  FROM public.usuarios 
  WHERE id = auth.uid();
  
  -- If current user is socio, they can access anyone
  IF current_user_type = 'socio' THEN
    RETURN true;
  END IF;
  
  -- If current user is gestor, check if target user is linked to them
  IF current_user_type = 'gestor' THEN
    -- Can access themselves
    IF target_user_id = auth.uid() THEN
      RETURN true;
    END IF;
    
    -- Can access users linked to them in vinculos_usuarios
    RETURN EXISTS (
      SELECT 1 FROM public.vinculos_usuarios 
      WHERE usuario_principal_id = auth.uid() 
        AND usuario_id = target_user_id 
        AND ativo = true
    );
  END IF;
  
  -- For other user types, only themselves
  RETURN target_user_id = auth.uid();
END;
$function$