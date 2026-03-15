import { motion } from "motion/react";
import { usePatreonUrl } from "../hooks/usePatreonUrl";

interface PatreonBannerProps {
  variant?: "hero" | "inline" | "slim";
}

export default function PatreonBanner({
  variant = "inline",
}: PatreonBannerProps) {
  const patreonUrl = usePatreonUrl();

  if (!patreonUrl) return null;

  if (variant === "slim") {
    return (
      <motion.a
        href={patreonUrl}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[#f96854]/50 bg-[#f96854]/10 text-[#f96854] hover:bg-[#f96854]/20 hover:border-[#f96854]/80 transition-all text-xs font-mono font-bold tracking-wider"
        data-ocid="patreon.link"
        style={{ fontFamily: "'Share Tech Mono', monospace" }}
      >
        <PatreonIcon className="w-3.5 h-3.5" />
        PATREON
      </motion.a>
    );
  }

  if (variant === "hero") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full border border-[#f96854]/40 bg-[#f96854]/8 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(90deg, rgba(249,104,84,0.08) 0%, rgba(249,104,84,0.03) 50%, rgba(249,104,84,0.08) 100%)",
        }}
      >
        {/* Scanline accent */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(249,104,84,0.03) 2px, rgba(249,104,84,0.03) 4px)",
          }}
        />
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <PatreonIcon className="w-6 h-6 text-[#f96854] flex-shrink-0" />
            <div>
              <p
                className="text-sm font-bold text-[#f96854] tracking-wider"
                style={{ fontFamily: "'Share Tech Mono', monospace" }}
              >
                &gt;_ SUPPORT H4CK.FST ON PATREON
              </p>
              <p className="text-xs text-[#f96854]/70 font-mono mt-0.5">
                Donate &amp; unlock exclusive deals, freebies, and much more
              </p>
            </div>
          </div>
          <a
            href={patreonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2 rounded-sm font-mono font-bold text-sm tracking-wider border border-[#f96854] text-[#f96854] hover:bg-[#f96854] hover:text-black transition-all"
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              boxShadow: "0 0 12px rgba(249,104,84,0.25)",
            }}
            data-ocid="patreon.primary_button"
          >
            <PatreonIcon className="w-4 h-4" />
            DONATE ON PATREON
          </a>
        </div>
      </motion.div>
    );
  }

  // inline variant
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="rounded-sm border border-[#f96854]/40 overflow-hidden relative"
      style={{
        background:
          "linear-gradient(135deg, rgba(249,104,84,0.10) 0%, rgba(0,0,0,0) 60%, rgba(249,104,84,0.06) 100%)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(249,104,84,0.03) 3px, rgba(249,104,84,0.03) 4px)",
        }}
      />
      <div className="px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative">
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(249,104,84,0.15)",
              border: "1px solid rgba(249,104,84,0.4)",
            }}
          >
            <PatreonIcon className="w-4.5 h-4.5 text-[#f96854]" />
          </div>
          <div>
            <p
              className="text-sm font-bold text-[#f96854] tracking-wider mb-0.5"
              style={{ fontFamily: "'Share Tech Mono', monospace" }}
            >
              SUPPORT ON PATREON
            </p>
            <p
              className="text-xs font-mono"
              style={{ color: "rgba(249,104,84,0.7)" }}
            >
              Donate and get exclusive deals, freebies &amp; much more
            </p>
          </div>
        </div>
        <a
          href={patreonUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-sm font-mono font-bold text-xs tracking-wider border border-[#f96854]/60 text-[#f96854] hover:bg-[#f96854] hover:text-black transition-all"
          style={{ fontFamily: "'Share Tech Mono', monospace" }}
          data-ocid="patreon.secondary_button"
        >
          <PatreonIcon className="w-3.5 h-3.5" />
          DONATE NOW
        </a>
      </div>
    </motion.div>
  );
}

function PatreonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Patreon"
    >
      <path d="M14.82 2.41C11.57 2.41 8.93 5.05 8.93 8.3c0 3.24 2.64 5.88 5.89 5.88 3.24 0 5.88-2.64 5.88-5.88 0-3.25-2.64-5.89-5.88-5.89zM2 21.6h3.5V2.41H2V21.6z" />
    </svg>
  );
}
