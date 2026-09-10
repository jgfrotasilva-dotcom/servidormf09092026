-- =====================================================
-- ADICIONAR COLUNAS NA TABELA requests
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- Adicionar coluna request_number (número automático do requerimento)
ALTER TABLE requests 
ADD COLUMN IF NOT EXISTS request_number TEXT;

-- Adicionar coluna outros_descricao (descrição detalhada para tipo OUTROS)
ALTER TABLE requests 
ADD COLUMN IF NOT EXISTS outros_descricao TEXT;

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
