import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle,
  Clipboard,
  ClipboardCheck,
  Clock,
  CreditCard,
  Eye,
  Gift,
  Loader2,
  ShoppingBag,
  Terminal,
  User,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import type { Order } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetMyOrders,
  useGetOrderAccountDetails,
  useGetUserCredit,
  useRedeemGiftCardCode,
} from "../hooks/useQueries";

const SKELETONS = ["a", "b", "c"];

function formatCreditDisplay(pence: bigint): string {
  return `£${(Number(pence) / 100).toFixed(2)}`;
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
      return "Bitcoin";
    case "ethereum":
      return "Ethereum";
    case "amazon_gift_card":
      return "Amazon Gift Card";
    case "paypal":
      return "PayPal";
    case "nexus_bank":
      return "Nexus Bank";
  }
}

function StatusBadge({ status }: { status: Order["status"] }) {
  if (status.__kind__ === "pending")
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 font-mono text-[10px]">
        <Clock className="w-3 h-3 mr-1" />
        PENDING
      </Badge>
    );
  if (status.__kind__ === "accepted")
    return (
      <Badge className="bg-primary/20 text-primary border-primary/30 font-mono text-[10px]">
        <CheckCircle className="w-3 h-3 mr-1" />
        ACCEPTED
      </Badge>
    );
  return (
    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-mono text-[10px]">
      <XCircle className="w-3 h-3 mr-1" />
      DECLINED
    </Badge>
  );
}

function AccountDetailsRow({ orderId }: { orderId: bigint }) {
  const [show, setShow] = useState(false);
  const { data, isLoading } = useGetOrderAccountDetails(show ? orderId : null);
  return (
    <div className="mt-3">
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 text-primary border-primary/40 font-mono text-xs"
        onClick={() => setShow(!show)}
        data-ocid="profile.orders.account_details.button"
      >
        <Eye className="w-3.5 h-3.5" />
        {show ? "HIDE" : "VIEW"} ACCOUNT DETAILS
      </Button>
      {show && (
        <Alert className="mt-2 bg-primary/10 border-primary/30">
          <AlertDescription>
            {isLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <pre className="text-sm whitespace-pre-wrap font-mono text-primary">
                {data || "No details available"}
              </pre>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 ml-2 text-primary/60 hover:text-primary transition-colors"
      title={`Copy ${label}`}
      data-ocid="profile.copy.button"
    >
      {copied ? (
        <ClipboardCheck className="w-3.5 h-3.5 text-primary" />
      ) : (
        <Clipboard className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

function RedeemGiftCardSection() {
  const [code, setCode] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const redeem = useRedeemGiftCardCode();

  const handleRedeem = async () => {
    if (!code.trim()) {
      setErrorMsg("Please enter a gift card code");
      return;
    }
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const creditAdded = await redeem.mutateAsync(code.trim().toUpperCase());
      setSuccessMsg(
        `${formatCreditDisplay(creditAdded)} credit added to your account!`,
      );
      setCode("");
    } catch {
      setErrorMsg("Invalid or already redeemed code");
    }
  };

  return (
    <div
      className="mt-5 border-t border-primary/20 pt-5"
      data-ocid="profile.redeem.panel"
    >
      <div className="flex items-center gap-2 mb-3">
        <Gift className="w-4 h-4 text-primary" />
        <span className="font-mono text-xs text-primary/60 tracking-widest uppercase">
          Redeem Gift Card
        </span>
      </div>

      <div className="space-y-2">
        <Input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setSuccessMsg("");
            setErrorMsg("");
          }}
          placeholder="ENTER CODE..."
          className="font-mono text-sm bg-black border-primary/30 text-primary placeholder:text-primary/20 focus:border-primary tracking-widest"
          onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
          data-ocid="profile.redeem.input"
        />
        <Button
          onClick={handleRedeem}
          disabled={redeem.isPending || !code.trim()}
          className="w-full font-mono text-xs h-9 tracking-widest"
          data-ocid="profile.redeem.submit_button"
        >
          {redeem.isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
              REDEEMING...
            </>
          ) : (
            "REDEEM"
          )}
        </Button>
      </div>

      {successMsg && (
        <p
          className="mt-2 text-xs font-mono text-primary"
          style={{ textShadow: "0 0 8px rgba(0,255,65,0.5)" }}
          data-ocid="profile.redeem.success_state"
        >
          ✓ {successMsg}
        </p>
      )}
      {errorMsg && (
        <p
          className="mt-2 text-xs font-mono text-red-400"
          data-ocid="profile.redeem.error_state"
        >
          ✗ {errorMsg}
        </p>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: orders = [], isLoading } = useGetMyOrders();
  const principal = identity?.getPrincipal() ?? null;
  const { data: credit = BigInt(0), isLoading: creditLoading } =
    useGetUserCredit(principal);

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <div className="terminal-border rounded-lg p-8 bg-black">
          <User className="w-12 h-12 text-primary/40 mx-auto mb-4" />
          <h2 className="font-mono text-xl font-bold mb-2 text-primary glow-green-text">
            ACCESS DENIED
          </h2>
          <p className="text-muted-foreground font-mono text-sm mb-6">
            &gt; Authentication required to view profile.
          </p>
          <Link to="/">
            <Button className="font-mono" data-ocid="profile.signin.button">
              RETURN TO STORE
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const principalId = identity.getPrincipal().toString();
  const truncatedPrincipal =
    principalId.length > 20
      ? `${principalId.slice(0, 10)}...${principalId.slice(-8)}`
      : principalId;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Terminal className="w-6 h-6 text-primary" />
          <h1
            className="font-mono font-bold text-3xl text-primary glow-green-text tracking-widest"
            style={{ fontFamily: "'Share Tech Mono', monospace" }}
          >
            MY PROFILE
          </h1>
        </div>
        <div className="flex items-center gap-2 mt-3 p-3 bg-primary/5 border border-primary/20 rounded-sm">
          <span className="font-mono text-xs text-primary/50">
            &gt; PRINCIPAL:
          </span>
          <span className="font-mono text-xs text-primary/80">
            {truncatedPrincipal}
          </span>
          <CopyButton text={principalId} label="principal ID" />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credit Balance Card */}
        <div className="lg:col-span-1">
          <Card
            className="bg-black border-primary/40 glow-green"
            data-ocid="profile.credit.card"
          >
            <CardHeader className="pb-2">
              <CardTitle className="font-mono text-sm text-primary/60 tracking-widest">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  STORE CREDIT
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-4">
                {creditLoading ? (
                  <Skeleton className="h-10 w-32" />
                ) : (
                  <div
                    className="font-mono text-4xl font-bold text-primary glow-green-text tracking-wider"
                    style={{ fontFamily: "'Share Tech Mono', monospace" }}
                    data-ocid="profile.credit.balance"
                  >
                    {formatCreditDisplay(credit)}
                  </div>
                )}
                <div className="mt-1 text-xs font-mono text-primary/40">
                  AVAILABLE BALANCE
                </div>
              </div>

              <div className="mt-2 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-primary/40">Total Orders</span>
                  <span className="text-primary">{orders.length}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-primary/40">Accepted</span>
                  <span className="text-primary">
                    {
                      orders.filter((o) => o.status.__kind__ === "accepted")
                        .length
                    }
                  </span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-primary/40">Pending</span>
                  <span className="text-yellow-400">
                    {
                      orders.filter((o) => o.status.__kind__ === "pending")
                        .length
                    }
                  </span>
                </div>
              </div>

              <RedeemGiftCardSection />
            </CardContent>
          </Card>
        </div>

        {/* Order History */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2
              className="font-mono font-bold text-lg text-primary tracking-wider"
              style={{ fontFamily: "'Share Tech Mono', monospace" }}
            >
              ORDER HISTORY
            </h2>
            <span className="font-mono text-xs text-primary/40">
              [{orders.length} RECORDS]
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-4" data-ocid="profile.orders.loading_state">
              {SKELETONS.map((k) => (
                <Skeleton key={k} className="h-32 w-full rounded-sm" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-center terminal-border rounded-sm bg-black/50"
              data-ocid="profile.orders.empty_state"
            >
              <ShoppingBag className="w-10 h-10 text-primary/20 mb-4" />
              <h3 className="font-mono text-sm font-semibold mb-1 text-primary/60">
                NO ORDERS FOUND
              </h3>
              <p className="text-muted-foreground text-xs font-mono mb-4">
                &gt; Database query returned 0 results.
              </p>
              <Link to="/">
                <Button
                  size="sm"
                  className="font-mono text-xs"
                  data-ocid="profile.browse.button"
                >
                  BROWSE STORE
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3" data-ocid="profile.orders.list">
              {orders.map((order, index) => (
                <Card
                  key={order.id.toString()}
                  className="bg-black border-primary/20 hover:border-primary/50 transition-colors"
                  data-ocid={`profile.orders.item.${index + 1}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="font-mono text-sm text-foreground">
                          {order.productTitle}
                        </CardTitle>
                        <p className="text-xs text-primary/40 mt-0.5 font-mono">
                          &gt; ORDER #{order.id.toString()} ·{" "}
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs font-mono">
                      <span className="text-primary/40">
                        PRICE:{" "}
                        <span className="text-primary font-bold">
                          £{(Number(order.productPrice) / 100).toFixed(2)}
                        </span>
                      </span>
                      <span className="text-primary/40">
                        PAYMENT:{" "}
                        <span className="text-primary/80">
                          {getPaymentMethodLabel(order.paymentMethod)}
                        </span>
                      </span>
                    </div>
                    {order.status.__kind__ === "accepted" && (
                      <AccountDetailsRow orderId={order.id} />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
