/**
 * Tabelas de interstícios para Evolução Funcional pela Via Não Acadêmica
 * Baseado na legislação da SEE-SP
 */

// Interstícios para PEB II (Classe Docentes)
// Formato: "NívelOrigem-NívelDestino": anos de interstício
export const PEB2_INTERSTICIOS: Record<string, number> = {
  "I-II": 4,
  "II-III": 4,
  "III-IV": 5,
  "IV-V": 5,
  "V-VI": 4,
  "VI-VII": 4,
  "VII-VIII": 4,
};

// Interstícios para DIRETOR DE ESCOLA (Classe de Suporte Pedagógico)
export const DIRETOR_INTERSTICIOS: Record<string, number> = {
  "I-II": 4,
  "II-III": 5,
  "III-IV": 6,
  "IV-V": 6,
  "V-VI": 5,
  "VI-VII": 5,
  "VII-VIII": 4,
};

/**
 * Retorna o interstício (em anos) para uma progressão de nível
 * @param position Cargo do servidor (PEB I, PEB II ou DIRETOR DE ESCOLA)
 * @param fromLevel Nível de origem (I, II, III, etc.)
 * @param toLevel Nível de destino
 * @returns Número de anos de interstício
 */
export function getIntersticio(
  position: string,
  fromLevel: string,
  toLevel: string
): number | null {
  const key = `${fromLevel}-${toLevel}`;
  
  // PEB I e PEB II usam a mesma tabela (Classe Docentes)
  if (position === "PEB I" || position === "PEB II") {
    return PEB2_INTERSTICIOS[key] || null;
  } else if (position === "DIRETOR DE ESCOLA") {
    return DIRETOR_INTERSTICIOS[key] || null;
  }
  
  return null;
}

/**
 * Calcula a data da próxima evolução baseado no nível destino da última evolução
 * @param position Cargo do servidor
 * @param lastToLevel Nível destino da última evolução
 * @param lastStartDate Data de vigência da última evolução
 * @returns Objeto com a data da próxima evolução e os níveis
 */
export function calculateNextEvolution(
  position: string,
  lastToLevel: string,
  lastStartDate: string
): {
  nextDate: string;
  nextFromLevel: string;
  nextToLevel: string;
  intersticio: number;
} | null {
  // Mapeia níveis romanos para números
  const levelMap: Record<string, number> = {
    I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8
  };
  
  const currentLevelNum = levelMap[lastToLevel];
  if (!currentLevelNum || currentLevelNum >= 8) {
    return null; // Já está no nível máximo
  }
  
  const nextLevelNum = currentLevelNum + 1;
  const nextFromLevel = lastToLevel;
  const nextToLevel = Object.keys(levelMap).find(k => levelMap[k] === nextLevelNum) || "";
  
  const intersticio = getIntersticio(position, nextFromLevel, nextToLevel);
  if (!intersticio) return null;
  
  // Calcula a data da próxima evolução
  const lastDate = new Date(lastStartDate);
  lastDate.setFullYear(lastDate.getFullYear() + intersticio);
  const nextDate = lastDate.toISOString().split("T")[0];
  
  return {
    nextDate,
    nextFromLevel,
    nextToLevel,
    intersticio
  };
}

/**
 * Retorna informações de pontuação e pesos para uma progressão
 */
export function getProgressionInfo(
  position: string,
  fromLevel: string,
  toLevel: string
): {
  pontuacao: number;
  pesoAtualizacao: number;
  pesoAperfeicoamento: number;
  pesoProducao: number;
} | null {
  // Simplificado - pode ser expandido conforme necessidade
  const key = `${fromLevel}-${toLevel}`;
  
  if (position === "PEB II") {
    const info: Record<string, { pont: number; p1: number; p2: number; p3: number }> = {
      "I-II": { pont: 35, p1: 4, p2: 4, p3: 2 },
      "II-III": { pont: 40, p1: 4, p2: 4, p3: 2 },
      "III-IV": { pont: 50, p1: 3, p2: 3, p3: 4 },
      "IV-V": { pont: 60, p1: 3, p2: 3, p3: 4 },
      "V-VI": { pont: 60, p1: 3, p2: 3, p3: 4 },
      "VI-VII": { pont: 60, p1: 3, p2: 3, p3: 4 },
      "VII-VIII": { pont: 60, p1: 3, p2: 3, p3: 4 },
    };
    return info[key] ? {
      pontuacao: info[key].pont,
      pesoAtualizacao: info[key].p1,
      pesoAperfeicoamento: info[key].p2,
      pesoProducao: info[key].p3
    } : null;
  } else if (position === "DIRETOR DE ESCOLA") {
    const info: Record<string, { pont: number; p1: number; p2: number; p3: number }> = {
      "I-II": { pont: 35, p1: 4, p2: 4, p3: 2 },
      "II-III": { pont: 40, p1: 4, p2: 4, p3: 2 },
      "III-IV": { pont: 50, p1: 3, p2: 3, p3: 4 },
      "IV-V": { pont: 60, p1: 3, p2: 3, p3: 4 },
      "V-VI": { pont: 60, p1: 3, p2: 3, p3: 4 },
      "VI-VII": { pont: 60, p1: 3, p2: 3, p3: 4 },
      "VII-VIII": { pont: 60, p1: 3, p2: 3, p3: 4 },
    };
    return info[key] ? {
      pontuacao: info[key].pont,
      pesoAtualizacao: info[key].p1,
      pesoAperfeicoamento: info[key].p2,
      pesoProducao: info[key].p3
    } : null;
  }
  
  return null;
}
