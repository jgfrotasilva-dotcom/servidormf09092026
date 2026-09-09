import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const servers = pgTable("servers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  cpf: text("cpf").notNull().unique(),
  rgCin: text("rg_cin"),
  birthDate: text("birth_date"),
  phone: text("phone"),
  email: text("email"),
  position: text("position").notNull(),
  category: text("category").notNull(),
  // Novos campos funcionais
  faixa: text("faixa"),
  nivel: text("nivel"),
  designatedFunction: text("designated_function"), // Função designada (CGPG, GOE, VICE-DIRETOR)
  ctdStartDate: text("ctd_start_date"),
  ctdEndDate: text("ctd_end_date"),
  active: boolean("active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const atsBenefits = pgTable("ats_benefits", {
  id: uuid("id").primaryKey().defaultRandom(),
  serverId: uuid("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  quinquenioNumber: integer("quinquenio_number").notNull(), // 1, 2, 3... 10
  type: text("type").notNull(), // "1º Quinquênio", "2º Quinquênio", etc.
  startDate: text("start_date").notNull(), // Data de vigência
  doeDate: text("doe_date"), // Data do DOE
  isLast: boolean("is_last").notNull().default(false),
  nextDate: text("next_date"), // Data calculada do próximo (vigência + 1825 dias)
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const licenseCertificates = pgTable("license_certificates", {
  id: uuid("id").primaryKey().defaultRandom(),
  serverId: uuid("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  certificateNumber: text("certificate_number").notNull(),
  certificateYear: text("certificate_year").notNull(),
  acquisitionStartDate: text("acquisition_start_date").notNull(),
  acquisitionEndDate: text("acquisition_end_date").notNull(),
  doeDate: text("doe_date"),
  totalBalance: integer("total_balance").notNull().default(90),
  currentBalance: integer("current_balance").notNull().default(90),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const licenseUsages = pgTable("license_usages", {
  id: uuid("id").primaryKey().defaultRandom(),
  certificateId: uuid("certificate_id")
    .notNull()
    .references(() => licenseCertificates.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "FRUICAO" ou "PECUNIA"
  days: integer("days").notNull(),
  startDate: text("start_date"), // Para fruição
  endDate: text("end_date"), // Para fruição
  doeDate: text("doe_date"),
  year: text("year"), // Para pecúnia
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const absences = pgTable("absences", {
  id: uuid("id").primaryKey().defaultRandom(),
  serverId: uuid("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "AUSENCIA" ou "ORIENTACAO_TECNICA"
  subtype: text("subtype"), // Subtipo específico
  systemDate: text("system_date").notNull(), // Data do sistema (quando registrou)
  // Campos para AUSENCIA com período (Licença Saúde, Auxílio-Doença, Licença Prêmio)
  startDate: text("start_date"),
  endDate: text("end_date"),
  days: integer("days"),
  doeDate: text("doe_date"),
  // Campos para ORIENTACAO_TECNICA
  title: text("title"),
  location: text("location"),
  startTime: text("start_time"),
  endTime: text("end_time"),
  dateTBD: boolean("date_tbd").notNull().default(false), // Data a informar
  notes: text("notes"),
  hours: integer("hours"), // Quantidade de horas/aulas (para FALTA_AULA e FALTA_MEDICA_PARCIAL)
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const functionalEvolutions = pgTable("functional_evolutions", {
  id: uuid("id").primaryKey().defaultRandom(),
  serverId: uuid("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  evolutionNumber: integer("evolution_number").notNull(), // 1-10
  startDate: text("start_date").notNull(), // Data de vigência
  doeDate: text("doe_date"), // Data do DOE
  fromLevel: text("from_level").notNull(), // I, II, III...
  toLevel: text("to_level").notNull(), // II, III, IV...
  isLast: boolean("is_last").notNull().default(false), // É a última evolução cadastrada?
  nextEvolutionDate: text("next_evolution_date"), // Data calculada da próxima evolução
  nextFromLevel: text("next_from_level"), // Nível origem da próxima evolução
  nextToLevel: text("next_to_level"), // Nível destino da próxima evolução
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Server = typeof servers.$inferSelect;
export type NewServer = typeof servers.$inferInsert;
export type AtsBenefit = typeof atsBenefits.$inferSelect;
export type NewAtsBenefit = typeof atsBenefits.$inferInsert;
export type LicenseCertificate = typeof licenseCertificates.$inferSelect;
export type NewLicenseCertificate = typeof licenseCertificates.$inferInsert;
export type LicenseUsage = typeof licenseUsages.$inferSelect;
export type NewLicenseUsage = typeof licenseUsages.$inferInsert;
export type FunctionalEvolution = typeof functionalEvolutions.$inferSelect;
export type NewFunctionalEvolution = typeof functionalEvolutions.$inferInsert;
export type Absence = typeof absences.$inferSelect;
export type NewAbsence = typeof absences.$inferInsert;

// Catálogo de tipos de ausência
export const ABSENCE_TYPES = {
  SIMPLE: [
    { code: "FALTA_AULA", label: "Falta-Aula" },
    { code: "FALTA_MEDICA_PARCIAL", label: "Falta Médica Parcial" },
    { code: "FALTA_MEDICA_TOTAL", label: "Falta Médica Total" },
    { code: "JUSTIFICADA", label: "Justificada" },
    { code: "DOACAO_SANGUE", label: "Doação de Sangue" },
  ],
  PERIOD: [
    { code: "LICENCA_SAUDE", label: "Licença Saúde" },
    { code: "AUXILIO_DOENCA", label: "Auxílio-Doença" },
    { code: "LICENCA_PREMIO", label: "Licença Prêmio" },
  ],
} as const;

export const ABSENCE_ALL = [...ABSENCE_TYPES.SIMPLE, ...ABSENCE_TYPES.PERIOD];

// Catalog of allowed positions and categories used by the app
export const POSITIONS = [
  "AOE",
  "AUXILIAR DE LIMPEZA",
  "CUIDADOR(A)",
  "DIRETOR DE ESCOLA",
  "MERENDEIRA",
  "PEB I",
  "PEB II",
  "PEFM",
  "PROATI",
  "SECRETÁRIO DE ESCOLA",
] as const;

export const CATEGORIES = [
  { code: "A", label: "A - Efetivo" },
  { code: "ACT", label: "ACT - F" },
  { code: "CTD", label: "CTD - O" },
  { code: "CLT", label: "CLT" },
] as const;

export const DESIGNATED_FUNCTIONS = [
  { code: "CGPG", label: "CGPG - Coordenador de Gestão Pedagógica" },
  { code: "GOE", label: "GOE - Gerente de Organização Escolar" },
  { code: "VICE-DIRETOR", label: "Vice-Diretor Escolar" },
] as const;

export type Position = (typeof POSITIONS)[number];
export type CategoryCode = (typeof CATEGORIES)[number]["code"];
export type DesignatedFunctionCode = (typeof DESIGNATED_FUNCTIONS)[number]["code"];

// Tabela de Requerimentos
export const requests = pgTable("requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  serverId: uuid("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // Tipo de vantagem solicitada
  description: text("description"), // Descrição do requerimento
  status: text("status").notNull().default("pendente"), // pendente, aprovado, rejeitado
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  responseNotes: text("response_notes"), // Observações da resposta
});

export type Request = typeof requests.$inferSelect;
export type NewRequest = typeof requests.$inferInsert;
