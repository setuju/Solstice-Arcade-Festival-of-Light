import React from 'react';
import { motion } from 'motion/react';

export function ParticleLayer() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
                key={i}
                className="absolute bg-indigo-300 rounded-full blur-[2px]"
                initial={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: `${Math.random() * 8 + 2}px`,
                    height: `${Math.random() * 8 + 2}px`,
                }}
                animate={{
                    y: [0, -100, 0],
                    opacity: [0.2, 0.8, 0.2],
                }}
                transition={{
                    duration: Math.random() * 5 + 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: Math.random() * 5,
                }}
            />
        ))}
    </div>
  );
}
