import Link from 'next/link';
import Logo from '@/components/icons/logo';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-7xl items-center">
        <Link href="/" className="flex items-center space-x-2">
          <Logo className="h-6 w-6" />
          <span className="font-headline text-xl font-bold tracking-tight">EnerCost Analyzer</span>
        </Link>
      </div>
    </header>
  );
}
