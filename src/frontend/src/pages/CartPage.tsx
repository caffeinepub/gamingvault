import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  Copy,
  CreditCard,
  Gift,
  Loader2,
  ShoppingCart,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Coupon, PaymentMethod } from "../backend.d";
import PatreonBanner from "../components/PatreonBanner";
import { useCart } from "../context/CartContext";
import { useCurrency } from "../hooks/useCurrency";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGenerateGiftCardCode,
  useGetAllProducts,
  useGetPaymentInstructions,
  useGetUserCredit,
  usePlaceOrder,
  useValidateCoupon,
} from "../hooks/useQueries";
import { getBuyerQuestion } from "../utils/buyerQuestions";

const PAYMENT_METHODS = [
  {
    key: "bitcoin",
    label: "Bitcoin",
    icon: "\u20BF",
    refLabel: "Your Bitcoin Transaction ID / Proof of Payment",
    refPlaceholder: "Paste your transaction ID or screenshot reference",
    comingSoon: false,
  },
  {
    key: "ethereum",
    label: "Ethereum",
    icon: "\u039E",
    refLabel: "Your Ethereum Transaction ID / Proof of Payment",
    refPlaceholder: "Paste your transaction hash (0x...)",
    comingSoon: false,
  },
  {
    key: "amazon_gift_card",
    label: "Amazon Gift Card",
    icon: "\uD83C\uDF81",
    refLabel: "Gift Card Code",
    refPlaceholder: "Enter your Amazon Gift Card code",
    comingSoon: false,
  },
  {
    key: "paypal",
    label: "PayPal",
    icon: "P",
    refLabel: "Your PayPal Name (used to send payment)",
    refPlaceholder: "Enter the PayPal name you used to send payment",
    comingSoon: false,
  },
  {
    key: "nexus_bank",
    label: "Nexus Bank",
    icon: "\uD83C\uDFE6",
    refLabel: "Nexus Bank ID",
    refPlaceholder: "Your Nexus Bank ID",
    comingSoon: true,
  },
] as const;

type MethodKey = (typeof PAYMENT_METHODS)[number]["key"];
type ActiveMethodKey = Exclude<MethodKey, "nexus_bank">;

function buildPaymentMethod(
  key: ActiveMethodKey,
  value: string,
): PaymentMethod | null {
  if (!value.trim()) return null;
  switch (key) {
    case "bitcoin":
      return { __kind__: "bitcoin", bitcoin: value.trim() };
    case "ethereum":
      return { __kind__: "ethereum", ethereum: value.trim() };
    case "amazon_gift_card":
      return { __kind__: "amazon_gift_card", amazon_gift_card: value.trim() };
    case "paypal":
      return { __kind__: "paypal", paypal: value.trim() };
  }
}

function StaffAddressBox({ method }: { method: ActiveMethodKey }) {
  const { data: address, isLoading } = useGetPaymentInstructions(method);

  const handleCopy = async () => {
    const val = address?.trim();
    if (!val) return;
    await navigator.clipboard.writeText(val);
    toast.success("Copied to clipboard!");
  };

  if (isLoading) return <Skeleton className="h-14 w-full rounded-lg" />;

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
      <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
        Send payment to:
      </p>
      {address?.trim() ? (
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm font-mono text-foreground break-all">
            {address.trim()}
          </code>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 flex-shrink-0 text-primary hover:bg-primary/10"
            onClick={handleCopy}
            data-ocid="cart.payment_address.button"
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Payment address not configured yet.
        </p>
      )}
    </div>
  );
}

// ---- GIFT CARD ACTIVATED SCREEN ----
function GiftCardActivatedScreen({
  code,
  onDone,
}: {
  code: string;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Gift card code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4"
      data-ocid="cart.gift_card.modal"
    >
      {/* Matrix scanlines overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.03) 2px, rgba(0,255,65,0.03) 4px)",
        }}
      />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
        className="relative w-full max-w-md"
      >
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-2xl" />

        <div className="relative rounded-2xl border border-primary/50 bg-black p-8 text-center shadow-[0_0_40px_rgba(0,255,65,0.2)]">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
            className="w-16 h-16 rounded-full border-2 border-primary bg-primary/15 flex items-center justify-center mx-auto mb-6"
          >
            <Gift className="w-8 h-8 text-primary" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="font-mono text-2xl font-bold text-primary mb-1 tracking-widest"
            style={{ textShadow: "0 0 20px rgba(0,255,65,0.6)" }}
          >
            GIFT CARD ACTIVATED
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-muted-foreground mb-6"
          >
            Your gift card has been activated. Copy the code below and redeem it
            on your Profile page to add credit to your account.
          </motion.p>

          {/* Code Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-6"
          >
            <div
              className="rounded-lg border border-primary/60 bg-primary/5 px-4 py-4 mb-3"
              style={{ boxShadow: "inset 0 0 20px rgba(0,255,65,0.08)" }}
            >
              <p
                className="font-mono text-2xl font-bold text-primary tracking-[0.3em] select-all"
                style={{ textShadow: "0 0 10px rgba(0,255,65,0.5)" }}
                data-ocid="cart.gift_card.panel"
              >
                {code}
              </p>
            </div>
            <Button
              onClick={handleCopy}
              className="w-full gap-2 h-11 font-mono"
              style={{
                background: copied ? "rgba(0,255,65,0.2)" : undefined,
                borderColor: "rgba(0,255,65,0.5)",
              }}
              data-ocid="cart.gift_card.button"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  CODE COPIED!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  COPY CODE
                </>
              )}
            </Button>
          </motion.div>

          {/* Done button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Button
              variant="outline"
              onClick={onDone}
              className="w-full border-primary/30 text-primary hover:bg-primary/10 font-mono"
              data-ocid="cart.gift_card.close_button"
            >
              GO TO PROFILE &rarr;
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---- COUPON SECTION ----
function CouponSection({
  onApplyCoupon,
  appliedCoupon,
}: {
  onApplyCoupon: (coupon: Coupon | null) => void;
  appliedCoupon: Coupon | null;
}) {
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const validateCoupon = useValidateCoupon();

  const handleApply = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }
    setCouponError("");
    try {
      const result = await validateCoupon.mutateAsync(
        couponCode.trim().toUpperCase(),
      );
      if (result) {
        onApplyCoupon(result);
        setCouponCode("");
      } else {
        setCouponError("Invalid or expired coupon code");
      }
    } catch {
      setCouponError("Invalid or expired coupon code");
    }
  };

  const handleRemove = () => {
    onApplyCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  if (appliedCoupon) {
    const isFixed = appliedCoupon.discountType === "fixed";
    const discountLabel = isFixed
      ? `£${(Number(appliedCoupon.value) / 100).toFixed(2)} off`
      : `${Number(appliedCoupon.value)}% off`;
    return (
      <div
        className="rounded-lg border border-primary/40 bg-primary/5 p-3 flex items-center gap-3"
        data-ocid="cart.coupon.panel"
      >
        <Tag className="w-4 h-4 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-mono text-sm font-semibold text-primary">
            COUPON APPLIED: {appliedCoupon.code}
          </p>
          <p className="text-xs text-primary/70">You save {discountLabel}</p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={handleRemove}
          data-ocid="cart.coupon.close_button"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-ocid="cart.coupon.panel">
      <Label className="text-sm font-medium flex items-center gap-1.5">
        <Tag className="w-3.5 h-3.5 text-primary" />
        Coupon Code
      </Label>
      <div className="flex gap-2">
        <Input
          value={couponCode}
          onChange={(e) => {
            setCouponCode(e.target.value.toUpperCase());
            setCouponError("");
          }}
          placeholder="Enter coupon code..."
          className="font-mono"
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
          data-ocid="cart.coupon.input"
        />
        <Button
          onClick={handleApply}
          disabled={validateCoupon.isPending}
          variant="outline"
          className="flex-shrink-0 border-primary/40 text-primary hover:bg-primary/10"
          data-ocid="cart.coupon.apply_button"
        >
          {validateCoupon.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Apply"
          )}
        </Button>
      </div>
      {couponError && (
        <p
          className="text-xs text-destructive"
          data-ocid="cart.coupon.error_state"
        >
          {couponError}
        </p>
      )}
    </div>
  );
}

// ---- STORE CREDIT SECTION ----
function StoreCreditSection({
  totalPricePence,
  appliedCredit,
  onApplyCredit,
  userPrincipal,
}: {
  totalPricePence: bigint;
  appliedCredit: bigint;
  onApplyCredit: (amount: bigint) => void;
  userPrincipal: any;
}) {
  const { data: credit = BigInt(0), isLoading } =
    useGetUserCredit(userPrincipal);
  const maxApplicable = credit < totalPricePence ? credit : totalPricePence;

  if (isLoading) return <Skeleton className="h-20 w-full rounded-lg" />;
  if (credit === BigInt(0)) return null;

  const creditGbp = (Number(credit) / 100).toFixed(2);
  const appliedGbp = (Number(appliedCredit) / 100).toFixed(2);

  return (
    <div
      className="rounded-lg border border-primary/40 bg-primary/5 p-4 space-y-3"
      data-ocid="cart.store_credit.panel"
    >
      <div className="flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-primary" />
        <span className="font-mono text-sm font-semibold text-primary uppercase tracking-wider">
          Store Credit
        </span>
        <span
          className="ml-auto font-mono text-sm font-bold text-primary"
          style={{ textShadow: "0 0 8px rgba(0,255,65,0.4)" }}
        >
          £{creditGbp} available
        </span>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={appliedCredit > BigInt(0) ? "default" : "outline"}
          className="flex-1 font-mono text-xs"
          onClick={() =>
            onApplyCredit(appliedCredit > BigInt(0) ? BigInt(0) : maxApplicable)
          }
          data-ocid="cart.store_credit.toggle"
        >
          {appliedCredit > BigInt(0)
            ? `✓ CREDIT APPLIED: -£${appliedGbp}`
            : `APPLY £${(Number(maxApplicable) / 100).toFixed(2)} CREDIT`}
        </Button>
      </div>

      {appliedCredit > BigInt(0) && (
        <p className="text-xs font-mono text-primary/60">
          &gt; Credit will be deducted from your balance when order is placed.
        </p>
      )}
    </div>
  );
}

export default function CartPage() {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const { formatPrice } = useCurrency();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const placeOrder = usePlaceOrder();
  const generateGiftCardCode = useGenerateGiftCardCode();
  const { data: allProducts = [] } = useGetAllProducts();
  const navigate = useNavigate();

  const [selectedMethod, setSelectedMethod] =
    useState<ActiveMethodKey>("bitcoin");
  const [paymentRef, setPaymentRef] = useState("");
  const [refError, setRefError] = useState("");
  const [ordersDone, setOrdersDone] = useState(false);
  const [placedOrderIds, setPlacedOrderIds] = useState<bigint[]>([]);
  const [isPlacing, setIsPlacing] = useState(false);
  const [buyerAnswers, setBuyerAnswers] = useState<Record<string, string>>({});
  const [giftCardCode, setGiftCardCode] = useState<string | null>(null);
  const [appliedCredit, setAppliedCredit] = useState<bigint>(BigInt(0));
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price, BigInt(0));

  // Apply coupon discount
  let couponDiscount = BigInt(0);
  if (appliedCoupon) {
    if (appliedCoupon.discountType === "fixed") {
      couponDiscount =
        appliedCoupon.value < subtotal ? appliedCoupon.value : subtotal;
    } else {
      couponDiscount = (subtotal * appliedCoupon.value) / BigInt(100);
    }
  }
  const priceAfterCoupon =
    subtotal - couponDiscount > BigInt(0)
      ? subtotal - couponDiscount
      : BigInt(0);
  const totalPrice = priceAfterCoupon;
  const youPay =
    totalPrice - appliedCredit > BigInt(0)
      ? totalPrice - appliedCredit
      : BigInt(0);
  const currentMethod = PAYMENT_METHODS.find((m) => m.key === selectedMethod)!;
  const principal = identity?.getPrincipal() ?? null;

  const handlePlaceOrders = async () => {
    if (!paymentRef.trim()) {
      setRefError("Please enter the required payment information");
      return;
    }
    // Validate buyer answers
    for (const item of cartItems) {
      const q = item.buyerQuestion || getBuyerQuestion(item.productId);
      if (q && !buyerAnswers[item.productId.toString()]?.trim()) {
        setRefError(`Please answer the question for: ${item.title}`);
        return;
      }
    }
    setRefError("");
    setIsPlacing(true);
    // Snapshot cart before clearing
    const cartSnapshot = [...cartItems];
    try {
      const ids: bigint[] = [];
      for (const item of cartSnapshot) {
        const q = item.buyerQuestion || getBuyerQuestion(item.productId);
        const answer = buyerAnswers[item.productId.toString()]?.trim();
        const creditNote =
          appliedCredit > BigInt(0)
            ? ` | CREDIT APPLIED: £${(Number(appliedCredit) / 100).toFixed(2)}`
            : "";
        const couponNote = appliedCoupon
          ? ` | COUPON: ${appliedCoupon.code}`
          : "";
        const ref =
          q && answer
            ? `${paymentRef.trim()} | NOTE: ${answer}${creditNote}${couponNote}`
            : `${paymentRef.trim()}${creditNote}${couponNote}`;
        const pm = buildPaymentMethod(selectedMethod, ref);
        if (!pm) continue;
        const id = await placeOrder.mutateAsync({
          productId: item.productId,
          paymentMethod: pm,
        });
        ids.push(id);
      }
      setPlacedOrderIds(ids);
      clearCart();

      // Check if any ordered product is a gift card (use snapshot)
      const giftCardOrderId = ids.find((_orderId, idx) => {
        const item = cartSnapshot[idx];
        return item?.isGiftCard === true;
      });

      if (giftCardOrderId !== undefined) {
        try {
          const code = await generateGiftCardCode.mutateAsync(giftCardOrderId);
          setGiftCardCode(code);
        } catch {
          toast.success(
            `${ids.length} order${ids.length > 1 ? "s" : ""} placed successfully!`,
          );
          setOrdersDone(true);
        }
      } else {
        toast.success(
          `${ids.length} order${ids.length > 1 ? "s" : ""} placed successfully!`,
        );
        setOrdersDone(true);
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to place orders");
    } finally {
      setIsPlacing(false);
    }
  };

  // Gift card activated screen
  if (giftCardCode !== null) {
    return (
      <AnimatePresence>
        <GiftCardActivatedScreen
          code={giftCardCode}
          onDone={() => navigate({ to: "/profile" })}
        />
      </AnimatePresence>
    );
  }

  if (ordersDone) {
    return (
      <div
        className="container mx-auto px-4 py-10 max-w-2xl"
        data-ocid="cart.success_state"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-mono text-3xl font-bold mb-2 text-primary">
            Orders Confirmed!
          </h1>
          <p className="text-muted-foreground">
            {placedOrderIds.length} order{placedOrderIds.length > 1 ? "s" : ""}{" "}
            placed and pending review.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/orders" className="flex-1">
            <Button className="w-full" data-ocid="cart.orders.link">
              View My Orders
            </Button>
          </Link>
          <Link to="/" className="flex-1">
            <Button
              variant="outline"
              className="w-full border-primary/40 text-primary hover:bg-primary/10"
              data-ocid="cart.store.link"
            >
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div
        className="container mx-auto px-4 py-10 max-w-2xl"
        data-ocid="cart.empty_state"
      >
        <div className="text-center py-20">
          <ShoppingCart className="w-14 h-14 text-primary/30 mx-auto mb-4" />
          <h2 className="font-mono text-xl font-bold text-primary mb-2">
            Your cart is empty
          </h2>
          <p className="text-muted-foreground mb-6">
            Add products to your cart to checkout multiple items at once.
          </p>
          <Link to="/">
            <Button className="gap-2" data-ocid="cart.store.link">
              Browse the Store
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <PatreonBanner variant="inline" />

      <h1 className="font-mono text-2xl font-bold text-primary mt-6 mb-6 flex items-center gap-3">
        <ShoppingCart className="w-6 h-6" />
        Your Cart
        <Badge className="bg-primary/20 text-primary border-primary/40">
          {cartItems.length} item{cartItems.length > 1 ? "s" : ""}
        </Badge>
      </h1>

      <div className="grid gap-6">
        {/* Cart Items */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-mono text-base">Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cartItems.map((item, idx) => (
              <div
                key={item.productId.toString()}
                className="flex items-center justify-between gap-3 py-3 border-b border-border last:border-0"
                data-ocid={`cart.item.${idx + 1}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-semibold text-foreground truncate">
                      {item.title}
                    </p>
                    {allProducts.find(
                      (p) => p.id.toString() === item.productId.toString(),
                    )?.isGiftCard && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40 text-xs gap-1 flex-shrink-0">
                        <Gift className="w-3 h-3" />
                        Gift Card
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-primary font-mono">
                    {formatPrice(item.price)}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                  onClick={() => removeFromCart(item.productId)}
                  data-ocid={`cart.remove_button.${idx + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Separator className="bg-border" />
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-muted-foreground">
                  Subtotal
                </span>
                <span className="font-mono text-sm text-foreground">
                  {formatPrice(subtotal)}
                </span>
              </div>
              {couponDiscount > BigInt(0) && appliedCoupon && (
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-primary flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Coupon ({appliedCoupon.code})
                  </span>
                  <span className="font-mono text-sm text-primary">
                    -{formatPrice(couponDiscount)}
                  </span>
                </div>
              )}
              {appliedCredit > BigInt(0) && (
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-primary">
                    Store Credit Applied
                  </span>
                  <span className="font-mono text-sm text-primary">
                    -£{(Number(appliedCredit) / 100).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-border pt-1.5">
                <span className="font-mono text-sm font-bold text-foreground">
                  You Pay
                </span>
                <span
                  className="font-mono font-bold text-lg text-primary"
                  style={
                    appliedCredit > BigInt(0) || couponDiscount > BigInt(0)
                      ? { textShadow: "0 0 8px rgba(0,255,65,0.5)" }
                      : {}
                  }
                >
                  {formatPrice(youPay)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checkout Section */}
        {!isAuthenticated ? (
          <Card className="bg-card border-border">
            <CardContent className="pt-6 text-center py-10">
              <h3 className="font-mono font-semibold mb-2">
                Sign in to Checkout
              </h3>
              <p className="text-muted-foreground text-sm">
                You need to sign in to place orders.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-mono">Checkout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Store Credit */}
              <StoreCreditSection
                totalPricePence={totalPrice}
                appliedCredit={appliedCredit}
                onApplyCredit={setAppliedCredit}
                userPrincipal={principal}
              />

              {/* Coupon Code */}
              <CouponSection
                appliedCoupon={appliedCoupon}
                onApplyCoupon={setAppliedCoupon}
              />

              {/* Buyer Questions */}
              {cartItems.some(
                (item) =>
                  item.buyerQuestion || getBuyerQuestion(item.productId),
              ) && (
                <div className="space-y-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <h3 className="font-mono text-sm font-semibold text-primary uppercase tracking-wider">
                    Additional Information Required
                  </h3>
                  {cartItems.map((item) => {
                    const q =
                      item.buyerQuestion || getBuyerQuestion(item.productId);
                    if (!q) return null;
                    return (
                      <div
                        key={item.productId.toString()}
                        className="space-y-1.5"
                      >
                        <Label className="text-sm">
                          <span className="text-muted-foreground">
                            {item.title}:{" "}
                          </span>
                          {q}
                        </Label>
                        <Input
                          value={buyerAnswers[item.productId.toString()] ?? ""}
                          onChange={(e) =>
                            setBuyerAnswers((prev) => ({
                              ...prev,
                              [item.productId.toString()]: e.target.value,
                            }))
                          }
                          placeholder="Your answer..."
                          data-ocid="cart.buyer_answer.input"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Payment Method Selector */}
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Select Payment Method
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map((m) =>
                    m.comingSoon ? (
                      <div
                        key={m.key}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-secondary/10 text-muted-foreground/40 cursor-not-allowed select-none"
                        aria-disabled="true"
                        data-ocid={`cart.${m.key}.toggle`}
                      >
                        <span className="text-base opacity-40">{m.icon}</span>
                        <span className="text-sm font-medium">{m.label}</span>
                        <Badge className="ml-auto text-[10px] px-1.5 py-0 bg-muted text-muted-foreground border-0 leading-5">
                          Soon
                        </Badge>
                      </div>
                    ) : (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => {
                          setSelectedMethod(m.key as ActiveMethodKey);
                          setPaymentRef("");
                          setRefError("");
                        }}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                          selectedMethod === m.key
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                        data-ocid={`cart.${m.key}.toggle`}
                      >
                        <span className="text-base">{m.icon}</span>
                        {m.label}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <StaffAddressBox method={selectedMethod} />

              <Separator className="bg-border" />

              <div className="space-y-2">
                <Label htmlFor="cart-payment-ref">
                  {currentMethod.refLabel}
                </Label>
                <Input
                  id="cart-payment-ref"
                  placeholder={currentMethod.refPlaceholder}
                  value={paymentRef}
                  onChange={(e) => {
                    setPaymentRef(e.target.value);
                    setRefError("");
                  }}
                  data-ocid="cart.payment_ref.input"
                />
                {refError && (
                  <p
                    className="text-sm text-destructive"
                    data-ocid="cart.payment_ref.error_state"
                  >
                    {refError}
                  </p>
                )}
              </div>

              <Button
                onClick={handlePlaceOrders}
                disabled={isPlacing}
                className="w-full h-11 gap-2"
                data-ocid="cart.place_orders.primary_button"
              >
                {isPlacing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Placing Orders...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    Place {cartItems.length} Order
                    {cartItems.length > 1 ? "s" : ""} — {formatPrice(youPay)}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
