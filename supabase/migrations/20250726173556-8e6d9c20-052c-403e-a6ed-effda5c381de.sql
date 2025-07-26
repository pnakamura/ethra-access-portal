-- Habilitar Row Level Security na tabela informacoes_nutricionais
ALTER TABLE public.informacoes_nutricionais ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: usuários podem ver seus próprios dados nutricionais
CREATE POLICY "Usuarios podem ver seus proprios dados nutricionais" 
ON public.informacoes_nutricionais 
FOR SELECT 
USING (auth.uid() = usuario_id);

-- Política para INSERT: usuários podem inserir seus próprios dados nutricionais
CREATE POLICY "Usuarios podem inserir seus proprios dados nutricionais" 
ON public.informacoes_nutricionais 
FOR INSERT 
WITH CHECK (auth.uid() = usuario_id);

-- Política para UPDATE: usuários podem atualizar seus próprios dados nutricionais
CREATE POLICY "Usuarios podem atualizar seus proprios dados nutricionais" 
ON public.informacoes_nutricionais 
FOR UPDATE 
USING (auth.uid() = usuario_id);

-- Política para DELETE: usuários podem deletar seus próprios dados nutricionais
CREATE POLICY "Usuarios podem deletar seus proprios dados nutricionais" 
ON public.informacoes_nutricionais 
FOR DELETE 
USING (auth.uid() = usuario_id);