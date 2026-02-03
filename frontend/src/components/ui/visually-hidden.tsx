/**
 * VisuallyHidden component for screen reader text
 * Hides content visually but keeps it accessible to screen readers
 */
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
      style={{ clip: 'rect(0, 0, 0, 0)' }}
    >
      {children}
    </span>
  );
}

/**
 * Skip link for keyboard navigation
 * Allows users to skip directly to main content
 */
export function SkipLink({ href = '#main-content', children = 'Skip to main content' }: {
  href?: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
    >
      {children}
    </a>
  );
}
