"use client";

import mermaid from "mermaid";
import { memo, useEffect, useRef, useState } from "react";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
});

export const Mermaid = memo(({ children }: { children: React.ReactNode }) => {
  const [scale, setScale] = useState(1);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (divRef.current) {
      mermaid.run({ nodes: [divRef.current] });
    }
  }, [children]);

  useEffect(() => {
    if (divRef.current) {
      const svgElement = divRef.current.querySelector("svg");
      if (svgElement) {
        svgElement.style.transform = `scale(${scale})`;
        svgElement.style.transformOrigin = "top left";
      }
    }
  }, [scale, children]);

  useEffect(() => {
    const container = divRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();

        const zoomFactor = e.deltaY < 0 ? 0.1 : -0.1;
        setScale((prevScale) =>
          Math.max(0.5, Math.min(3, prevScale + zoomFactor)),
        );
      }
    };

    container.addEventListener("wheel", handleNativeWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleNativeWheel);
    };
  }, []);

  return (
    <div
      className="mermaid"
      ref={divRef}
      style={{
        overflow: "hidden",
        position: "relative",
      }}
    >
      {children}
    </div>
  );
});
