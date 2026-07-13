"use client";

import { useRef } from "react";

/**
 * Wrapper que aplica um brilho sutil que segue o cursor do mouse — o mesmo
 * tipo de microinteração usada em produtos SaaS premium (Linear, Vercel,
 * Stripe). Funciona atualizando duas CSS custom properties (--x, --y) a
 * cada movimento do mouse; o brilho em si é pintado via ::before definido
 * em globals.css (.spotlight), sem re-render do React a cada frame.
 */
export default function Spotlight({
  children,
  className = "",
  style,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: "div" | "li";
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };

  const Component = Tag as any;

  return (
    <Component ref={ref} onMouseMove={handleMove} style={style} className={`spotlight ${className}`}>
      {children}
    </Component>
  );
}
