"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

function AnimatedScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.22,
  });

  return (
    <motion.div
      aria-hidden="true"
      className="scroll-progress"
      style={{ scaleX }}
    />
  );
}

export function ScrollProgress() {
  const prefersReducedMotion = useReducedMotion();

  return prefersReducedMotion ? null : <AnimatedScrollProgress />;
}
