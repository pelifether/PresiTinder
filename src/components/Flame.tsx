/** The logo mark: a flame, in the spirit of the app this thing parodies. */
export default function Flame({ size = 36 }: { size?: number }) {
  return (
    <svg
      className="flame"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="flame-g" x1="0" y1="1" x2="0.4" y2="0">
          <stop offset="0" stopColor="#ff7a45" />
          <stop offset="0.55" stopColor="#fd3a6d" />
          <stop offset="1" stopColor="#fd267a" />
        </linearGradient>
      </defs>
      <path
        d="M12 23.1c-4.5 0-8.1-3.5-8.1-8 0-3.4 2-5.8 4-7.6 1.8-1.8 3.4-3.5 3.7-6.2.1-.9 1.1-1.3 1.7-.7 1 1 1.4 2.5 2 3.7 1.2 2.3 5 4.8 5 9.8-.1 4.6-3.7 8.1-8.3 8z"
        fill="url(#flame-g)"
        stroke="#191512"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M12 20.9c-2.1 0-3.8-1.6-3.8-3.7 0-1.6 1.1-2.7 2.1-3.7.7-.7 1.3-1.4 1.6-2.3.6 1.1 1.2 1.8 1.9 2.6.9.9 2 2 2 3.4 0 2.1-1.7 3.7-3.8 3.7z"
        fill="#ffd23f"
        stroke="#191512"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
