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
  const [held, setHeld] = useState(false);

  useEffect(() => {
    setIndex(0);
    setHeld(false);
  }, [frames.join("|")]);

  useEffect(() => {
    if (held || frames.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % frames.length);
    }, 2600);
    return () => window.clearInterval(timer);
  }, [held, frames.join("|")]);

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
    </div>
  );

  return (
    <div>
      {slug ? (
        <Link to="/piece/$slug" params={{ slug }} className="block">
          {image}
        </Link>
      ) : (
        image
      )}
      {frames.length > 1 ? (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {frames.map((url, i) => (
            <button
              key={url}
              type="button"
              aria-label={`Look ${i + 1}`}
              className={i === index ? "ring-1 ring-ink" : "opacity-70"}
              onClick={() => {
                setIndex(i);
                setHeld(true);
              }}
            >
              <img src={url} alt="" className="h-20 w-full bg-paper object-contain" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
