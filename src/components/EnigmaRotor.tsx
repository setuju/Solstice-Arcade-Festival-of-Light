import React, { useEffect, useRef, useState } from 'react';

interface EnigmaRotorProps {
  value: number;
  onChange: (delta: number) => void;
  index: number;
}

export const EnigmaRotor: React.FC<EnigmaRotorProps> = ({ value, onChange, index }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentRot, setCurrentRot] = useState(value);
  const animationRef = useRef<number>();

  useEffect(() => {
    // Easing function for smooth rotation
    let start = currentRot;
    let end = value;
    
    // Handle wrap-around animation (e.g., 25 to 0 shouldn't spin all the way backwards)
    if (end === 0 && start === 25) end = 26;
    if (end === 25 && start === 0) start = 26;

    let progress = 0;
    const animate = () => {
      progress += 0.08; // Animation speed
      if (progress >= 1) {
        setCurrentRot(value);
      } else {
        const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        setCurrentRot(start + (end - start) * ease);
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current!);
  }, [value]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = 60;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background/body
    ctx.fillStyle = '#111827'; // Dark gray
    ctx.fillRect(0, 0, width, height);
    
    ctx.save();
    
    // Create a 3D effect clipping path (a rectangle that crops the top and bottom of the wheel)
    ctx.beginPath();
    ctx.rect(0, 10, width, height - 20);
    ctx.clip();

    // Map current rotation to an angle
    // We have 26 letters. The active letter should be at the front (angle = 0 in 3D perspective).
    const anglePerLetter = (2 * Math.PI) / 26;
    const rotationAngle = currentRot * anglePerLetter;

    for (let i = 0; i < 26; i++) {
        // Calculate the angle for this specific letter
        const itemAngle = (i * anglePerLetter) - rotationAngle;
        
        // Normalize angle to -PI to PI
        let normalizedAngle = itemAngle;
        while (normalizedAngle > Math.PI) normalizedAngle -= 2 * Math.PI;
        while (normalizedAngle < -Math.PI) normalizedAngle += 2 * Math.PI;

        // Only draw if it's facing somewhat forward
        if (Math.abs(normalizedAngle) < Math.PI / 2.5) {
            // Project to 2D (cylindrical projection)
            const yOffset = Math.sin(normalizedAngle) * radius;
            const scale = Math.cos(normalizedAngle) * 0.8 + 0.2; // depth scale
            const opacity = Math.cos(normalizedAngle); // fade towards edges

            ctx.save();
            ctx.translate(cx, cy + yOffset);
            ctx.scale(1, scale);

            // Draw text
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.font = 'bold 24px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Draw a subtle line separator
            ctx.beginPath();
            ctx.strokeStyle = `rgba(34, 211, 238, ${opacity * 0.3})`;
            ctx.lineWidth = 1;
            ctx.moveTo(-width/2 + 10, -15);
            ctx.lineTo(width/2 - 10, -15);
            ctx.stroke();

            ctx.fillText(i.toString().padStart(2, '0'), 0, 0); // e.g., 01, 02.. or use A-Z
            ctx.restore();
        }
    }
    ctx.restore();

    // Draw overlay shading for 3D cylinder effect
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(0,0,0,0.8)');
    gradient.addColorStop(0.2, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.5, 'rgba(34,211,238,0.1)'); // Highlight center
    gradient.addColorStop(0.8, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw center selector box
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)'; // Cyan highlight
    ctx.lineWidth = 2;
    ctx.strokeRect(4, cy - 20, width - 8, 40);

  }, [currentRot]);

  return (
    <div className="flex flex-col items-center select-none drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]">
      <button 
        onClick={() => onChange(1)} 
        className="w-20 h-10 bg-cyan-900/60 hover:bg-cyan-800 border border-cyan-500/50 flex items-center justify-center text-cyan-300 rounded-t-xl active:scale-[0.98] transition-all text-xl cursor-pointer"
      >
        ▲
      </button>
      <div className="border-x-2 border-cyan-800/80 p-0.5 bg-gray-900">
        <canvas 
            ref={canvasRef} 
            width={80} 
            height={160} 
            className="block"
        />
      </div>
      <button 
        onClick={() => onChange(-1)} 
        className="w-20 h-10 bg-cyan-900/60 hover:bg-cyan-800 border border-cyan-500/50 flex items-center justify-center text-cyan-300 rounded-b-xl active:scale-[0.98] transition-all text-xl cursor-pointer"
      >
        ▼
      </button>
    </div>
  );
};
