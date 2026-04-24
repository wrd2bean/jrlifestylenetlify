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
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  type AdminSessionState,
  deleteProduct,
  fetchAdminProducts,
  fetchOrders,
  getCurrentAdminSession,
  signInAdmin,
  signOutAdmin,
} from "@/lib/admin";
import {
  formatMoney,
  getPrimaryImage,
  getProductBadge,
  getShortDescription,
  hasSupabaseEnv,
  type OrderRecord,
  type StoreProduct,
} from "@/lib/catalog";
import { ProductFormDialog } from "@/components/admin/product-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin Dashboard — JR Lifestyle" },
      { name: "description", content: "Manage JR Lifestyle products, inventory, and customer orders." },
    ],
  }),
});

function AdminPage() {
  const isConfigured = hasSupabaseEnv();
  const [authLoading, setAuthLoading] = useState(isConfigured);
  const [adminSession, setAdminSession] = useState<AdminSessionState | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
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
      product.name.toLowerCase().includes(query) || product.description.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  async function loadDashboard() {
    setIsRefreshing(true);
    setDashboardError(null);

    try {
      const [nextProducts, nextOrders] = await Promise.all([fetchAdminProducts(), fetchOrders()]);
      setProducts(nextProducts);
      setOrders(nextOrders);
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
    const confirmed = window.confirm(`Delete "${product.name}"? This removes the product and its images.`);
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
              <p>Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to local and Netlify environment variables.</p>
              <p>Run the SQL in `supabase/migrations/20260423_product_management_system.sql` inside your Supabase project.</p>
              <p>Once connected, every admin edit saves directly to the database and appears on the site with no rebuild.</p>
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
            <div
              className="absolute inset-0 opacity-50"
              style={{ background: "radial-gradient(circle at top left, rgba(178,45,45,0.25), transparent 45%)" }}
            />
            <div className="relative">
              <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-blood">JR Lifestyle Backend</p>
              <h1 className="mt-4 font-display text-6xl uppercase leading-[0.9] tracking-[0.08em] md:text-8xl">
                Run the
                <br />
                brand.
              </h1>
              <p className="mt-6 max-w-xl text-base text-muted-foreground">
                A clean dashboard for admins and employees. Add new products, upload images, update stock, and check incoming orders in one place.
              </p>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <StatCard label="Products" value="Live CRUD" />
                <StatCard label="Images" value="Multi Upload" />
                <StatCard label="Orders" value="Realtime View" />
              </div>
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
  const soldOutProducts = products.filter((product) => product.status === "sold_out").length;

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
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Total Products" value={String(products.length)} />
          <StatCard label="Visible Products" value={String(liveProducts)} />
          <StatCard label="Sold Out" value={String(soldOutProducts)} />
          <StatCard label="Orders" value={String(orders.length)} />
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
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <Card className="border-border/70 bg-card/80">
              <CardContent className="grid gap-4 p-5 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search products..."
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="sold_out">Sold out</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
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
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <InfoChip label="Price" value={formatMoney(product.price)} />
                          <InfoChip label="Stock" value={String(product.stockQuantity)} />
                          <InfoChip label="Images" value={String(product.images.length)} />
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>Sizes: {product.sizes.join(", ") || "None"}</span>
                          <span>Colors: {product.colors.join(", ") || "None"}</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => {
                              setSelectedProduct(product);
                              setEditorOpen(true);
                            }}
                          >
                            <Package2 className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            className="gap-2 text-destructive hover:text-destructive"
                            onClick={() => void handleDelete(product)}
                            disabled={isDeletingId === product.id}
                          >
                            {isDeletingId === product.id ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <Card className="border-border/70 bg-card/80">
                <CardContent className="p-10 text-center text-muted-foreground">
                  No products match the current search and filters.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="orders">
            <Card className="border-border/70 bg-card/80">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>
                          <div>
                            <p>{order.customerName}</p>
                            <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell className="uppercase">{order.status.replace("_", " ")}</TableCell>
                        <TableCell>{formatMoney(order.totalAmount)}</TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                    {orders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                          No orders yet. Once your checkout writes to the `orders` table, they’ll show here automatically.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="border-border/70 bg-card/80">
          <CardContent className="flex flex-col gap-3 p-5 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <p>Storefront updates are dynamic. Product changes save straight to Supabase and show on the site without a Netlify rebuild.</p>
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
