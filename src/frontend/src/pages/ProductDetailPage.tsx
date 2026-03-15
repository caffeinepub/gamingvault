import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Bitcoin,
  CheckCircle,
  CreditCard,
  Gamepad2,
  Loader2,
  ShoppingCart,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { PaymentMethod } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetPaymentInstructions,
  useGetProduct,
  usePlaceOrder,
} from "../hooks/useQueries";

function formatPrice(cents: bigint): string {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

const PAYMENT_METHODS = [
  {
    key: "bitcoin",
    label: "Bitcoin",
    placeholder: "Your Bitcoin wallet address",
    icon: "₿",
  },
  {
    key: "ethereum",
    label: "Ethereum",
    placeholder: "Your Ethereum wallet address (0x...)",
    icon: "Ξ",
  },
  {
    key: "amazon_gift_card",
    label: "Amazon Gift Card",
    placeholder: "Gift card code",
    icon: "🎁",
  },
  {
    key: "paypal",
    label: "PayPal",
    placeholder: "Your PayPal email address",
    icon: "P",
  },
  {
    key: "nexus_bank",
    label: "Nexus Bank",
    placeholder: "Your Nexus Bank ID (numbers only)",
    icon: "🏦",
  },
] as const;

type MethodKey = (typeof PAYMENT_METHODS)[number]["key"];

function buildPaymentMethod(
  key: MethodKey,
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
    case "nexus_bank": {
      const n = BigInt(value.trim());
      return { __kind__: "nexus_bank", nexus_bank: n };
    }
  }
}

function PaymentInstructionsView({ method }: { method: string }) {
  const { data: instructions, isLoading } = useGetPaymentInstructions(method);
  if (isLoading) return <Skeleton className="h-16 w-full" />;
  return (
    <Alert className="bg-primary/10 border-primary/30">
      <AlertDescription className="whitespace-pre-wrap text-sm">
        {instructions || "Payment instructions will be provided by staff."}
      </AlertDescription>
    </Alert>
  );
}

export default function ProductDetailPage() {
  const params = useParams({ from: "/product/$id" });
  const productId = BigInt(params.id);
  const { data: product, isLoading } = useGetProduct(productId);
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const placeOrder = usePlaceOrder();

  const [selectedMethod, setSelectedMethod] = useState<MethodKey>("bitcoin");
  const [paymentRef, setPaymentRef] = useState("");
  const [refError, setRefError] = useState("");
  const [orderId, setOrderId] = useState<bigint | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const handleBuy = async () => {
    if (!paymentRef.trim()) {
      setRefError("Please enter your payment reference");
      return;
    }
    if (selectedMethod === "nexus_bank" && !/^\d+$/.test(paymentRef.trim())) {
      setRefError("Nexus Bank ID must be numeric");
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
              Payment Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Please complete your payment using{" "}
              <strong className="text-foreground">
                {PAYMENT_METHODS.find((m) => m.key === selectedMethod)?.label}
              </strong>
              :
            </p>
            <PaymentInstructionsView method={selectedMethod} />
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
              {/* Payment Method Selector */}
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Select Payment Method
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => {
                        setSelectedMethod(m.key);
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
                  ))}
                </div>
              </div>

              <Separator className="bg-border" />

              {/* Payment Reference */}
              <div className="space-y-2">
                <Label htmlFor="payment-ref">
                  {PAYMENT_METHODS.find((m) => m.key === selectedMethod)?.label}{" "}
                  Reference
                </Label>
                <Input
                  id="payment-ref"
                  placeholder={
                    PAYMENT_METHODS.find((m) => m.key === selectedMethod)
                      ?.placeholder
                  }
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
      </div>
    </div>
  );
}
