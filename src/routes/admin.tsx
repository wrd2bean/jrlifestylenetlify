import { type FormEvent, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  LoaderCircle,
  LogOut,
  Package2,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  Video,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  type AdminSessionState,
  deleteProduct,
  fetchAdminProducts,
  fetchAdminStoreSettings,
  fetchOrders,
  getCurrentAdminSession,
  saveStoreSettings,
  signInAdmin,
  signOutAdmin,
  updateOrderStatus,
} from "@/lib/admin";
import {
  defaultStoreSettings,
  formatMoney,
  getPrimaryImage,
  getPrimaryVideo,
  getProductBadge,
  getShortDescription,
  hasSupabaseEnv,
  type OrderRecord,
  type OrderStatus,
  type StoreProduct,
  type StoreSettings,
} from "@/lib/catalog";
import { ProductFormDialog } from "@/components/admin/product-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin Dashboard — JR Lifestyle" },
      { name: "description", content: "Manage JR Lifestyle products, shipping, checkout, and customer orders." },
    ],
  }),
});

function AdminPage() {
  const isConfigured = hasSupabaseEnv();
  const [authLoading, setAuthLoading] = useState(isConfigured);
  const [adminSession, setAdminSession] = useState<AdminSessionState | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(defaultStoreSettings());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);

  const categories = Array.from(new Set(products.map((product) => product.category))).sort();
  const filteredProducts = products.filter((product) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });
  const visibleOrders = orders.filter((order) => order.paymentStatus === "paid");

  async function loadDashboard() {
    setIsRefreshing(true);
    setDashboardError(null);

    try {
      const [nextProducts, nextOrders, nextSettings] = await Promise.all([
        fetchAdminProducts(),
        fetchOrders(),
        fetchAdminStoreSettings(),
      ]);
      setProducts(nextProducts);
      setOrders(nextOrders);
      setSettings(nextSettings);
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : "Unable to load dashboard data.");
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    if (!isConfigured) {
      setAuthLoading(false);
      return;
    }

    let isMounted = true;

    async function bootstrap() {
      try {
        const sessionState = await getCurrentAdminSession();
        if (!isMounted) return;
        setAdminSession(sessionState);

        if (sessionState) {
          await loadDashboard();
        }
      } catch (error) {
        if (!isMounted) return;
        setDashboardError(error instanceof Error ? error.message : "Unable to initialize admin.");
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    }

    void bootstrap();

    const { data } = supabase.auth.onAuthStateChange(() => {
      void bootstrap();
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [isConfigured]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      await signInAdmin(loginForm.email, loginForm.password);
      const sessionState = await getCurrentAdminSession();

      if (!sessionState) {
        throw new Error("This account signed in, but it does not have a staff profile in the `profiles` table yet.");
      }

      setAdminSession(sessionState);
      await loadDashboard();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleLogout() {
    await signOutAdmin();
    setAdminSession(null);
    setProducts([]);
    setOrders([]);
  }

  async function handleDelete(product: StoreProduct) {
    const confirmed = window.confirm(`Delete "${product.name}"? This removes the product, images, and videos.`);
    if (!confirmed) return;

    setIsDeletingId(product.id);
    setDashboardError(null);

    try {
      await deleteProduct(product);
      await loadDashboard();
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : "Unable to delete product.");
    } finally {
      setIsDeletingId(null);
    }
  }

  async function handleOrderStatusChange(orderId: string, status: OrderStatus) {
    try {
      await updateOrderStatus(orderId, status);
      await loadDashboard();
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : "Unable to update order status.");
    }
  }

  async function handleSaveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingSettings(true);
    setDashboardError(null);

    try {
      await saveStoreSettings(settings);
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : "Unable to save store settings.");
    } finally {
      setIsSavingSettings(false);
    }
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-background px-5 py-10 text-foreground">
        <div className="mx-auto max-w-4xl space-y-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-blood">Admin Setup</p>
            <h1 className="mt-3 font-display text-5xl uppercase tracking-[0.08em] md:text-7xl">Connect Supabase</h1>
          </div>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="space-y-4 p-6 text-sm text-muted-foreground">
              <p>Add Supabase, Stripe, and optional email environment variables locally and in Netlify.</p>
              <p>Run the SQL in `supabase/migrations/20260424_ecommerce_checkout.sql` inside your Supabase project.</p>
              <p>Once connected, product, preorder, homepage feature, shipping settings, and order changes all update dynamically without a rebuild.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <LoaderCircle className="h-6 w-6 animate-spin text-blood" />
      </div>
    );
  }

  if (!adminSession) {
    return (
      <div className="min-h-screen overflow-hidden bg-background text-foreground">
        <div className="mx-auto grid min-h-screen max-w-7xl gap-12 px-5 py-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card p-8 shadow-[0_30px_90px_-35px_rgba(0,0,0,0.7)] lg:p-12">
            <div className="absolute inset-0 opacity-50" style={{ background: "radial-gradient(circle at top left, rgba(178,45,45,0.25), transparent 45%)" }} />
            <div className="relative">
              <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-blood">JR Lifestyle Backend</p>
              <h1 className="mt-4 font-display text-6xl uppercase leading-[0.9] tracking-[0.08em] md:text-8xl">
                Run the
                <br />
                brand.
              </h1>
              <p className="mt-6 max-w-xl text-base text-muted-foreground">
                Manage products, videos, preorder drops, featured homepage picks, shipping settings, and live Stripe orders in one place.
              </p>
            </div>
          </div>

          <Card className="border-border/70 bg-card/90">
            <CardContent className="p-6 sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-blood">Staff Login</p>
              <h2 className="mt-3 font-display text-4xl uppercase tracking-[0.08em]">Access Dashboard</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Use a Supabase Auth email/password account with a matching row in the `profiles` table.
              </p>
              <form className="mt-8 space-y-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="email">Email</label>
                  <Input
                    id="email"
                    type="email"
                    value={loginForm.email}
                    onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="staff@jrlifestyle.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="password">Password</label>
                  <Input
                    id="password"
                    type="password"
                    value={loginForm.password}
                    onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Enter password"
                    required
                  />
                </div>

                {loginError && (
                  <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {loginError}
                  </div>
                )}

                <Button type="submit" className="w-full gap-2 bg-blood text-white hover:bg-blood/90" disabled={isLoggingIn}>
                  {isLoggingIn && <LoaderCircle className="h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const liveProducts = products.filter((product) => product.isActive && product.status !== "draft").length;
  const preorderProducts = products.filter((product) => product.isPreorder).length;
  const featuredProduct = products.find((product) => product.featuredHomepage);
  const paidOrders = visibleOrders.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ProductFormDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        product={selectedProduct}
        onSaved={async () => {
          setSelectedProduct(null);
          await loadDashboard();
        }}
      />

      <div className="border-b border-border/70 bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-blood">Admin Dashboard</p>
            <h1 className="mt-2 font-display text-5xl uppercase tracking-[0.08em] md:text-6xl">JR Control Room</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Signed in as {adminSession.profile.fullName || adminSession.profile.email} · {adminSession.profile.role}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="gap-2" onClick={() => void loadDashboard()} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              className="gap-2 bg-blood text-white hover:bg-blood/90"
              onClick={() => {
                setSelectedProduct(null);
                setEditorOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => void handleLogout()}>
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-8 px-5 py-8">
        <div className="grid gap-4 md:grid-cols-5">
          <StatCard label="Total Products" value={String(products.length)} />
          <StatCard label="Visible Products" value={String(liveProducts)} />
          <StatCard label="Preorders" value={String(preorderProducts)} />
          <StatCard label="Paid Orders" value={String(paidOrders)} />
          <StatCard label="Featured Tee" value={featuredProduct ? "Selected" : "Unset"} />
        </div>

        {dashboardError && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {dashboardError}
          </div>
        )}

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-3xl border border-border/70 bg-card/80 p-2">
            <TabsTrigger value="products" className="rounded-2xl px-4 py-2">Products</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-2xl px-4 py-2">Orders</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-2xl px-4 py-2">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <Card className="border-border/70 bg-card/80">
              <CardContent className="grid gap-4 p-5 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search products..." className="pl-9" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="sold_out">Sold out</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden border-border/70 bg-card/80">
                  <CardContent className="p-0">
                    <div className="grid gap-0 sm:grid-cols-[180px_1fr]">
                      <div className="bg-background/60">
                        {getPrimaryImage(product) ? (
                          <img src={getPrimaryImage(product)} alt={product.name} className="h-full min-h-52 w-full object-cover" />
                        ) : getPrimaryVideo(product) ? (
                          <video
                            src={getPrimaryVideo(product)}
                            aria-label={product.name}
                            className="h-full min-h-52 w-full object-cover"
                            autoPlay
                            muted
                            loop
                            playsInline
                          />
                        ) : (
                          <div className="flex min-h-52 items-center justify-center text-muted-foreground">No image</div>
                        )}
                      </div>
                      <div className="space-y-4 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-blood">{product.category}</p>
                            <h3 className="mt-2 font-display text-2xl uppercase tracking-[0.08em]">{product.name}</h3>
                          </div>
                          <span className="rounded-full border border-border/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-bone">
                            {getProductBadge(product) ?? "Live"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{getShortDescription(product)}</p>
                        <div className="grid grid-cols-4 gap-3 text-sm">
                          <InfoChip label="Price" value={formatMoney(product.price)} />
                          <InfoChip label="Stock" value={String(product.stockQuantity)} />
                          <InfoChip label="Images" value={String(product.images.length)} />
                          <InfoChip label="Videos" value={String(product.videos.length)} />
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {product.isPreorder && <span>Preorder enabled</span>}
                          {product.featuredHomepage && (
                            <span className="inline-flex items-center gap-1 text-bone">
                              <Star className="h-3.5 w-3.5" />
                              Featured homepage product
                            </span>
                          )}
                          {product.videos.length > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Video className="h-3.5 w-3.5" />
                              Product video attached
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <Button variant="outline" className="gap-2" onClick={() => { setSelectedProduct(product); setEditorOpen(true); }}>
                            <Package2 className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button variant="outline" className="gap-2 text-destructive hover:text-destructive" onClick={() => void handleDelete(product)} disabled={isDeletingId === product.id}>
                            {isDeletingId === product.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <Card className="border-border/70 bg-card/80">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                          Paid Stripe orders will appear here automatically after checkout succeeds.
                        </TableCell>
                      </TableRow>
                    ) : (
                      visibleOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.orderNumber}</p>
                            {order.stripeCheckoutSessionId && (
                              <p className="text-xs text-muted-foreground">{order.stripeCheckoutSessionId}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{order.customerName || "Pending Stripe details"}</p>
                            <p className="text-xs text-muted-foreground">{order.customerEmail || "No email yet"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="uppercase">{order.paymentStatus}</p>
                            <p className="text-xs text-muted-foreground">{order.stripePaymentIntentId || "No payment id yet"}</p>
                          </div>
                        </TableCell>
                        <TableCell>{order.preorder ? "Preorder" : "Standard"}</TableCell>
                        <TableCell>
                          <Select value={order.status} onValueChange={(value) => void handleOrderStatusChange(order.id, value as OrderStatus)}>
                            <SelectTrigger className="w-[150px]">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="canceled">Canceled</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{formatMoney(order.totalAmount)}</TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="border-border/70 bg-card/80">
              <CardContent className="p-6">
                <form className="space-y-6" onSubmit={handleSaveSettings}>
                  <div>
                    <p className="font-display text-3xl uppercase tracking-[0.08em]">Store Settings</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Control shipping, promo codes, delivery notes, and tax behavior for Stripe checkout.
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Flat rate shipping</label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={settings.shippingFlatRate}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            shippingFlatRate: Number(event.target.value || 0),
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Free shipping threshold</label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={settings.freeShippingThreshold ?? ""}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            freeShippingThreshold:
                              Number(event.target.value) > 0 ? Number(event.target.value) : null,
                          }))
                        }
                        placeholder="Leave blank to disable"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Estimated tax rate %</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={settings.estimatedTaxRate}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            estimatedTaxRate: Number(event.target.value || 0),
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Delivery notes</label>
                    <Textarea
                      value={settings.deliveryNotes}
                      onChange={(event) =>
                        setSettings((current) => ({
                          ...current,
                          deliveryNotes: event.target.value,
                        }))
                      }
                      className="min-h-24"
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <SettingToggle
                      title="Enable Stripe automatic tax"
                      description="Stripe will calculate taxes during checkout."
                      checked={settings.enableAutomaticTax}
                      onCheckedChange={(checked) =>
                        setSettings((current) => ({ ...current, enableAutomaticTax: checked }))
                      }
                    />
                    <SettingToggle
                      title="Allow promotion codes"
                      description="Enables Stripe Checkout promo code entry."
                      checked={settings.allowPromotionCodes}
                      onCheckedChange={(checked) =>
                        setSettings((current) => ({ ...current, allowPromotionCodes: checked }))
                      }
                    />
                  </div>

                  <Button type="submit" className="bg-blood text-white hover:bg-blood/90" disabled={isSavingSettings}>
                    {isSavingSettings && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    Save Settings
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="border-border/70 bg-card/80">
          <CardContent className="flex flex-col gap-3 p-5 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <p>Storefront updates are dynamic. Product, preorder, featured homepage, media, shipping, and Stripe order changes save to Supabase and show on the site without a Netlify rebuild.</p>
            <a href="/shop" className="inline-flex items-center gap-2 text-bone hover:text-foreground">
              View live storefront
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-border/70 bg-card/80">
      <CardContent className="p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-muted-foreground">{label}</p>
        <p className="mt-3 font-display text-4xl uppercase tracking-[0.08em] text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/40 px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
}

function SettingToggle({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </div>
    </div>
  );
}
