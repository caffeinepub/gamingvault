import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  Clock,
  Coins,
  Copy,
  CreditCard,
  Edit2,
  Gift,
  Link2,
  Loader2,
  Lock,
  Package,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Order, Product } from "../backend";
import { DiscountType } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { usePatreonUrlEditor } from "../hooks/usePatreonUrl";
import type { CreditReason, RegisteredUser } from "../hooks/useQueries";
import {
  useAcceptOrder,
  useAddCoupon,
  useAddCreditToUser,
  useAddProduct,
  useDeclineOrder,
  useDeleteCoupon,
  useDeleteProduct,
  useEditProduct,
  useGetAllCoupons,
  useGetAllOrders,
  useGetAllProducts,
  useGetAllRegisteredUsers,
  useGetPaymentInstructions,
  useSetPaymentInstructions,
} from "../hooks/useQueries";
import { getBuyerQuestion, setBuyerQuestion } from "../utils/buyerQuestions";

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
  const stripNote = (val: string) => val.split(" | NOTE: ")[0];
  switch (pm.__kind__) {
    case "bitcoin":
      return `Bitcoin: ${stripNote(pm.bitcoin)}`;
    case "ethereum":
      return `Ethereum: ${stripNote(pm.ethereum)}`;
    case "amazon_gift_card":
      return `Amazon Gift Card: ${stripNote(pm.amazon_gift_card)}`;
    case "paypal":
      return `PayPal: ${stripNote(pm.paypal)}`;
    case "nexus_bank":
      return `Nexus Bank ID: ${pm.nexus_bank.toString()}`;
  }
}

function getBuyerNote(pm: Order["paymentMethod"]): string | null {
  let raw = "";
  switch (pm.__kind__) {
    case "bitcoin":
      raw = pm.bitcoin;
      break;
    case "ethereum":
      raw = pm.ethereum;
      break;
    case "amazon_gift_card":
      raw = pm.amazon_gift_card;
      break;
    case "paypal":
      raw = pm.paypal;
      break;
    default:
      return null;
  }
  const parts = raw.split(" | NOTE: ");
  return parts.length > 1 ? parts.slice(1).join(" | NOTE: ") : null;
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
  const { identity, login, isInitializing, isLoggingIn } =
    useInternetIdentity();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const isAuthenticated = !!identity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (code !== STAFF_CODE) {
      setError("Incorrect passcode. Please try again.");
      setCode("");
      return;
    }
    onUnlock();
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
            {isAuthenticated
              ? "Enter your staff passcode to continue"
              : "Login to access the staff panel"}
          </p>
        </CardHeader>
        <CardContent>
          {isInitializing ? (
            <div
              className="flex items-center justify-center py-6 gap-2 text-muted-foreground"
              data-ocid="staff.passcode.loading_state"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Initializing...</span>
            </div>
          ) : !isAuthenticated ? (
            <Button
              className="w-full"
              onClick={login}
              disabled={isLoggingIn}
              data-ocid="staff.passcode.login_button"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <User className="w-4 h-4 mr-2" />
                  Login with Internet Identity
                </>
              )}
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground bg-primary/5 border border-primary/20 rounded-md px-3 py-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="truncate">
                    Logged in as:{" "}
                    {identity?.getPrincipal().toString().slice(0, 20)}...
                  </span>
                </div>
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
          )}
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
  const existingQuestion = editProduct ? getBuyerQuestion(editProduct.id) : "";
  const [askBuyerQuestion, setAskBuyerQuestion] = useState(!!existingQuestion);
  const [buyerQuestion, setBuyerQuestionState] = useState(existingQuestion);

  // Gift card fields
  const [isGiftCard, setIsGiftCard] = useState(
    editProduct?.isGiftCard ?? false,
  );
  const [giftCardValueStr, setGiftCardValueStr] = useState(
    editProduct && editProduct.giftCardValue > BigInt(0)
      ? (Number(editProduct.giftCardValue) / 100).toFixed(2)
      : "",
  );

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
    if (!isGiftCard && !accountDetails.trim())
      e.accountDetails = "Account details are required";
    if (isGiftCard) {
      if (
        !giftCardValueStr.trim() ||
        Number.isNaN(Number.parseFloat(giftCardValueStr)) ||
        Number.parseFloat(giftCardValueStr) <= 0
      )
        e.giftCardValue = "Enter a valid credit value";
    }
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
    const gcValueCents = isGiftCard
      ? BigInt(Math.round(Number.parseFloat(giftCardValueStr) * 100))
      : BigInt(0);
    try {
      if (editProduct) {
        await editProductMutation.mutateAsync({
          id: editProduct.id,
          title: title.trim(),
          description: description.trim(),
          price: priceCents,
          accountDetails: isGiftCard ? "[GIFT CARD]" : accountDetails.trim(),
          isGiftCard,
          giftCardValue: gcValueCents,
          customQuestion:
            askBuyerQuestion && buyerQuestion.trim()
              ? buyerQuestion.trim()
              : undefined,
        });
        setBuyerQuestion(editProduct.id, askBuyerQuestion ? buyerQuestion : "");
        toast.success("Product updated!");
      } else {
        const newId = await addProduct.mutateAsync({
          title: title.trim(),
          description: description.trim(),
          price: priceCents,
          accountDetails: isGiftCard ? "[GIFT CARD]" : accountDetails.trim(),
          isGiftCard,
          giftCardValue: gcValueCents,
          customQuestion:
            askBuyerQuestion && buyerQuestion.trim()
              ? buyerQuestion.trim()
              : undefined,
        });
        setBuyerQuestion(
          newId as bigint,
          askBuyerQuestion ? buyerQuestion : "",
        );
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

      {/* Gift Card Section */}
      <div className="space-y-3 rounded-lg border border-border bg-secondary/20 p-4">
        <div className="flex items-center gap-3">
          <Checkbox
            id="is-gift-card"
            checked={isGiftCard}
            onCheckedChange={(v) => {
              setIsGiftCard(!!v);
              setErrors((p) => ({
                ...p,
                giftCardValue: "",
                accountDetails: "",
              }));
            }}
            data-ocid="staff.product.gift_card.checkbox"
          />
          <Label
            htmlFor="is-gift-card"
            className="cursor-pointer text-sm flex items-center gap-1.5"
          >
            <Gift className="w-3.5 h-3.5 text-primary" />
            This is a gift card
          </Label>
        </div>
        {isGiftCard && (
          <div className="space-y-1.5 pl-7">
            <Label
              htmlFor="gift-card-value"
              className="text-xs text-muted-foreground"
            >
              Credit Value (£) — added to buyer's account balance when redeemed
            </Label>
            <Input
              id="gift-card-value"
              value={giftCardValueStr}
              onChange={(e) => {
                setGiftCardValueStr(e.target.value);
                setErrors((p) => ({ ...p, giftCardValue: "" }));
              }}
              placeholder="e.g. 10.00"
              type="number"
              step="0.01"
              min="0"
              data-ocid="staff.product.gift_card_value.input"
            />
            {errors.giftCardValue && (
              <p
                className="text-xs text-destructive"
                data-ocid="staff.product.gift_card_value.error_state"
              >
                {errors.giftCardValue}
              </p>
            )}
          </div>
        )}
      </div>

      {!isGiftCard && (
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
      )}

      <div className="space-y-3 rounded-lg border border-border bg-secondary/20 p-4">
        <div className="flex items-center gap-3">
          <Checkbox
            id="ask-buyer-question"
            checked={askBuyerQuestion}
            onCheckedChange={(v) => setAskBuyerQuestion(!!v)}
            data-ocid="staff.product.ask_question.checkbox"
          />
          <Label
            htmlFor="ask-buyer-question"
            className="cursor-pointer text-sm"
          >
            Ask buyer a question before purchase
          </Label>
        </div>
        {askBuyerQuestion && (
          <div className="space-y-1.5 pl-7">
            <Label
              htmlFor="buyer-question-text"
              className="text-xs text-muted-foreground"
            >
              Question to ask buyer at checkout
            </Label>
            <Input
              id="buyer-question-text"
              value={buyerQuestion}
              onChange={(e) => setBuyerQuestionState(e.target.value)}
              placeholder="e.g. Enter the name for your account"
              data-ocid="staff.product.question.input"
            />
          </div>
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
                      {p.isGiftCard && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40 flex-shrink-0 gap-1">
                          <Gift className="w-3 h-3" />
                          Gift Card
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {p.description}
                    </p>
                    {p.isGiftCard && p.giftCardValue > BigInt(0) && (
                      <p className="text-xs text-yellow-400 mt-1">
                        Credit value: £
                        {(Number(p.giftCardValue) / 100).toFixed(2)}
                      </p>
                    )}
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
        {getBuyerNote(order.paymentMethod) && (
          <div className="mb-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
            <span className="font-semibold text-primary">Buyer's Answer: </span>
            <span className="text-foreground">
              {getBuyerNote(order.paymentMethod)}
            </span>
          </div>
        )}

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

// ---- ADDRESS FIELD (single-line Input) ----
function AddressField({
  method,
  label,
  placeholder,
}: { method: string; label: string; placeholder: string }) {
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
      toast.success("Saved!");
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    }
  };

  return (
    <div className="space-y-2">
      <Label className="font-medium text-sm">{label}</Label>
      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSaved(false);
            }}
            placeholder={placeholder}
            className="font-mono text-sm"
            data-ocid={`staff.payment.${method}.input`}
          />
          <Button
            size="sm"
            onClick={handleSave}
            disabled={setInstructions.isPending}
            variant={saved ? "outline" : "default"}
            className="flex-shrink-0"
            data-ocid={`staff.payment.${method}.save_button`}
          >
            {setInstructions.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : saved ? (
              "Saved ✓"
            ) : (
              "Save"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// ---- INSTRUCTIONS FIELD (multi-line Textarea) ----
function InstructionsField({
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
      toast.success("Saved!");
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    }
  };

  return (
    <div className="space-y-2">
      <Label className="font-medium text-sm">{label}</Label>
      {isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : (
        <Textarea
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(false);
          }}
          placeholder={`Enter redemption instructions for ${label}...`}
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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Payment Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Add your receiving addresses and usernames. Buyers will see these at
          checkout so they know where to send payment.
        </p>
      </div>

      {/* Crypto addresses */}
      <Card className="bg-card/60 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Cryptocurrency
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <AddressField
            method="bitcoin"
            label="Your Bitcoin Address (buyers will send payments here)"
            placeholder="e.g. bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
          />
          <Separator />
          <AddressField
            method="ethereum"
            label="Your Ethereum Address (buyers will send payments here)"
            placeholder="e.g. 0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B"
          />
        </CardContent>
      </Card>

      {/* PayPal */}
      <Card className="bg-card/60 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            PayPal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AddressField
            method="paypal"
            label="Your PayPal Username (buyers will send money to this account)"
            placeholder="e.g. @yourpaypaltag"
          />
        </CardContent>
      </Card>

      {/* Amazon Gift Cards */}
      <Card className="bg-card/60 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Amazon Gift Card
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InstructionsField
            method="amazon_gift_card"
            label="Redemption Instructions (shown to buyers after payment)"
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ---- PATREON SETTINGS TAB ----
function PatreonSettingsTab() {
  const [draft, setDraft, save] = usePatreonUrlEditor();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    save();
    setSaved(true);
    toast.success("Patreon URL saved!");
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold mb-1">
          Patreon Settings
        </h2>
        <p className="text-sm text-muted-foreground">
          Set your Patreon URL. When set, a donation banner will appear across
          the store encouraging users to subscribe for exclusive deals,
          freebies, and more.
        </p>
      </div>
      <div className="space-y-3">
        <Label
          htmlFor="patreon-url"
          className="font-medium flex items-center gap-2"
        >
          <Link2 className="w-4 h-4 text-primary" />
          Patreon URL
        </Label>
        <Input
          id="patreon-url"
          type="url"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="https://www.patreon.com/your-page"
          className="font-mono"
          data-ocid="staff.patreon.input"
        />
        <p className="text-xs text-muted-foreground">
          Paste your full Patreon URL. Leave empty to hide the donation banner.
        </p>
      </div>
      <Button
        onClick={handleSave}
        variant={saved ? "outline" : "default"}
        data-ocid="staff.patreon.save_button"
      >
        {saved ? "Saved ✓" : "Save Patreon URL"}
      </Button>
    </div>
  );
}

// ---- COUPONS TAB ----

function CreditsTab() {
  const { data: users = [], isLoading } = useGetAllRegisteredUsers();
  const addCredit = useAddCreditToUser();

  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);
  const [amount, setAmount] = useState("");
  const [reasonType, setReasonType] = useState<
    "manualRefund" | "compensation" | "promoPayment" | "other"
  >("manualRefund");
  const [otherReason, setOtherReason] = useState("");
  const [notes, setNotes] = useState("");
  const [isPromo, setIsPromo] = useState(false);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q) ||
      (u.playerId ?? "").toLowerCase().includes(q)
    );
  });

  const handleReasonChange = (v: string) => {
    const r = v as typeof reasonType;
    setReasonType(r);
    setIsPromo(r === "promoPayment");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const amountNum = Number.parseFloat(amount);
    if (!amount || Number.isNaN(amountNum) || amountNum <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!notes.trim()) {
      toast.error("Notes are required");
      return;
    }
    if (reasonType === "other" && !otherReason.trim()) {
      toast.error("Please describe the reason");
      return;
    }

    let reason: CreditReason;
    if (reasonType === "manualRefund")
      reason = { __kind__: "manualRefund", manualRefund: null };
    else if (reasonType === "compensation")
      reason = { __kind__: "compensation", compensation: null };
    else if (reasonType === "promoPayment")
      reason = { __kind__: "promoPayment", promoPayment: null };
    else reason = { __kind__: "other", other: otherReason.trim() };

    const amountBig = BigInt(Math.round(amountNum * 100));

    try {
      await addCredit.mutateAsync({
        targetUser: selectedUser.principal,
        amount: amountBig,
        reason,
        notes: notes.trim(),
        isPromoPayment: isPromo,
      });
      toast.success(
        `£${amountNum.toFixed(2)} credit added to ${selectedUser.name}`,
      );
      setAmount("");
      setNotes("");
      setOtherReason("");
      setReasonType("manualRefund");
      setIsPromo(false);
      setSelectedUser(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to add credit");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary font-mono text-lg">
            <Coins className="w-5 h-5" />
            Add Credit to User
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email or Player ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-ocid="credits.search_input"
            />
          </div>

          {isLoading ? (
            <div className="space-y-2" data-ocid="credits.loading_state">
              {["a", "b", "c"].map((k) => (
                <Skeleton key={k} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {filtered.length === 0 ? (
                <p
                  className="text-muted-foreground text-sm py-4 text-center"
                  data-ocid="credits.empty_state"
                >
                  No users found
                </p>
              ) : (
                filtered.map((u, idx) => (
                  <button
                    key={u.principal.toString()}
                    type="button"
                    onClick={() =>
                      setSelectedUser(
                        selectedUser?.principal.toString() ===
                          u.principal.toString()
                          ? null
                          : u,
                      )
                    }
                    className={`w-full text-left px-3 py-2 rounded border text-sm transition-colors ${
                      selectedUser?.principal.toString() ===
                      u.principal.toString()
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted"
                    }`}
                    data-ocid={`credits.item.${idx + 1}`}
                  >
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground flex gap-3 mt-0.5">
                      {u.email && <span>{u.email}</span>}
                      {u.playerId && <span>ID: {u.playerId}</span>}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {selectedUser && (
            <form
              onSubmit={handleSubmit}
              className="space-y-4 pt-2 border-t border-border"
            >
              <div className="text-sm font-medium text-primary font-mono">
                Adding credit to: {selectedUser.name}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="credit-amount">Amount (£)</Label>
                  <Input
                    id="credit-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g. 5.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    data-ocid="credits.input"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="credit-reason">Reason</Label>
                  <Select value={reasonType} onValueChange={handleReasonChange}>
                    <SelectTrigger
                      id="credit-reason"
                      data-ocid="credits.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manualRefund">
                        Manual Refund
                      </SelectItem>
                      <SelectItem value="compensation">Compensation</SelectItem>
                      <SelectItem value="promoPayment">
                        Payment for Promotion
                      </SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {reasonType === "other" && (
                <div className="space-y-1.5">
                  <Label htmlFor="credit-other-reason">Describe reason</Label>
                  <Input
                    id="credit-other-reason"
                    placeholder="e.g. Goodwill gesture"
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    data-ocid="credits.textarea"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="credit-notes">Notes (required)</Label>
                <Textarea
                  id="credit-notes"
                  placeholder="e.g. Refund for order #123 - product not delivered"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  data-ocid="credits.textarea"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="credit-promo"
                  checked={isPromo}
                  onCheckedChange={(v) => setIsPromo(!!v)}
                  data-ocid="credits.checkbox"
                />
                <Label htmlFor="credit-promo" className="cursor-pointer">
                  This is a Payment for Promotion (creator/promoter payment)
                </Label>
              </div>

              <Button
                type="submit"
                disabled={addCredit.isPending}
                className="w-full"
                data-ocid="credits.submit_button"
              >
                {addCredit.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding Credit...
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4 mr-2" />
                    Add Credit
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CouponsTab() {
  const { data: coupons = [], isLoading } = useGetAllCoupons();
  const addCoupon = useAddCoupon();
  const deleteCoupon = useDeleteCoupon();

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>(
    DiscountType.fixed,
  );
  const [valueStr, setValueStr] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isPercentage = discountType === DiscountType.percentage;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!code.trim()) errs.code = "Code is required";
    const numVal = Number.parseFloat(valueStr);
    if (
      !valueStr.trim() ||
      Number.isNaN(numVal) ||
      numVal <= 0 ||
      (isPercentage && numVal > 100)
    ) {
      errs.value = isPercentage
        ? "Enter a percentage between 1 and 100"
        : "Enter a valid amount";
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    const bigValue = isPercentage
      ? BigInt(Math.round(numVal))
      : BigInt(Math.round(numVal * 100));
    try {
      await addCoupon.mutateAsync({
        code: code.trim().toUpperCase(),
        discountType,
        value: bigValue,
      });
      toast.success("Coupon created!");
      setCode("");
      setValueStr("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create coupon");
    }
  };

  const handleDelete = async (couponCode: string) => {
    if (!confirm(`Delete coupon ${couponCode}?`)) return;
    try {
      await deleteCoupon.mutateAsync(couponCode);
      toast.success("Coupon deleted");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete coupon");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Coupons</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Create discount coupon codes for buyers to use at checkout.
        </p>
      </div>

      {/* Create coupon form */}
      <Card className="bg-card/60 border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="font-mono text-sm text-primary uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Coupon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="coupon-code">Coupon Code</Label>
                <Input
                  id="coupon-code"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setErrors((p) => ({ ...p, code: "" }));
                  }}
                  placeholder="e.g. SAVE10"
                  className="font-mono uppercase"
                  data-ocid="staff.coupons.input"
                />
                {errors.code && (
                  <p className="text-xs text-destructive">{errors.code}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="coupon-type">Discount Type</Label>
                <Select
                  value={discountType}
                  onValueChange={(v) => {
                    setDiscountType(v as DiscountType);
                    setValueStr("");
                    setErrors((p) => ({ ...p, value: "" }));
                  }}
                >
                  <SelectTrigger
                    id="coupon-type"
                    data-ocid="staff.coupons.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DiscountType.fixed}>
                      Fixed Amount (£)
                    </SelectItem>
                    <SelectItem value={DiscountType.percentage}>
                      Percentage (%)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="coupon-value">
                  {isPercentage
                    ? "Percentage (1–100)"
                    : "Amount (pence, e.g. 500 = £5.00)"}
                </Label>
                <Input
                  id="coupon-value"
                  value={valueStr}
                  onChange={(e) => {
                    setValueStr(e.target.value);
                    setErrors((p) => ({ ...p, value: "" }));
                  }}
                  placeholder={isPercentage ? "e.g. 10" : "e.g. 500"}
                  type="number"
                  min="1"
                  max={isPercentage ? "100" : undefined}
                  step={isPercentage ? "1" : "1"}
                  data-ocid="staff.coupons.input"
                />
                {errors.value && (
                  <p className="text-xs text-destructive">{errors.value}</p>
                )}
              </div>
            </div>
            <Button
              type="submit"
              disabled={addCoupon.isPending}
              className="gap-1.5"
              data-ocid="staff.coupons.submit_button"
            >
              {addCoupon.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Coupon
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Coupons list */}
      {isLoading ? (
        <div className="space-y-3" data-ocid="staff.coupons.loading_state">
          {SKELETONS_3.map((k) => (
            <Skeleton key={k} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div
          className="text-center py-10 text-muted-foreground"
          data-ocid="staff.coupons.empty_state"
        >
          <Tag className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No coupons yet. Create your first one above.</p>
        </div>
      ) : (
        <div className="space-y-2" data-ocid="staff.coupons.list">
          {coupons.map((c, index) => (
            <Card
              key={c.code}
              className="bg-card border-border"
              data-ocid={`staff.coupons.item.${index + 1}`}
            >
              <CardContent className="py-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
                    <code className="font-mono font-bold text-primary text-sm tracking-wider">
                      {c.code}
                    </code>
                    <Badge
                      className={
                        c.discountType === DiscountType.percentage
                          ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          : "bg-primary/20 text-primary border-primary/30"
                      }
                    >
                      {c.discountType === DiscountType.percentage
                        ? `${Number(c.value)}% OFF`
                        : `£${(Number(c.value) / 100).toFixed(2)} OFF`}
                    </Badge>
                    <Badge
                      className={
                        c.active
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                      }
                    >
                      {c.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
                    onClick={() => handleDelete(c.code)}
                    data-ocid={`staff.coupons.delete_button.${index + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
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
        <TabsList className="bg-card border border-border flex-wrap h-auto gap-1">
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
          <TabsTrigger
            value="coupons"
            className="gap-1.5"
            data-ocid="staff.coupons.tab"
          >
            <Tag className="w-3.5 h-3.5" />
            Coupons
          </TabsTrigger>
          <TabsTrigger
            value="credits"
            className="gap-1.5"
            data-ocid="staff.credits.tab"
          >
            <Coins className="w-3.5 h-3.5" />
            Credits
          </TabsTrigger>
          <TabsTrigger
            value="patreon"
            className="gap-1.5"
            data-ocid="staff.patreon.tab"
          >
            <Link2 className="w-3.5 h-3.5" />
            Patreon
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
        <TabsContent value="coupons">
          <CouponsTab />
        </TabsContent>
        <TabsContent value="credits">
          <CreditsTab />
        </TabsContent>
        <TabsContent value="patreon">
          <PatreonSettingsTab />
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
