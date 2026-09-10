-- =====================================================
-- ATUALIZAR TABELA REQUESTS
-- Adicionar campos para número automático e descrição detalhada
-- =====================================================

-- Adicionar campo request_number (número do requerimento)
ALTER TABLE requests 
ADD COLUMN IF NOT EXISTS request_number TEXT;

-- Adicionar campo outros_descricao (descrição detalhada para tipo OUTROS)
ALTER TABLE requests 
ADD COLUMN IF NOT EXISTS outros_descricao TEXT;

-- Criar índice único para request_number
CREATE UNIQUE INDEX IF NOT EXISTS idx_requests_request_number 
ON requests(request_number);

-- =====================================================
-- MIGRAR DADOS EXISTENTES (se houver)
-- Gerar números para requerimentos existentes
-- =====================================================

-- Função para gerar número de requerimento
CREATE OR REPLACE FUNCTION generate_request_number_for_existing()
RETURNS void AS $$
DECLARE
  req RECORD;
  year_part TEXT;
  seq_num INTEGER;
  request_num TEXT;
BEGIN
  FOR req IN SELECT id, created_at FROM requests WHERE request_number IS NULL
  LOOP
    year_part := EXTRACT(YEAR FROM req.created_at)::TEXT;
    
    -- Busca próximo número sequencial para o ano
    SELECT COALESCE(
      MAX(CAST(SUBSTRING(request_number FROM 'REQ-' || year_part || '-(\d+)$') AS INTEGER)),
      0
    ) + 1
    INTO seq_num
    FROM requests
    WHERE request_number LIKE 'REQ-' || year_part || '-%';
    
    -- Formata número com 4 dígitos
    request_num := 'REQ-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
    
    -- Atualiza requerimento
    UPDATE requests
    SET request_number = request_num
    WHERE id = req.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Executa migração (comente se não quiser migrar dados existentes)
-- SELECT generate_request_number_for_existing();

-- Tornar request_number obrigatório após migração
-- ALTER TABLE requests 
-- ALTER COLUMN request_number SET NOT NULL;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar se os campos foram adicionados
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'requests'
  AND column_name IN ('request_number', 'outros_descricao');

-- Ver requerimentos com números
SELECT request_number, type, status, created_at
FROM requests
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
