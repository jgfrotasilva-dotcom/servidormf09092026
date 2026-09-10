import { db } from "@/db";
import { requests } from "@/db/schema";
import { sql } from "drizzle-orm";

/**
 * Gera próximo número de requerimento no formato REQ-YYYY-NNNN
 * Exemplo: REQ-2024-0001, REQ-2024-0002, etc.
 */
export async function generateRequestNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  
  // Busca o último requerimento do ano atual
  const result = await db
    .select({
      maxNumber: sql<number>`
        COALESCE(
          MAX(
            CAST(
              SUBSTRING(request_number FROM 'REQ-${currentYear}-(\\d+)$') AS INTEGER
            )
          ),
          0
        )
      `.mapWith(Number),
    })
    .from(requests)
    .where(sql`request_number LIKE ${`REQ-${currentYear}-%`}`);
  
  const lastNumber = result[0]?.maxNumber || 0;
  const nextNumber = lastNumber + 1;
  
  // Formata com 4 dígitos: 0001, 0002, etc.
  const formattedNumber = nextNumber.toString().padStart(4, "0");
  
  return `REQ-${currentYear}-${formattedNumber}`;
}
