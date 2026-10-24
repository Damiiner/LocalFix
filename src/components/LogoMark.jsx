function LogoMark({ className = "", large = false }) {
  const size = large ? 48 : 40;
  return (
    <span
      className={`logo-mark-wrap${large ? " logo-mark-wrap--large" : ""}${className ? ` ${className}` : ""}`.trim()}
      aria-hidden="true"
    >
      <svg
        className={`logo-mark-svg${large ? " logo-mark-svg--large" : ""}`}
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="lf-shader-a" x1="6" y1="4" x2="36" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#c9a227" />
            <stop offset="0.5" stopColor="#8faa84" />
            <stop offset="1" stopColor="#c17f59" />
          </linearGradient>
          <linearGradient id="lf-shader-b" x1="2" y1="20" x2="38" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f0e4c4" stopOpacity="0.95" />
            <stop offset="1" stopColor="#c9a227" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="36" height="36" rx="12" fill="url(#lf-shader-a)" opacity="0.4" />
        <path
          d="M8 28c6-14 18-18 24-22M12 32c8-10 16-12 22-16M6 14c10 4 18 12 24 20"
          stroke="url(#lf-shader-b)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="20" cy="20" r="3.2" fill="#f4eee4" opacity="0.95" />
      </svg>
    </span>
  );
}

export default LogoMark;
