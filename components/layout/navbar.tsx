'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Menu, X, Brain, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navLinks = [
  { label: 'Blog', href: '/blog' },
  { label: 'Games', href: '/games' },
  { label: 'Bookstore', href: '/bookstore' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled ? 'bg-background/95 backdrop-blur-md border-b border-border shadow-sm' : 'bg-transparent'
    )}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center transition-transform group-hover:scale-105">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-foreground">
              Mind<span className="text-accent">Scape</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                pathname === link.href || pathname.startsWith(link.href + '/')
                  ? 'text-accent bg-accent/8'
                  : 'text-foreground/70 hover:text-foreground hover:bg-muted'
              )}>{link.label}</Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link href="/search" className="hidden md:flex">
              <Button variant="ghost" size="sm" className="gap-2 text-foreground/70 hover:text-foreground">
                <Search className="w-4 h-4" /> Search
              </Button>
            </Link>
            <Link href="/admin" className="hidden md:block">
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-white text-xs">Admin</Button>
            </Link>
            <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-md text-foreground/70 hover:text-foreground hover:bg-muted transition-colors" aria-label="Toggle menu">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {open && (
        <div className="md:hidden bg-background border-b border-border animate-fade-in">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={cn(
                'block px-4 py-2.5 text-sm font-medium rounded-md transition-colors',
                pathname === link.href ? 'text-accent bg-accent/8' : 'text-foreground/70 hover:text-foreground hover:bg-muted'
              )}>{link.label}</Link>
            ))}
            <Link href="/search" className="block px-4 py-2.5 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-muted rounded-md">Search</Link>
            <Link href="/admin" className="block px-4 py-2.5 text-sm font-medium text-accent hover:bg-accent/8 rounded-md">Admin Dashboard</Link>
          </div>
        </div>
      )}
    </header>
  );
}
