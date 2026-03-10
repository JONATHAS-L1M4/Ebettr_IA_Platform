import React, { useRef, useState } from 'react';

interface Position {
  x: number;
  y: number;
}

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  spotlightColor?: string;
  className?: string;
  enableOverflow?: boolean; // Nova prop para permitir dropdowns
}

const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  // Cor cinza muito sutil para o tema light
  spotlightColor = 'rgba(0, 0, 0, 0.04)', 
  enableOverflow = false,
  ...props
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState<number>(0);

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = e => {
    if (!divRef.current) return;

    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    
    if (props.onMouseMove) props.onMouseMove(e);
  };

  const handleMouseEnter: React.MouseEventHandler<HTMLDivElement> = e => {
    setOpacity(1);
    if (props.onMouseEnter) props.onMouseEnter(e);
  };

  const handleMouseLeave: React.MouseEventHandler<HTMLDivElement> = e => {
    setOpacity(0);
    if (props.onMouseLeave) props.onMouseLeave(e);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-xl border bg-white transition-all duration-300 ${enableOverflow ? '' : 'overflow-hidden'} ${className}`}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-in-out"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
          zIndex: 1
        }}
      />
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
};

export default SpotlightCard;