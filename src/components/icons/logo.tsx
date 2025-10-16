import type { SVGProps } from 'react';

const Logo = (props: SVGProps<SVGSVGElement>) => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="hsl(var(--primary))" />
    </svg>
);
export default Logo;
