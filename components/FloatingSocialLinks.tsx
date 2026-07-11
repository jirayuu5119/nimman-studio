type FloatingSocialLinksProps = {
  instagramUrl?: string;
  facebookUrl?: string;
};

function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="currentColor"
    >
      <path d="M13.5 22v-8.2h2.8l.42-3.2H13.5V8.55c0-.93.26-1.56 1.61-1.56h1.72V4.13A23 23 0 0 0 14.32 4c-2.49 0-4.2 1.52-4.2 4.31v2.29H7.3v3.2h2.82V22h3.38Z" />
    </svg>
  );
}

export default function FloatingSocialLinks({
  instagramUrl,
  facebookUrl,
}: FloatingSocialLinksProps) {
  if (!instagramUrl && !facebookUrl) return null;

  return (
    <nav
      aria-label="ช่องทางชมผลงาน"
      className="fixed right-3 top-1/2 z-50 flex -translate-y-1/2 flex-col gap-3 md:right-6"
    >
      {instagramUrl && (
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="ชมผลงาน Instagram"
          title="ชมผลงาน Instagram"
          className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white/95 text-stone-700 shadow-[0_10px_30px_rgba(0,0,0,0.14)] backdrop-blur transition hover:-translate-y-0.5 hover:border-fuchsia-400 hover:bg-gradient-to-br hover:from-fuchsia-500 hover:via-rose-500 hover:to-amber-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 md:h-12 md:w-12"
        >
          <InstagramIcon />
          <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-full bg-stone-900 px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100 md:block">
            ชมผลงาน IG
          </span>
        </a>
      )}

      {facebookUrl && (
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="ชมผลงาน Facebook"
          title="ชมผลงาน Facebook"
          className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white/95 text-stone-700 shadow-[0_10px_30px_rgba(0,0,0,0.14)] backdrop-blur transition hover:-translate-y-0.5 hover:border-[#1877F2] hover:bg-[#1877F2] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 md:h-12 md:w-12"
        >
          <FacebookIcon />
          <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-full bg-stone-900 px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100 md:block">
            ชมผลงาน Facebook
          </span>
        </a>
      )}
    </nav>
  );
}
