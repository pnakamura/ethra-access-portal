-- PHASE 1: CRITICAL RLS POLICY IMPLEMENTATION (URGENT)

-- Enable RLS on tables that lack it and create policies

-- 1. ASSINATURAS - Users can only see their own subscriptions
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions" 
ON public.assinaturas 
FOR SELECT 
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert their own subscriptions" 
ON public.assinaturas 
FOR INSERT 
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own subscriptions" 
ON public.assinaturas 
FOR UPDATE 
USING (auth.uid() = usuario_id);

CREATE POLICY "Admins can manage all subscriptions" 
ON public.assinaturas 
FOR ALL 
USING (is_admin());

-- 2. DEPENDENTES - Users can only see dependents they manage
ALTER TABLE public.dependentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their dependents" 
ON public.dependentes 
FOR SELECT 
USING (auth.uid() = usuario_id OR is_admin());

CREATE POLICY "Users can create dependents" 
ON public.dependentes 
FOR INSERT 
WITH CHECK (auth.uid() = usuario_id AND can_manage_dependents());

CREATE POLICY "Users can update their dependents" 
ON public.dependentes 
FOR UPDATE 
USING (auth.uid() = usuario_id OR is_admin());

CREATE POLICY "Users can delete their dependents" 
ON public.dependentes 
FOR DELETE 
USING (auth.uid() = usuario_id OR is_admin());

-- 3. LEMBRETES_AUTOMATICOS - Users see only their reminders
ALTER TABLE public.lembretes_automaticos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reminders" 
ON public.lembretes_automaticos 
FOR ALL 
USING (auth.uid() = usuario_id);

-- 4. NOTIFICACOES - Users see only their notification settings
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notifications" 
ON public.notificacoes 
FOR ALL 
USING (auth.uid() = usuario_id);

-- 5. PAGAMENTOS - CRITICAL - Users see only their payment records
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments" 
ON public.pagamentos 
FOR SELECT 
USING (auth.uid() = usuario_id);

CREATE POLICY "Admins can view all payments" 
ON public.pagamentos 
FOR SELECT 
USING (is_admin());

CREATE POLICY "System can insert payments" 
ON public.pagamentos 
FOR INSERT 
WITH CHECK (true); -- Payments are created by the system

CREATE POLICY "Admins can update payments" 
ON public.pagamentos 
FOR UPDATE 
USING (is_admin());

-- 6. PLANOS - Public read, admin manage
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans" 
ON public.planos 
FOR SELECT 
USING (ativo = true AND deletado_em IS NULL);

CREATE POLICY "Admins can manage all plans" 
ON public.planos 
FOR ALL 
USING (is_admin());

-- 7. RELATORIOS_SEMANAIS - Users see only their health reports
ALTER TABLE public.relatorios_semanais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports" 
ON public.relatorios_semanais 
FOR SELECT 
USING (auth.uid() = usuario_id);

CREATE POLICY "System can create reports" 
ON public.relatorios_semanais 
FOR INSERT 
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Admins can view all reports" 
ON public.relatorios_semanais 
FOR SELECT 
USING (is_admin());

-- 8. USUARIOS_ADMIN - Only admins can access admin settings
ALTER TABLE public.usuarios_admin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage admin settings" 
ON public.usuarios_admin 
FOR ALL 
USING (is_admin());

-- 9. VINCULOS_USUARIOS - Users see only their relationships
ALTER TABLE public.vinculos_usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their relationships" 
ON public.vinculos_usuarios 
FOR SELECT 
USING (auth.uid() = usuario_id OR auth.uid() = usuario_principal_id OR is_admin());

CREATE POLICY "Principals can create relationships" 
ON public.vinculos_usuarios 
FOR INSERT 
WITH CHECK (auth.uid() = usuario_principal_id AND can_manage_dependents());

CREATE POLICY "Principals can update their relationships" 
ON public.vinculos_usuarios 
FOR UPDATE 
USING (auth.uid() = usuario_principal_id OR is_admin());

CREATE POLICY "Principals can delete their relationships" 
ON public.vinculos_usuarios 
FOR DELETE 
USING (auth.uid() = usuario_principal_id OR is_admin());

-- 10. WHATSAPP_LINKS - Users see only their WhatsApp links
ALTER TABLE public.whatsapp_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own WhatsApp links" 
ON public.whatsapp_links 
FOR ALL 
USING (auth.uid() = usuario_id OR is_admin());