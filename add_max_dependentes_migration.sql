-- Migration: Add max_dependentes to planos table
-- Execute this SQL in your Lovable Cloud SQL Editor

-- Add max_dependentes column to planos table
-- NULL means unlimited dependents
ALTER TABLE public.planos 
ADD COLUMN IF NOT EXISTS max_dependentes INTEGER;

COMMENT ON COLUMN public.planos.max_dependentes IS 'Maximum number of dependents allowed for this plan. NULL means unlimited.';

-- Set default limits based on your business rules
-- Adjust these values according to your actual plan names and requirements

-- Example updates (uncomment and adjust according to your plans):
-- UPDATE public.planos SET max_dependentes = 0 WHERE nome_plano = 'Básico';
-- UPDATE public.planos SET max_dependentes = 3 WHERE nome_plano = 'Premium';
-- UPDATE public.planos SET max_dependentes = 10 WHERE nome_plano = 'Profissional';
-- UPDATE public.planos SET max_dependentes = NULL WHERE nome_plano = 'Sócio'; -- NULL = unlimited
