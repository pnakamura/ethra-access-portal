-- Fix RLS policies to allow socios and gestores to view user data
-- Socios can view all users, gestores can view their linked users
-- 
-- IMPORTANT: Execute this SQL in your Supabase SQL Editor
-- (Project Settings > Database > SQL Editor)

-- Drop existing policies for informacoes_nutricionais
DROP POLICY IF EXISTS "Usuarios podem ver seus proprios dados nutricionais" ON public.informacoes_nutricionais;
DROP POLICY IF EXISTS "Usuarios podem inserir seus proprios dados nutricionais" ON public.informacoes_nutricionais;
DROP POLICY IF EXISTS "Usuarios podem atualizar seus proprios dados nutricionais" ON public.informacoes_nutricionais;
DROP POLICY IF EXISTS "Usuarios podem deletar seus proprios dados nutricionais" ON public.informacoes_nutricionais;

-- Create new policies for informacoes_nutricionais using can_gestor_access_user
CREATE POLICY "Users can view nutrition data they have access to"
ON public.informacoes_nutricionais
FOR SELECT
USING (public.can_gestor_access_user(usuario_id));

CREATE POLICY "Users can insert their own nutrition data"
ON public.informacoes_nutricionais
FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update nutrition data they have access to"
ON public.informacoes_nutricionais
FOR UPDATE
USING (public.can_gestor_access_user(usuario_id));

CREATE POLICY "Users can delete nutrition data they have access to"
ON public.informacoes_nutricionais
FOR DELETE
USING (public.can_gestor_access_user(usuario_id));

-- Fix policies for registro_peso
DROP POLICY IF EXISTS "Usuarios podem gerenciar seus proprios registros de peso" ON public.registro_peso;

CREATE POLICY "Users can view weight records they have access to"
ON public.registro_peso
FOR SELECT
USING (public.can_gestor_access_user(usuario_id));

CREATE POLICY "Users can insert their own weight records"
ON public.registro_peso
FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update weight records they have access to"
ON public.registro_peso
FOR UPDATE
USING (public.can_gestor_access_user(usuario_id));

CREATE POLICY "Users can delete weight records they have access to"
ON public.registro_peso
FOR DELETE
USING (public.can_gestor_access_user(usuario_id));

-- Fix policies for registro_hidratacao
DROP POLICY IF EXISTS "Usuarios podem gerenciar seus proprios registros de hidratacao" ON public.registro_hidratacao;

CREATE POLICY "Users can view hydration records they have access to"
ON public.registro_hidratacao
FOR SELECT
USING (public.can_gestor_access_user(usuario_id));

CREATE POLICY "Users can insert their own hydration records"
ON public.registro_hidratacao
FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update hydration records they have access to"
ON public.registro_hidratacao
FOR UPDATE
USING (public.can_gestor_access_user(usuario_id));

CREATE POLICY "Users can delete hydration records they have access to"
ON public.registro_hidratacao
FOR DELETE
USING (public.can_gestor_access_user(usuario_id));

-- Fix policies for registro_exercicios
DROP POLICY IF EXISTS "Usuarios podem gerenciar seus proprios registros de exercicios" ON public.registro_exercicios;

CREATE POLICY "Users can view exercise records they have access to"
ON public.registro_exercicios
FOR SELECT
USING (public.can_gestor_access_user(usuario_id));

CREATE POLICY "Users can insert their own exercise records"
ON public.registro_exercicios
FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update exercise records they have access to"
ON public.registro_exercicios
FOR UPDATE
USING (public.can_gestor_access_user(usuario_id));

CREATE POLICY "Users can delete exercise records they have access to"
ON public.registro_exercicios
FOR DELETE
USING (public.can_gestor_access_user(usuario_id));

-- Fix policies for metas_usuario
DROP POLICY IF EXISTS "Usuarios podem ver suas proprias metas" ON public.metas_usuario;
DROP POLICY IF EXISTS "Usuarios podem atualizar suas proprias metas" ON public.metas_usuario;

CREATE POLICY "Users can view goals they have access to"
ON public.metas_usuario
FOR SELECT
USING (public.can_gestor_access_user(usuario_id));

CREATE POLICY "Users can insert their own goals"
ON public.metas_usuario
FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update goals they have access to"
ON public.metas_usuario
FOR UPDATE
USING (public.can_gestor_access_user(usuario_id));

CREATE POLICY "Users can delete goals they have access to"
ON public.metas_usuario
FOR DELETE
USING (public.can_gestor_access_user(usuario_id));
