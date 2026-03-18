import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle,
  Copy,
  Gamepad2,
  Loader2,
  ShoppingCart,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { PaymentMethod } from "../backend.d";
import PatreonBanner from "../components/PatreonBanner";
import { useCart } from "../context/CartContext";
import { useCurrency } from "../hooks/useCurrency";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetPaymentInstructions,
  useGetProduct,
  usePlaceOrder,
} from "../hooks/useQueries";

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

  if (isLoading) {
    return <Skeleton className="h-14 w-full rounded-lg" />;
  }

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
            data-ocid="product.payment_address.button"
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

export default function ProductDetailPage() {
  const params = useParams({ from: "/product/$id" });
  const productId = BigInt(params.id);
  const { data: product, isLoading } = useGetProduct(productId);
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const placeOrder = usePlaceOrder();
  const { formatPrice } = useCurrency();
  const { addToCart } = useCart();

  const [selectedMethod, setSelectedMethod] =
    useState<ActiveMethodKey>("bitcoin");
  const [paymentRef, setPaymentRef] = useState("");
  const [refError, setRefError] = useState("");
  const [orderId, setOrderId] = useState<bigint | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const { data: staffAddress } = useGetPaymentInstructions(selectedMethod);

  const handleBuy = async () => {
    if (!paymentRef.trim()) {
      setRefError("Please enter the required information");
      return;
    }
    setRefError("");
    try {
      const pm = buildPaymentMethod(selectedMethod, paymentRef);
      if (!pm || !product) return;
      const newOrderId = await placeOrder.mutateAsync({
        productId: product.id,
        paymentMethod: pm,
      });
      setOrderId(newOrderId);
      setOrderPlaced(true);
      toast.success("Order placed successfully!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to place order");
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      productId: product.id,
      title: product.title,
      price: product.price,
      isGiftCard: product.isGiftCard,
    });
  };

  const currentMethod = PAYMENT_METHODS.find((m) => m.key === selectedMethod)!;

  if (isLoading) {
    return (
      <div
        className="container mx-auto px-4 py-10 max-w-3xl"
        data-ocid="product.loading_state"
      >
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div
        className="container mx-auto px-4 py-10 max-w-3xl text-center"
        data-ocid="product.error_state"
      >
        <h2 className="font-display text-xl font-bold mb-2">
          Product not found
        </h2>
        <Link to="/">
          <Button variant="outline">Back to Store</Button>
        </Link>
      </div>
    );
  }

  if (orderPlaced && orderId !== null) {
    return (
      <div
        className="container mx-auto px-4 py-10 max-w-2xl"
        data-ocid="product.success_state"
      >
        <div className="text-center mb-8">
          <CheckCircle className="w-14 h-14 text-primary mx-auto mb-4" />
          <h1 className="font-display text-3xl font-bold mb-2">
            Order Confirmed!
          </h1>
          <p className="text-muted-foreground">
            Order #{orderId.toString()} has been placed and is pending review.
          </p>
        </div>
        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <CardTitle className="font-display text-base">
              Complete Your Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Send your payment via{" "}
              <strong className="text-foreground">
                {PAYMENT_METHODS.find((m) => m.key === selectedMethod)?.label}
              </strong>{" "}
              to the address below:
            </p>
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                Send payment to:
              </p>
              {staffAddress?.trim() ? (
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono text-foreground break-all">
                    {staffAddress.trim()}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 flex-shrink-0 text-primary hover:bg-primary/10"
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        staffAddress.trim() ?? "",
                      );
                      toast.success("Copied!");
                    }}
                    data-ocid="order-confirm.payment_address.button"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Payment address not configured yet. Staff will contact you.
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Once payment is sent, staff will review and deliver your account
              credentials. Check your orders for status updates.
            </p>
          </CardContent>
        </Card>
        <div className="flex gap-3">
          <Link to="/orders" className="flex-1">
            <Button className="w-full" data-ocid="order-confirm.link">
              View My Orders
            </Button>
          </Link>
          <Link to="/" className="flex-1">
            <Button
              variant="outline"
              className="w-full"
              data-ocid="order-confirm.secondary_button"
            >
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        data-ocid="product.link"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Store
      </Link>

      <div className="grid gap-6">
        {/* Patreon banner above product */}
        <PatreonBanner variant="inline" />

        {/* Product Info */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <Gamepad2 className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h1 className="font-display text-2xl font-bold leading-tight">
                    {product.title}
                  </h1>
                  <Badge className="bg-primary/20 text-primary border-primary/40 text-base px-3 py-1 flex-shrink-0">
                    {formatPrice(product.price)}
                  </Badge>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buy Section */}
        {!isAuthenticated ? (
          <Card className="bg-card border-border">
            <CardContent className="pt-6 text-center py-10">
              <ShoppingCart className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-display font-semibold mb-2">
                Sign in to Purchase
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                You need to sign in to place an order.
              </p>
              <Badge variant="outline" className="text-muted-foreground">
                Use the Sign In button in the header
              </Badge>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-display">Place Your Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add to Cart button */}
              <Button
                variant="outline"
                onClick={handleAddToCart}
                className="w-full gap-2 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/70"
                data-ocid="cart.add_button"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </Button>

              <Separator className="bg-border" />

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
                        data-ocid={`product.${m.key}.toggle`}
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
                        data-ocid={`product.${m.key}.toggle`}
                      >
                        <span className="text-base">{m.icon}</span>
                        {m.label}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Staff address display */}
              <StaffAddressBox method={selectedMethod} />

              <Separator className="bg-border" />

              {/* Payment Reference */}
              <div className="space-y-2">
                <Label htmlFor="payment-ref">{currentMethod.refLabel}</Label>
                <Input
                  id="payment-ref"
                  placeholder={currentMethod.refPlaceholder}
                  value={paymentRef}
                  onChange={(e) => {
                    setPaymentRef(e.target.value);
                    setRefError("");
                  }}
                  data-ocid="product.payment_ref.input"
                />
                {refError && (
                  <p
                    className="text-sm text-destructive"
                    data-ocid="product.payment_ref.error_state"
                  >
                    {refError}
                  </p>
                )}
              </div>

              <Button
                onClick={handleBuy}
                disabled={placeOrder.isPending}
                className="w-full h-11 gap-2"
                data-ocid="product.buy.primary_button"
              >
                {placeOrder.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    Buy Now — {formatPrice(product.price)}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Patreon banner below product details */}
        <PatreonBanner variant="inline" />
      </div>
    </div>
  );
}
