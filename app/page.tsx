"use client";
// src/app/page.tsx — Trang chủ "Gửi Phương Linh"
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";

const GiftExperience = dynamic(() => import("./gift"), { ssr: false });

/* ============ SỬA NỘI DUNG Ở ĐÂY ============ */
const SHORT_NAME = "Phương Linh";
const INTRO = "Nhân ngày 20/10, anh có một món quà nhỏ muốn gửi riêng cho em.";
type BadgeIconName = "flower" | "sparkle" | "heart";

const BADGES = [
  { icon: "flower" as BadgeIconName, text: "Xinh đẹp như hoa" },
  { icon: "sparkle" as BadgeIconName, text: "Dễ thương" },
  { icon: "heart" as BadgeIconName, text: "Đáng yêu" },
];
// Thay src, note và story ở đây khi muốn cá nhân hóa dải kỷ niệm.
const MEMORIES = [
  { src: "/anh1.jpg", note: "Một ngày mình nhớ mãi", story: "Một khoảnh khắc nhỏ, đủ làm một ngày bình thường trở nên dịu dàng hơn." },
  { src: "/anh2.jpg", note: "Nụ cười thật xinh", story: "Có những nụ cười chỉ cần nhìn thấy là lòng tự nhiên nhẹ đi." },
  { src: "/anh3.jpg", note: "Một chút bình yên", story: "Mình muốn giữ lại cảm giác bình yên này thật lâu." },
  { src: "/anh4.jpg", note: "Khoảnh khắc đáng yêu", story: "Một khoảnh khắc rất tự nhiên, nhưng lại khiến mình mỉm cười." },
  { src: "/anh5.jpg", note: "Ngày thật rực rỡ", story: "Mong những ngày phía trước của bạn cũng luôn nhiều ánh sáng." },
  { src: "/anh6.jpg", note: "Điều dịu dàng", story: "Có những điều dịu dàng không cần nói thành lời." },
  { src: "/anh7.jpg", note: "Một kỷ niệm nhỏ", story: "Một khoảnh khắc nhỏ được giữ lại thật dịu dàng." },
  { src: "/anh8.jpg", note: "Hẹn một ngày vui", story: "Mong ngày nào cũng có thêm một điều khiến bạn mỉm cười." },
  { src: "/anh9.jpg", note: "Nắng trong mắt", story: "Có những khung hình nhìn thôi cũng thấy thật ấm áp." },
  { src: "/anh10.jpg", note: "Thật đáng yêu", story: "Một vẻ đáng yêu rất riêng, không thể nhầm lẫn." },
  { src: "/anh11.jpg", note: "Lưu lại nhé", story: "Thêm một kỷ niệm đẹp vào dải ảnh của chúng mình." },
];
/* ============================================ */

function BadgeIcon({ name }: { name: BadgeIconName }) {
  if (name === "flower") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path d="M12 21V12.5" stroke="#B56B87" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M12 17c-2.5-1.6-4.8-1.1-5.8.3 2.1 1.3 4.2 1.2 5.8-.3Z" fill="#A9C99A" />
        <path d="M12 15.8c2.5-1.6 4.8-1.1 5.8.3-2.1 1.3-4.2 1.2-5.8-.3Z" fill="#91BA85" />
        <path d="M12 12.8c-3.1-.4-4.8-2.4-4.5-4.2 2.5-.1 4.1 1.4 4.5 4.2Z" fill="#F28EAE" />
        <path d="M12 12.8c3.1-.4 4.8-2.4 4.5-4.2-2.5-.1-4.1 1.4-4.5 4.2Z" fill="#E96F99" />
        <path d="M12 12.8c-2.4-2-2.5-4.6-1.2-5.7 1.9 1.2 2.3 3.2 1.2 5.7Z" fill="#FFB8C9" />
        <path d="M12 12.8c2.4-2 2.5-4.6 1.2-5.7-1.9 1.2-2.3 3.2-1.2 5.7Z" fill="#F78EAE" />
        <circle cx="12" cy="12.5" r="1.8" fill="#FFD77E" />
      </svg>
    );
  }

  if (name === "sparkle") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Z" fill="#C7A6E9" />
        <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" fill="#E6C8FF" />
        <circle cx="6" cy="17" r="1.3" fill="#F3B5D0" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path d="M12 20.2s-7.5-4.4-7.5-10.1c0-2.2 1.6-3.8 3.7-3.8 1.5 0 2.8.8 3.8 2.1 1-1.3 2.3-2.1 3.8-2.1 2.1 0 3.7 1.6 3.7 3.8 0 5.7-7.5 10.1-7.5 10.1Z" fill="#F58EAE" stroke="#D9688D" strokeWidth="1.2" />
      <path d="M8.3 9.1c.7-.9 1.7-1.1 2.6-.5" fill="none" stroke="#FFD8E4" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function Fireflies() {
  const [items, setItems] = useState<{ id: number; x: number; y: number; s: number; d: number; dl: number }[]>([]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setItems(
        Array.from({ length: 22 }, (_, i) => ({
          id: i, x: Math.random() * 100, y: Math.random() * 100,
          s: 3 + Math.random() * 5, d: 5 + Math.random() * 6, dl: Math.random() * 5,
        }))
      );
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {items.map((f) => (
        <motion.span
          key={f.id}
          className="absolute rounded-full"
          style={{ left: `${f.x}%`, top: `${f.y}%`, width: f.s, height: f.s, background: "#FFE08A", boxShadow: "0 0 12px 4px rgba(255,214,102,.65)" }}
          animate={{ opacity: [0.1, 0.9, 0.1], x: [0, 24, -18, 0], y: [0, -30, 10, 0] }}
          transition={{ duration: f.d, delay: f.dl, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function Petals() {
  const [items, setItems] = useState<{ id: number; x: number; s: number; d: number; dl: number }[]>([]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setItems(
        Array.from({ length: 10 }, (_, i) => ({
          id: i, x: Math.random() * 100, s: 12 + Math.random() * 12, d: 12 + Math.random() * 8, dl: Math.random() * 12,
        }))
      );
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {items.map((p) => (
        <motion.span
          key={p.id}
          className="absolute"
          style={{ left: `${p.x}%`, top: -30, fontSize: p.s, opacity: 0.7 }}
          animate={{ y: "110vh", rotate: 300, x: [0, 40, -30, 0] }}
          transition={{ duration: p.d, delay: p.dl, repeat: Infinity, ease: "linear" }}
        >
          🌸
        </motion.span>
      ))}
    </div>
  );
}

const CORNER_FRIENDS = [
  { image: "/anh1.jpg", text: "Hello!", position: "left-2 top-20 sm:left-4 sm:top-24", tilt: -10, delay: 0 },
  { image: "/anh2.jpg", text: "Yay!", position: "right-2 top-20 sm:right-4 sm:top-24", tilt: 10, delay: 0.35 },
  { image: "/anh3.jpg", text: "Ngon quá!", position: "bottom-2 left-2 sm:bottom-4 sm:left-4", tilt: 8, delay: 0.7 },
  { image: "/anh4.jpg", text: "Quạc quạc!", position: "bottom-2 right-2 sm:right-4 sm:bottom-4", tilt: -8, delay: 1.05 },
  { image: "/anh5.jpg", text: "Hí hí!", position: "left-2 top-1/2 -translate-y-1/2 sm:left-4", tilt: -6, delay: 1.4 },
  { image: "/anh6.jpg", text: "Đáng yêu!", position: "right-2 top-1/2 -translate-y-1/2 sm:right-4", tilt: 6, delay: 1.75 },
];

function CornerFriends() {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 hidden overflow-hidden sm:block" aria-hidden>
      {CORNER_FRIENDS.map((friend) => (
        <motion.div
          key={friend.text}
          className={`absolute ${friend.position} flex flex-col items-center`}
          initial={{ opacity: 0, scale: 0.5, rotate: friend.tilt }}
          animate={{
            opacity: 1,
            scale: [1, 1.04, 1],
            rotate: [friend.tilt, friend.tilt - 3, friend.tilt],
            y: [0, -8, 0],
          }}
          transition={{
            opacity: { duration: 0.6, delay: 1.5 + friend.delay },
            scale: { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 2 + friend.delay },
            rotate: { duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 2 + friend.delay },
            y: { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 2 + friend.delay },
          }}
        >
          <span className="rounded-full border border-white/90 bg-white/75 px-3 py-1 text-xs font-bold text-[#B05278] shadow-[0_6px_18px_rgba(174,76,118,.2)] backdrop-blur">
            {friend.text}
          </span>
          <span className="group pointer-events-auto relative mt-2 h-[141px] w-48 overflow-hidden rounded-[1.6rem] border-4 border-white/95 bg-white/80 p-1.5 shadow-[0_16px_34px_rgba(174,76,118,.3),0_0_24px_rgba(255,133,181,.22)] transition duration-500 hover:scale-110 hover:-rotate-2 hover:shadow-[0_20px_46px_rgba(224,69,123,.44),0_0_32px_rgba(255,133,181,.5)] sm:h-[166px] sm:w-[230px]">
            <Image
              src={friend.image}
              alt=""
              fill
              quality={100}
              sizes="(max-width: 640px) 192px, 230px"
              className="rounded-[1.2rem] object-contain transition duration-500 group-hover:scale-105"
            />
            <span className="pointer-events-none absolute inset-0 rounded-[1.2rem] bg-gradient-to-br from-white/35 via-transparent to-[#E0457B]/15" />
            <span className="pointer-events-none absolute -inset-y-8 -left-1/2 w-1/3 rotate-[25deg] bg-white/45 blur-md transition duration-700 group-hover:left-[125%]" />
            <span className="pointer-events-none absolute inset-0 rounded-[1.2rem] ring-2 ring-inset ring-white/75" />
          </span>
        </motion.div>
      ))}
    </div>
  );
}

type Memory = (typeof MEMORIES)[number];

function MemoryCard({ memory, index, onOpen, row }: { memory: Memory; index: number; onOpen: () => void; row: "top" | "bottom" }) {
  const [failed, setFailed] = useState(false);
  const rotation = [-5, 3, -2, 5, -4, 2, 4, -3][index % 8];

  return (
    <motion.button
      type="button"
      layoutId={`memory-${index}`}
      onClick={onOpen}
      whileHover={{ scale: 1.12, rotate: 0, y: -10, zIndex: 20 }}
      whileTap={{ scale: 0.97 }}
      className={`group relative aspect-[4/5] h-44 w-32 shrink-0 rounded-[0.35rem] bg-[#FFFDF6] p-2 text-left shadow-[0_12px_25px_rgba(128,68,99,.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E0457B] ${row === "bottom" ? "opacity-85 blur-[0.7px]" : ""}`}
      style={{ rotate: rotation }}
      aria-label={`Mở kỷ niệm: ${memory.note}`}
    >
      <span className="relative block h-full overflow-hidden rounded-[0.2rem] bg-gradient-to-br from-[#FFD6E0] to-[#DCCBFF]">
        {failed ? (
          <span className="flex h-full items-center justify-center text-4xl text-[#E0457B]" aria-hidden>♥</span>
        ) : (
          <Image
            src={memory.src}
            alt={memory.note}
            fill
            sizes="(max-width: 640px) 128px, 160px"
            loading={index < 2 ? "eager" : "lazy"}
            className="object-cover transition duration-500 group-hover:scale-105"
            onError={() => setFailed(true)}
          />
        )}
      </span>
      {row === "top" && <span className="absolute -top-3 left-1/2 h-5 w-2 -translate-x-1/2 rounded-sm bg-[#C89B68] shadow-sm" aria-hidden />}
    </motion.button>
  );
}

function MemoryLightbox({ memory, index, onClose, onMove }: { memory: Memory; index: number; onClose: () => void; onMove: (step: number) => void }) {
  const [failed, setFailed] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onMove(-1);
      if (event.key === "ArrowRight") onMove(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, onMove]);

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#241526]/80 p-5 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={memory.note}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}
    >
      <button ref={closeRef} type="button" onClick={onClose} className="absolute right-5 top-5 rounded-full bg-white/15 px-4 py-2 text-sm text-white backdrop-blur focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFD6E0]">
        Đóng ×
      </button>
      <button type="button" onClick={() => onMove(-1)} aria-label="Ảnh trước" className="absolute left-3 rounded-full bg-white/15 px-4 py-3 text-2xl text-white backdrop-blur sm:left-8">‹</button>
      <motion.div layoutId={`memory-${index}`} className="relative h-[min(82vh,42rem)] w-[min(90vw,34rem)] overflow-hidden rounded-xl bg-gradient-to-br from-[#FFD6E0] to-[#DCCBFF] p-2 shadow-2xl">
        <div className="relative h-full w-full overflow-hidden rounded-lg">
          {failed ? <div className="flex h-full items-center justify-center text-7xl text-[#E0457B]" aria-hidden>♥</div> : (
            <Image src={memory.src} alt={memory.note} fill sizes="(max-width: 640px) 90vw, 640px" className="object-contain" onError={() => setFailed(true)} />
          )}
        </div>
      </motion.div>
      <button type="button" onClick={() => onMove(1)} aria-label="Ảnh tiếp theo" className="absolute right-3 rounded-full bg-white/15 px-4 py-3 text-2xl text-white backdrop-blur sm:right-8">›</button>
    </motion.div>
  );
}

function MemoryStrip() {
  const [paused, setPaused] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const rows = [MEMORIES, [...MEMORIES].reverse()];
  const openMemory = useCallback((index: number) => setSelected(index), []);
  const moveMemory = useCallback((step: number) => {
    setSelected((current) => current === null ? null : (current + step + MEMORIES.length) % MEMORIES.length);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return (
    <>
      <section
        ref={stripRef}
        className="relative mt-10 w-screen max-w-[100vw] overflow-hidden py-7 [mask-image:linear-gradient(to_right,transparent,black_7%,black_93%,transparent)]"
        aria-label="Tin nổi bật nè!"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerCancel={() => setPaused(false)}
      >
        <div className="pointer-events-none absolute inset-0 opacity-80" aria-hidden>
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className="absolute text-[#FFE5A0]" style={{ left: `${(i * 17) % 100}%`, top: `${18 + (i % 4) * 20}%`, fontSize: i % 3 ? 10 : 14 }}>✦</span>
          ))}
        </div>
        <p className="relative z-10 mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-[#B06A87]">Tin nổi bật nè!</p>
        <div className="relative z-10 space-y-3">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="relative overflow-visible">
              {rowIndex === 0 && <span className="absolute left-[5%] right-[5%] top-1/2 h-px -translate-y-1/2 bg-[#C89B68]/45" aria-hidden />}
              <motion.div
                className="flex w-max gap-4 px-6 will-change-transform sm:gap-6"
                animate={reducedMotion ? undefined : { x: rowIndex === 0 ? ["0%", "-50%"] : ["-50%", "0%"] }}
                transition={{ duration: rowIndex === 0 ? 48 : 34, repeat: Infinity, ease: "linear" }}
                style={{ animationPlayState: paused || reducedMotion ? "paused" : "running" }}
                drag="x"
                dragConstraints={stripRef}
                dragElastic={0.08}
                onDragStart={() => setPaused(true)}
                onDragEnd={() => setPaused(false)}
              >
                {[...row, ...row].map((memory, index) => (
                  <MemoryCard key={`${rowIndex}-${index}`} memory={memory} index={index % MEMORIES.length} row={rowIndex === 0 ? "top" : "bottom"} onOpen={() => openMemory(index % MEMORIES.length)} />
                ))}
              </motion.div>
            </div>
          ))}
        </div>
      </section>
      <AnimatePresence>
        {selected !== null && <MemoryLightbox memory={MEMORIES[selected]} index={selected} onClose={() => setSelected(null)} onMove={moveMemory} />}
      </AnimatePresence>
    </>
  );
}

export default function Home() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [gift, setGift] = useState(false);

  // vầng sáng đi theo con trỏ
  const mx = useMotionValue(-300);
  const my = useMotionValue(-300);
  const sx = useSpring(mx, { stiffness: 120, damping: 20 });
  const sy = useSpring(my, { stiffness: 120, damping: 20 });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  }, []);

  const toggleMusic = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) { a.play().then(() => setPlaying(true)).catch(() => {}); }
    else { a.pause(); setPlaying(false); }
  };

  const start = () => {
    audioRef.current?.play().then(() => setPlaying(true)).catch(() => {});
    setGift(true);
  };

  const letters = SHORT_NAME.split("");

  return (
    <main
      onPointerMove={(e) => { mx.set(e.clientX - 150); my.set(e.clientY - 150); }}
      className="relative min-h-screen overflow-hidden text-[#4A2C40]"
      style={{
        background:
          "radial-gradient(circle at 15% 15%, rgba(255,255,255,.8), transparent 25%), radial-gradient(circle at 85% 20%, rgba(255,190,215,.55), transparent 30%), linear-gradient(145deg,#FFD5E3 0%,#FFE9EC 46%,#FFF8F1 100%)",
      }}
    >
      <audio ref={audioRef} src="/emxinh.mp3" loop autoPlay />
      {gift && <GiftExperience audioRef={audioRef} onClose={() => { setGift(false); router.push("/ban-trong-mat-minh"); }} />}
      <Fireflies />
      <Petals />
      <CornerFriends />

      <motion.div
        className="pointer-events-none absolute h-[300px] w-[300px] rounded-full"
        style={{ x: sx, y: sy, background: "radial-gradient(circle, rgba(255,255,255,.75), transparent 65%)" }}
        aria-hidden
      />

      <button
        onClick={toggleMusic}
        aria-label={playing ? "Tắt nhạc" : "Bật nhạc"}
        title={playing ? "Tắt nhạc" : "Bật nhạc"}
        className="absolute right-5 top-5 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-white/80 bg-white/65 text-lg shadow-[0_8px_30px_rgba(177,79,119,.16)] backdrop-blur transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF6B9D]"
      >
        {playing ? "🔊" : "🔇"}
      </button>

      <section className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/45 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#A45678] shadow-sm backdrop-blur"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#E0457B] shadow-[0_0_0_4px_rgba(224,69,123,.12)]" />
          Một món quà nhỏ · 20 tháng 10
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, delay: 0.3 }}
          className="max-w-lg text-base leading-relaxed text-[#7A5470] sm:text-lg"
        >
          {INTRO}
        </motion.p>

        <h1
          className="mt-2 flex flex-wrap justify-center overflow-visible pb-2 text-[4.2rem] leading-[1.08] sm:text-[7rem]"
          style={{ color: "#E0457B", textShadow: "0 6px 30px rgba(255,107,157,.35)", fontFamily: "var(--font-dancing-script), cursive, sans-serif" }}
          aria-label={SHORT_NAME}
        >
          {letters.map((ch, i) => (
            <motion.span
              key={i}
              aria-hidden
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 1 + i * 0.18, ease: "easeOut" }}
              style={{ display: "inline-block", whiteSpace: "pre", padding: "0 .02em" }}
            >
              {ch}
            </motion.span>
          ))}
        </h1>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2.3, duration: 0.7 }}
          className="relative mt-5 max-w-xl rounded-[2rem] border border-white/90 bg-white/40 px-6 py-5 shadow-[0_18px_60px_rgba(174,76,118,.12)] backdrop-blur-md sm:px-10"
        >
          <span className="absolute -left-3 -top-5 text-3xl text-[#E987A8]">“</span>
          <p className="text-sm italic leading-7 text-[#6F4A60] sm:text-base">
            Có những người xuất hiện trong cuộc sống rất nhẹ nhàng,
            nhưng lại khiến mọi ngày bình thường trở nên đáng nhớ hơn.
          </p>
          <span className="absolute -bottom-7 -right-3 text-3xl text-[#E987A8]">”</span>
        </motion.div>

        <ul className="mt-8 flex flex-wrap justify-center gap-2.5">
          {BADGES.map((b, i) => (
            <motion.li
              key={b.text}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", delay: 3 + i * 0.25 }}
              whileHover={{ rotate: i % 2 ? 3 : -3, y: -3 }}
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/80 bg-white/55 px-4 py-2 text-sm leading-none text-[#714B62] shadow-[0_8px_24px_rgba(224,69,123,.12)] backdrop-blur"
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/65 shadow-sm">
                <BadgeIcon name={b.icon} />
              </span>
              <span className="whitespace-nowrap">{b.text}</span>
            </motion.li>
          ))}
        </ul>

        <MemoryStrip />

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 4.6 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.96 }}
          onClick={start}
          className="relative mt-11 rounded-full bg-[#E0457B] px-11 py-4 font-semibold text-white shadow-[0_12px_30px_rgba(224,69,123,.4)] transition hover:bg-[#D7356D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E0457B]"
        >
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-[#E0457B]"
            animate={{ scale: [1, 1.35], opacity: [0.6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            aria-hidden
          />
          Mở món quà này nhé <span className="ml-1">→</span>
        </motion.button>
        <p className="mt-4 text-xs text-[#9A7490]">Bật loa một chút, vì món quà này có nhạc nền 🎧</p>
      </section>
    </main>
  );
}
