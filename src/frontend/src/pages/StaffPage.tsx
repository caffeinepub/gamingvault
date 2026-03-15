import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  Clock,
  Copy,
  CreditCard,
  Edit2,
  Loader2,
  Lock,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Order, Product } from "../backend.d";
import { useActor } from "../hooks/useActor";
import {
  useAcceptOrder,
  useAddProduct,
  useDeclineOrder,
  useDeleteProduct,
  useEditProduct,
  useGetAllOrders,
  useGetAllProducts,
  useGetPaymentInstructions,
  useSetPaymentInstructions,
} from "../hooks/useQueries";

const STAFF_CODE = "2006";
const SKELETONS_3 = ["a", "b", "c"];

function formatPrice(cents: bigint): string {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getPaymentMethodLabel(pm: Order["paymentMethod"]): string {
  switch (pm.__kind__) {
    case "bitcoin":
      return `Bitcoin: ${pm.bitcoin}`;
    case "ethereum":
      return `Ethereum: ${pm.ethereum}`;
    case "amazon_gift_card":
      return `Amazon Gift Card: ${pm.amazon_gift_card}`;
    case "paypal":
      return `PayPal: ${pm.paypal}`;
    case "nexus_bank":
      return `Nexus Bank ID: ${pm.nexus_bank.toString()}`;
  }
}

function StatusBadge({ status }: { status: Order["status"] }) {
  if (status.__kind__ === "pending")
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  if (status.__kind__ === "accepted")
    return (
      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
        <CheckCircle className="w-3 h-3 mr-1" />
        Accepted
      </Badge>
    );
  return (
    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
      <XCircle className="w-3 h-3 mr-1" />
      Declined
    </Badge>
  );
}

// ---- PASSCODE SCREEN ----
function PasscodeScreen({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === STAFF_CODE) {
      onUnlock();
    } else {
      setError("Incorrect passcode. Please try again.");
      setCode("");
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-sm bg-card border-border">
        <CardHeader className="text-center pb-2">
          <div className="w-14 h-14 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="font-display text-xl">Staff Access</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your staff passcode to continue
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staff-code">Passcode</Label>
              <Input
                id="staff-code"
                type="password"
                placeholder="Enter passcode"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError("");
                }}
                autoComplete="off"
                data-ocid="staff.passcode.input"
              />
              {error && (
                <p
                  className="text-sm text-destructive"
                  data-ocid="staff.passcode.error_state"
                >
                  {error}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              data-ocid="staff.passcode.submit_button"
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              Unlock Panel
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ---- PRODUCT FORM ----
function ProductForm({
  onDone,
  editProduct,
}: { onDone: () => void; editProduct?: Product }) {
  const addProduct = useAddProduct();
  const editProductMutation = useEditProduct();
  const [title, setTitle] = useState(editProduct?.title ?? "");
  const [description, setDescription] = useState(
    editProduct?.description ?? "",
  );
  const [priceStr, setPriceStr] = useState(
    editProduct ? (Number(editProduct.price) / 100).toFixed(2) : "",
  );
  const [accountDetails, setAccountDetails] = useState(
    editProduct?.accountDetails ?? "",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Title is required";
    if (!description.trim()) e.description = "Description is required";
    if (
      !priceStr.trim() ||
      Number.isNaN(Number.parseFloat(priceStr)) ||
      Number.parseFloat(priceStr) <= 0
    )
      e.price = "Enter a valid price";
    if (!accountDetails.trim())
      e.accountDetails = "Account details are required";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const priceCents = BigInt(Math.round(Number.parseFloat(priceStr) * 100));
    try {
      if (editProduct) {
        await editProductMutation.mutateAsync({
          id: editProduct.id,
          title: title.trim(),
          description: description.trim(),
          price: priceCents,
          accountDetails: accountDetails.trim(),
        });
        toast.success("Product updated!");
      } else {
        await addProduct.mutateAsync({
          title: title.trim(),
          description: description.trim(),
          price: priceCents,
          accountDetails: accountDetails.trim(),
        });
        toast.success("Product added!");
      }
      onDone();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save product");
    }
  };

  const isPending = addProduct.isPending || editProductMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="prod-title">Title</Label>
          <Input
            id="prod-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setErrors((p) => ({ ...p, title: "" }));
            }}
            placeholder="e.g. Fortnite OG Account"
            data-ocid="staff.product.title.input"
          />
          {errors.title && (
            <p
              className="text-xs text-destructive"
              data-ocid="staff.product.title.error_state"
            >
              {errors.title}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prod-price">Price (USD)</Label>
          <Input
            id="prod-price"
            value={priceStr}
            onChange={(e) => {
              setPriceStr(e.target.value);
              setErrors((p) => ({ ...p, price: "" }));
            }}
            placeholder="e.g. 24.99"
            type="number"
            step="0.01"
            min="0"
            data-ocid="staff.product.price.input"
          />
          {errors.price && (
            <p
              className="text-xs text-destructive"
              data-ocid="staff.product.price.error_state"
            >
              {errors.price}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="prod-desc">Description</Label>
        <Textarea
          id="prod-desc"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setErrors((p) => ({ ...p, description: "" }));
          }}
          placeholder="Describe the account..."
          rows={3}
          data-ocid="staff.product.description.textarea"
        />
        {errors.description && (
          <p
            className="text-xs text-destructive"
            data-ocid="staff.product.description.error_state"
          >
            {errors.description}
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="prod-details">
          Account Details{" "}
          <span className="text-muted-foreground text-xs">
            (sent to buyer after acceptance)
          </span>
        </Label>
        <Textarea
          id="prod-details"
          value={accountDetails}
          onChange={(e) => {
            setAccountDetails(e.target.value);
            setErrors((p) => ({ ...p, accountDetails: "" }));
          }}
          placeholder="Username, password, email, etc."
          rows={4}
          data-ocid="staff.product.account_details.textarea"
        />
        {errors.accountDetails && (
          <p
            className="text-xs text-destructive"
            data-ocid="staff.product.account_details.error_state"
          >
            {errors.accountDetails}
          </p>
        )}
      </div>
      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={onDone}
          data-ocid="staff.product.cancel_button"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          data-ocid="staff.product.save_button"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : editProduct ? (
            "Save Changes"
          ) : (
            "Add Product"
          )}
        </Button>
      </div>
    </form>
  );
}

// ---- PRODUCTS TAB ----
function ProductsTab() {
  const { data: products = [], isLoading } = useGetAllProducts();
  const deleteProduct = useDeleteProduct();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();

  const handleDelete = async (id: bigint) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct.mutateAsync(id);
      toast.success("Product deleted");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete");
    }
  };

  const openAdd = () => {
    setEditingProduct(undefined);
    setShowForm(true);
  };
  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setEditingProduct(undefined);
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl font-semibold">Products</h2>
        <Button
          onClick={openAdd}
          size="sm"
          className="gap-1.5"
          data-ocid="staff.products.open_modal_button"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {showForm && (
        <Card className="bg-card/80 border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">
              {editingProduct ? "Edit Product" : "New Product"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm onDone={closeForm} editProduct={editingProduct} />
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3" data-ocid="staff.products.loading_state">
          {SKELETONS_3.map((k) => (
            <Skeleton key={k} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="staff.products.empty_state"
        >
          <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No products yet. Add your first one.</p>
        </div>
      ) : (
        <div className="space-y-3" data-ocid="staff.products.list">
          {products.map((p, index) => (
            <Card
              key={p.id.toString()}
              className="bg-card border-border"
              data-ocid={`staff.products.item.${index + 1}`}
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{p.title}</h3>
                      <Badge className="bg-primary/20 text-primary border-primary/40 flex-shrink-0">
                        {formatPrice(p.price)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {p.description}
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => openEdit(p)}
                      data-ocid={`staff.products.edit_button.${index + 1}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(p.id)}
                      data-ocid={`staff.products.delete_button.${index + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- ORDER ROW ----
function OrderRow({
  order,
  index,
  onAccept,
  onDecline,
  acceptPending,
  declinePending,
}: {
  order: Order;
  index: number;
  onAccept: (id: bigint) => void;
  onDecline: (id: bigint) => void;
  acceptPending: boolean;
  declinePending: boolean;
}) {
  const { actor } = useActor();
  const [buyerEmail, setBuyerEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!actor) return;
    actor
      .getOrderBuyerContact(order.id)
      .then((d) => {
        setBuyerEmail(d.email ?? null);
      })
      .catch(() => {});
  }, [actor, order.id]);

  const copyEmail = async () => {
    let accountDetails = "[Account details will be here]";
    if (actor) {
      try {
        accountDetails = await actor.getOrderAccountDetails(order.id);
      } catch {}
    }
    const subject = `Your Gaming Account - ${order.productTitle}`;
    const body = `Hi,\n\nYour order has been accepted. Here are your account details:\n\n${accountDetails}\n\nThank you for your purchase!\n\nH4CK.FST Team`;
    const fullEmail = `Subject: ${subject}\n\n${body}`;
    await navigator.clipboard.writeText(fullEmail);
    toast.success("Email copied to clipboard!");
  };

  return (
    <Card
      className="bg-card border-border"
      data-ocid={`staff.orders.item.${index + 1}`}
    >
      <CardContent className="py-4">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-medium text-sm">{order.productTitle}</span>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              Order #{order.id.toString()} · {formatDate(order.createdAt)}
            </p>
          </div>
          <Badge className="bg-primary/20 text-primary border-primary/40">
            {formatPrice(order.productPrice)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm mb-3">
          <div>
            <span className="text-muted-foreground">Buyer Email: </span>
            <span className="font-medium">{buyerEmail ?? "Loading..."}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Payment: </span>
            <span className="font-medium text-xs">
              {getPaymentMethodLabel(order.paymentMethod)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {order.status.__kind__ === "pending" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-green-500/40 text-green-400 hover:bg-green-500/10"
                onClick={() => onAccept(order.id)}
                disabled={acceptPending}
                data-ocid={`staff.orders.confirm_button.${index + 1}`}
              >
                {acceptPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-red-500/40 text-red-400 hover:bg-red-500/10"
                onClick={() => onDecline(order.id)}
                disabled={declinePending}
                data-ocid={`staff.orders.delete_button.${index + 1}`}
              >
                {declinePending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                Decline
              </Button>
            </>
          )}
          {order.status.__kind__ === "accepted" && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
              onClick={copyEmail}
              data-ocid={`staff.orders.secondary_button.${index + 1}`}
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Email
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---- ORDERS TAB ----
function OrdersTab() {
  const { data: orders = [], isLoading } = useGetAllOrders();
  const acceptOrder = useAcceptOrder();
  const declineOrder = useDeclineOrder();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAccept = async (id: bigint) => {
    setProcessingId(`${id.toString()}accept`);
    try {
      await acceptOrder.mutateAsync(id);
      toast.success("Order accepted");
    } catch (e: any) {
      toast.error(e?.message || "Failed to accept order");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (id: bigint) => {
    setProcessingId(`${id.toString()}decline`);
    try {
      await declineOrder.mutateAsync(id);
      toast.success("Order declined");
    } catch (e: any) {
      toast.error(e?.message || "Failed to decline order");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold">All Orders</h2>
      {isLoading ? (
        <div className="space-y-3" data-ocid="staff.orders.loading_state">
          {SKELETONS_3.map((k) => (
            <Skeleton key={k} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="staff.orders.empty_state"
        >
          <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, index) => (
            <OrderRow
              key={order.id.toString()}
              order={order}
              index={index}
              onAccept={handleAccept}
              onDecline={handleDecline}
              acceptPending={processingId === `${order.id.toString()}accept`}
              declinePending={processingId === `${order.id.toString()}decline`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---- PAYMENT SETTING FIELD ----
function PaymentSettingField({
  method,
  label,
}: { method: string; label: string }) {
  const { data: current, isLoading } = useGetPaymentInstructions(method);
  const setInstructions = useSetPaymentInstructions();
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (current !== undefined) setValue(current);
  }, [current]);

  const handleSave = async () => {
    try {
      await setInstructions.mutateAsync({ method, instructions: value });
      setSaved(true);
      toast.success(`${label} instructions saved!`);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    }
  };

  return (
    <div className="space-y-2">
      <Label className="font-medium">{label}</Label>
      {isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : (
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`Enter payment instructions for ${label}...`}
          rows={3}
          data-ocid={`staff.payment.${method}.textarea`}
        />
      )}
      <Button
        size="sm"
        onClick={handleSave}
        disabled={setInstructions.isPending}
        variant={saved ? "outline" : "default"}
        data-ocid={`staff.payment.${method}.save_button`}
      >
        {setInstructions.isPending ? (
          <>
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            Saving...
          </>
        ) : saved ? (
          "Saved ✓"
        ) : (
          "Save"
        )}
      </Button>
    </div>
  );
}

// ---- PAYMENT SETTINGS TAB ----
function PaymentSettingsTab() {
  const methods = [
    { key: "bitcoin", label: "Bitcoin" },
    { key: "ethereum", label: "Ethereum" },
    { key: "amazon_gift_card", label: "Amazon Gift Card" },
    { key: "paypal", label: "PayPal" },
    { key: "nexus_bank", label: "Nexus Bank" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-semibold">
        Payment Instructions
      </h2>
      <p className="text-sm text-muted-foreground">
        Set the payment instructions shown to buyers for each method.
      </p>
      <div className="space-y-6">
        {methods.map((m, i) => (
          <div key={m.key}>
            <PaymentSettingField method={m.key} label={m.label} />
            {i < methods.length - 1 && <Separator className="mt-6" />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- STAFF DASHBOARD ----
function StaffDashboard() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Staff Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage products, orders, and payment settings
          </p>
        </div>
      </div>

      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger
            value="products"
            className="gap-1.5"
            data-ocid="staff.products.tab"
          >
            <Package className="w-3.5 h-3.5" />
            Products
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="gap-1.5"
            data-ocid="staff.orders.tab"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Orders
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="gap-1.5"
            data-ocid="staff.payments.tab"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Payment Settings
          </TabsTrigger>
        </TabsList>
        <TabsContent value="products">
          <ProductsTab />
        </TabsContent>
        <TabsContent value="orders">
          <OrdersTab />
        </TabsContent>
        <TabsContent value="payments">
          <PaymentSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function StaffPage() {
  const [unlocked, setUnlocked] = useState(false);
  if (!unlocked) return <PasscodeScreen onUnlock={() => setUnlocked(true)} />;
  return <StaffDashboard />;
}
