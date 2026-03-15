import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { CheckCircle, Clock, Eye, ShoppingBag, XCircle } from "lucide-react";
import { useState } from "react";
import type { Order } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetMyOrders, useGetOrderAccountDetails } from "../hooks/useQueries";

const SKELETONS = ["a", "b", "c"];

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

function AccountDetailsRow({ orderId }: { orderId: bigint }) {
  const [show, setShow] = useState(false);
  const { data, isLoading } = useGetOrderAccountDetails(show ? orderId : null);
  return (
    <div className="mt-3">
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 text-primary border-primary/40"
        onClick={() => setShow(!show)}
        data-ocid="orders.account_details.button"
      >
        <Eye className="w-3.5 h-3.5" />
        {show ? "Hide" : "View"} Account Details
      </Button>
      {show && (
        <Alert className="mt-2 bg-primary/10 border-primary/30">
          <AlertDescription>
            {isLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {data || "No details available"}
              </pre>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default function MyOrdersPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: orders = [], isLoading } = useGetMyOrders();

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <ShoppingBag className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
        <h2 className="font-display text-xl font-bold mb-2">
          Sign In Required
        </h2>
        <p className="text-muted-foreground mb-6">
          Please sign in to view your orders.
        </p>
        <Link to="/">
          <Button>Go to Store</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-1">My Orders</h1>
        <p className="text-muted-foreground">
          Track the status of your gaming account purchases.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4" data-ocid="orders.loading_state">
          {SKELETONS.map((k) => (
            <Skeleton key={k} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          data-ocid="orders.empty_state"
        >
          <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="font-display text-lg font-semibold mb-1">
            No orders yet
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Browse our store and place your first order.
          </p>
          <Link to="/">
            <Button>Browse Store</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4" data-ocid="orders.list">
          {orders.map((order, index) => (
            <Card
              key={order.id.toString()}
              className="bg-card border-border"
              data-ocid={`orders.item.${index + 1}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="font-display text-base">
                      {order.productTitle}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Order #{order.id.toString()} ·{" "}
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <span className="text-muted-foreground">
                    Price:{" "}
                    <span className="text-foreground font-medium">
                      {formatPrice(order.productPrice)}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    Payment:{" "}
                    <span className="text-foreground font-medium">
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
  );
}
