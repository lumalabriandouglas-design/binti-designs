import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

export function lookFrames(cover: string, gallery: string[] = []) {
  return [...new Set([cover, ...gallery].filter(Boolean))];
}

export function LookFrames({
  urls,
  alt,
  slug,
}: {
  urls: string[];
  alt: string;
  slug?: string;
}) {
  const frames = lookFrames("", urls);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    if (frames.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % frames.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, [frames.join("|")]);

  const image = (
    <div className="relative bg-paper-2">
      {frames.map((url, i) => (
        <img
          key={url}
          src={url}
          alt={alt}
          loading={i === 0 ? "eager" : "lazy"}
          decoding="async"
          className={`w-full object-contain transition-opacity duration-700 ${
            i === 0 ? "" : "absolute inset-0"
          } ${i === index ? "opacity-100" : "opacity-0"}`}
        />
      ))}
    </div>
  );

  if (!slug) return image;
  return (
    <Link to="/piece/$slug" params={{ slug }} className="block">
      {image}
    </Link>
  );
}
