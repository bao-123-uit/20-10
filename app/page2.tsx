"use client";
// src/app/thu-gui-ban/page.tsx
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Patrick_Hand } from "next/font/google";

const hand = Patrick_Hand({ subsets: ["vietnamese", "latin"], weight: "400" });

/* ============ SỬA NỘI DUNG THƯ Ở ĐÂY (phần [trong ngoặc] là chỗ bạn thay bằng chuyện thật) ============ */
const GREETING = "Gửi Linh,";
const PARAS = [
  "Trước hết, mình muốn cảm ơn bạn. Cảm ơn vì [một điều cụ thể bạn đã làm cho mình, ví dụ: hôm mình buồn, bạn ngồi nghe mình kể suốt cả buổi chiều]. Có thể bạn không nhớ, nhưng mình thì nhớ rất rõ.",
  "Có một điều mình chưa từng nói với bạn: mình thấy may mắn vì đã quen bạn. Ở cạnh bạn, mình thấy nhẹ nhõm hơn, và thích bản thân mình hơn một chút.",
  "Nhân ngày 20/10, mình chỉ mong bạn luôn được cười thật nhiều, được yêu thương đúng cách, và có thật nhiều ly trà sữa ngon. Dù mọi chuyện sau này ra sao, mình vẫn mong bạn hạnh phúc.",
  "Cảm ơn vì đã đọc đến dòng này nhé.",
];
const SIGNATURE = "[Tên bạn]";
const PS = "P.S. Trang web này tốn của mình mấy đêm không ngủ, nên bạn trả công bằng một ly trà sữa ít đường nhé 🧋";
const NEXT_HREF = "/bat-ngo";
/* ========================================================================================================= */

type Stage = "closed" | "opening" | "reading";

function Envelope({ open, onOpen }: { open: boolean; onOpen: () => void }) {
  return (
    <motion.button
      onClick={onOpen}
      disabled={open}
      aria-label="Mở phong bì"
      whileHover={open ? {} : { scale: 1.04, rotate: -1.5 }}
      whileTap={open ? {} : { scale: 0.97 }}
      animate={open ? { y: 40 } : { y: [0, -10, 0] }}
      transition={open ? { duration: 0.8 } : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      className="relative h-[220px] w-[min(86vw,340px)] [perspective:1000px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-[#E0457B]"
      style={{ filter: "drop-shadow(0 24px 30px rgba(120,60,80,.35))" }}
    >
      <div className="absolute inset-0 rounded-md bg-[#E3AE99]" />

      {/* lá thư bên trong, trượt lên khi mở */}
      <motion.div
        className="absolute inset-x-4 top-3 bottom-3 rounded-sm bg-[#FFF8EE] px-4 pt-5"
        animate={{ y: open ? -150 : 0 }}
        transition={{ delay: open ? 0.7 : 0, duration: 1, type: "spring", stiffness: 60, damping: 14 }}
        style={{ zIndex: 1 }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="mb-3 h-[3px] rounded bg-[#E8D5C4]" style={{ width: `${90 - i * 14}%` }} />
        ))}
      </motion.div>

      {/* túi phong bì */}
      <svg viewBox="0 0 340 220" className="absolute inset-0 h-full w-full" style={{ zIndex: 2 }} aria-hidden>
        <polygon points="0,0 170,125 0,220" fill="#EBB9A5" />
        <polygon points="340,0 170,125 340,220" fill="#E9B4A0" />
        <polygon points="0,220 170,100 340,220" fill="#F3CDBB" />
      </svg>

      {/* nắp phong bì */}
      <motion.div
        className="absolute left-0 top-0 h-[58%] w-full origin-top"
        initial={false}
        animate={{ rotateX: open ? 180 : 0, zIndex: open ? 0 : 3 }}
        transition={{ rotateX: { duration: 0.8 }, zIndex: { delay: open ? 0.4 : 0, duration: 0 } }}
        style={{ clipPath: "polygon(0 0,100% 0,50% 100%)", background: "linear-gradient(180deg,#F6D2C1,#EDB9A4)" }}
      />

      {/* dấu sáp hình tim */}
      <motion.div
        className="absolute left-1/2 top-[44%] flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-[#D6396F] text-xl text-white shadow-lg"
        style={{ zIndex: 4 }}
        animate={open ? { opacity: 0, scale: 0.4 } : { scale: [1, 1.15, 1] }}
        transition={open ? { duration: 0.3 } : { duration: 1.4, repeat: Infinity }}
      >
        ♥
      </motion.div>
    </motion.button>
  );
}

export default function LetterPage() {
  const [stage, setStage] = useState<Stage>("closed");
  const [p, setP] = useState(0);
  const [c, setC] = useState(0);
  const [stars, setStars] = useState<{ id: number; x: number; y: number; s: number; d: number }[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const done = p >= PARAS.length;

  useEffect(() => {
    setStars(Array.from({ length: 40 }, (_, i) => ({ id: i, x: Math.random() * 100, y: Math.random() * 100, s: 1.5 + Math.random() * 2.5, d: 2 + Math.random() * 4 })));
  }, []);

  const open = () => {
    if (stage !== "closed") return;
    setStage("opening");
    setTimeout(() => setStage("reading"), 2400);
  };

  // máy đánh chữ: chậm rãi, dừng lâu hơn ở dấu câu
  useEffect(() => {
    if (stage !== "reading" || done) return;
    const text = PARAS[p];
    const lead = p === 0 && c === 0 ? 1600 : 0;
    if (c < text.length) {
      const ch = text[c - 1] ?? "";
      const delay = lead || (/[.!?]/.test(ch) ? 480 : /[,:;]/.test(ch) ? 220 : 42);
      const t = setTimeout(() => setC(c + 1), delay);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { setP(p + 1); setC(0); }, 900);
    return () => clearTimeout(t);
  }, [stage, p, c, done]);

  useEffect(() => {
    if (stage === "reading" && c % 30 === 0) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [stage, p, c, done]);

  const skip = () => { setP(PARAS.length); setC(0); };
  const replay = () => { setP(0); setC(0); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const night = stage === "reading";

  return (
    <main className="relative min-h-screen overflow-hidden text-[#4A2C40]">
      {/* nền sáng */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,#FFD6E0,#FFF5F0)" }} />
      {/* nền đêm: hiện dần khi mở thư */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: stage === "closed" ? 0 : 1 }}
        transition={{ duration: 2.2 }}
        style={{ background: "radial-gradient(ellipse at 80% 0%, #6B4A74 0%, #3A2840 45%, #241A2B 100%)" }}
      >
        <div className="absolute right-[10%] top-[6%] h-24 w-24 rounded-full bg-[#FFF1C9] opacity-90 shadow-[0_0_80px_30px_rgba(255,236,170,.35)]" aria-hidden />
        {stars.map((s) => (
          <motion.span
            key={s.id}
            className="absolute rounded-full bg-[#FFF1C9]"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: s.d, repeat: Infinity }}
            aria-hidden
          />
        ))}
      </motion.div>

      <Link
        href="/"
        className={`absolute left-4 top-4 z-30 rounded-full px-4 py-2 text-sm backdrop-blur transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E0457B] ${night ? "bg-white/15 text-[#F5E6EE] hover:bg-white/25" : "bg-white/60 hover:bg-white"}`}
      >
        ← Về trang chủ
      </Link>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 py-20">
        <AnimatePresence mode="wait">
          {stage !== "reading" && (
            <motion.div key="env" exit={{ opacity: 0, y: 60 }} transition={{ duration: 0.7 }} className="flex flex-col items-center">
              <motion.h1
                animate={{ color: stage === "opening" ? "#F5E6EE" : "#E0457B" }}
                className="mb-12 max-w-xs text-center text-4xl sm:text-5xl"
                style={{ fontFamily: "var(--font-script)" }}
              >
                Có một lá thư dành cho bạn
              </motion.h1>
              <Envelope open={stage === "opening"} onOpen={open} />
              <motion.p
                animate={{ opacity: stage === "closed" ? 1 : 0 }}
                className="mt-14 text-sm text-[#7A5470]"
              >
                Chạm vào phong bì nhé 💌
              </motion.p>
            </motion.div>
          )}

          {stage === "reading" && (
            <motion.article
              key="letter"
              initial={{ opacity: 0, y: 80, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: -0.4 }}
              transition={{ duration: 1.1, type: "spring", damping: 18 }}
              className={`${hand.className} w-full max-w-xl rounded-md px-7 py-10 sm:px-12`}
              style={{
                background: "repeating-linear-gradient(#FFF8EE 0 35px, #EBD9C8 35px 36px)",
                boxShadow: "0 30px 70px rgba(0,0,0,.45), 0 0 60px rgba(255,214,150,.15)",
                lineHeight: "36px",
                fontSize: "1.3rem",
              }}
            >
              <p className="text-[2rem] text-[#B83A67]" style={{ fontFamily: "var(--font-script)", lineHeight: "44px" }}>
                {GREETING}
              </p>

              {PARAS.map((t, i) => {
                const text = i < p ? t : i === p ? t.slice(0, c) : "";
                if (!text) return null;
                return (
                  <p key={i} className="mt-[36px]">
                    {text}
                    {i === p && !done && <span className="ml-0.5 inline-block w-[2px] animate-pulse bg-[#B83A67] align-middle" style={{ height: "1.1em" }} />}
                  </p>
                );
              })}

              {done && (
                <>
                  <motion.p
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1.2 }}
                    className="mt-[36px] text-right text-[2.2rem] text-[#B83A67]"
                    style={{ fontFamily: "var(--font-script)", lineHeight: "50px" }}
                  >
                    {SIGNATURE}
                  </motion.p>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8, duration: 1 }} className="mt-[36px] text-[1.1rem] text-[#7A5470]">
                    {PS}
                  </motion.p>
                </>
              )}
              <div ref={endRef} />
            </motion.article>
          )}
        </AnimatePresence>

        {stage === "reading" && (
          <div className="mt-8 flex min-h-[56px] flex-wrap items-center justify-center gap-3">
            {!done ? (
              <button onClick={skip} className="rounded-full bg-white/15 px-5 py-2 text-sm text-[#F5E6EE] backdrop-blur transition hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFD6E0]">
                Hiện hết thư
              </button>
            ) : (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3 }} className="flex flex-wrap justify-center gap-3">
                <button onClick={replay} className="rounded-full bg-white/15 px-5 py-2.5 text-sm text-[#F5E6EE] backdrop-blur transition hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFD6E0]">
                  Đọc lại
                </button>
                <Link href={NEXT_HREF} className="rounded-full bg-[#E0457B] px-8 py-2.5 font-medium text-white shadow-[0_10px_30px_rgba(224,69,123,.5)] transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FFD6E0]">
                  Còn một điều nữa
                </Link>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
