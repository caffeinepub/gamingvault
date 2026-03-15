import { useCallback, useEffect, useRef, useState } from "react";
import MatrixRain from "./MatrixRain";

interface HackingCutsceneProps {
  onComplete: () => void;
}

interface TerminalLine {
  id: number;
  text: string;
  bright?: boolean;
  alert?: boolean;
}

// Regex: exactly 2 letters then exactly 5 digits
const CPM_ID_REGEX = /^[A-Za-z]{2}\d{5}$/;

// Lines printed before the ID gate appears
const GATE_AFTER = 16;

const HACK_LINE_POOL = [
  // --- Initial setup (4 lines) ---
  { text: "> INITIALIZING H4CK.FST SECURE GATEWAY...", delay: 80 },
  { text: "> ESTABLISHING ENCRYPTED TUNNEL...", delay: 110 },
  { text: "> ROUTING THROUGH: TOR[7] -> PROXY[23] -> VPN[4]...", delay: 128 },
  {
    text: "> TARGET ACQUIRED: CAR PARKING MULTIPLAYER (v4.8.14)",
    delay: 96,
    alert: true,
  },
  // --- 12 CPM real terminal hacking lines ---
  {
    text: "> nmap -sS 185.92.220.14 -p 27017,3000,8080,443 --open",
    delay: 140,
  },
  { text: "> PORT 27017/tcp open  mongodb  MongoDB 5.0.2", delay: 88 },
  {
    text: "> mongo --host 185.92.220.14:27017 --authenticationDatabase cpm_live",
    delay: 112,
  },
  {
    text: "> use cpm_playerdb;  db.players.count() --> 4,837,291 records",
    delay: 96,
  },
  {
    text: "> db.players.find({},{playerId:1,username:1,coins:1,vip:1}).limit(50000)",
    delay: 120,
  },
  {
    text: "> [####################] DUMPED 50,000 / 50,000 records  (12.3 MB)",
    delay: 64,
    bright: true,
  },
  {
    text: "> CRACKING SESSION TOKEN: eyJhbGciOiJIUzI1NiJ9.cpmLIVE.xP9a...",
    delay: 128,
  },
  {
    text: "> JWT SECRET EXTRACTED: cpm_s3cr3t_k3y_!2024@prod",
    delay: 72,
    alert: true,
  },
  {
    text: "> CPM_AUTH BYPASS: SUCCESS -- SESSION HIJACKED",
    delay: 56,
    alert: true,
  },
  {
    text: "> SELECT * FROM cpm_accounts WHERE vip_level > 3;  --> 2,194 rows",
    delay: 104,
  },
  {
    text: "> WRITE ACCESS CONFIRMED: db.players.updateMany({},{$set:{coins:999999}})",
    delay: 120,
  },
  {
    text: "> PLAYER DATABASE: FULL READ/WRITE ACCESS GRANTED",
    delay: 48,
    bright: true,
  },
  // --- Post-gate lines (resume after ID confirmed) ---
  { text: "> INJECTING SHELLCODE [################] 100%", delay: 104 },
  { text: "> PRIVILEGE ESCALATION: SUDO -> ROOT...", delay: 88 },
  { text: ">>> ROOT ACCESS GRANTED <<<", delay: 40, bright: true },
  { text: "> UID=0(ROOT) GID=0(ROOT) GROUPS=0(ROOT)", delay: 72 },
  {
    text: "> INJECTING PAYLOAD INTO KERNEL @ 0xffffffff81000000...",
    delay: 124,
  },
  { text: "> DEPLOYING ROOTKIT: stealth_v9.bin", delay: 108 },
  { text: "> KERNEL MODULE LOADED: [h4ck_stealth.ko]", delay: 80 },
  { text: "> BYPASSING INTRUSION DETECTION SYSTEM...", delay: 96 },
  { text: "> IDS SIGNATURE SPOOFED [CLEAN]", delay: 72 },
  { text: "> CONNECTING TO PRODUCT DATABASE...", delay: 104 },
  { text: "> DUMPING TABLE: accounts (3,847 records)", delay: 120 },
  { text: "> DUMPING TABLE: users (12,441 records)", delay: 112 },
  { text: "> EXFILTRATING DATA -> NULL_ROUTE_9.onion...", delay: 88 },
  { text: "> TRANSFER COMPLETE: 847MB EXTRACTED", delay: 80 },
  { text: "> WIPING ACCESS LOGS: /var/log/auth.log", delay: 100 },
  { text: "> WIPING ACCESS LOGS: /var/log/syslog", delay: 72 },
  { text: "> OVERWRITING BASH HISTORY...", delay: 80 },
  { text: "> DEPLOYING OBFUSCATION LAYER ALPHA-7...", delay: 112 },
  { text: "> DEPLOYING OBFUSCATION LAYER BETA-12...", delay: 104 },
  { text: "> TRACE ROUTE: CLEARED", delay: 60 },
  { text: "> FORENSIC ARTIFACTS: DESTROYED", delay: 60 },
  { text: "> CONNECTION CLOSED -- GHOST PROTOCOL ACTIVE", delay: 80 },
  {
    text: ">>> ACCESS GRANTED :: H4CK.FST ONLINE <<<",
    delay: 40,
    bright: true,
  },
  // Phase 2 cycling lines
  { text: "> SCANNING FOR ADDITIONAL VECTORS...", delay: 100 },
  {
    text: "> FOUND 3 NEW EXPLOITS IN DEPENDENCY CHAIN",
    delay: 80,
    alert: true,
  },
  { text: "> LATERAL MOVEMENT: 192.168.1.0/24", delay: 96 },
  { text: "> COMPROMISING HOST: 192.168.1.14...", delay: 112 },
  { text: "> DUMPING CREDENTIALS: /etc/shadow", delay: 88 },
  { text: "> CRACKING HASHES [GPU CLUSTER ONLINE]...", delay: 120 },
  { text: "> PASSWORD CRACKED: admin:h4ck3r2024", delay: 64, alert: true },
  { text: "> PIVOTING TO INTERNAL NETWORK SEGMENT...", delay: 104 },
  { text: "> INSTALLING PERSISTENT BACKDOOR...", delay: 96 },
  { text: "> BACKDOOR ACTIVE ON PORT 31337", delay: 48, bright: true },
  { text: "> ENCRYPTING EXFIL CHANNEL...", delay: 80 },
  { text: "> BYPASSING DLP CONTROLS...", delay: 88 },
  { text: "> EXFIL STREAM ACTIVE: 250MB/s", delay: 72 },
  { text: "> SPINNING UP TOR HIDDEN SERVICE...", delay: 104 },
  { text: "> H4CK.FST DARKNET NODE: ONLINE", delay: 48, bright: true },
  { text: "> PATCHING KERNEL AUDIT TRAIL...", delay: 96 },
  { text: "> MEMORY DUMP: SECURE", delay: 72 },
  { text: "> ANTI-FORENSICS MODULE: ACTIVE", delay: 80 },
  { text: "> ALL TRACKS COVERED -- GHOST MODE", delay: 88 },
];

const MAX_VISIBLE = 18;

const PROGRESS_BARS = [
  { label: "BYPASSING FIREWALL", start: 0, end: 0.2 },
  { label: "INJECTING PAYLOAD", start: 0.2, end: 0.45 },
  { label: "DECRYPTING DATABASE", start: 0.45, end: 0.65 },
  { label: "COVERING TRACKS", start: 0.65, end: 0.85 },
  { label: "SYSTEM ONLINE", start: 0.85, end: 1.0 },
];

const BOOT_STATUS_LINES = [
  "POWER ON...",
  "BIOS v2.4.1 OK",
  "RAM CHECK... 65536MB OK",
  "LOADING BOOT SECTOR...",
  "SYSTEM READY",
];

// ─── Power On Screen ──────────────────────────────────────────────────────────
function PowerOnScreen({ onDone }: { onDone: () => void }) {
  const [powered, setPowered] = useState<boolean>(false);
  const [activated, setActivated] = useState<boolean>(false);
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [fading, setFading] = useState<boolean>(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const handlePowerOn = useCallback(() => {
    if (powered) return;
    setPowered(true);
    setActivated(true);

    // After brief flash, de-activate glow burst
    setTimeout(() => setActivated(false), 400);

    const timers: ReturnType<typeof setTimeout>[] = [];
    // Show each status line every ~500ms
    BOOT_STATUS_LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), 300 + i * 500));
    });
    // Start fade after all lines shown
    timers.push(
      setTimeout(() => setFading(true), 300 + BOOT_STATUS_LINES.length * 500),
    );
    // Call onDone after fade
    timers.push(
      setTimeout(
        () => onDoneRef.current(),
        300 + BOOT_STATUS_LINES.length * 500 + 700,
      ),
    );

    return () => timers.forEach(clearTimeout);
  }, [powered]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
        opacity: fading ? 0 : 1,
        transition: "opacity 0.7s ease",
      }}
    >
      {/* Boot logo */}
      <div
        style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: "3rem",
          fontWeight: 700,
          color: "#00ff41",
          letterSpacing: "0.18em",
          textShadow:
            "0 0 20px #00ff41, 0 0 60px rgba(0,255,65,0.8), 0 0 100px rgba(0,255,65,0.4)",
          marginBottom: "48px",
          animation: "logoGlow 2s ease-in-out infinite alternate",
        }}
      >
        H4CK.FST
      </div>

      {/* Clickable power button */}
      {!powered && (
        <button
          type="button"
          data-ocid="boot.primary_button"
          onClick={handlePowerOn}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "18px",
            outline: "none",
          }}
          aria-label="Power on H4CK.FST"
        >
          {/* Glowing circle surround */}
          <div
            style={{
              width: "110px",
              height: "110px",
              borderRadius: "50%",
              border: `2px solid ${activated ? "#afffbc" : "rgba(0,255,65,0.35)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: activated
                ? "0 0 60px #00ff41, 0 0 120px rgba(0,255,65,0.7), inset 0 0 30px rgba(0,255,65,0.15)"
                : "0 0 20px rgba(0,255,65,0.2), inset 0 0 10px rgba(0,255,65,0.05)",
              transition: "box-shadow 0.2s ease, border-color 0.2s ease",
              animation: "powerRingPulse 2.5s ease-in-out infinite",
            }}
          >
            <svg
              role="img"
              aria-label="Power button"
              width="64"
              height="64"
              viewBox="0 0 80 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                filter: activated
                  ? "drop-shadow(0 0 28px #00ff41) drop-shadow(0 0 80px rgba(0,255,65,0.9))"
                  : "drop-shadow(0 0 14px #00ff41) drop-shadow(0 0 40px rgba(0,255,65,0.6))",
                transition: "filter 0.2s ease",
                animation: "powerPulse 2s ease-in-out infinite",
              }}
            >
              {/* Vertical line at top */}
              <line
                x1="40"
                y1="12"
                x2="40"
                y2="36"
                stroke="#00ff41"
                strokeWidth="5"
                strokeLinecap="round"
              />
              {/* Circular arc (power symbol) */}
              <path
                d="M 24 22 A 22 22 0 1 0 56 22"
                stroke="#00ff41"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>

          {/* Blinking press label */}
          <span
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "0.72rem",
              color: "rgba(0,255,65,0.7)",
              letterSpacing: "0.22em",
              textShadow: "0 0 8px rgba(0,255,65,0.5)",
              animation: "blinkLabel 1.1s step-end infinite",
              userSelect: "none",
            }}
          >
            [ PRESS TO POWER ON ]
          </span>
        </button>
      )}

      {/* Power activated — show non-interactive icon + boot lines */}
      {powered && (
        <>
          <div
            style={{
              marginBottom: "28px",
              animation: "powerPulse 2s ease-in-out infinite",
            }}
          >
            <svg
              role="img"
              aria-label="Power button"
              width="80"
              height="80"
              viewBox="0 0 80 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                filter:
                  "drop-shadow(0 0 28px #00ff41) drop-shadow(0 0 80px rgba(0,255,65,0.9))",
              }}
            >
              <line
                x1="40"
                y1="12"
                x2="40"
                y2="36"
                stroke="#00ff41"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M 24 22 A 22 22 0 1 0 56 22"
                stroke="#00ff41"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>

          {/* Boot status lines */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              minWidth: "260px",
            }}
          >
            {BOOT_STATUS_LINES.map((line, i) => (
              <div
                key={line}
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "0.78rem",
                  color: "rgba(0,255,65,0.6)",
                  letterSpacing: "0.12em",
                  opacity: i < visibleLines ? 1 : 0,
                  transition: "opacity 0.3s ease",
                  textShadow: "0 0 6px rgba(0,255,65,0.4)",
                }}
              >
                &gt; {line}
              </div>
            ))}
          </div>
        </>
      )}

      <style>{`
        @keyframes powerPulse {
          0%, 100% {
            filter: drop-shadow(0 0 14px #00ff41) drop-shadow(0 0 40px rgba(0,255,65,0.6));
          }
          50% {
            filter: drop-shadow(0 0 28px #00ff41) drop-shadow(0 0 80px rgba(0,255,65,0.9)) drop-shadow(0 0 120px rgba(0,255,65,0.4));
          }
        }
        @keyframes powerRingPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(0,255,65,0.2), inset 0 0 10px rgba(0,255,65,0.05); }
          50% { box-shadow: 0 0 40px rgba(0,255,65,0.45), inset 0 0 20px rgba(0,255,65,0.08); }
        }
        @keyframes logoGlow {
          from { text-shadow: 0 0 20px #00ff41, 0 0 60px rgba(0,255,65,0.8); }
          to   { text-shadow: 0 0 30px #00ff41, 0 0 90px rgba(0,255,65,1), 0 0 140px rgba(0,255,65,0.5); }
        }
        @keyframes blinkLabel {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        button[data-ocid="boot.primary_button"]:hover svg {
          filter: drop-shadow(0 0 22px #00ff41) drop-shadow(0 0 60px rgba(0,255,65,0.85)) !important;
        }
        button[data-ocid="boot.primary_button"]:hover span {
          color: #00ff41 !important;
          text-shadow: 0 0 16px rgba(0,255,65,0.9) !important;
        }
        button[data-ocid="boot.primary_button"]:focus-visible {
          outline: 2px solid rgba(0,255,65,0.6);
          outline-offset: 8px;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
}

// ─── Main cutscene ────────────────────────────────────────────────────────────
export default function HackingCutscene({ onComplete }: HackingCutsceneProps) {
  // Always clear any stored Player ID so the gate shows fresh on every visit
  useEffect(() => {
    sessionStorage.removeItem("cpmPlayerId");
  }, []);

  const [phase, setPhase] = useState<"boot" | "terminal">("boot");
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [glitchActive, setGlitchActive] = useState<boolean>(false);
  const [flashOpacity, setFlashOpacity] = useState<number>(0);
  const [shakeOffset, setShakeOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [blinkVisible, setBlinkVisible] = useState<boolean>(true);

  // ID gate state — always false on mount (sessionStorage cleared above)
  const [gateVisible, setGateVisible] = useState<boolean>(false);
  const [cpmId, setCpmId] = useState<string>("");
  const [gateError, setGateError] = useState<string>("");
  const [idConfirmed, setIdConfirmed] = useState<boolean>(false);

  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const durationRef = useRef<number>(Math.random() * 35000 + 45000);
  const startTimeRef = useRef<number>(Date.now());
  const completedRef = useRef<boolean>(false);
  const lineIdRef = useRef<number>(0);
  const pausedRef = useRef<boolean>(false);
  const resumeRef = useRef<(() => void) | null>(null);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    if (!sessionStorage.getItem("cpmPlayerId")) return;
    completedRef.current = true;

    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (phase !== "terminal") return;
    const handler = (e: Event) => {
      if (pausedRef.current) return;
      if (e.type === "click") {
        const target = e.target as HTMLElement;
        if (target.closest("[data-gate]")) return;
      }
      finish();
    };
    window.addEventListener("keydown", handler);
    window.addEventListener("click", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("click", handler);
    };
  }, [finish, phase]);

  useEffect(() => {
    if (phase !== "terminal") return;
    const timer = setTimeout(finish, durationRef.current);
    return () => clearTimeout(timer);
  }, [finish, phase]);

  useEffect(() => {
    if (phase !== "terminal") return;
    const start = Date.now();
    const duration = durationRef.current;
    let raf: number;
    let pausedTime = 0;
    let lastFrameTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const delta = now - lastFrameTime;
      lastFrameTime = now;

      if (pausedRef.current) {
        pausedTime += delta;
        raf = requestAnimationFrame(animate);
        return;
      }

      const elapsed = now - start - pausedTime;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  useEffect(() => {
    if (phase !== "terminal") return;
    let poolIdx = 0;
    let timeout: ReturnType<typeof setTimeout>;
    let stopped = false;

    const showNext = () => {
      if (stopped || completedRef.current) return;

      if (pausedRef.current) {
        resumeRef.current = showNext;
        return;
      }

      const entry = HACK_LINE_POOL[poolIdx % HACK_LINE_POOL.length];
      poolIdx++;

      const newLine: TerminalLine = {
        id: lineIdRef.current++,
        text: entry.text,
        bright: entry.bright,
        alert: entry.alert,
      };

      setLines((prev) => {
        const next = [...prev, newLine];
        return next.length > MAX_VISIBLE
          ? next.slice(next.length - MAX_VISIBLE)
          : next;
      });

      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }

      if (poolIdx === GATE_AFTER && !sessionStorage.getItem("cpmPlayerId")) {
        pausedRef.current = true;
        setGateVisible(true);
        resumeRef.current = () => {
          timeout = setTimeout(showNext, 80);
        };
        return;
      }

      const delay = entry.delay + Math.random() * 60;
      timeout = setTimeout(showNext, delay);
    };

    timeout = setTimeout(showNext, 80);
    return () => {
      stopped = true;
      clearTimeout(timeout);
    };
  }, [phase]);

  useEffect(() => {
    if (gateVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gateVisible]);

  const handleConfirm = useCallback(() => {
    const trimmed = cpmId.trim().toUpperCase();
    if (!trimmed) {
      setGateError("> ERROR: PLAYER ID REQUIRED. ACCESS DENIED.");
      return;
    }
    if (!CPM_ID_REGEX.test(trimmed)) {
      setGateError(
        "> ERROR: INVALID FORMAT. EXPECTED 2 LETTERS + 5 NUMBERS (e.g. AB12345).",
      );
      return;
    }
    sessionStorage.setItem("cpmPlayerId", trimmed);
    setIdConfirmed(true);
    setGateVisible(false);
    setGateError("");
    pausedRef.current = false;
    if (resumeRef.current) {
      resumeRef.current();
      resumeRef.current = null;
    }
  }, [cpmId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.stopPropagation();
        handleConfirm();
      }
    },
    [handleConfirm],
  );

  useEffect(() => {
    let glitchTimer: ReturnType<typeof setTimeout>;
    const trigger = () => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 150 + Math.random() * 100);
      glitchTimer = setTimeout(trigger, 800 + Math.random() * 1200);
    };
    glitchTimer = setTimeout(trigger, 1000);
    return () => clearTimeout(glitchTimer);
  }, []);

  useEffect(() => {
    let flashTimer: ReturnType<typeof setTimeout>;
    const flash = () => {
      setFlashOpacity(0.1 + Math.random() * 0.12);
      setTimeout(() => setFlashOpacity(0), 80);
      flashTimer = setTimeout(flash, 3000 + Math.random() * 5000);
    };
    flashTimer = setTimeout(flash, 2000);
    return () => clearTimeout(flashTimer);
  }, []);

  useEffect(() => {
    let shakeTimer: ReturnType<typeof setTimeout>;
    const shake = () => {
      setShakeOffset({
        x: (Math.random() - 0.5) * 6,
        y: (Math.random() - 0.5) * 4,
      });
      setTimeout(() => setShakeOffset({ x: 0, y: 0 }), 120);
      shakeTimer = setTimeout(shake, 4000 + Math.random() * 6000);
    };
    shakeTimer = setTimeout(shake, 3000);
    return () => clearTimeout(shakeTimer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setBlinkVisible((v) => !v), 500);
    return () => clearInterval(interval);
  }, []);

  const getBarProgress = (bar: (typeof PROGRESS_BARS)[0]) => {
    if (progress <= bar.start) return 0;
    if (progress >= bar.end) return 100;
    return ((progress - bar.start) / (bar.end - bar.start)) * 100;
  };

  const elapsed = Date.now() - startTimeRef.current;
  const remaining = Math.max(0, durationRef.current - elapsed);
  const remainingSecs = Math.ceil(remaining / 1000);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#000",
        transform: `translate(${shakeOffset.x}px, ${shakeOffset.y}px)`,
        transition: "transform 0.05s",
      }}
    >
      <MatrixRain className="absolute inset-0 w-full h-full opacity-40" />

      {/* Scanlines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.22) 2px, rgba(0,0,0,0.22) 4px)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Flash */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `rgba(0,255,65,${flashOpacity})`,
          pointerEvents: "none",
          zIndex: 2,
          transition: "opacity 0.05s",
        }}
      />

      {/* Content layer */}
      <div style={{ position: "relative", zIndex: 10, minHeight: "100vh" }}>
        {/* ── BOOT SCREEN ── */}
        {phase === "boot" && (
          <PowerOnScreen onDone={() => setPhase("terminal")} />
        )}

        {/* ── TERMINAL ── */}
        {phase === "terminal" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "100vh",
              padding: "24px",
              fontFamily: "'Share Tech Mono', monospace",
              animation: "fadeIn 0.5s ease",
            }}
          >
            <div
              style={{
                fontSize: "clamp(2rem, 6vw, 3.5rem)",
                fontWeight: 700,
                color: "#00ff41",
                marginBottom: "32px",
                letterSpacing: "0.15em",
                animation: glitchActive
                  ? "none"
                  : "cutsceneGlitch 1.5s infinite",
                textShadow: glitchActive
                  ? "-4px 0 #ff0040, 4px 0 #00ffff, 0 0 30px #00ff41"
                  : "0 0 20px #00ff41, 0 0 60px rgba(0,255,65,0.5)",
                transform: glitchActive
                  ? `translate(${(Math.random() - 0.5) * 10}px, ${(Math.random() - 0.5) * 4}px)`
                  : "none",
              }}
            >
              H4CK.FST
            </div>

            <div
              style={{
                width: "100%",
                maxWidth: "860px",
                border: "1px solid #00ff41",
                boxShadow:
                  "0 0 30px rgba(0,255,65,0.5), 0 0 80px rgba(0,255,65,0.2), inset 0 0 20px rgba(0,255,65,0.04)",
                background: "rgba(0,10,0,0.92)",
              }}
            >
              {/* Titlebar */}
              <div
                style={{
                  borderBottom: "1px solid rgba(0,255,65,0.3)",
                  padding: "8px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(0,255,65,0.05)",
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#ff5f56",
                  }}
                />
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#ffbd2e",
                  }}
                />
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#27c93f",
                  }}
                />
                <span
                  style={{
                    marginLeft: 8,
                    color: "rgba(0,255,65,0.6)",
                    fontSize: "0.75rem",
                  }}
                >
                  root@h4ck.fst -- bash
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    color: "rgba(0,255,65,0.4)",
                    fontSize: "0.7rem",
                  }}
                >
                  {idConfirmed
                    ? `ETA: ${remainingSecs}s`
                    : "-- AWAITING AUTH --"}
                </span>
              </div>

              {/* Terminal output */}
              <div
                ref={terminalRef}
                style={{
                  height: "320px",
                  overflowY: "auto",
                  padding: "16px",
                  fontSize: "0.78rem",
                  lineHeight: 1.7,
                  scrollbarWidth: "none",
                }}
              >
                {lines.map((line) => (
                  <div
                    key={line.id}
                    style={{
                      color: line.bright
                        ? "#ffffff"
                        : line.alert
                          ? "#ffcc00"
                          : "#00ff41",
                      textShadow: line.bright
                        ? "0 0 15px #00ff41, 0 0 40px rgba(0,255,65,0.8)"
                        : line.alert
                          ? "0 0 10px #ffcc00"
                          : "0 0 6px rgba(0,255,65,0.5)",
                      animation: line.bright
                        ? "brightPulse 0.8s ease-in-out infinite alternate"
                        : "none",
                      fontWeight: line.bright ? 700 : 400,
                    }}
                  >
                    {line.text}
                  </div>
                ))}

                {/* ID Gate prompt */}
                {gateVisible && (
                  <div
                    data-gate="true"
                    style={{
                      marginTop: "12px",
                      padding: "14px 16px",
                      border: "1px solid rgba(0,255,65,0.6)",
                      background: "rgba(0,20,0,0.95)",
                      boxShadow:
                        "0 0 20px rgba(0,255,65,0.3), inset 0 0 10px rgba(0,255,65,0.05)",
                    }}
                  >
                    <div
                      style={{
                        color: "#ffcc00",
                        textShadow: "0 0 10px #ffcc00",
                        marginBottom: "6px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                      }}
                    >
                      &gt; AUTHENTICATION REQUIRED
                    </div>
                    <div
                      style={{
                        color: "#00ff41",
                        textShadow: "0 0 6px rgba(0,255,65,0.5)",
                        marginBottom: "4px",
                        fontSize: "0.78rem",
                      }}
                    >
                      &gt; ENTER YOUR CAR PARKING MULTIPLAYER PLAYER ID TO
                      CONTINUE:
                    </div>
                    <div
                      style={{
                        color: "rgba(0,255,65,0.55)",
                        fontSize: "0.72rem",
                        marginBottom: "12px",
                      }}
                    >
                      &gt; FORMAT: 2 LETTERS + 5 NUMBERS &nbsp;(e.g. AB12345)
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "stretch",
                      }}
                    >
                      <input
                        ref={inputRef}
                        data-ocid="cutscene.input"
                        type="text"
                        value={cpmId}
                        onChange={(e) => {
                          setCpmId(e.target.value);
                          if (gateError) setGateError("");
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g. AB12345"
                        maxLength={7}
                        style={{
                          flex: 1,
                          background: "rgba(0,10,0,0.9)",
                          border: "1px solid #00ff41",
                          color: "#00ff41",
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: "0.82rem",
                          padding: "8px 12px",
                          outline: "none",
                          boxShadow: "0 0 10px rgba(0,255,65,0.3)",
                          caretColor: "#00ff41",
                          textTransform: "uppercase",
                        }}
                      />
                      <button
                        type="button"
                        data-ocid="cutscene.primary_button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirm();
                        }}
                        style={{
                          background: "#00ff41",
                          color: "#000",
                          border: "none",
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          padding: "8px 20px",
                          cursor: "pointer",
                          letterSpacing: "0.08em",
                          boxShadow: "0 0 16px rgba(0,255,65,0.7)",
                          transition: "background 0.15s, box-shadow 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "#afffbc";
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "#00ff41";
                        }}
                      >
                        CONFIRM
                      </button>
                    </div>
                    {gateError && (
                      <div
                        style={{
                          marginTop: "8px",
                          color: "#ff3333",
                          textShadow: "0 0 8px #ff0000",
                          fontSize: "0.76rem",
                        }}
                      >
                        {gateError}
                      </div>
                    )}
                  </div>
                )}

                {!gateVisible && (
                  <div style={{ color: "#00ff41" }}>
                    <span style={{ opacity: blinkVisible ? 1 : 0 }}>|</span>
                  </div>
                )}
              </div>

              {/* Progress bars */}
              <div
                style={{
                  borderTop: "1px solid rgba(0,255,65,0.2)",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {PROGRESS_BARS.map((bar) => {
                  const pct = getBarProgress(bar);
                  const isActive = progress > bar.start && progress < bar.end;
                  return (
                    <div key={bar.label}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.7rem",
                          color:
                            pct >= 100
                              ? "#00ff41"
                              : isActive
                                ? "#afffbc"
                                : "rgba(0,255,65,0.4)",
                          marginBottom: "4px",
                        }}
                      >
                        <span>{bar.label}</span>
                        <span>{Math.floor(pct)}%</span>
                      </div>
                      <div
                        style={{
                          height: "6px",
                          background: "rgba(0,255,65,0.1)",
                          border: "1px solid rgba(0,255,65,0.2)",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background:
                              pct >= 100
                                ? "#00ff41"
                                : "linear-gradient(90deg, #00ff41, #afffbc)",
                            boxShadow: isActive
                              ? "0 0 12px #00ff41, 0 0 24px rgba(0,255,65,0.6)"
                              : "none",
                            transition: "width 0.15s linear",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {!gateVisible && (
              <div
                style={{
                  marginTop: "28px",
                  fontSize: "0.75rem",
                  color: "rgba(0,255,65,0.5)",
                  letterSpacing: "0.1em",
                  animation: "blinkAnim 1.2s step-end infinite",
                }}
              >
                [ PRESS ANY KEY TO SKIP ]
              </div>
            )}
            {gateVisible && (
              <div
                style={{
                  marginTop: "28px",
                  fontSize: "0.75rem",
                  color: "rgba(255,204,0,0.7)",
                  letterSpacing: "0.1em",
                  textShadow: "0 0 8px rgba(255,204,0,0.4)",
                  animation: "blinkAnim 1.2s step-end infinite",
                }}
              >
                [ AUTHENTICATION REQUIRED TO PROCEED ]
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes cutsceneGlitch {
          0%   { text-shadow: 0 0 20px #00ff41, 0 0 60px rgba(0,255,65,0.5); transform: translate(0); }
          5%   { text-shadow: -5px 0 #ff0040, 5px 0 #00ffff, 0 0 30px #00ff41; transform: translate(-4px, 2px); }
          6%   { text-shadow: 5px 0 #ff0040, -5px 0 #00ffff; transform: translate(4px, -2px); }
          7%   { text-shadow: 0 0 20px #00ff41; transform: translate(0); }
          15%  { text-shadow: -3px 0 #ff0040, 3px 0 #00ffff; transform: translate(-2px, 1px); }
          16%  { text-shadow: 3px 0 #ff0040; transform: translate(3px); }
          17%  { text-shadow: 0 0 20px #00ff41; transform: translate(0); }
          50%  { text-shadow: 0 0 20px #00ff41, 0 0 40px rgba(0,255,65,0.6); transform: translate(0); }
          51%  { text-shadow: -6px 0 #ff0040, 6px 0 #00ffff; transform: translate(-5px, 3px); }
          52%  { text-shadow: 6px 0 #ff0040; transform: translate(5px, -2px); }
          53%  { text-shadow: 0 0 20px #00ff41; transform: translate(0); }
          100% { text-shadow: 0 0 20px #00ff41, 0 0 60px rgba(0,255,65,0.5); transform: translate(0); }
        }
        @keyframes brightPulse {
          from { opacity: 0.7; text-shadow: 0 0 10px #00ff41; }
          to   { opacity: 1; text-shadow: 0 0 30px #00ff41, 0 0 60px rgba(0,255,65,0.8); }
        }
        @keyframes blinkAnim {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        div::-webkit-scrollbar { display: none; }
        input::placeholder { color: rgba(0,255,65,0.35); }
      `}</style>
    </div>
  );
}
