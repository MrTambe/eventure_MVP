import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router';
import { cn } from '@/lib/utils';

interface DockItem {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
}

interface DockProps {
  items: DockItem[];
  panelHeight?: number;
  baseItemSize?: number;
  magnification?: number;
  className?: string;
}

export function Dock({
  items,
  panelHeight = 68,
  baseItemSize = 50,
  magnification = 70,
  className,
}: DockProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleItemClick = (item: DockItem) => {
    if (item.href) {
      navigate(item.href);
    } else if (item.onClick) {
      item.onClick();
    }
  };

  const isItemActive = (item: DockItem) => {
    return item.href === location.pathname;
  };

  const getItemSize = (index: number) => {
    if (hoveredIndex === null) return baseItemSize;

    const distance = Math.abs(index - hoveredIndex);
    if (distance === 0) return magnification;
    if (distance === 1) return magnification * 0.8;
    if (distance === 2) return magnification * 0.6;
    return baseItemSize;
  };

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'flex items-end justify-center gap-2',
        'bg-background/80 backdrop-blur-lg border border-border rounded-full',
        'px-4 py-2 shadow-lg',
        className
      )}
      style={{ height: panelHeight }}
    >
      {items.map((item, index) => (
        <motion.button
          key={index}
          onClick={() => handleItemClick(item)}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          animate={{
            height: getItemSize(index),
            width: getItemSize(index),
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
          className={cn(
            'flex items-center justify-center rounded-full transition-colors',
            'hover:bg-muted',
            isItemActive(item) && 'bg-primary text-primary-foreground',
            !isItemActive(item) && 'text-foreground/70 hover:text-foreground'
          )}
          title={item.label}
        >
          <motion.div
            animate={{
              scale: getItemSize(index) / baseItemSize,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            className="flex items-center justify-center"
          >
            {item.icon}
          </motion.div>
        </motion.button>
      ))}
    </motion.div>
  );
}
