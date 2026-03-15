import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Loader2, LogIn, LogOut, ShieldCheck, ShoppingBag } from "lucide-react";
import type { Currency } from "../hooks/useCurrency";
import { useCurrency } from "../hooks/useCurrency";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { usePatreonUrl } from "../hooks/usePatreonUrl";
import PatreonBanner from "./PatreonBanner";

const CURRENCIES: { code: Currency; symbol: string }[] = [
  { code: "GBP", symbol: "£" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
];

export default function Header() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";
  const patreonUrl = usePatreonUrl();
  const { currency, setCurrency } = useCurrency();

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        if (error?.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md terminal-border">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          to="/"
          className="flex items-center gap-2 group"
          data-ocid="nav.link"
        >
          <img
            src="/assets/generated/hf-logo-transparent.dim_80x80.png"
            alt="HF"
            className="w-9 h-9 drop-shadow-[0_0_8px_#00ff41] group-hover:drop-shadow-[0_0_14px_#00ff41] transition-all"
          />
          <span
            className="font-mono font-bold text-xl tracking-wider text-primary flicker"
            style={{ fontFamily: "'Share Tech Mono', monospace" }}
          >
            H4CK<span className="glitch glow-green-text">.FST</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          {patreonUrl && <PatreonBanner variant="slim" />}

          {/* Currency Selector */}
          <div
            className="flex items-center rounded-sm border border-primary/40 overflow-hidden"
            data-ocid="currency.select"
          >
            {CURRENCIES.map(({ code, symbol }) => (
              <button
                key={code}
                type="button"
                onClick={() => setCurrency(code)}
                className={`px-2 py-1 text-xs font-mono transition-all ${
                  currency === code
                    ? "bg-primary text-background font-bold"
                    : "bg-transparent text-primary/60 hover:text-primary hover:bg-primary/10"
                }`}
                data-ocid={`currency.${code.toLowerCase()}.toggle`}
                title={code}
              >
                {symbol}
              </button>
            ))}
          </div>

          {isAuthenticated && (
            <Link to="/orders">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-primary hover:text-primary hover:bg-primary/10"
                data-ocid="orders.link"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">My Orders</span>
              </Button>
            </Link>
          )}
          <Link to="/staff">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/70 glow-green"
              data-ocid="staff.link"
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Staff</span>
            </Button>
          </Link>
          <Button
            onClick={handleAuth}
            disabled={isLoggingIn}
            variant={isAuthenticated ? "outline" : "default"}
            size="sm"
            className="gap-2 border-primary/40 text-primary hover:bg-primary/20"
            data-ocid="auth.button"
          >
            {isLoggingIn ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isAuthenticated ? (
              <LogOut className="w-4 h-4" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            {isLoggingIn
              ? "Connecting..."
              : isAuthenticated
                ? "Sign Out"
                : "Sign In"}
          </Button>
        </nav>
      </div>
    </header>
  );
}
