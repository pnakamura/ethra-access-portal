-- Diagnostic script to check authentication issue
-- Execute this in Supabase SQL Editor

-- 1. Check if user exists in auth.users
SELECT 
  id, 
  email, 
  email_confirmed_at,
  created_at,
  updated_at,
  last_sign_in_at,
  deleted_at,
  is_sso_user,
  banned_until
FROM auth.users 
WHERE email = 'paulo.nakamura@atitude45.com.br';

-- 2. Check if user exists in public.usuarios
SELECT 
  id,
  nome,
  email,
  tipo_usuario,
  created_at
FROM public.usuarios 
WHERE email = 'paulo.nakamura@atitude45.com.br';

-- 3. Check RLS policies on usuarios table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'usuarios'
ORDER BY policyname;

-- 4. Check if can_gestor_access_user function exists
SELECT 
  proname,
  prosrc
FROM pg_proc 
WHERE proname = 'can_gestor_access_user';

-- 5. Temporarily disable RLS to check if that's the issue (for diagnostic only)
-- DO NOT leave this disabled!
-- ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;

-- If user exists in auth.users but not in public.usuarios, run this:
-- Replace the UUID with the actual auth.users id from step 1
/*
INSERT INTO public.usuarios (id, nome, email, tipo_usuario)
SELECT 
  id,
  raw_user_meta_data->>'full_name',
  email,
  'socio'
FROM auth.users
WHERE email = 'paulo.nakamura@atitude45.com.br'
ON CONFLICT (id) DO NOTHING;
*/
