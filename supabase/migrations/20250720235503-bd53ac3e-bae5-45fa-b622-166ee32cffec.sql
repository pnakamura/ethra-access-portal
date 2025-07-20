-- Adicionar coluna email à tabela usuarios
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS email text;