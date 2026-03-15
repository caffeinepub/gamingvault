import { Heart } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const caffeineUrl = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`;

  return (
    <footer className="border-t border-border bg-card/50 mt-auto terminal-border">
      <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span
            className="text-primary glow-green-text font-mono text-base font-bold"
            style={{ fontFamily: "'Share Tech Mono', monospace" }}
          >
            [H4CK.FST]
          </span>
          <span className="text-muted-foreground text-xs">
            — Premium Gaming Accounts
          </span>
        </div>
        <p className="flex items-center gap-1 text-xs">
          © {year}. Built with{" "}
          <Heart className="w-3.5 h-3.5 text-primary fill-primary" /> using{" "}
          <a
            href={caffeineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline glow-green-text"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </footer>
  );
}
