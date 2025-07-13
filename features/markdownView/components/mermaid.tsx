"use client";

import mermaid from "mermaid";
import { memo, useEffect, useRef, useState } from "react";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
});

export const Mermaid = memo(({ children }: { children: React.ReactNode }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
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
        svgElement.style.transform = `scale(${scale}) translate(${position.x}px, ${position.y}px)`;
        svgElement.style.transformOrigin = "top left";
        svgElement.style.cursor = isDragging ? "grabbing" : "grab";
      }
    }
  }, [scale, position, isDragging, children]);

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

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        e.preventDefault();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleMouseLeave = () => {
      setIsDragging(false);
    };

    container.addEventListener("wheel", handleNativeWheel, { passive: false });
    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("wheel", handleNativeWheel);
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isDragging, dragStart, position]);

  return (
    <div
      className="mermaid"
      ref={divRef}
      style={{
        overflow: "hidden",
        position: "relative",
        userSelect: "none",
      }}
    >
      {children}
    </div>
  );
});
