export function BananaMark({ className = "banana" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path
        d="M14 18c8-8 34-4 38 14-10-2-18 2-22 10-8 14-20 16-26 8 10-2 16-12 14-22-1-6-4-8-4-10z"
        fill="#f0d24b"
      />
      <path d="M48 20c4 8 4 16 1 22" fill="none" stroke="#c9a227" strokeWidth="2" />
      <path d="M50 16c3-1 6 1 6 4" fill="none" stroke="#5b3b16" strokeWidth="3" />
    </svg>
  );
}

export function MinionPeek() {
  return (
    <div className="minion-peek group-hover:-translate-y-2 transition-transform duration-300">
      <div className="minion-body">
        <span className="minion-goggle" />
        <span className="minion-smile" />
      </div>
    </div>
  );
}

export function BananaLoader({ label = "Opening the atelier" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="animate-bounce">
        <BananaMark className="h-10 w-10" />
      </div>
      <p className="eyebrow">{label}</p>
    </div>
  );
}
