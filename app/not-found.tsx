import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Brain } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Brain className="w-10 h-10 text-accent" />
        </div>
        <h1 className="text-6xl font-bold mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>404</h1>
        <p className="text-xl text-muted-foreground mb-8">This page seems to have wandered off.</p>
        <Link href="/"><Button className="bg-accent hover:bg-accent/90 text-white">Return Home</Button></Link>
      </div>
    </div>
  );
}
