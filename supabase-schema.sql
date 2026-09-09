-- ========================================
-- SCRIPT DE CRIAÇÃO DE TABELAS
-- EE Profa. Marlene Frattini
-- Sistema de Gestão de Servidores
-- ========================================

-- Habilitar extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- TABELA: servers (Servidores)
-- ========================================
CREATE TABLE IF NOT EXISTS servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    cpf TEXT NOT NULL UNIQUE,
    rg_cin TEXT,
    birth_date TEXT,
    phone TEXT,
    email TEXT,
    position TEXT NOT NULL,
    category TEXT NOT NULL,
    faixa TEXT,
    nivel TEXT,
    designated_function TEXT,
    ctd_start_date TEXT,
    ctd_end_date TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- TABELA: ats_benefits (ATS - Quinquênios)
-- ========================================
CREATE TABLE IF NOT EXISTS ats_benefits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    quinquenio_number INTEGER NOT NULL,
    type TEXT NOT NULL,
    start_date TEXT NOT NULL,
    doe_date TEXT,
    is_last BOOLEAN NOT NULL DEFAULT false,
    next_date TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- TABELA: license_certificates (Certidões de Licença Prêmio)
-- ========================================
CREATE TABLE IF NOT EXISTS license_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    certificate_number TEXT NOT NULL,
    certificate_year TEXT NOT NULL,
    acquisition_start_date TEXT NOT NULL,
    acquisition_end_date TEXT NOT NULL,
    doe_date TEXT,
    total_balance INTEGER NOT NULL DEFAULT 90,
    current_balance INTEGER NOT NULL DEFAULT 90,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- TABELA: license_usages (Usufrutos de Licença)
-- ========================================
CREATE TABLE IF NOT EXISTS license_usages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_id UUID NOT NULL REFERENCES license_certificates(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    days INTEGER NOT NULL,
    start_date TEXT,
    end_date TEXT,
    doe_date TEXT,
    year TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- TABELA: absences (Ausências e Orientações)
-- ========================================
CREATE TABLE IF NOT EXISTS absences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    subtype TEXT,
    system_date TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    days INTEGER,
    doe_date TEXT,
    title TEXT,
    location TEXT,
    start_time TEXT,
    end_time TEXT,
    date_tbd BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- TABELA: functional_evolutions (Evoluções Funcionais)
-- ========================================
CREATE TABLE IF NOT EXISTS functional_evolutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    evolution_number INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    doe_date TEXT,
    from_level TEXT NOT NULL,
    to_level TEXT NOT NULL,
    is_last BOOLEAN NOT NULL DEFAULT false,
    next_evolution_date TEXT,
    next_from_level TEXT,
    next_to_level TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- ÍNDICES PARA MELHOR PERFORMANCE
-- ========================================

-- Índice para busca por CPF
CREATE INDEX IF NOT EXISTS idx_servers_cpf ON servers(cpf);

-- Índice para busca por categoria
CREATE INDEX IF NOT EXISTS idx_servers_category ON servers(category);

-- Índice para busca por cargo
CREATE INDEX IF NOT EXISTS idx_servers_position ON servers(position);

-- Índice para servidores ativos
CREATE INDEX IF NOT EXISTS idx_servers_active ON servers(active);

-- Índices para foreign keys
CREATE INDEX IF NOT EXISTS idx_ats_server_id ON ats_benefits(server_id);
CREATE INDEX IF NOT EXISTS idx_license_cert_server_id ON license_certificates(server_id);
CREATE INDEX IF NOT EXISTS idx_license_usage_cert_id ON license_usages(certificate_id);
CREATE INDEX IF NOT EXISTS idx_absences_server_id ON absences(server_id);
CREATE INDEX IF NOT EXISTS idx_evolutions_server_id ON functional_evolutions(server_id);

-- ========================================
-- TRIGGER PARA ATUALIZAR updated_at
-- ========================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para todas as tabelas
CREATE TRIGGER update_servers_updated_at BEFORE UPDATE ON servers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ats_benefits_updated_at BEFORE UPDATE ON ats_benefits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_license_certificates_updated_at BEFORE UPDATE ON license_certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_license_usages_updated_at BEFORE UPDATE ON license_usages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_absences_updated_at BEFORE UPDATE ON absences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_functional_evolutions_updated_at BEFORE UPDATE ON functional_evolutions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- VERIFICAÇÃO
-- ========================================

-- Listar todas as tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
