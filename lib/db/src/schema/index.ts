import { pgTable, serial, text, numeric, integer, timestamp } from "drizzle-orm/pg-core";

export const products = pgTable("nexus_products", {
  id: serial("id").primaryKey(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  category: text("category").default("Smartphone").notNull(),
  color: text("color").default("").notNull(),
  storage: text("storage").default("").notNull(),
  imei: text("imei").default("").notNull(),
  serialNumber: text("serial_number").default("").notNull(),
  condition: text("condition").default("Novo").notNull(),
  supplier: text("supplier").default("").notNull(),
  supplierPhone: text("supplier_phone").default("").notNull(),
  purchaseValue: numeric("purchase_value", { precision: 12, scale: 2 }).notNull(),
  status: text("status").default("Disponível").notNull(),
  purchasedAt: timestamp("purchased_at", { withTimezone: true }).defaultNow().notNull(),
  imageUrl: text("image_url"),
  notes: text("notes"),
});

export const costs = pgTable("nexus_costs", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
  notes: text("notes"),
});

export const customers = pgTable("nexus_customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  cpf: text("cpf"),
  email: text("email"),
  notes: text("notes"),
});

export const suppliers = pgTable("nexus_suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
});

export const sales = pgTable("nexus_sales", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  customerName: text("customer_name").notNull(),
  phone: text("phone").default("").notNull(),
  saleValue: numeric("sale_value", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  installments: integer("installments").default(1).notNull(),
  machineFee: numeric("machine_fee", { precision: 12, scale: 2 }).default("0").notNull(),
  commission: numeric("commission", { precision: 12, scale: 2 }).default("0").notNull(),
  otherCosts: numeric("other_costs", { precision: 12, scale: 2 }).default("0").notNull(),
  netProfit: numeric("net_profit", { precision: 12, scale: 2 }).notNull(),
  soldAt: timestamp("sold_at", { withTimezone: true }).defaultNow().notNull(),
  notes: text("notes"),
});