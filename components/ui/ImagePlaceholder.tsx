interface ImagePlaceholderProps {
  className?: string;
}

// Tuile de remplacement pour un bien sans visuel — dupliquée à l'identique
// dans PropertyCard et PropertyDetailHero avant extraction.
export default function ImagePlaceholder({ className }: ImagePlaceholderProps) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-200 via-stone-100 to-stone-300${
        className ? ` ${className}` : ""
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        className="h-16 w-16 text-stone-400"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M9 21v-6h6v6"
        />
      </svg>
    </div>
  );
}
