/**
 * Valida CPF brasileiro
 */
export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  
  if (digits.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(digits)) return false;
  
  // Valida primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits.charAt(9))) return false;
  
  // Valida segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits.charAt(10))) return false;
  
  return true;
}

/**
 * Valida email
 */
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida telefone brasileiro
 */
export function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11;
}

/**
 * Valida data de nascimento
 */
export function validateBirthDate(dateStr: string): boolean {
  if (!dateStr) return false;
  
  const normalized = dateStr.trim();
  
  // Formato brasileiro dd/mm/yyyy
  const brMatch = normalized.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    const dayNum = parseInt(day);
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    // Valida ranges
    if (dayNum < 1 || dayNum > 31) return false;
    if (monthNum < 1 || monthNum > 12) return false;
    if (yearNum < 1900 || yearNum > new Date().getFullYear()) return false;
    
    // Cria data e valida
    const date = new Date(Date.UTC(yearNum, monthNum - 1, dayNum));
    if (isNaN(date.getTime())) return false;
    
    // Verifica se a data é válida (ex: 31/02 não existe)
    if (date.getUTCDate() !== dayNum || date.getUTCMonth() !== monthNum - 1) {
      return false;
    }
  } else {
    // Formato ISO ou outro
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return false;
  }
  
  // Verifica se a data não é futura
  const today = new Date();
  const date = new Date(normalized);
  if (date > today) return false;
  
  // Verifica se a pessoa tem menos de 120 anos
  const maxDate = new Date();
  maxDate.setFullYear(today.getFullYear() - 120);
  if (date < maxDate) return false;
  
  return true;
}
