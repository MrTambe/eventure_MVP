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
  panelHeight = 72,
  baseItemSize = 50,
  magnification = 70,
  className,
}: DockProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
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

  return (
    <motion.div
      className={cn(
        'fixed top-4 left-1/2 -translate-x-1/2 z-[100]',
        'flex items-center justify-center gap-0.5 sm:gap-1',
        'bg-white dark:bg-neutral-900 border-2 border-black dark:border-white',
        'px-2 sm:px-4 py-2 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff]',
        'max-w-[calc(100vw-1rem)] overflow-x-auto',
        className
      )}
      style={{ height: panelHeight }}
    >
      {items.map((item, index) => {
        const active = isItemActive(item);
        return (
          <motion.button
            key={index}
            onClick={() => handleItemClick(item)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 px-2 sm:px-3 py-1.5 rounded transition-colors min-w-[44px] sm:min-w-[56px]',
              active
                ? 'bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white'
                : 'text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            title={item.label}
          >
            <span className="flex items-center justify-center">{item.icon}</span>
            <span className="hidden sm:block text-[9px] font-bold uppercase tracking-wide leading-none">{item.label}</span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}