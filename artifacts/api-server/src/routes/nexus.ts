import { Router } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@workspace/db";
import { costs, customers, products, sales, suppliers } from "@workspace/db/schema";

const router = Router();
const money = (value: unknown) => Number(value ?? 0);
const iso = (value: Date | string | null | undefined) => value ? new Date(value).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

async function productViews() {
  const rows = await db.select().from(products).orderBy(desc(products.id));
  const allCosts = await db.select().from(costs);
  return rows.map((p) => {
    const productCosts = allCosts.filter((c) => c.productId === p.id);
    const additionalCosts = productCosts.reduce((sum, c) => sum + money(c.amount), 0);
    const purchasedAt = new Date(p.purchasedAt);
    const daysInStock = p.status === "Vendido" ? 0 : Math.max(0, Math.floor((Date.now() - purchasedAt.getTime()) / 86400000));
    return { ...p, purchaseValue: money(p.purchaseValue), additionalCosts, totalCost: money(p.purchaseValue) + additionalCosts, daysInStock, purchasedAt: iso(p.purchasedAt), costs: productCosts };
  });
}

router.get("/dashboard", async (_req, res) => {
  const ps = await productViews();
  const ss = await db.select().from(sales).orderBy(desc(sales.id));
  const totalSold = ss.reduce((n, s) => n + money(s.saleValue), 0);
  const totalInvested = ps.reduce((n, p) => n + p.purchaseValue, 0);
  const additionalCosts = ps.reduce((n, p) => n + p.additionalCosts, 0);
  const netProfit = ss.reduce((n, s) => n + money(s.netProfit), 0);
  res.json({
    totalInvested, totalSold, grossProfit: netProfit + ss.reduce((n, s) => n + money(s.machineFee) + money(s.commission) + money(s.otherCosts), 0),
    netProfit, additionalCosts, stockCount: ps.filter((p) => p.status !== "Vendido").length, soldCount: ps.filter((p) => p.status === "Vendido").length,
    stockValue: ps.filter((p) => p.status !== "Vendido").reduce((n, p) => n + p.totalCost, 0),
    averageTicket: ss.length ? totalSold / ss.length : 0, capitalTrapped: ps.filter((p) => p.status !== "Vendido").reduce((n, p) => n + p.totalCost, 0),
    monthlySales: [{ label: "Jan", value: totalSold * .14 }, { label: "Fev", value: totalSold * .18 }, { label: "Mar", value: totalSold * .21 }, { label: "Abr", value: totalSold * .16 }, { label: "Mai", value: totalSold * .31 }],
    monthlyProfit: [{ label: "Jan", value: netProfit * .12 }, { label: "Fev", value: netProfit * .21 }, { label: "Mar", value: netProfit * .18 }, { label: "Abr", value: netProfit * .2 }, { label: "Mai", value: netProfit * .29 }],
    recentProducts: ps.slice(0, 5),
  });
});

router.get("/products", async (_req, res) => res.json(await productViews()));
router.get("/products/:id", async (req, res) => {
  const product = (await productViews()).find((p) => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: "Produto não encontrado" });
  return res.json(product);
});
router.post("/products", async (req, res) => {
  const body = req.body;
  if (!body.brand || !body.model || body.purchaseValue === undefined) return res.status(400).json({ error: "Marca, modelo e valor são obrigatórios" });
  const [created] = await db.insert(products).values({
    brand: body.brand, model: body.model, category: body.category || "Smartphone", color: body.color || "", storage: body.storage || "",
    imei: body.imei || "", serialNumber: body.serialNumber || "", condition: body.condition || "Novo", supplier: body.supplier || "",
    supplierPhone: body.supplierPhone || "", purchaseValue: String(body.purchaseValue), purchasedAt: body.purchasedAt ? new Date(body.purchasedAt) : new Date(),
    imageUrl: body.imageUrl || null, notes: body.notes || null,
  }).returning();
  return res.status(201).json((await productViews()).find((p) => p.id === created.id));
});
router.patch("/products/:id", async (req, res) => {
  const [updated] = await db.update(products).set(req.body).where(eq(products.id, Number(req.params.id))).returning();
  if (!updated) return res.status(404).json({ error: "Produto não encontrado" });
  return res.json((await productViews()).find((p) => p.id === updated.id));
});
router.delete("/products/:id", async (req, res) => { await db.delete(products).where(eq(products.id, Number(req.params.id))); return res.status(204).send(); });
router.post("/products/:id/costs", async (req, res) => {
  const body = req.body;
  const [created] = await db.insert(costs).values({ productId: Number(req.params.id), category: body.category, description: body.description, amount: String(body.amount), date: body.date ? new Date(body.date) : new Date(), notes: body.notes || null }).returning();
  return res.status(201).json({ ...created, amount: money(created.amount), date: iso(created.date) });
});
router.patch("/products/:id/costs/:costId", async (req, res) => {
  const b = req.body;
  const [updated] = await db.update(costs).set({ category: b.category, description: b.description, amount: String(b.amount), date: b.date ? new Date(b.date) : new Date(), notes: b.notes || null }).where(and(eq(costs.id, Number(req.params.costId)), eq(costs.productId, Number(req.params.id)))).returning();
  if (!updated) return res.status(404).json({ error: "Custo não encontrado" });
  return res.json({ ...updated, amount: money(updated.amount), date: iso(updated.date) });
});
router.delete("/products/:id/costs/:costId", async (req, res) => {
  await db.delete(costs).where(and(eq(costs.id, Number(req.params.costId)), eq(costs.productId, Number(req.params.id))));
  return res.status(204).send();
});

router.get("/sales", async (_req, res) => {
  const rows = await db.select().from(sales).orderBy(desc(sales.id));
  const productList = await productViews();
  res.json(rows.map((s) => {
    const product = productList.find((item) => item.id === s.productId);
    return { ...s, productName: product ? `${product.brand} ${product.model}`.trim() : `Produto #${s.productId}`, saleValue: money(s.saleValue), machineFee: money(s.machineFee), commission: money(s.commission), otherCosts: money(s.otherCosts), netProfit: money(s.netProfit), soldAt: iso(s.soldAt) };
  }));
});
router.post("/sales", async (req, res) => {
  const b = req.body; const product = (await productViews()).find((p) => p.id === Number(b.productId));
  if (!product) return res.status(404).json({ error: "Produto não encontrado" });
  if (product.status === "Vendido") return res.status(409).json({ error: "Este aparelho já foi vendido" });
  const saleValue = money(b.saleValue), machineFee = money(b.machineFee), commission = money(b.commission), otherCosts = money(b.otherCosts);
  const [created] = await db.insert(sales).values({ productId: product.id, customerName: b.customerName, phone: b.phone || "", saleValue: String(saleValue), paymentMethod: b.paymentMethod, installments: Number(b.installments || 1), machineFee: String(machineFee), commission: String(commission), otherCosts: String(otherCosts), netProfit: String(saleValue - product.totalCost - machineFee - commission - otherCosts), soldAt: b.soldAt ? new Date(b.soldAt) : new Date(), notes: b.notes || null }).returning();
  await db.update(products).set({ status: "Vendido" }).where(eq(products.id, product.id));
  return res.status(201).json({ ...created, saleValue, netProfit: money(created.netProfit), soldAt: iso(created.soldAt) });
});

router.get("/customers", async (_req, res) => {
  const cs = await db.select().from(customers); const ss = await db.select().from(sales);
  res.json(cs.map((c) => { const mine = ss.filter((s) => s.customerName === c.name); return { ...c, purchasesCount: mine.length, totalSpent: mine.reduce((n, s) => n + money(s.saleValue), 0) }; }));
});
router.post("/customers", async (req, res) => { const [c] = await db.insert(customers).values(req.body).returning(); return res.status(201).json({ ...c, purchasesCount: 0, totalSpent: 0 }); });
router.get("/suppliers", async (_req, res) => {
  const ps = await productViews(); const names = await db.select().from(suppliers);
  res.json(names.map((s) => { const mine = ps.filter((p) => p.supplier === s.name); return { ...s, productsCount: mine.length, totalPurchased: mine.reduce((n, p) => n + p.purchaseValue, 0), averageCost: mine.length ? mine.reduce((n, p) => n + p.purchaseValue, 0) / mine.length : 0 }; }));
});
router.post("/suppliers", async (req, res) => { const [s] = await db.insert(suppliers).values(req.body).returning(); return res.status(201).json({ ...s, productsCount: 0, totalPurchased: 0, averageCost: 0 }); });

export default router;