import Link from 'next/link';
import Logo from '@/components/icons/logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import AuthButton from '@/components/auth/auth-button';

const NavLinks = () => (
  <>
    <Button asChild variant="ghost">
      <Link href="/">Análisis</Link>
    </Button>
    <Button asChild variant="ghost">
      <Link href="/tariffs">Tarifas</Link>
    </Button>
    <Button asChild variant="ghost">
      <Link href="/clients">Clientes</Link>
    </Button>
  </>
);

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-7xl items-center">
        <div className="flex items-center space-x-2 mr-6">
          <Link href="/" className="flex items-center space-x-2">
            <Logo className="h-6 w-6" />
            <span className="font-headline text-xl font-bold tracking-tight">EnerCost Analyzer</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-2">
          <NavLinks />
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <AuthButton />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px]">
                <SheetHeader className="border-b pb-4 mb-4">
                  <SheetTitle>
                    <Link href="/" className="flex items-center space-x-2">
                        <Logo className="h-6 w-6" />
                        <span className="font-headline text-lg font-bold">EnerCost</span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-full">
                  <nav className="flex flex-col space-y-2">
                      <NavLinks />
                  </nav>
                </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
