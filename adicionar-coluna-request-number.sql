-- =====================================================
-- ADICIONAR COLUNA request_number NA TABELA requests
-- =====================================================

-- Adicionar coluna request_number
ALTER TABLE requests 
ADD COLUMN IF NOT EXISTS request_number TEXT;

-- Adicionar coluna outros_descricao
ALTER TABLE requests 
ADD COLUMN IF NOT EXISTS outros_descricao TEXT;

-- Criar índice único para request_number (apenas se a coluna existir e tiver valores)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_requests_request_number 
-- ON requests(request_number);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'requests'
  AND column_name IN ('request_number', 'outros_descricao');

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
