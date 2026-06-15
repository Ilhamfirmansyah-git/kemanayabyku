import { useState, useRef, useEffect, useCallback, useId } from "react";
import { PenLine, Sparkles, Gift, X, RefreshCw, Heart, Send, Copy, Check } from "lucide-react";

/* =========================================================================
 * CompanionCat — "companion app" hadiah interaktif
 * Ganti dua konstanta di bawah untuk personalisasi cepat.
 * Palet warna ada di blok <style> (CSS variables .cc-root) — ubah di satu tempat.
 * ========================================================================= */
const RECIPIENT_NAME = "RECIPIENT_NAME"; // <- ganti dengan nama penerima
const CAT_NAME = "Miso"; //                 <- nama si kucing

/* --- Konten teks (mudah diedit) ---------------------------------------- */
// Reaksi singkat saat dielus (emoji HANYA di dialog karakter, bukan ikon UI)
const PET_REACTIONS = [
  "Hihi, geli~ 😺",
  "Nyaman banget...",
  "Mrrp 💜",
  "Aku suka dielus begini",
  "Pelan-pelan ya~ ✨",
  "Dengkuran on 🐾",
];
// Pesan tonggak berdasarkan tingkat kedekatan
const MILESTONES = [
  { at: 25, label: "Mulai akrab", say: "Kita mulai akrab nih~" },
  { at: 50, label: "Teman dekat", say: "Kamu teman favoritku sekarang 💛" },
  { at: 75, label: "Sahabat karib", say: "Rasanya kayak udah kenal lama 🥰" },
  { at: 100, label: "Tak terpisahkan", say: "Kita nggak terpisahkan! ✨🐾" },
];
const closenessLabel = (v) =>
  v >= 100 ? "Tak terpisahkan" : v >= 75 ? "Sahabat karib" : v >= 50 ? "Teman dekat" : v >= 25 ? "Mulai akrab" : "Baru berkenalan";

// Mode "Pilih suasana"
const MOODS = [
  { key: "senang", label: "Senang" },
  { key: "lelah", label: "Lelah" },
  { key: "kangen", label: "Kangen" },
  { key: "semangat", label: "Butuh semangat" },
  { key: "tenang", label: "Tenang" },
];
const MOOD_NOTES = {
  senang: `Hai ${RECIPIENT_NAME}, senyummu hari ini menular sampai ke sini. Simpan kebahagiaan kecil ini ya — kamu pantas merasakannya.`,
  lelah: `${RECIPIENT_NAME}, kalau capek, istirahat itu bukan menyerah. Aku tunggu di sini sampai kamu siap lagi. Pelan-pelan tidak apa-apa.`,
  kangen: `Rindu itu tanda hatimu sedang ingat seseorang yang berharga, ${RECIPIENT_NAME}. Jaraknya boleh jauh, tapi rasanya tetap dekat.`,
  semangat: `Tarik napas, ${RECIPIENT_NAME}. Kamu sudah melewati 100% hari-hari tersulitmu. Yang ini juga akan kamu lewati. Aku percaya sama kamu.`,
  tenang: `Bahumu boleh turun sebentar, ${RECIPIENT_NAME}. Tidak ada yang harus buru-buru. Hari ini cukup begini saja, dan itu sudah cukup baik.`,
};

// Mode "Kejutan acak"
const SURPRISES = [
  `${RECIPIENT_NAME}, kamu adalah salah satu alasan dunia terasa lebih hangat.`,
  `Pengingat kecil: caramu memperlakukan orang lain itu indah, ${RECIPIENT_NAME}.`,
  `Hari ini bersandar padaku saja kalau perlu. Aku tahan kok, ${RECIPIENT_NAME}.`,
  `Kamu nggak harus sempurna untuk layak disayang, ${RECIPIENT_NAME}. Cukup jadi kamu.`,
  `Semoga ada satu hal kecil hari ini yang bikin kamu tersenyum, ${RECIPIENT_NAME}.`,
  `Terima kasih sudah bertahan sejauh ini. Aku bangga sama kamu, ${RECIPIENT_NAME}.`,
];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* --- Hook: prefers-reduced-motion --------------------------------------- */
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

/* =======================================================================
 * Maskot kucing (SVG asli) + Petal Halo (signature element)
 * ===================================================================== */
function CatScene({ closeness, happy, blush }) {
  const COUNT = 12; //  jumlah kelopak di cincin kedekatan
  const filled = Math.round((closeness / 100) * COUNT);
  const cx = 120, cy = 120, R = 104;

  // posisi tiap kelopak di sekeliling lingkaran
  const petals = Array.from({ length: COUNT }, (_, i) => {
    const a = (-90 + i * (360 / COUNT)) * (Math.PI / 180);
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), rot: (i * 360) / COUNT + 90, on: i < filled };
  });

  return (
    <svg viewBox="0 0 240 240" width="100%" height="100%" aria-hidden="true" focusable="false">
      {/* glow lembut saat kedekatan penuh */}
      {closeness >= 100 && <circle cx={cx} cy={cy} r="92" fill="var(--mauve)" opacity="0.18" />}

      {/* Petal Halo — cincin kelopak yang mekar mengikuti kedekatan */}
      {petals.map((p, i) => (
        <ellipse
          key={i}
          cx={p.x}
          cy={p.y}
          rx="3.4"
          ry="9"
          transform={`rotate(${p.rot} ${p.x} ${p.y})`}
          fill={p.on ? (i % 2 ? "var(--coral)" : "var(--mauve)") : "var(--soft)"}
          style={{ transition: "fill 320ms ease" }}
        />
      ))}

      {/* ----- Kucing ----- */}
      {/* telinga */}
      <path d="M84 86 L96 56 L112 82 Z" fill="var(--cream)" stroke="var(--plum)" strokeWidth="3" strokeLinejoin="round" />
      <path d="M128 82 L144 56 L156 86 Z" fill="var(--cream)" stroke="var(--plum)" strokeWidth="3" strokeLinejoin="round" />
      <path d="M92 78 L98 64 L106 78 Z" fill="var(--lilac-deep)" />
      <path d="M134 78 L142 64 L148 78 Z" fill="var(--lilac-deep)" />

      {/* kepala */}
      <circle cx={cx} cy="122" r="46" fill="var(--cream)" stroke="var(--plum)" strokeWidth="3" />

      {/* pipi merona (opacity dikendalikan state) */}
      <ellipse cx="101" cy="134" rx="9" ry="5.5" fill="var(--coral)" opacity={0.55 * blush} style={{ transition: "opacity 280ms ease" }} />
      <ellipse cx="139" cy="134" rx="9" ry="5.5" fill="var(--coral)" opacity={0.55 * blush} style={{ transition: "opacity 280ms ease" }} />

      {/* mata: senang (lengkung) vs normal (bulat) */}
      {happy ? (
        <g stroke="var(--plum)" strokeWidth="3.2" strokeLinecap="round" fill="none">
          <path d="M99 122 Q104 115 109 122" />
          <path d="M131 122 Q136 115 141 122" />
        </g>
      ) : (
        <g fill="var(--plum)">
          <ellipse cx="104" cy="121" rx="5" ry="6.5" />
          <ellipse cx="136" cy="121" rx="5" ry="6.5" />
          <circle cx="106" cy="119" r="1.6" fill="var(--cream)" />
          <circle cx="138" cy="119" r="1.6" fill="var(--cream)" />
        </g>
      )}

      {/* hidung + mulut */}
      <path d="M116 130 L124 130 L120 135 Z" fill="var(--coral)" />
      <path d="M120 135 Q114 141 109 137 M120 135 Q126 141 131 137" stroke="var(--plum)" strokeWidth="2.4" fill="none" strokeLinecap="round" />

      {/* kumis */}
      <g stroke="var(--plum)" strokeWidth="1.8" strokeLinecap="round" opacity="0.7">
        <line x1="78" y1="126" x2="98" y2="129" />
        <line x1="76" y1="134" x2="98" y2="134" />
        <line x1="142" y1="129" x2="162" y2="126" />
        <line x1="142" y1="134" x2="164" y2="134" />
      </g>

      {/* dua telapak kecil */}
      <ellipse cx="103" cy="170" rx="11" ry="8" fill="var(--cream)" stroke="var(--plum)" strokeWidth="3" />
      <ellipse cx="137" cy="170" rx="11" ry="8" fill="var(--cream)" stroke="var(--plum)" strokeWidth="3" />
    </svg>
  );
}

/* =======================================================================
 * Komponen utama
 * ===================================================================== */
export default function CompanionCat() {
  const reduced = useReducedMotion();
  const titleId = useId();

  // --- State interaksi maskot ---
  const [closeness, setCloseness] = useState(0);
  const [happy, setHappy] = useState(false);
  const [catSay, setCatSay] = useState(`Hai ${RECIPIENT_NAME}! Coba elus aku pelan-pelan~ 🐾`);
  const [particles, setParticles] = useState([]); // partikel vektor di titik sentuh

  // --- State mode & hasil ---
  const [mode, setMode] = useState("tulis"); // tulis | suasana | kejutan
  const [text, setText] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [note, setNote] = useState(null); // { title, body } -> modal
  const [copied, setCopied] = useState(false);

  const orbRef = useRef(null);
  const happyTimer = useRef(null);
  const lastPet = useRef(0);
  const milestoneHit = useRef(0);
  const dragging = useRef(false);

  // blush 0..1 mengikuti kedekatan + sedikit "boost" saat dielus
  const blush = Math.min(1, closeness / 100 + (happy ? 0.35 : 0));

  /* ---- Inti interaksi: "mengelus" pada koordinat (x,y) relatif orb ---- */
  const pet = useCallback(
    (x, y, amount) => {
      // reaksi mata senang sementara
      setHappy(true);
      clearTimeout(happyTimer.current);
      happyTimer.current = setTimeout(() => setHappy(false), 900);

      // naikkan kedekatan + cek tonggak
      setCloseness((prev) => {
        const next = Math.min(100, prev + amount);
        const m = MILESTONES.find((ms) => next >= ms.at && milestoneHit.current < ms.at);
        if (m) {
          milestoneHit.current = m.at;
          setCatSay(m.say);
        } else {
          setCatSay(pick(PET_REACTIONS));
        }
        return next;
      });

      // partikel vektor (hati / berlian), bukan tumpukan emoji
      const id = Math.random().toString(36).slice(2);
      const kind = Math.random() > 0.5 ? "heart" : "gem";
      setParticles((p) => [...p, { id, x, y, kind }]);
      setTimeout(() => setParticles((p) => p.filter((it) => it.id !== id)), reduced ? 350 : 900);
    },
    [reduced]
  );

  // pointer: klik/drag (mouse & touch lewat Pointer Events)
  const petAtEvent = (e, amount) => {
    const rect = orbRef.current?.getBoundingClientRect();
    if (!rect) return;
    pet(e.clientX - rect.left, e.clientY - rect.top, amount);
  };
  const onPointerDown = (e) => { dragging.current = true; petAtEvent(e, 5); };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    const now = Date.now();
    if (now - lastPet.current < 90) return; // throttle agar tidak spam
    lastPet.current = now;
    petAtEvent(e, 1.6);
  };
  const stopDrag = () => { dragging.current = false; };

  // alternatif keyboard: Enter / Space mengelus di tengah (aksesibilitas)
  const onKeyPet = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const rect = orbRef.current?.getBoundingClientRect();
      pet((rect?.width || 220) / 2, (rect?.height || 220) / 2, 5);
    }
  };

  /* ---- Hasil dari tiap mode -> buka modal ---- */
  const openNote = (title, body) => { setNote({ title, body }); setCopied(false); };

  const submitTulis = () => {
    const t = text.trim();
    if (!t) return;
    openNote(
      "Balasan dari " + CAT_NAME,
      `Kamu bilang: "${t}".\n\n${RECIPIENT_NAME}, apa pun yang sedang kamu rasakan itu valid. Aku dengar, dan aku di sini menemanimu. Terima kasih sudah mau berbagi denganku.`
    );
  };
  const submitMood = (key) =>
    openNote("Untuk hatimu hari ini", MOOD_NOTES[key]);

  const submitKejutan = () => {
    if (spinning) return;
    if (reduced) { openNote("Sebuah kejutan kecil", pick(SURPRISES)); return; }
    setSpinning(true);
    setTimeout(() => { setSpinning(false); openNote("Sebuah kejutan kecil", pick(SURPRISES)); }, 900);
  };

  const copyNote = () => {
    navigator.clipboard?.writeText(note.body).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  // tutup modal dengan Escape
  useEffect(() => {
    if (!note) return;
    const onEsc = (e) => e.key === "Escape" && setNote(null);
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [note]);

  const MODES = [
    { key: "tulis", label: "Tulis pesan", Icon: PenLine },
    { key: "suasana", label: "Pilih suasana", Icon: Sparkles },
    { key: "kejutan", label: "Kejutan acak", Icon: Gift },
  ];

  return (
    <div className="cc-root" style={{ minHeight: "100vh" }}>
      {/* ============ Styling terpusat: palet, font, kelas, animasi ============ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Mulish:wght@400;500;600;700&display=swap');

        /* ----- PALET (ubah di sini saja) ----- */
        .cc-root{
          --cream:#FFFBF7; --lilac:#EFE7FA; --lilac-deep:#D9C7F0; --peach:#FCE6D8;
          --plum:#4A3B63; --plum-soft:#6E5C86; --violet:#5E4480; --mauve:#8B6FA8;
          --coral:#C96A4E; --soft:rgba(94,68,128,.16); --line:rgba(94,68,128,.16);
          font-family:'Mulish',system-ui,sans-serif; color:var(--plum);
          background:linear-gradient(135deg,var(--lilac) 0%,#F6ECF6 46%,var(--peach) 100%);
          display:flex; align-items:center; justify-content:center;
        }
        .cc-display{ font-family:'Fraunces',Georgia,serif; }

        /* fokus keyboard terlihat jelas di semua elemen interaktif */
        .cc-focus:focus-visible{ outline:3px solid var(--violet); outline-offset:3px; border-radius:14px; }

        /* kartu glass premium + border gradient tipis */
        .cc-card{
          background:rgba(255,251,247,.72); backdrop-filter:blur(18px);
          border-radius:28px; position:relative;
          box-shadow:0 18px 50px -18px rgba(74,59,99,.45), 0 2px 8px rgba(74,59,99,.08);
        }
        .cc-card::before{
          content:""; position:absolute; inset:0; border-radius:28px; padding:1.5px;
          background:linear-gradient(140deg,var(--mauve),rgba(255,255,255,.7),var(--coral));
          -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
          -webkit-mask-composite:xor; mask-composite:exclude; pointer-events:none;
        }

        /* orb tempat maskot tinggal */
        .cc-orb{
          background:radial-gradient(circle at 38% 32%,#fff 0%,var(--lilac) 70%,var(--peach) 120%);
          box-shadow:inset 0 2px 10px rgba(255,255,255,.7), 0 10px 26px -10px rgba(74,59,99,.5);
        }
        .cc-orb.cc-grab{ cursor:grab; } .cc-orb.cc-grab:active{ cursor:grabbing; }

        /* ----- Tombol & kontrol (state hover/active/disabled jelas) ----- */
        .cc-primary,.cc-tab,.cc-chip{
          font-family:'Mulish',sans-serif; font-weight:600; cursor:pointer;
          transition:transform .15s ease,background .2s ease,color .2s ease,box-shadow .2s ease;
        }
        .cc-primary{ background:var(--violet); color:#fff; border:none; border-radius:16px;
          box-shadow:0 8px 18px -8px rgba(94,68,128,.8); }
        .cc-primary:hover{ background:#503a6f; }
        .cc-primary:active{ transform:scale(.97); }
        .cc-primary:disabled{ background:#C9BFD8; color:#fff; cursor:not-allowed; box-shadow:none; transform:none; }

        .cc-tab{ background:transparent; color:var(--plum-soft); border:1px solid var(--line); border-radius:14px; }
        .cc-tab:hover{ background:rgba(139,111,168,.10); }
        .cc-tab[aria-selected="true"]{ background:var(--violet); color:#fff; border-color:var(--violet); }

        .cc-chip{ background:#fff; color:var(--plum); border:1px solid var(--line); border-radius:999px; }
        .cc-chip:hover{ background:var(--lilac); border-color:var(--mauve); }
        .cc-chip:active{ transform:scale(.97); }

        .cc-icon-btn{ cursor:pointer; transition:background .2s ease,transform .15s ease; border-radius:12px; }
        .cc-icon-btn:hover{ background:rgba(139,111,168,.14); }
        .cc-icon-btn:active{ transform:scale(.94); }

        .cc-input{ font-family:'Mulish',sans-serif; background:#fff; border:1px solid var(--line);
          border-radius:16px; color:var(--plum); resize:none; transition:border-color .2s ease,box-shadow .2s ease; }
        .cc-input:focus{ outline:none; border-color:var(--violet); box-shadow:0 0 0 3px rgba(94,68,128,.16); }

        /* ----- Animasi (dimatikan saat reduced-motion) ----- */
        @keyframes cc-floatUp{ 0%{transform:translateY(0) scale(.5);opacity:0} 18%{opacity:1} 100%{transform:translateY(-58px) scale(1);opacity:0} }
        @keyframes cc-pop{ from{transform:scale(.94);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes cc-rise{ from{transform:translateY(14px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes cc-spin{ to{transform:rotate(360deg)} }
        .cc-particle{ animation:cc-floatUp .9s ease-out forwards; }
        .cc-panel{ animation:cc-rise .36s ease; }
        .cc-modal{ animation:cc-pop .3s ease; }
        .cc-spin{ animation:cc-spin .9s linear infinite; }

        @media (prefers-reduced-motion: reduce){
          .cc-root *{ animation:none !important; transition:none !important; }
        }
      `}</style>

      {/* ====================== KARTU UTAMA ====================== */}
      <div className="cc-card w-full max-w-md mx-auto" style={{ margin: "24px 16px" }}>
        <div className="p-5 sm:p-7">
          {/* --- Header (subjek halaman = penerima) --- */}
          <header className="text-center">
            <p className="text-xs" style={{ letterSpacing: ".22em", textTransform: "uppercase", color: "var(--mauve)", fontWeight: 700 }}>
              Teman kecilmu
            </p>
            <h1 className="cc-display" style={{ fontSize: "1.9rem", lineHeight: 1.1, marginTop: 6, color: "var(--plum)" }}>
              Halo, {RECIPIENT_NAME}
            </h1>
            <p className="text-sm" style={{ color: "var(--plum-soft)", marginTop: 6 }}>
              {CAT_NAME} datang menemanimu hari ini.
            </p>
          </header>

          {/* --- Bubble dialog kucing (status dinamis, dibacakan screen reader) --- */}
          <div
            aria-live="polite"
            aria-atomic="true"
            className="text-center"
            style={{
              margin: "18px auto 4px", maxWidth: 320, background: "#fff", border: "1px solid var(--line)",
              borderRadius: 18, padding: "10px 16px", fontSize: ".92rem", color: "var(--plum)",
              boxShadow: "0 6px 16px -10px rgba(74,59,99,.5)",
            }}
          >
            {catSay}
          </div>

          {/* --- Orb + maskot interaktif (signature: Petal Halo mengelilingi) --- */}
          <div className="flex flex-col items-center" style={{ marginTop: 10 }}>
            <div
              ref={orbRef}
              role="button"
              tabIndex={0}
              aria-label={`Elus ${CAT_NAME}. Tingkat kedekatan ${Math.round(closeness)} persen.`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={stopDrag}
              onPointerLeave={stopDrag}
              onKeyDown={onKeyPet}
              className="cc-orb cc-grab cc-focus relative select-none touch-manipulation rounded-full"
              style={{ width: 220, height: 220 }}
            >
              <CatScene closeness={closeness} happy={happy} blush={blush} />

              {/* partikel vektor di titik sentuh (hati / berlian) */}
              {particles.map((p) => (
                <span key={p.id} className="cc-particle" style={{ position: "absolute", left: p.x, top: p.y, pointerEvents: "none", transform: "translate(-50%,-50%)" }}>
                  {p.kind === "heart" ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-4.6-9.3-9.1C1 8.7 2.7 5.5 6 5.5c2 0 3.2 1.4 4 2.6.8-1.2 2-2.6 4-2.6 3.3 0 5 3.2 3.3 6.4C19 16.4 12 21 12 21z" fill="var(--coral)" /></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="var(--mauve)" /></svg>
                  )}
                </span>
              ))}
            </div>

            {/* meteran kedekatan: ikon konsisten (Heart) + label + persen */}
            <div className="flex items-center" style={{ gap: 8, marginTop: 14 }}>
              <Heart size={18} strokeWidth={2} aria-hidden="true" style={{ color: "var(--coral)" }} />
              <span className="text-sm" style={{ fontWeight: 600, color: "var(--plum)" }}>{closenessLabel(closeness)}</span>
              <span className="cc-display text-sm" style={{ color: "var(--mauve)" }}>· {Math.round(closeness)}%</span>
            </div>
            <p className="text-xs" style={{ color: "var(--plum-soft)", marginTop: 4 }}>
              Elus dengan pointer, atau fokus lalu tekan Enter / Spasi.
            </p>
          </div>

          {/* --- Pemilih mode (3 tab, ikon satu keluarga) --- */}
          <div role="tablist" aria-label="Mode interaksi" className="grid grid-cols-3" style={{ gap: 8, marginTop: 22 }}>
            {MODES.map(({ key, label, Icon }) => (
              <button
                key={key}
                role="tab"
                aria-selected={mode === key}
                onClick={() => setMode(key)}
                className="cc-tab cc-focus flex flex-col items-center justify-center touch-manipulation"
                style={{ minHeight: 56, padding: "8px 4px" }}
              >
                <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                <span className="text-xs" style={{ marginTop: 5 }}>{label}</span>
              </button>
            ))}
          </div>

          {/* --- Panel mode aktif (transisi masuk halus ≤400ms) --- */}
          <div key={mode} className="cc-panel" style={{ marginTop: 16 }}>
            {/* Mode 1: tulis pesan manual (label visible, bukan placeholder saja) */}
            {mode === "tulis" && (
              <div>
                <label htmlFor="cc-text" className="text-sm" style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>
                  Ceritakan apa yang sedang kamu rasakan
                </label>
                <textarea
                  id="cc-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={3}
                  placeholder="Tulis sesuatu untuk Miso..."
                  className="cc-input w-full"
                  style={{ padding: "12px 14px", fontSize: ".95rem" }}
                />
                <button
                  onClick={submitTulis}
                  disabled={!text.trim()}
                  className="cc-primary cc-focus flex items-center justify-center w-full touch-manipulation"
                  style={{ minHeight: 44, marginTop: 12, gap: 8 }}
                >
                  <Send size={18} strokeWidth={2} aria-hidden="true" />
                  Kirim ke {CAT_NAME}
                </button>
              </div>
            )}

            {/* Mode 2: pilih suasana hati (chip) */}
            {mode === "suasana" && (
              <div>
                <p className="text-sm" style={{ fontWeight: 600, marginBottom: 10 }}>Bagaimana perasaanmu sekarang?</p>
                <div className="flex flex-wrap" style={{ gap: 8 }}>
                  {MOODS.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => submitMood(m.key)}
                      className="cc-chip cc-focus flex items-center justify-center touch-manipulation"
                      style={{ minHeight: 44, padding: "0 18px", fontSize: ".9rem" }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mode 3: kejutan acak (dial berputar) */}
            {mode === "kejutan" && (
              <div className="text-center">
                <p className="text-sm" style={{ color: "var(--plum-soft)", marginBottom: 12 }}>
                  Putar untuk membuka satu pesan kecil dari {CAT_NAME}.
                </p>
                <button
                  onClick={submitKejutan}
                  disabled={spinning}
                  className="cc-primary cc-focus inline-flex items-center justify-center touch-manipulation"
                  style={{ minHeight: 48, padding: "0 24px", gap: 10 }}
                >
                  <RefreshCw size={20} strokeWidth={2} aria-hidden="true" className={spinning ? "cc-spin" : ""} />
                  {spinning ? "Membuka..." : "Buka kejutan"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ====================== MODAL HASIL ====================== */}
      {note && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(74,59,99,.45)", backdropFilter: "blur(4px)", padding: 16 }}
          onClick={() => setNote(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(e) => e.stopPropagation()}
            className="cc-card cc-modal w-full"
            style={{ maxWidth: 380, background: "var(--cream)" }}
          >
            <div className="p-6">
              <div className="flex items-start justify-between" style={{ gap: 12 }}>
                <div className="flex items-center" style={{ gap: 8 }}>
                  <Sparkles size={20} strokeWidth={1.8} aria-hidden="true" style={{ color: "var(--mauve)" }} />
                  <h2 id={titleId} className="cc-display" style={{ fontSize: "1.25rem", color: "var(--plum)" }}>{note.title}</h2>
                </div>
                <button onClick={() => setNote(null)} aria-label="Tutup" className="cc-icon-btn cc-focus flex items-center justify-center touch-manipulation" style={{ width: 44, height: 44 }}>
                  <X size={20} strokeWidth={2} aria-hidden="true" style={{ color: "var(--plum-soft)" }} />
                </button>
              </div>

              <p style={{ marginTop: 14, color: "var(--plum)", lineHeight: 1.7, fontSize: ".97rem", whiteSpace: "pre-line" }}>
                {note.body}
              </p>

              <div className="flex items-center justify-between" style={{ marginTop: 20, gap: 10 }}>
                <span className="cc-display text-sm" style={{ color: "var(--mauve)" }}>— {CAT_NAME}</span>
                <button onClick={copyNote} className="cc-tab cc-focus inline-flex items-center justify-center touch-manipulation" style={{ minHeight: 44, padding: "0 16px", gap: 8 }}>
                  {copied ? <Check size={18} strokeWidth={2} aria-hidden="true" /> : <Copy size={18} strokeWidth={2} aria-hidden="true" />}
                  {copied ? "Tersalin" : "Salin"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}