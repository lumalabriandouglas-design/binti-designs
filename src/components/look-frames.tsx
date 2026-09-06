import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

export function lookFrames(cover: string, gallery: string[] = []) {
  return [...new Set([cover, ...gallery].filter((url) => url && !url.startsWith("r2:") && url !== "[object Object]"))];
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
    }, 2600);
    return () => window.clearInterval(timer);
  }, [frames.join("|")]);

  useEffect(() => {
    frames.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [frames.join("|")]);

  if (!frames.length) return <div className="min-h-64 bg-paper-2" />;

  const image = (
    <div className="relative overflow-hidden bg-paper-2">
      {frames.map((url, i) => (
        <img
          key={url}
          src={url}
          alt={i === index ? alt : ""}
          className={`w-full object-contain transition-opacity duration-700 ease-out ${
            i === 0 ? "relative" : "absolute inset-0 h-full w-full"
          } ${i === index ? "opacity-100" : "pointer-events-none opacity-0"}`}
        />
      ))}
      {frames.length > 1 ? (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {frames.map((url, i) => (
            <span
              key={url}
              className={`block h-1 w-4 ${i === index ? "bg-ink" : "bg-ink/25"}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );

  if (!slug) return image;
  return (
    <Link to="/piece/$slug" params={{ slug }} className="block">
      {image}
    </Link>
  );
}
