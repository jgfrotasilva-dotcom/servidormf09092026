/**
 * Formata CPF para o padrão 000.000.000-00
 */
export function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/**
 * Formata telefone brasileiro
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
}

/**
 * Formata data no padrão brasileiro
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  
  // Normaliza a string (remove espaços extras)
  const normalized = dateStr.trim();
  
  // Verifica formato brasileiro dd/mm/yyyy
  const brMatch = normalized.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  }
  
  // Verifica formato ISO yyyy-mm-dd
  const isoMatch = normalized.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  }
  
  // Tenta parsear como Date
  const date = new Date(normalized);
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC", // Usa UTC para evitar problemas de timezone
    });
  }
  
  return dateStr;
}

/**
 * Limpa máscara de CPF
 */
export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

/**
 * Limpa máscara de telefone
 */
export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Calcula idade a partir da data de nascimento
 */
export function calculateAge(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null;
  
  // Parse da data
  const date = parseDate(birthDate);
  if (!date) return null;
  
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  
  return age >= 0 ? age : null;
}

/**
 * Parse de data flexível (aceita ISO e brasileiro)
 */
export function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  
  const normalized = dateStr.trim();
  
  // Formato brasileiro dd/mm/yyyy
  const brMatch = normalized.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
    if (!isNaN(date.getTime())) return date;
  }
  
  // Formato ISO yyyy-mm-dd
  const isoMatch = normalized.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
    if (!isNaN(date.getTime())) return date;
  }
  
  // Tenta parse direto
  const date = new Date(normalized);
  if (!isNaN(date.getTime())) return date;
  
  return null;
}

/**
 * Verifica se a data de nascimento é no mês especificado
 */
export function isBirthdayInMonth(birthDate: string | null | undefined, month: number): boolean {
  if (!birthDate) return false;
  
  const date = parseDate(birthDate);
  if (!date) return false;
  
  // getUTCMonth() retorna 0-11, month é 1-12
  return date.getUTCMonth() === month - 1;
}

/**
 * Retorna dia e mês de aniversário formatado
 */
export function formatBirthday(birthDate: string | null | undefined): string {
  if (!birthDate) return "-";
  
  const date = parseDate(birthDate);
  if (!date) return "-";
  
  const day = date.getUTCDate().toString().padStart(2, "0");
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  
  return `${day}/${month}`;
}
