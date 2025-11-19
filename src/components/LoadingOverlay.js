import React from "react";
import { motion } from "framer-motion";
import "../layout.css";

function LoadingOverlay({ active }) {
  if (!active) return null;

  const dotMotion = {
    jump: {
      y: -20,
      transition: {
        duration: 0.8,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className="loading-overlay">
      <motion.div animate="jump" transition={{ staggerChildren: 0.15 }} className="dots-container">
        <motion.div className="dot" variants={dotMotion} />
        <motion.div className="dot" variants={dotMotion} />
        <motion.div className="dot" variants={dotMotion} />
      </motion.div>
    </div>
  );
}

export default LoadingOverlay;
