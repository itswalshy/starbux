import type { SVGProps } from 'react';

export function TipJarLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 130" // Adjusted viewBox for aspect ratio
      width="200" // Default width, can be overridden by props
      height="130" // Default height, can be overridden by props
      fill="hsl(var(--foreground))" // Use theme foreground color
      {...props}
    >
      {/* Simplified Siren Element */}
      <g transform="translate(100 45)"> {/* Center the siren part */}
        {/* Outer Circle */}
        <circle cx="0" cy="0" r="38" stroke="hsl(var(--foreground))" strokeWidth="3" fill="none" />
        {/* Inner Circle (Face Placeholder) */}
        <circle cx="0" cy="0" r="20" fill="hsl(var(--foreground))" />
        <circle cx="0" cy="0" r="18" fill="hsl(var(--background))" /> {/* Cutout for face */}
        <circle cx="0" cy="-5" r="3" fill="hsl(var(--foreground))" /> {/* Eye 1 */}
        <circle cx="0" cy="5" r="1.5" fill="hsl(var(--foreground))" /> {/* Nose */}
        {/* Simplified Crown */}
        <path d="M -15 -30 L 0 -42 L 15 -30 Z" fill="hsl(var(--foreground))" />
        <circle cx="0" cy="-28" r="4" fill="hsl(var(--foreground))" />
        {/* Simplified "Tail" elements */}
        <path d="M -25 0 Q -35 15 -25 30 L -20 28 Q -30 15 -20 0 Z" fill="hsl(var(--foreground))" />
        <path d="M 25 0 Q 35 15 25 30 L 20 28 Q 30 15 20 0 Z" fill="hsl(var(--foreground))" />
      </g>
      {/* Text Element "tipjar" */}
      <text
        x="50%" // Center text
        y="115" // Position below the siren
        fontFamily="Arial, Helvetica, sans-serif" // A common bold sans-serif font
        fontSize="36" // Adjust size as needed
        fontWeight="bold"
        textAnchor="middle" // Ensure text is centered
        fill="hsl(var(--foreground))" // Use theme foreground color
      >
        tipjar
      </text>
    </svg>
  );
}
