import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import type { Answer, Question } from "../data/quiz";

const THRESHOLD = 100;
const VELOCITY = 620;
const FLY_MS = 300;

interface Props {
  q: Question;
  /** set by the buttons and arrow keys, so they animate like a real swipe */
  forced: Answer | null;
  onAnswer: (v: Answer) => void;
}

export default function SwipeCard({ q, forced, onAnswer }: Props) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-260, 260], [-16, 16]);
  const noOpacity = useTransform(x, [-110, -28], [1, 0]);
  const yesOpacity = useTransform(x, [28, 110], [0, 1]);
  const skipOpacity = useTransform(y, [-110, -28], [1, 0]);

  const [fly, setFly] = useState<{ x: number; y: number } | null>(null);
  const committed = useRef(false);

  function commit(v: Answer) {
    if (committed.current) return;
    committed.current = true;
    setFly({ x: v === 0 ? 0 : v * 680, y: v === 0 ? -760 : 0 });
    // Handing control back on a timer rather than onAnimationComplete: the
    // card is already off-screen by then, and the quiz can never stall on a
    // callback that does not fire.
    window.setTimeout(() => onAnswer(v), FLY_MS - 60);
  }

  useEffect(() => {
    if (forced !== null) commit(forced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forced]);

  function handleDragEnd(_e: unknown, info: PanInfo) {
    const { offset, velocity } = info;
    if (offset.y < -THRESHOLD && Math.abs(offset.x) < THRESHOLD) return commit(0);
    if (offset.x > THRESHOLD || velocity.x > VELOCITY) return commit(1);
    if (offset.x < -THRESHOLD || velocity.x < -VELOCITY) return commit(-1);
  }

  return (
    <motion.div
      className="swipe-card"
      style={{ x, y, rotate }}
      drag={!fly}
      dragSnapToOrigin
      dragElastic={0.65}
      onDragEnd={handleDragEnd}
      animate={fly ? { x: fly.x, y: fly.y, opacity: 0 } : undefined}
      transition={{ duration: FLY_MS / 1000, ease: "easeOut" }}
    >
      <div className="swipe-head">
        <span className="q-theme">{q.theme}</span>
      </div>
      <p className="swipe-q">{q.text}</p>
      <div className="swipe-hint">
        <span>← não</span>
        <span>pular ↑</span>
        <span>sim →</span>
      </div>

      <motion.span className="stamp no" style={{ opacity: noOpacity }}>
        NÃO
      </motion.span>
      <motion.span className="stamp yes" style={{ opacity: yesOpacity }}>
        SIM
      </motion.span>
      <motion.span className="stamp skip" style={{ opacity: skipOpacity }}>
        PULAR
      </motion.span>
    </motion.div>
  );
}
