import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, Bell, Boxes, BriefcaseBusiness,
  Check, ChevronRight, CircleDollarSign, ClipboardList, Clock3, FileDown, FileText,
  LayoutDashboard, Menu, PackagePlus, Pencil, Plus, RefreshCw, Search, Settings,
  ShoppingCart, Store, Sun, Moon, Trash2, TrendingUp, Truck, UsersRound, X, Zap,
} from 'lucide-react';
import {
  getGetDashboardQueryKey, getGetProductQueryKey, getListCustomersQueryKey,
  getListProductsQueryKey, getListSalesQueryKey, getListSuppliersQueryKey,
  useAddProductCost, useCreateCustomer, useCreateProduct, useCreateSale,
  useCreateSupplier, useDeleteProduct, useGetDashboard, useGetProduct,
  useListCustomers, useListProducts, useListSales, useListSuppliers, useUpdateProduct,
  useUpdateProductCost, useDeleteProductCost,
} from '@workspace/api-client-react';
import type { Product } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import NotFound from '@/pages/not-found';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';
import nexusLogo from '@assets/16976e3f-a9cd-457f-ad51-8d2576d8c16c_1787591283004.png';

const queryClient = new QueryClient();
const money = (value = 0) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
const date = (value?: string) => value ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(value)) : '—';
const fullDate = (value?: string) => value ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value)) : '—';
const initials = (value = '') => value.split(' ').slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'NX';
const titleCase = (value = '') => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const currentPeriod = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'manhã';
  if (hour < 18) return 'tarde';
  return 'noite';
};
const currentDateLabel = () => new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()).toUpperCase();
const isSoldStatus = (status = '') => {
  const normalized = status.toLowerCase();
  return normalized.includes('sold') || normalized.includes('vendid');
};
const preparePhoto = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(reader.error);
  reader.onload = () => {
    const image = new Image();
    image.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    image.onload = () => {
      const maxSize = 1600;
      const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    image.src = String(reader.result || '');
  };
  reader.readAsDataURL(file);
});

type ToastMessage = { text: string; tone?: 'success' | 'error' };

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [lightTheme, setLightTheme] = useState(() => localStorage.getItem('inexus-theme') === 'light');
  useEffect(() => {
    document.documentElement.classList.toggle('light', lightTheme);
    localStorage.setItem('inexus-theme', lightTheme ? 'light' : 'dark');
  }, [lightTheme]);
  const nav = [
    { href: '/', label: 'Visão geral', icon: LayoutDashboard },
    { href: '/estoque', label: 'Estoque', icon: Boxes },
    { href: '/vendas', label: 'Vendas', icon: ShoppingCart },
    { href: '/financeiro', label: 'Financeiro', icon: CircleDollarSign },
    { href: '/clientes', label: 'Clientes', icon: UsersRound },
    { href: '/fornecedores', label: 'Fornecedores', icon: Truck },
  ];
  const secondary = [
    { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
    { href: '/gerencia', label: 'Gerência', icon: BriefcaseBusiness },
    { href: '/configuracoes', label: 'Configurações', icon: Settings },
  ];
  const active = (href: string) => href === '/' ? location === '/' : location.startsWith(href);
  return (
    <div className="app-shell app-noise">
      <aside className="sidebar">
        <Link href="/" className="brand" data-testid="link-brand">
          <span className="brand-logo-wrap"><img src={nexusLogo} alt="iNexus" className="brand-logo" /></span>
        </Link>
        <div className="section-label">Operação</div>
        <nav className="nav-list">
          {nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`nav-item ${active(href) ? 'active' : ''}`} data-testid={`link-nav-${label.toLowerCase().replace(' ', '-')}`}><Icon size={16} /><span>{label}</span></Link>)}
        </nav>
        <div className="section-label">Inteligência</div>
        <nav className="nav-list">
          {secondary.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`nav-item ${active(href) ? 'active' : ''}`} data-testid={`link-nav-${label.toLowerCase()}`}><Icon size={16} /><span>{label}</span></Link>)}
        </nav>
        <div className="sidebar-footer">
          <div className="store-card">
            <div className="store-avatar">NX</div>
            <div><div className="store-name">Sua loja</div><div className="store-location">Configure sua operação</div></div>
            <ChevronRight size={14} className="muted" style={{ marginLeft: 'auto' }} />
          </div>
        </div>
      </aside>
      <main className="main-stage">
        <header className="topbar">
          <div className="mono muted" style={{ fontSize: 10 }}>{currentDateLabel()} <span style={{ margin: '0 8px', color: '#4f5560' }}>/</span> OPERAÇÃO EM TEMPO REAL</div>
          <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <button className="icon-btn" data-testid="button-notifications" title="Notificações"><Bell size={17} /></button>
            <button className="icon-btn theme-toggle" onClick={() => setLightTheme((current) => !current)} title={lightTheme ? 'Usar tema escuro' : 'Usar tema claro'} aria-label={lightTheme ? 'Usar tema escuro' : 'Usar tema claro'} data-testid="button-toggle-theme">{lightTheme ? <Moon size={17} /> : <Sun size={17} />}</button>
            <Link href="/vendas?novo=1" className="btn btn-primary" data-testid="link-quick-sale"><Plus size={15} /> Nova venda</Link>
            <div className="store-avatar" style={{ width: 29, height: 29, borderRadius: 7 }}>NX</div>
          </div>
        </header>
        {children}
      </main>
      <nav className="mobile-nav">
        {[nav[0], nav[1], nav[2], nav[4], secondary[2]].map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={active(href) ? 'active' : ''} data-testid={`link-mobile-${label.toLowerCase()}`}><Icon size={17} /><span>{label}</span></Link>)}
      </nav>
    </div>
  );
}

function PageHeading({ eyebrow, title, desc, action }: { eyebrow: string; title: string; desc: string; action?: ReactNode }) {
  return <div className="page-heading animate-in"><div><div className="eyebrow">{eyebrow}</div><h1 className="page-title">{title}</h1><p className="page-desc">{desc}</p></div>{action}</div>;
}

function Card({ children, className = '', ...props }: { children: ReactNode; className?: string; [key: string]: unknown }) {
  return <section className={`card ${className}`} {...props}>{children}</section>;
}

function Kpi({ label, value, icon: Icon, meta, positive = true, testId }: { label: string; value: string; icon: typeof TrendingUp; meta?: string; positive?: boolean; testId: string }) {
  return <Card className="kpi-card animate-in" data-testid={testId}><div className="kpi-top"><span>{label}</span><Icon className="kpi-icon" /></div><div className="kpi-value" data-testid={`${testId}-value`}>{value}</div>{meta && <div className={`kpi-meta ${positive ? 'positive' : 'negative'}`}><span>{positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}</span>{meta}</div>}</Card>;
}

function LoadingBlock() {
  return <div className="kpi-grid" data-testid="loading-dashboard">{[1, 2, 3, 4].map((item) => <div className="card kpi-card" key={item}><div className="skeleton" style={{ height: 12, width: '58%' }} /><div className="skeleton" style={{ height: 26, width: '72%', marginTop: 22 }} /><div className="skeleton" style={{ height: 10, width: '42%', marginTop: 11 }} /></div>)}</div>;
}

function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return <div className="empty" data-testid="empty-state"><ClipboardList size={25} /><strong>{title}</strong><p>{text}</p>{action}</div>;
}

function DashboardPage() {
  const { data, isLoading, isError, refetch } = useGetDashboard();
  if (isLoading) return <div className="content-wrap"><PageHeading eyebrow="Painel de comando" title="Visão geral" desc="Acompanhe o pulso da sua operação." /><LoadingBlock /></div>;
  if (isError) return <div className="content-wrap"><PageHeading eyebrow="Painel de comando" title="Visão geral" desc="Não foi possível carregar os indicadores." /><EmptyState title="Conexão interrompida" text="Tente novamente para reconectar aos dados da operação." action={<button className="btn btn-primary" onClick={() => refetch()} data-testid="button-retry-dashboard"><RefreshCw size={14} /> Tentar novamente</button>} /></div>;
  const dashboard = data;
  const months = dashboard?.monthlySales ?? [];
  const profits = dashboard?.monthlyProfit ?? [];
  const max = Math.max(...months.map((item) => item.value), 1);
  return <div className="content-wrap">
    <PageHeading eyebrow="Painel de comando" title={`Sua operação nesta ${currentPeriod()}.`} desc="Cadastre sua operação para acompanhar seus resultados." action={<Link href="/vendas?novo=1" className="btn btn-primary" data-testid="link-dashboard-sale"><Plus size={15} /> Registrar venda</Link>} />
    <div className="kpi-grid">
      <Kpi label="Valor em estoque" value={money(dashboard?.stockValue)} icon={Boxes} meta={`${dashboard?.stockCount ?? 0} aparelhos disponíveis`} testId="kpi-stock" />
      <Kpi label="Vendas no período" value={money(dashboard?.totalSold)} icon={ShoppingCart} meta={`${dashboard?.soldCount ?? 0} vendas registradas`} testId="kpi-sales" />
      <Kpi label="Lucro líquido" value={money(dashboard?.netProfit)} icon={TrendingUp} meta={`${money(dashboard?.grossProfit)} bruto acumulado`} testId="kpi-profit" />
      <Kpi label="Capital parado" value={money(dashboard?.capitalTrapped)} icon={Clock3} meta="Atenção ao giro" positive={false} testId="kpi-trapped" />
    </div>
    <div className="grid-2-1" style={{ marginTop: 12 }}>
      <Card className="section-card animate-in delay-1">
        <div className="card-head"><div><h2 className="card-title">Ritmo de vendas</h2><div className="card-subtitle">Receita realizada nos últimos meses</div></div><span className="tag mono">6 MESES</span></div>
        {months.length ? <><div className="chart" data-testid="chart-monthly-sales">{months.map((item, index) => <div className="bar-group" key={`${item.label}-${index}`}><div className="bar" style={{ height: `${Math.max((item.value / max) * 88, 5)}%` }} /><span className="bar-label">{item.label}</span></div>)}</div><div className="legend"><span><i className="legend-dot" /> Receita</span><span className="muted">ticket médio {money(dashboard?.averageTicket)}</span></div></> : <EmptyState title="Sem dados de vendas" text="As métricas aparecerão quando a primeira venda for registrada." action={<Link href="/vendas?novo=1" className="btn btn-secondary">Registrar venda</Link>} />}
      </Card>
      <Card className="section-card animate-in delay-2">
        <div className="card-head"><div><h2 className="card-title">Margem líquida</h2><div className="card-subtitle">Evolução do resultado</div></div><TrendingUp size={17} className="kpi-icon" /></div>
        <div className="stat-big">{money(dashboard?.netProfit)}</div>
        <div className="muted" style={{ fontSize: 10, marginTop: 5 }}>resultado acumulado</div>
        <div style={{ marginTop: 25, display: 'grid', gap: 14 }}>{(profits.length ? profits.slice(-3) : [{ label: '—', value: 0 }]).map((item, index) => <div key={`${item.label}-${index}`}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, fontSize: 10 }}><span className="muted">{item.label}</span><span className="mono">{money(item.value)}</span></div><div className="progress-track"><div className="progress-fill" style={{ width: `${Math.max(Math.min((item.value / Math.max(...profits.map((metric) => metric.value), 1)) * 100, 100), 4)}%` }} /></div></div>)}</div>
        <Link href="/relatorios" className="btn btn-ghost" style={{ marginTop: 20, paddingLeft: 0 }} data-testid="link-dashboard-reports">Ver análise completa <ChevronRight size={14} /></Link>
      </Card>
    </div>
    <div className="grid-1-1" style={{ marginTop: 12, gridTemplateColumns: '1fr' }}>
      <Card className="section-card animate-in delay-3"><div className="card-head"><div><h2 className="card-title">Radar operacional</h2><div className="card-subtitle">Pontos que pedem sua atenção</div></div><AlertTriangle size={17} className="kpi-icon" /></div>
        <div className="alert-list"><div className="alert-item"><AlertTriangle size={16} className="alert-icon" /><div><strong>Capital em estoque</strong><p>{money(dashboard?.capitalTrapped)} ainda está imobilizado em aparelhos sem venda.</p></div></div><div className="alert-item"><Clock3 size={16} className="alert-icon" /><div><strong>Giro de inventário</strong><p>{dashboard?.stockCount ?? 0} itens ativos. Revise os aparelhos acima de 30 dias.</p></div></div></div>
      </Card>
    </div>
  </div>;
}

function Modal({ title, description, onClose, children }: { title: string; description: string; onClose: () => void; children: ReactNode }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="modal" role="dialog" aria-modal="true"><div className="modal-head"><div><h2 className="modal-title">{title}</h2><p className="modal-desc">{description}</p></div><button className="icon-btn" onClick={onClose} data-testid="button-close-modal"><X size={17} /></button></div><div className="modal-body">{children}</div></div></div>;
}

type ProductFormData = { brand: string; model: string; category: string; color: string; storage: string; imei: string; serialNumber: string; condition: string; supplier: string; supplierPhone: string; purchaseValue: string; purchasedAt: string; imageUrl: string; notes: string };
const emptyProduct: ProductFormData = { brand: '', model: '', category: 'Smartphone', color: '', storage: '', imei: '', serialNumber: '', condition: 'Novo', supplier: '', supplierPhone: '', purchaseValue: '', purchasedAt: new Date().toISOString().slice(0, 10), imageUrl: '', notes: '' };

function ProductForm({ onClose, onSaved }: { onClose: () => void; onSaved: (message: string) => void }) {
  const [form, setForm] = useState<ProductFormData>(emptyProduct);
  const create = useCreateProduct();
  const set = (key: keyof ProductFormData, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const choosePhoto = async (file?: File) => {
    if (!file) return;
    try { set('imageUrl', await preparePhoto(file)); } catch { /* browser will keep the current form state */ }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.brand.trim() || !form.model.trim() || !form.purchaseValue) return;
    const { purchaseValue, imageUrl, notes, ...rest } = form;
    create.mutate({ data: { ...rest, purchaseValue: Number(purchaseValue), ...(imageUrl ? { imageUrl } : {}), ...(notes ? { notes } : {}) } }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); onSaved('Aparelho adicionado ao estoque.'); onClose(); },
    });
  };
  return <form onSubmit={submit}><div className="form-grid">
    <Field label="Marca *" value={form.brand} onChange={(value) => set('brand', value)} placeholder="Apple, Samsung..." testId="input-product-brand" />
    <Field label="Modelo *" value={form.model} onChange={(value) => set('model', value)} placeholder="iPhone 15 Pro" testId="input-product-model" />
    <Field label="Categoria" value={form.category} onChange={(value) => set('category', value)} placeholder="Smartphone" testId="input-product-category" />
    <Field label="Armazenamento" value={form.storage} onChange={(value) => set('storage', value)} placeholder="256GB" testId="input-product-storage" />
    <Field label="Cor" value={form.color} onChange={(value) => set('color', value)} placeholder="Titânio natural" testId="input-product-color" />
    <Field label="Condição" value={form.condition} onChange={(value) => set('condition', value)} placeholder="Novo ou usado" testId="input-product-condition" />
    <Field label="IMEI" value={form.imei} onChange={(value) => set('imei', value)} placeholder="Opcional" testId="input-product-imei" />
    <Field label="Número de série" value={form.serialNumber} onChange={(value) => set('serialNumber', value)} placeholder="Opcional" testId="input-product-serial" />
    <Field label="Fornecedor" value={form.supplier} onChange={(value) => set('supplier', value)} placeholder="Nome do fornecedor" testId="input-product-supplier" />
    <Field label="Telefone do fornecedor" value={form.supplierPhone} onChange={(value) => set('supplierPhone', value)} placeholder="(11) 99999-0000" testId="input-product-supplier-phone" />
    <Field label="Custo de compra *" value={form.purchaseValue} onChange={(value) => set('purchaseValue', value)} placeholder="0,00" type="number" testId="input-product-purchase-value" />
    <Field label="Data de compra" value={form.purchasedAt} onChange={(value) => set('purchasedAt', value)} type="date" testId="input-product-purchased-at" />
    <Field label="URL da imagem (opcional)" value={form.imageUrl.startsWith('data:') ? 'Foto selecionada' : form.imageUrl} onChange={(value) => set('imageUrl', value)} placeholder="Ou cole uma URL" testId="input-product-image" full />
    <label className="field-group full photo-picker"><span className="field-label">Anexar foto do aparelho</span><input className="field" type="file" accept="image/*" onChange={(event) => choosePhoto(event.target.files?.[0])} data-testid="input-product-photo" />{form.imageUrl.startsWith('data:') && <span className="field-hint">Foto pronta para salvar neste aparelho.</span>}</label>
    <Field label="Observações" value={form.notes} onChange={(value) => set('notes', value)} placeholder="Detalhes importantes sobre o aparelho" testId="input-product-notes" full textarea />
  </div><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={onClose} data-testid="button-cancel-product">Cancelar</button><button type="submit" className="btn btn-primary" disabled={create.isPending} data-testid="button-submit-product">{create.isPending ? 'Salvando...' : <><PackagePlus size={14} /> Adicionar aparelho</>}</button></div></form>;
}

function Field({ label, value, onChange, placeholder, type = 'text', testId, full = false, textarea = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; testId: string; full?: boolean; textarea?: boolean }) {
  return <label className={`field-group ${full ? 'full' : ''}`}><span className="field-label">{label}</span>{textarea ? <textarea className="field" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} data-testid={testId} /> : <input className="field" type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} data-testid={testId} />}</label>;
}

function ProductThumb({ product }: { product: Product }) {
  return <div className="product-thumb">{product.imageUrl ? <img src={product.imageUrl} alt={`${product.brand} ${product.model}`} /> : initials(product.brand)}</div>;
}

function InventoryPage() {
  const [location] = useLocation();
  const { data, isLoading, isError, refetch } = useListProducts();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('stock');
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const products = data ?? [];
  const filtered = useMemo(() => products.filter((product) => {
    const haystack = `${product.brand} ${product.model} ${product.imei ?? ''} ${product.supplier ?? ''}`.toLowerCase();
    const status = (product.status || '').toLowerCase();
    return haystack.includes(search.toLowerCase()) && (filter === 'all' || (filter === 'stock' ? !isSoldStatus(status) : isSoldStatus(status)));
  }), [products, search, filter]);
  useEffect(() => { if (location.includes('novo=1')) setModal(true); }, [location]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), 2800); return () => clearTimeout(timer); }, [toast]);
  return <div className="content-wrap"><PageHeading eyebrow="Operação / inventário" title="Estoque" desc={`${products.length} aparelhos no catálogo. Controle o custo real de cada unidade.`} action={<button className="btn btn-primary" onClick={() => setModal(true)} data-testid="button-new-product"><Plus size={15} /> Adicionar aparelho</button>} />
    <Card className="section-card animate-in"><div className="toolbar"><div className="search"><Search size={15} /><input className="field" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por modelo, IMEI ou fornecedor..." data-testid="input-search-products" /></div><select className="select" style={{ width: 145 }} value={filter} onChange={(event) => setFilter(event.target.value)} data-testid="select-product-filter"><option value="stock">Em estoque</option><option value="all">Todos os itens</option><option value="sold">Vendidos</option></select><span className="tag mono">{filtered.length} RESULTADOS</span></div>
      {isLoading ? <div className="list">{[1, 2, 3, 4].map((item) => <div className="list-row" key={item}><div className="skeleton" style={{ width: 36, height: 36 }} /><div className="skeleton" style={{ width: '42%', height: 12 }} /></div>)}</div> : isError ? <EmptyState title="Estoque indisponível" text="Não conseguimos consultar seus aparelhos agora." action={<button className="btn btn-primary" onClick={() => refetch()} data-testid="button-retry-products">Tentar novamente</button>} /> : filtered.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Aparelho</th><th>Identificação</th><th>Fornecedor</th><th>Custo total</th><th>Tempo</th><th>Status</th><th /></tr></thead><tbody>{filtered.map((product) => <tr key={product.id} data-testid={`row-product-${product.id}`}><td><Link href={`/estoque/${product.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'inherit', textDecoration: 'none' }} data-testid={`link-product-${product.id}`}><ProductThumb product={product} /><span><strong style={{ display: 'block', fontSize: 11 }}>{product.brand} {product.model}</strong><span className="muted" style={{ fontSize: 10 }}>{product.color || 'Cor não informada'} · {product.storage || '—'}</span></span></Link></td><td><span className="mono muted">{product.imei || product.serialNumber || 'sem IMEI'}</span></td><td>{product.supplier || <span className="muted">Não informado</span>}</td><td className="mono">{money(product.totalCost || product.purchaseValue)}</td><td><span className={product.daysInStock > 30 ? 'negative' : 'muted'}>{product.daysInStock ?? 0} dias</span></td><td><span className={`status ${isSoldStatus(product.status) ? 'status-sold' : 'status-stock'}`}>{titleCase(product.status || 'Em estoque')}</span></td><td><Link href={`/estoque/${product.id}`} className="icon-btn" data-testid={`button-view-product-${product.id}`}><ChevronRight size={15} /></Link></td></tr>)}</tbody></table></div> : <EmptyState title={search ? 'Nada encontrado' : 'Seu estoque está vazio'} text={search ? 'Tente outro termo ou limpe a busca.' : 'Adicione o primeiro aparelho para começar a controlar custos e margem.'} action={!search ? <button className="btn btn-primary" onClick={() => setModal(true)} data-testid="button-empty-new-product"><Plus size={14} /> Adicionar aparelho</button> : undefined} />}
    </Card>{modal && <Modal title="Adicionar aparelho" description="Cadastre a unidade com seu custo de entrada." onClose={() => setModal(false)}><ProductForm onClose={() => setModal(false)} onSaved={(text) => setToast({ text, tone: 'success' })} /></Modal>}{toast && <div className="toast-note" data-testid="status-product-toast"><Check size={14} style={{ color: '#8cdec4', verticalAlign: 'middle', marginRight: 8 }} />{toast.text}</div>}</div>;
}

function ProductDetailPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data: product, isLoading, isError, refetch } = useGetProduct(id);
  const [editing, setEditing] = useState(false);
  const [costModal, setCostModal] = useState(false);
  const [editingCost, setEditingCost] = useState<number | null>(null);
  const [toast, setToast] = useState('');
  const update = useUpdateProduct();
  const remove = useDeleteProduct();
  const addCost = useAddProductCost();
  const updateCost = useUpdateProductCost();
  const deleteCost = useDeleteProductCost();
  const [form, setForm] = useState({ brand: '', model: '', color: '', storage: '', category: '', status: '', purchaseValue: '', imageUrl: '', notes: '' });
  const [cost, setCost] = useState({ category: 'Logística', description: '', amount: '', date: new Date().toISOString().slice(0, 10), notes: '' });
  useEffect(() => { if (product) setForm({ brand: product.brand, model: product.model, color: product.color ?? '', storage: product.storage ?? '', category: product.category ?? '', status: product.status ?? 'in_stock', purchaseValue: String(product.purchaseValue), imageUrl: product.imageUrl ?? '', notes: product.notes ?? '' }); }, [product]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 2600); return () => clearTimeout(timer); }, [toast]);
  if (isLoading) return <div className="content-wrap"><PageHeading eyebrow="Estoque / detalhe" title="Carregando aparelho" desc="Buscando informações da unidade." /><div className="card section-card skeleton" style={{ height: 230 }} /></div>;
  if (isError || !product) return <div className="content-wrap"><PageHeading eyebrow="Estoque / detalhe" title="Aparelho não encontrado" desc="Esse registro pode ter sido removido." /><EmptyState title="Registro indisponível" text="Volte ao estoque e escolha outro aparelho." action={<Link href="/estoque" className="btn btn-primary">Voltar ao estoque</Link>} /></div>;
  const save = (event: FormEvent) => { event.preventDefault(); update.mutate({ id, data: { ...form, purchaseValue: Number(form.purchaseValue) } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(id) }); queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); setEditing(false); setToast('Aparelho atualizado.'); } }); };
  const submitCost = (event: FormEvent) => { event.preventDefault(); if (!cost.description || !cost.amount) return; const data = { ...cost, amount: Number(cost.amount) }; const done = () => { queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(id) }); queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); setCostModal(false); setEditingCost(null); setCost({ ...cost, description: '', amount: '', notes: '' }); setToast(editingCost ? 'Custo atualizado.' : 'Custo adicional registrado.'); }; if (editingCost) updateCost.mutate({ id, costId: editingCost, data }, { onSuccess: done }); else addCost.mutate({ id, data }, { onSuccess: done }); };
  const choosePhoto = async (file?: File) => { if (!file) return; try { const imageUrl = await preparePhoto(file); setForm((current) => ({ ...current, imageUrl })); } catch { /* browser will keep the current form state */ } };
  const startEditCost = (item: NonNullable<typeof product.costs>[number]) => { setEditingCost(item.id); setCost({ category: item.category, description: item.description, amount: String(item.amount), date: item.date.slice(0, 10), notes: item.notes ?? '' }); setCostModal(true); };
  const removeCost = (costId: number) => { if (!window.confirm('Excluir este custo adicional?')) return; deleteCost.mutate({ id, costId }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(id) }); queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); setToast('Custo excluído.'); } }); };
  const deleteItem = () => { if (!window.confirm('Excluir este aparelho do estoque?')) return; remove.mutate({ id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); setLocation('/estoque'); } }); };
  return <div className="content-wrap"><div style={{ paddingTop: 24 }}><Link href="/estoque" className="btn btn-ghost" data-testid="link-back-inventory"><ChevronRight size={15} style={{ transform: 'rotate(180deg)' }} /> Voltar ao estoque</Link></div>
    <div className="card detail-hero animate-in" style={{ marginTop: 14 }}><div className="device-visual">{product.imageUrl && <img src={product.imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: .7 }} />}</div><div><div className="detail-brand">{product.brand}</div><h1 className="detail-name">{product.model}</h1><div className="detail-meta"><span className="tag">{product.storage || 'Armazenamento não informado'}</span><span className="tag">{product.color || 'Cor não informada'}</span><span className="tag">{titleCase(product.condition || 'Condição não informada')}</span><span className={`status ${isSoldStatus(product.status) ? 'status-sold' : 'status-stock'}`}>{titleCase(product.status || 'Em estoque')}</span></div></div><div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'flex-end' }}><button className="btn btn-secondary" onClick={() => setEditing(true)} data-testid="button-edit-product"><Pencil size={14} /> Editar</button><button className="btn btn-danger" onClick={deleteItem} disabled={remove.isPending} data-testid="button-delete-product"><Trash2 size={14} /> Excluir</button></div></div>
    <div className="grid-2-1" style={{ marginTop: 12 }}><Card className="section-card"><div className="card-head"><div><h2 className="card-title">Composição do custo</h2><div className="card-subtitle">Quanto realmente foi investido nesta unidade</div></div><button className="btn btn-secondary" onClick={() => { setEditingCost(null); setCostModal(true); }} data-testid="button-add-cost"><Plus size={14} /> Adicionar custo</button></div><div className="metric-list"><div className="metric-line"><span>Compra</span><strong>{money(product.purchaseValue)}</strong></div><div className="metric-line"><span>Custos adicionais</span><strong>{money(product.additionalCosts)}</strong></div><div className="metric-line"><span>Custo total</span><strong style={{ color: 'hsl(var(--primary))' }}>{money(product.totalCost)}</strong></div><div className="metric-line"><span>Entrada no estoque</span><strong>{fullDate(product.purchasedAt)}</strong></div></div>{product.costs?.length ? <div className="cost-list">{product.costs.map((item) => <div className="cost-row" key={item.id}><div><strong>{item.description}</strong><span>{item.category} · {fullDate(item.date)}</span></div><strong className="mono">{money(item.amount)}</strong><div className="cost-actions"><button className="icon-btn" onClick={() => startEditCost(item)} title="Editar custo" data-testid={`button-edit-cost-${item.id}`}><Pencil size={13} /></button><button className="icon-btn" onClick={() => removeCost(item.id)} title="Excluir custo" data-testid={`button-delete-cost-${item.id}`}><Trash2 size={13} /></button></div></div>)}</div> : null}</Card><Card className="section-card"><div className="card-head"><div><h2 className="card-title">Identificação</h2><div className="card-subtitle">Dados para rastreabilidade</div></div><ClipboardList size={17} className="kpi-icon" /></div><div className="metric-list"><div className="metric-line"><span>IMEI</span><strong>{product.imei || 'Não informado'}</strong></div><div className="metric-line"><span>Nº de série</span><strong>{product.serialNumber || 'Não informado'}</strong></div><div className="metric-line"><span>Fornecedor</span><strong>{product.supplier || 'Não informado'}</strong></div><div className="metric-line"><span>Tempo em estoque</span><strong className={product.daysInStock > 30 ? 'negative' : ''}>{product.daysInStock} dias</strong></div></div></Card></div>
    <Card className="section-card" style={{ marginTop: 12 }}><div className="card-head"><div><h2 className="card-title">Fotos do aparelho</h2><div className="card-subtitle">Adicione ou substitua a foto desta unidade</div></div><label className="btn btn-secondary photo-button"><Plus size={14} /> Anexar foto<input type="file" accept="image/*" onChange={(event) => choosePhoto(event.target.files?.[0])} hidden /></label></div>{product.imageUrl ? <div className="photo-gallery"><img src={product.imageUrl} alt={`${product.brand} ${product.model}`} /><button className="btn btn-ghost" onClick={() => update.mutate({ id, data: { imageUrl: '' } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(id) }); setToast('Foto excluída.'); } })}><Trash2 size={14} /> Excluir foto</button></div> : <EmptyState title="Nenhuma foto anexada" text="Anexe uma foto para identificar rapidamente este aparelho." />}</Card>
    {product.notes && <Card className="section-card" style={{ marginTop: 12 }}><div className="card-title">Observações</div><p className="muted" style={{ fontSize: 12, lineHeight: 1.7, marginBottom: 0 }}>{product.notes}</p></Card>}
    {editing && <Modal title="Editar aparelho" description="Atualize os dados comerciais desta unidade." onClose={() => setEditing(false)}><form onSubmit={save}><div className="form-grid">{(['brand', 'model', 'category', 'color', 'storage', 'status', 'purchaseValue'] as const).map((key) => <Field key={key} label={titleCase(key)} value={form[key]} onChange={(value) => setForm({ ...form, [key]: value })} testId={`input-edit-${key}`} type={key === 'purchaseValue' ? 'number' : 'text'} />)}<Field label="Observações" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} testId="input-edit-notes" full textarea /><label className="field-group full photo-picker"><span className="field-label">Anexar ou trocar foto</span><input className="field" type="file" accept="image/*" onChange={(event) => choosePhoto(event.target.files?.[0])} data-testid="input-edit-photo" /></label>{form.imageUrl && <div className="photo-preview full"><img src={form.imageUrl} alt="Prévia do aparelho" /></div>}</div><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={update.isPending} data-testid="button-save-product">{update.isPending ? 'Salvando...' : 'Salvar alterações'}</button></div></form></Modal>}
    {costModal && <Modal title={editingCost ? 'Editar custo adicional' : 'Adicionar custo'} description="Registre frete, manutenção ou qualquer custo que altera a margem." onClose={() => { setCostModal(false); setEditingCost(null); }}><form onSubmit={submitCost}><div className="form-grid"><Field label="Categoria" value={cost.category} onChange={(value) => setCost({ ...cost, category: value })} testId="input-cost-category" /><Field label="Descrição *" value={cost.description} onChange={(value) => setCost({ ...cost, description: value })} placeholder="Ex: frete de entrada" testId="input-cost-description" /><Field label="Valor *" value={cost.amount} onChange={(value) => setCost({ ...cost, amount: value })} type="number" testId="input-cost-amount" /><Field label="Data" value={cost.date} onChange={(value) => setCost({ ...cost, date: value })} type="date" testId="input-cost-date" /><Field label="Notas" value={cost.notes} onChange={(value) => setCost({ ...cost, notes: value })} testId="input-cost-notes" full textarea /></div><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => { setCostModal(false); setEditingCost(null); }}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={addCost.isPending || updateCost.isPending} data-testid="button-submit-cost">{addCost.isPending || updateCost.isPending ? 'Salvando...' : editingCost ? 'Salvar custo' : 'Registrar custo'}</button></div></form></Modal>}{toast && <div className="toast-note" data-testid="status-detail-toast"><Check size={14} style={{ color: '#8cdec4', verticalAlign: 'middle', marginRight: 8 }} />{toast}</div>}</div>;
}

type SaleFormData = { productId: string; customerName: string; phone: string; saleValue: string; paymentMethod: string; installments: string; machineFee: string; commission: string; otherCosts: string; notes: string };
function SaleForm({ products, onClose, onSaved }: { products: Product[]; onClose: () => void; onSaved: () => void }) {
  const create = useCreateSale();
  const available = products.filter((product) => !isSoldStatus(product.status));
  const [form, setForm] = useState<SaleFormData>({ productId: available[0] ? String(available[0].id) : '', customerName: '', phone: '', saleValue: '', paymentMethod: 'PIX', installments: '1', machineFee: '0', commission: '0', otherCosts: '0', notes: '' });
  const set = (key: keyof SaleFormData, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => { event.preventDefault(); if (!form.productId || !form.customerName || !form.saleValue) return; const { productId, saleValue, installments, machineFee, commission, otherCosts, phone, notes, ...rest } = form; create.mutate({ data: { ...rest, productId: Number(productId), saleValue: Number(saleValue), installments: Number(installments), machineFee: Number(machineFee), commission: Number(commission), otherCosts: Number(otherCosts), ...(phone ? { phone } : {}), ...(notes ? { notes } : {}) } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListSalesQueryKey() }); queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); onSaved(); onClose(); } }); };
  return <form onSubmit={submit}><div className="form-grid"><label className="field-group full"><span className="field-label">Aparelho *</span><select className="select" value={form.productId} onChange={(event) => set('productId', event.target.value)} data-testid="select-sale-product">{available.length ? available.map((product) => <option key={product.id} value={product.id}>{product.brand} {product.model} · custo {money(product.totalCost)}</option>) : <option value="">Nenhum aparelho disponível</option>}</select></label><Field label="Cliente *" value={form.customerName} onChange={(value) => set('customerName', value)} placeholder="Nome completo" testId="input-sale-customer" /><Field label="Telefone" value={form.phone} onChange={(value) => set('phone', value)} placeholder="(11) 99999-0000" testId="input-sale-phone" /><Field label="Valor da venda *" value={form.saleValue} onChange={(value) => set('saleValue', value)} type="number" placeholder="0,00" testId="input-sale-value" /><label className="field-group"><span className="field-label">Pagamento</span><select className="select" value={form.paymentMethod} onChange={(event) => set('paymentMethod', event.target.value)} data-testid="select-sale-payment"><option>PIX</option><option>Cartão de crédito</option><option>Cartão de débito</option><option>Dinheiro</option><option>Transferência</option></select></label><Field label="Parcelas" value={form.installments} onChange={(value) => set('installments', value)} type="number" testId="input-sale-installments" /><Field label="Taxa da máquina" value={form.machineFee} onChange={(value) => set('machineFee', value)} type="number" testId="input-sale-machine-fee" /><Field label="Comissão" value={form.commission} onChange={(value) => set('commission', value)} type="number" testId="input-sale-commission" /><Field label="Outros custos" value={form.otherCosts} onChange={(value) => set('otherCosts', value)} type="number" testId="input-sale-other-costs" /><Field label="Observações" value={form.notes} onChange={(value) => set('notes', value)} testId="input-sale-notes" full textarea /></div><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={create.isPending || !available.length} data-testid="button-submit-sale">{create.isPending ? 'Registrando...' : <><ShoppingCart size={14} /> Confirmar venda</>}</button></div></form>;
}

function SalesPage() {
  const [location] = useLocation();
  const { data, isLoading, isError, refetch } = useListSales();
  const { data: products } = useListProducts();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const sales = data ?? [];
  const filtered = sales.filter((sale) => `${sale.customerName} ${sale.productName ?? ''} ${sale.phone ?? ''}`.toLowerCase().includes(search.toLowerCase()));
  useEffect(() => { if (location.includes('novo=1')) setModal(true); }, [location]);
  return <div className="content-wrap"><PageHeading eyebrow="Operação / receita" title="Vendas" desc={`${sales.length} vendas registradas. Transforme cada saída em margem acompanhada.`} action={<button className="btn btn-primary" onClick={() => setModal(true)} data-testid="button-new-sale"><Plus size={15} /> Registrar venda</button>} /><Card className="section-card animate-in"><div className="toolbar"><div className="search"><Search size={15} /><input className="field" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por cliente ou aparelho..." data-testid="input-search-sales" /></div><span className="tag mono">{filtered.length} VENDAS</span></div>{isLoading ? <div className="list">{[1, 2, 3].map((item) => <div className="list-row" key={item}><div className="skeleton" style={{ width: '45%', height: 12 }} /></div>)}</div> : isError ? <EmptyState title="Vendas indisponíveis" text="A conexão com o histórico falhou." action={<button className="btn btn-primary" onClick={() => refetch()}>Tentar novamente</button>} /> : filtered.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Data</th><th>Cliente</th><th>Aparelho</th><th>Pagamento</th><th>Venda</th><th>Lucro líquido</th></tr></thead><tbody>{filtered.map((sale) => <tr key={sale.id} data-testid={`row-sale-${sale.id}`}><td className="mono muted">{fullDate(sale.soldAt)}</td><td><strong>{sale.customerName}</strong><span className="row-detail">{sale.phone || 'Telefone não informado'}</span></td><td>{sale.productName || `Produto #${sale.productId}`}</td><td><span className="tag">{sale.paymentMethod}</span>{sale.installments && sale.installments > 1 ? <span className="muted" style={{ marginLeft: 5 }}>{sale.installments}x</span> : null}</td><td className="mono">{money(sale.saleValue)}</td><td className="mono positive">{money(sale.netProfit)}</td></tr>)}</tbody></table></div> : <EmptyState title={search ? 'Nada encontrado' : 'Ainda não há vendas'} text={search ? 'Tente outro nome ou aparelho.' : 'Registre sua primeira venda e acompanhe a margem líquida.'} action={!search ? <button className="btn btn-primary" onClick={() => setModal(true)} data-testid="button-empty-new-sale"><Plus size={14} /> Registrar venda</button> : undefined} />}</Card>{modal && <Modal title="Registrar nova venda" description="A venda atualiza o estoque e calcula o lucro líquido automaticamente." onClose={() => setModal(false)}><SaleForm products={products ?? []} onClose={() => setModal(false)} onSaved={() => undefined} /></Modal>}</div>;
}

type SimpleFormProps = { type: 'customer' | 'supplier'; onClose: () => void; onSaved: () => void };
function SimpleCreateForm({ type, onClose, onSaved }: SimpleFormProps) {
  const customer = useCreateCustomer();
  const supplier = useCreateSupplier();
  const [form, setForm] = useState({ name: '', phone: '', cpf: '', email: '', notes: '' });
  const isCustomer = type === 'customer';
  const submit = (event: FormEvent) => { event.preventDefault(); if (!form.name || !form.phone) return; if (isCustomer) { customer.mutate({ data: { name: form.name, phone: form.phone, ...(form.cpf ? { cpf: form.cpf } : {}), ...(form.email ? { email: form.email } : {}), ...(form.notes ? { notes: form.notes } : {}) } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() }); onSaved(); onClose(); } }); } else { supplier.mutate({ data: { name: form.name, phone: form.phone } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListSuppliersQueryKey() }); queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }); onSaved(); onClose(); } }); } };
  return <form onSubmit={submit}><div className="form-grid"><Field label="Nome *" value={form.name} onChange={(value) => setForm({ ...form, name: value })} placeholder={isCustomer ? 'Nome do cliente' : 'Razão social ou nome'} testId={`input-${type}-name`} /><Field label="Telefone *" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} placeholder="(11) 99999-0000" testId={`input-${type}-phone`} />{isCustomer && <><Field label="CPF" value={form.cpf} onChange={(value) => setForm({ ...form, cpf: value })} placeholder="000.000.000-00" testId="input-customer-cpf" /><Field label="E-mail" value={form.email} onChange={(value) => setForm({ ...form, email: value })} type="email" placeholder="cliente@email.com" testId="input-customer-email" /><Field label="Observações" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} testId="input-customer-notes" full textarea /></>}</div><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={customer.isPending || supplier.isPending} data-testid={`button-submit-${type}`}>{customer.isPending || supplier.isPending ? 'Salvando...' : `Adicionar ${isCustomer ? 'cliente' : 'fornecedor'}`}</button></div></form>;
}

function CustomersPage() {
  const { data, isLoading, isError, refetch } = useListCustomers();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const customers = data ?? [];
  const filtered = customers.filter((customer) => `${customer.name} ${customer.phone} ${customer.cpf ?? ''}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="content-wrap"><PageHeading eyebrow="Relacionamento" title="Clientes" desc="Histórico de compra, frequência e valor por relacionamento." action={<button className="btn btn-primary" onClick={() => setModal(true)} data-testid="button-new-customer"><Plus size={15} /> Novo cliente</button>} /><Card className="section-card animate-in"><div className="toolbar"><div className="search"><Search size={15} /><input className="field" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar cliente, telefone ou CPF..." data-testid="input-search-customers" /></div><span className="tag mono">{filtered.length} CLIENTES</span></div>{isLoading ? <LoadingRows /> : isError ? <EmptyState title="Clientes indisponíveis" text="Tente novamente para carregar sua base." action={<button className="btn btn-primary" onClick={() => refetch()}>Tentar novamente</button>} /> : filtered.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Cliente</th><th>Contato</th><th>CPF</th><th>Compras</th><th>Total investido</th><th /></tr></thead><tbody>{filtered.map((customer) => <tr key={customer.id} data-testid={`row-customer-${customer.id}`}><td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div className="product-thumb" style={{ background: 'rgba(239,133,48,.14)', color: 'hsl(var(--primary))' }}>{initials(customer.name)}</div><strong>{customer.name}</strong></div></td><td>{customer.phone}</td><td className="mono muted">{customer.cpf || '—'}</td><td className="mono">{customer.purchasesCount}</td><td className="mono">{money(customer.totalSpent)}</td><td><button className="icon-btn" title="Detalhes do cliente" data-testid={`button-customer-details-${customer.id}`}><ChevronRight size={15} /></button></td></tr>)}</tbody></table></div> : <EmptyState title="Nenhum cliente cadastrado" text="Crie uma base de clientes para acompanhar recorrência e ticket." action={<button className="btn btn-primary" onClick={() => setModal(true)}>Adicionar cliente</button>} />}</Card>{modal && <Modal title="Novo cliente" description="Registre os dados essenciais para acompanhar o relacionamento." onClose={() => setModal(false)}><SimpleCreateForm type="customer" onClose={() => setModal(false)} onSaved={() => undefined} /></Modal>}</div>;
}

function SuppliersPage() {
  const { data, isLoading, isError, refetch } = useListSuppliers();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const suppliers = data ?? [];
  const filtered = suppliers.filter((supplier) => `${supplier.name} ${supplier.phone}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="content-wrap"><PageHeading eyebrow="Compras / parceiros" title="Fornecedores" desc="Tenha clareza sobre origem, volume comprado e custo médio." action={<button className="btn btn-primary" onClick={() => setModal(true)} data-testid="button-new-supplier"><Plus size={15} /> Novo fornecedor</button>} /><Card className="section-card animate-in"><div className="toolbar"><div className="search"><Search size={15} /><input className="field" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar fornecedor..." data-testid="input-search-suppliers" /></div><span className="tag mono">{filtered.length} FORNECEDORES</span></div>{isLoading ? <LoadingRows /> : isError ? <EmptyState title="Fornecedores indisponíveis" text="Tente novamente para carregar seus parceiros." action={<button className="btn btn-primary" onClick={() => refetch()}>Tentar novamente</button>} /> : filtered.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Fornecedor</th><th>Telefone</th><th>Produtos</th><th>Total comprado</th><th>Custo médio</th><th /></tr></thead><tbody>{filtered.map((supplier) => <tr key={supplier.id} data-testid={`row-supplier-${supplier.id}`}><td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div className="product-thumb" style={{ background: 'rgba(90,155,138,.15)', color: '#8cdec4' }}>{initials(supplier.name)}</div><strong>{supplier.name}</strong></div></td><td>{supplier.phone}</td><td className="mono">{supplier.productsCount}</td><td className="mono">{money(supplier.totalPurchased)}</td><td className="mono">{money(supplier.averageCost)}</td><td><button className="icon-btn" title="Detalhes do fornecedor" data-testid={`button-supplier-details-${supplier.id}`}><ChevronRight size={15} /></button></td></tr>)}</tbody></table></div> : <EmptyState title="Nenhum fornecedor cadastrado" text="Cadastre parceiros para acompanhar concentração e custo de compra." action={<button className="btn btn-primary" onClick={() => setModal(true)}>Adicionar fornecedor</button>} />}</Card>{modal && <Modal title="Novo fornecedor" description="Salve os dados de contato para acelerar suas compras." onClose={() => setModal(false)}><SimpleCreateForm type="supplier" onClose={() => setModal(false)} onSaved={() => undefined} /></Modal>}</div>;
}

function LoadingRows() { return <div className="list">{[1, 2, 3, 4].map((item) => <div className="list-row" key={item}><div className="skeleton" style={{ width: 36, height: 36 }} /><div className="skeleton" style={{ width: '42%', height: 12 }} /></div>)}</div>; }

function FinancePage() {
  const { data: dashboard, isLoading } = useGetDashboard();
  const { data: sales } = useListSales();
  const saleList = sales ?? [];
  const fees = saleList.reduce((sum, sale) => sum + (sale.machineFee ?? 0) + (sale.commission ?? 0) + (sale.otherCosts ?? 0), 0);
  return <div className="content-wrap"><PageHeading eyebrow="Inteligência financeira" title="Financeiro" desc="Leia o resultado real: custo, receita, taxas e capital em movimento." action={<Link href="/relatorios" className="btn btn-secondary" data-testid="link-finance-reports"><FileText size={14} /> Abrir relatórios</Link>} /><div className="kpi-grid"><Kpi label="Receita total" value={money(dashboard?.totalSold)} icon={CircleDollarSign} meta={`${dashboard?.soldCount ?? 0} unidades vendidas`} testId="kpi-finance-revenue" /><Kpi label="Lucro bruto" value={money(dashboard?.grossProfit)} icon={TrendingUp} meta="antes de taxas e comissões" testId="kpi-finance-gross" /><Kpi label="Custos adicionais" value={money(dashboard?.additionalCosts)} icon={ArrowDownRight} meta="frete, reparo e operação" positive={false} testId="kpi-finance-costs" /><Kpi label="Ticket médio" value={money(dashboard?.averageTicket)} icon={ShoppingCart} meta={`taxas apuradas ${money(fees)}`} testId="kpi-finance-ticket" /></div><div className="grid-1-1" style={{ marginTop: 12 }}><Card className="section-card animate-in"><div className="card-head"><div><h2 className="card-title">Resumo do caixa</h2><div className="card-subtitle">Visão consolidada da operação</div></div><CircleDollarSign size={17} className="kpi-icon" /></div><div className="metric-list"><div className="metric-line"><span>Total investido em aparelhos</span><strong>{money(dashboard?.totalInvested)}</strong></div><div className="metric-line"><span>Valor atual em estoque</span><strong>{money(dashboard?.stockValue)}</strong></div><div className="metric-line"><span>Capital parado</span><strong className="negative">{money(dashboard?.capitalTrapped)}</strong></div><div className="metric-line"><span>Lucro líquido realizado</span><strong className="positive">{money(dashboard?.netProfit)}</strong></div></div></Card><Card className="section-card animate-in delay-1"><div className="card-head"><div><h2 className="card-title">Distribuição da receita</h2><div className="card-subtitle">Receita contra custo e resultado</div></div><BarChart3 size={17} className="kpi-icon" /></div>{isLoading ? <div className="skeleton" style={{ height: 160 }} /> : <><div style={{ display: 'flex', height: 15, borderRadius: 5, overflow: 'hidden', marginTop: 22 }}><div style={{ width: `${Math.min((dashboard?.totalInvested ?? 0) / Math.max(dashboard?.totalSold ?? 1, 1) * 100, 100)}%`, background: '#5a9b8a' }} /><div style={{ flex: 1, background: 'hsl(var(--primary))' }} /></div><div className="legend" style={{ marginTop: 20 }}><span><i className="legend-dot alt" /> custo dos produtos</span><span><i className="legend-dot" /> margem</span></div><div className="muted" style={{ fontSize: 10, lineHeight: 1.6, marginTop: 20 }}>Use o custo total, não apenas o valor de compra, para decidir seu próximo lote.</div></>}</Card></div></div>;
}

function ReportsPage() {
  const { data: dashboard } = useGetDashboard();
  const { data: sales } = useListSales();
  const exportCsv = () => { const rows = [['Data', 'Cliente', 'Aparelho', 'Valor', 'Pagamento', 'Lucro líquido'], ...(sales ?? []).map((sale) => [sale.soldAt, sale.customerName, sale.productName ?? '', String(sale.saleValue), sale.paymentMethod, String(sale.netProfit)])]; const blob = new Blob([rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(';')).join('\n')], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'iNexus-vendas.csv'; link.click(); URL.revokeObjectURL(link.href); };
  return <div className="content-wrap"><PageHeading eyebrow="Inteligência / exportação" title="Relatórios" desc="Transforme o histórico em decisões de compra e preço." action={<button className="btn btn-primary" onClick={exportCsv} data-testid="button-export-sales"><FileDown size={14} /> Exportar vendas CSV</button>} /><div className="grid-2-1"><Card className="section-card animate-in"><div className="card-head"><div><h2 className="card-title">Performance do período</h2><div className="card-subtitle">Indicadores prontos para compartilhar</div></div><BarChart3 size={17} className="kpi-icon" /></div><div className="grid-1-1" style={{ gap: 20 }}><div><div className="muted" style={{ fontSize: 10 }}>RECEITA</div><div className="stat-big" style={{ marginTop: 9 }}>{money(dashboard?.totalSold)}</div><div className="positive" style={{ fontSize: 10, marginTop: 7 }}><ArrowUpRight size={12} style={{ verticalAlign: 'middle' }} /> operação acumulada</div></div><div><div className="muted" style={{ fontSize: 10 }}>LUCRO LÍQUIDO</div><div className="stat-big" style={{ marginTop: 9 }}>{money(dashboard?.netProfit)}</div><div className="positive" style={{ fontSize: 10, marginTop: 7 }}><TrendingUp size={12} style={{ verticalAlign: 'middle' }} /> resultado real</div></div></div><div style={{ marginTop: 32 }}><div className="muted" style={{ fontSize: 10, marginBottom: 10 }}>VENDAS POR MÊS</div><div className="chart" style={{ height: 180 }}>{(dashboard?.monthlySales ?? []).map((item, index) => <div className="bar-group" key={index}><div className="bar" style={{ height: `${Math.max((item.value / Math.max(...(dashboard?.monthlySales ?? []).map((metric) => metric.value), 1)) * 88, 5)}%` }} /><span className="bar-label">{item.label}</span></div>)}</div></div></Card><Card className="section-card animate-in delay-1"><div className="card-head"><div><h2 className="card-title">Arquivos disponíveis</h2><div className="card-subtitle">Exporte dados para contabilidade</div></div><FileText size={17} className="kpi-icon" /></div><div className="alert-list"><button className="alert-item" style={{ color: 'inherit', textAlign: 'left', width: '100%' }} onClick={exportCsv} data-testid="button-report-sales"><FileDown size={16} className="alert-icon" /><div><strong>Histórico de vendas</strong><p>CSV com venda, cliente, pagamento e lucro líquido.</p></div><ChevronRight size={15} className="muted" style={{ marginLeft: 'auto' }} /></button><div className="alert-item"><ClipboardList size={16} className="alert-icon" /><div><strong>Inventário atual</strong><p>Disponível em Estoque para conferência de entrada.</p></div><ChevronRight size={15} className="muted" style={{ marginLeft: 'auto' }} /></div></div></Card></div></div>;
}

function ManagementPage() {
  const { data: dashboard } = useGetDashboard();
  const { data: products } = useListProducts();
  const aged = (products ?? []).filter((product) => product.daysInStock > 30).sort((a, b) => b.daysInStock - a.daysInStock);
  return <div className="content-wrap"><PageHeading eyebrow="Controle executivo" title="Gerência" desc="Uma leitura curta do que merece decisão hoje." action={<Link href="/estoque" className="btn btn-secondary" data-testid="link-management-stock"><Boxes size={14} /> Revisar estoque</Link>} /><div className="grid-2-1"><Card className="section-card animate-in"><div className="card-head"><div><h2 className="card-title">Alertas de giro</h2><div className="card-subtitle">Aparelhos que já pedem uma ação comercial</div></div><AlertTriangle size={17} className="kpi-icon" /></div>{aged.length ? <div className="list">{aged.slice(0, 6).map((product) => <Link href={`/estoque/${product.id}`} className="list-row" key={product.id} data-testid={`link-aged-product-${product.id}`}><ProductThumb product={product} /><div className="row-main"><div className="row-name">{product.brand} {product.model}</div><div className="row-detail">custo {money(product.totalCost)} · entrada {date(product.purchasedAt)}</div></div><span className="status status-alert">{product.daysInStock} dias</span><ChevronRight size={14} className="muted" /></Link>)}</div> : <EmptyState title="Giro saudável" text="Nenhum aparelho ultrapassou 30 dias em estoque." />}</Card><Card className="section-card animate-in delay-1"><div className="card-head"><div><h2 className="card-title">Placar da operação</h2><div className="card-subtitle">Pontos essenciais para a decisão</div></div><BriefcaseBusiness size={17} className="kpi-icon" /></div><div className="metric-list"><div className="metric-line"><span>Unidades no estoque</span><strong>{dashboard?.stockCount ?? 0}</strong></div><div className="metric-line"><span>Unidades vendidas</span><strong>{dashboard?.soldCount ?? 0}</strong></div><div className="metric-line"><span>Ticket médio</span><strong>{money(dashboard?.averageTicket)}</strong></div><div className="metric-line"><span>Lucro líquido</span><strong className="positive">{money(dashboard?.netProfit)}</strong></div></div><Link href="/financeiro" className="btn btn-secondary" style={{ marginTop: 18, width: '100%' }} data-testid="link-management-finance">Abrir financeiro <ChevronRight size={14} /></Link></Card></div></div>;
}

function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState(() => { try { return JSON.parse(localStorage.getItem('nexus-settings') || '{"alerts":true,"compact":false,"autoExport":false}') as { alerts: boolean; compact: boolean; autoExport: boolean }; } catch { return { alerts: true, compact: false, autoExport: false }; } });
  const toggle = (key: keyof typeof settings) => setSettings((current) => ({ ...current, [key]: !current[key] }));
  const save = () => { localStorage.setItem('nexus-settings', JSON.stringify(settings)); setSaved(true); setTimeout(() => setSaved(false), 2200); };
  return <div className="content-wrap"><PageHeading eyebrow="Workspace" title="Configurações" desc="Ajuste a experiência do iNexus para o seu ritmo." action={<button className="btn btn-primary" onClick={save} data-testid="button-save-settings"><Check size={14} /> Salvar preferências</button>} /><div className="grid-1-1"><Card className="section-card animate-in"><div className="card-head"><div><h2 className="card-title">Preferências de operação</h2><div className="card-subtitle">Controle alertas e a densidade das telas</div></div><Settings size={17} className="kpi-icon" /></div><div className="list"><SettingRow title="Alertas de estoque" description="Avisar quando aparelhos passarem de 30 dias." value={settings.alerts} onToggle={() => toggle('alerts')} testId="switch-alerts" /><SettingRow title="Modo compacto" description="Reduzir espaçamentos para ver mais linhas." value={settings.compact} onToggle={() => toggle('compact')} testId="switch-compact" /><SettingRow title="Exportação automática" description="Preparar relatório CSV ao fechar o dia." value={settings.autoExport} onToggle={() => toggle('autoExport')} testId="switch-auto-export" /></div></Card><Card className="section-card animate-in delay-1"><div className="card-head"><div><h2 className="card-title">Workspace ativo</h2><div className="card-subtitle">Dados da sua operação</div></div><Store size={17} className="kpi-icon" /></div><div className="metric-list"><div className="metric-line"><span>Nome da loja</span><strong>Sua loja</strong></div><div className="metric-line"><span>Localização</span><strong>Não configurada</strong></div><div className="metric-line"><span>Plano</span><strong className="positive">iNexus Pro</strong></div><div className="metric-line"><span>Sincronização</span><strong className="positive"><span style={{ display: 'inline-block', width: 6, height: 6, background: '#8cdec4', borderRadius: '50%', marginRight: 5 }} />Ativa</strong></div></div><div className="alert-item" style={{ marginTop: 18 }}><Zap size={16} className="alert-icon" /><div><strong>Seu cockpit está pronto</strong><p>Cadastre os dados da sua operação para começar.</p></div></div></Card></div>{saved && <div className="toast-note" data-testid="status-settings-saved"><Check size={14} style={{ color: '#8cdec4', verticalAlign: 'middle', marginRight: 8 }} />Preferências salvas.</div>}</div>;
}

function SettingRow({ title, description, value, onToggle, testId }: { title: string; description: string; value: boolean; onToggle: () => void; testId: string }) {
  return <div className="list-row"><div className="row-main"><div className="row-name">{title}</div><div className="row-detail">{description}</div></div><button onClick={onToggle} className={`icon-btn ${value ? 'active' : ''}`} style={{ width: 42, background: value ? 'rgba(239,133,48,.16)' : 'rgba(255,255,255,.04)', color: value ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }} data-testid={testId} aria-pressed={value}>{value ? <Check size={15} /> : <X size={15} />}</button></div>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) { const [location] = useLocation(); return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>; }
function Router() {
  return <RoutedErrorBoundary><Shell><Switch><Route path="/" component={DashboardPage} /><Route path="/estoque/:id" component={ProductDetailPage} /><Route path="/estoque" component={InventoryPage} /><Route path="/vendas" component={SalesPage} /><Route path="/financeiro" component={FinancePage} /><Route path="/clientes" component={CustomersPage} /><Route path="/fornecedores" component={SuppliersPage} /><Route path="/relatorios" component={ReportsPage} /><Route path="/gerencia" component={ManagementPage} /><Route path="/configuracoes" component={SettingsPage} /><Route component={NotFound} /></Switch></Shell></RoutedErrorBoundary>;
}
function App() { return <QueryClientProvider client={queryClient}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></QueryClientProvider>; }
export default App;