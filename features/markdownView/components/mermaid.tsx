"use client";

import mermaid from "mermaid";
import { memo, useEffect, useRef, useState } from "react";

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
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
        svgElement.style.transform = `translate(${position.x}px, ${position.y}px) scale(${scale})`;
        svgElement.style.transformOrigin = "0 0";
        svgElement.style.cursor = isDragging ? "grabbing" : "grab";
        svgElement.style.transition = isDragging
          ? "none"
          : "transform 0.1s ease-out";
      }
    }
  }, [scale, position, isDragging, children]);

  const zoomAt = (clientX: number, clientY: number, deltaScale: number) => {
    const container = divRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();

    const mouseX = clientX - containerRect.left;
    const mouseY = clientY - containerRect.top;

    const worldX = (mouseX - position.x) / scale;
    const worldY = (mouseY - position.y) / scale;

    const newScale = Math.max(0.1, Math.min(5, scale * deltaScale));

    const newX = mouseX - worldX * newScale;
    const newY = mouseY - worldY * newScale;

    setScale(newScale);
    setPosition({ x: newX, y: newY });
  };

  useEffect(() => {
    const container = divRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      let deltaScale: number;

      if (e.ctrlKey) {
        deltaScale = e.deltaY < 0 ? 1.2 : 0.8;
      } else {
        deltaScale = e.deltaY < 0 ? 1.1 : 0.9;
      }

      zoomAt(e.clientX, e.clientY, deltaScale);
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

    const handleDoubleClick = (e: MouseEvent) => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, 2);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;

      switch (e.key) {
        case "+":
        case "=":
          e.preventDefault();
          const containerRect = container.getBoundingClientRect();
          const centerX = containerRect.left + containerRect.width / 2;
          const centerY = containerRect.top + containerRect.height / 2;
          zoomAt(centerX, centerY, 1.2);
          break;
        case "-":
          e.preventDefault();
          const containerRect2 = container.getBoundingClientRect();
          const centerX2 = containerRect2.left + containerRect2.width / 2;
          const centerY2 = containerRect2.top + containerRect2.height / 2;
          zoomAt(centerX2, centerY2, 0.8);
          break;
        case "0":
          if (e.ctrlKey) {
            e.preventDefault();
            setScale(1);
            setPosition({ x: 0, y: 0 });
          }
          break;
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("mouseleave", handleMouseLeave);
    container.addEventListener("dblclick", handleDoubleClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("mouseleave", handleMouseLeave);
      container.removeEventListener("dblclick", handleDoubleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDragging, dragStart, position, scale]);

  return (
    <>
      <div
        className="mermaid"
        ref={divRef}
        style={{
          overflow: "hidden",
          position: "relative",
          userSelect: "none",
          width: "100%",
          height: "100%",
          background: "#1e1e1e",
        }}
      >
        {children}
      </div>

      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          zIndex: 1000,
        }}
      >
        <button
          onClick={() => {
            const container = divRef.current;
            if (container) {
              const containerRect = container.getBoundingClientRect();
              const centerX = containerRect.left + containerRect.width / 2;
              const centerY = containerRect.top + containerRect.height / 2;
              zoomAt(centerX, centerY, 1.2);
            }
          }}
          style={{
            width: "30px",
            height: "30px",
            backgroundColor: "#333",
            color: "white",
            border: "1px solid #555",
            borderRadius: "3px",
            cursor: "pointer",
            fontSize: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          +
        </button>
        <button
          onClick={() => {
            const container = divRef.current;
            if (container) {
              const containerRect = container.getBoundingClientRect();
              const centerX = containerRect.left + containerRect.width / 2;
              const centerY = containerRect.top + containerRect.height / 2;
              zoomAt(centerX, centerY, 0.8);
            }
          }}
          style={{
            width: "30px",
            height: "30px",
            backgroundColor: "#333",
            color: "white",
            border: "1px solid #555",
            borderRadius: "3px",
            cursor: "pointer",
            fontSize: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          −
        </button>
        <button
          onClick={() => {
            setScale(1);
            setPosition({ x: 0, y: 0 });
          }}
          style={{
            width: "30px",
            height: "30px",
            backgroundColor: "#333",
            color: "white",
            border: "1px solid #555",
            borderRadius: "3px",
            cursor: "pointer",
            fontSize: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          1:1
        </button>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: "10px",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          color: "white",
          padding: "5px 10px",
          borderRadius: "3px",
          fontSize: "12px",
          zIndex: 1000,
        }}
      >
        {Math.round(scale * 100)}%
      </div>
    </>
  );
});
