
-- Adicionar índices para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo_usuario ON usuarios(tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_atualizado_em ON usuarios(atualizado_em);
CREATE INDEX IF NOT EXISTS idx_registro_peso_usuario_data ON registro_peso(usuario_id, data_registro);
CREATE INDEX IF NOT EXISTS idx_registro_hidratacao_usuario_data ON registro_hidratacao(usuario_id, horario);
CREATE INDEX IF NOT EXISTS idx_informacoes_nutricionais_usuario_data ON informacoes_nutricionais(usuario_id, data_registro);

-- Adicionar trigger para atualizar updated_at em todas as tabelas relevantes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas que precisam
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Adicionar políticas RLS para as tabelas que faltam
ALTER TABLE informacoes_nutricionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE registro_exercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE registro_medidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE objetivos_usuario ENABLE ROW LEVEL SECURITY;

-- Políticas para informacoes_nutricionais
DROP POLICY IF EXISTS "Usuarios podem gerenciar suas proprias informacoes nutricionais" ON informacoes_nutricionais;
CREATE POLICY "Usuarios podem gerenciar suas proprias informacoes nutricionais"
ON informacoes_nutricionais FOR ALL
USING (auth.uid() = usuario_id OR is_admin());

-- Políticas para registro_exercicios
DROP POLICY IF EXISTS "Usuarios podem gerenciar seus proprios exercicios" ON registro_exercicios;
CREATE POLICY "Usuarios podem gerenciar seus proprios exercicios"
ON registro_exercicios FOR ALL
USING (auth.uid() = usuario_id OR is_admin());

-- Políticas para registro_medidas
DROP POLICY IF EXISTS "Usuarios podem gerenciar suas proprias medidas" ON registro_medidas;
CREATE POLICY "Usuarios podem gerenciar suas proprias medidas"
ON registro_medidas FOR ALL
USING (auth.uid() = usuario_id OR is_admin());

-- Políticas para metas_usuario
DROP POLICY IF EXISTS "Usuarios podem gerenciar suas proprias metas" ON metas_usuario;
CREATE POLICY "Usuarios podem gerenciar suas proprias metas"
ON metas_usuario FOR ALL
USING (auth.uid() = usuario_id OR is_admin());

-- Políticas para objetivos_usuario
DROP POLICY IF EXISTS "Usuarios podem gerenciar seus proprios objetivos" ON objetivos_usuario;
CREATE POLICY "Usuarios podem gerenciar seus proprios objetivos"
ON objetivos_usuario FOR ALL
USING (auth.uid() = usuario_id OR is_admin());

-- Função para calcular estatísticas de usuários
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE(
  total_usuarios INTEGER,
  total_clientes INTEGER,
  total_socios INTEGER,
  total_gestores INTEGER,
  total_dependentes INTEGER,
  usuarios_ativos_30_dias INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_usuarios,
    COUNT(CASE WHEN tipo_usuario = 'cliente' THEN 1 END)::INTEGER as total_clientes,
    COUNT(CASE WHEN tipo_usuario = 'socio' THEN 1 END)::INTEGER as total_socios,
    COUNT(CASE WHEN tipo_usuario = 'gestor' THEN 1 END)::INTEGER as total_gestores,
    COUNT(CASE WHEN tipo_usuario = 'dependente' THEN 1 END)::INTEGER as total_dependentes,
    COUNT(CASE WHEN atualizado_em >= NOW() - INTERVAL '30 days' THEN 1 END)::INTEGER as usuarios_ativos_30_dias
  FROM usuarios
  WHERE deletado_em IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter dados do dashboard de um usuário
CREATE OR REPLACE FUNCTION get_user_dashboard_data(user_id UUID)
RETURNS TABLE(
  peso_atual NUMERIC,
  ultimo_peso NUMERIC,
  meta_peso NUMERIC,
  meta_calorias INTEGER,
  meta_agua INTEGER,
  calorias_hoje NUMERIC,
  agua_hoje INTEGER,
  registros_peso_30_dias INTEGER,
  registros_nutricao_30_dias INTEGER,
  registros_agua_30_dias INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.peso_atual_kg,
    (SELECT rp.peso_kg FROM registro_peso rp WHERE rp.usuario_id = user_id AND rp.deletado_em IS NULL ORDER BY rp.data_registro DESC LIMIT 1),
    m.peso_objetivo,
    m.calorias_diarias,
    m.agua_diaria_ml,
    COALESCE((SELECT SUM(inf.calorias) FROM informacoes_nutricionais inf WHERE inf.usuario_id = user_id AND inf.data_registro::date = CURRENT_DATE AND inf.deletado_em IS NULL), 0),
    COALESCE((SELECT SUM(rh.quantidade_ml) FROM registro_hidratacao rh WHERE rh.usuario_id = user_id AND rh.horario::date = CURRENT_DATE AND rh.deletado_em IS NULL), 0)::INTEGER,
    (SELECT COUNT(*) FROM registro_peso rp WHERE rp.usuario_id = user_id AND rp.data_registro >= CURRENT_DATE - INTERVAL '30 days' AND rp.deletado_em IS NULL)::INTEGER,
    (SELECT COUNT(*) FROM informacoes_nutricionais inf WHERE inf.usuario_id = user_id AND inf.data_registro >= CURRENT_DATE - INTERVAL '30 days' AND inf.deletado_em IS NULL)::INTEGER,
    (SELECT COUNT(DISTINCT rh.horario::date) FROM registro_hidratacao rh WHERE rh.usuario_id = user_id AND rh.horario >= CURRENT_DATE - INTERVAL '30 days' AND rh.deletado_em IS NULL)::INTEGER
  FROM usuarios u
  LEFT JOIN metas_usuario m ON m.usuario_id = u.id
  WHERE u.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
