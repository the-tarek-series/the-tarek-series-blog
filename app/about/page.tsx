import type { Metadata } from 'next';
import Link from 'next/link';
import { Brain, BookOpen, Gamepad2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'About Me', description: 'Learn about Dr. Elena Hartmann, psychologist and writer behind MindScape.' };

export default function AboutPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          <div>
            <p className="text-accent text-sm font-medium uppercase tracking-widest mb-4">About Me</p>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight" style={{ fontFamily: 'var(--font-playfair)' }}>Dr. Elena Hartmann</h1>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">Licensed psychologist, researcher, and educator passionate about making evidence-based psychology accessible to everyone.</p>
            <p className="text-muted-foreground leading-relaxed mb-6">With over 12 years of clinical experience and a PhD in Cognitive Psychology from Stockholm University, I bridge the gap between academic research and everyday mental wellness.</p>
            <div className="flex gap-3">
              <Link href="/contact"><Button className="bg-accent hover:bg-accent/90 text-white gap-2"><Mail className="w-4 h-4" /> Get in Touch</Button></Link>
              <Link href="/blog"><Button variant="outline" className="gap-2"><BookOpen className="w-4 h-4" /> Read the Blog</Button></Link>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden">
              <img src="https://images.pexels.com/photos/5716001/pexels-photo-5716001.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Dr. Elena Hartmann" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-accent text-white rounded-2xl p-6 shadow-lg">
              <div className="text-3xl font-bold">12+</div>
              <div className="text-white/80 text-sm">Years of Practice</div>
            </div>
          </div>
        </div>

        <div className="bg-muted/40 rounded-3xl p-10 sm:p-14 mb-16 text-center">
          <Brain className="w-12 h-12 text-accent mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-5" style={{ fontFamily: 'var(--font-playfair)' }}>My Mission</h2>
          <p className="text-muted-foreground text-xl leading-relaxed max-w-2xl mx-auto">To create a space where psychology leaves the clinical room and enters everyday life — where complex research becomes practical wisdom that genuinely helps people flourish.</p>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-10 text-center" style={{ fontFamily: 'var(--font-playfair)' }}>What You Will Find Here</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: BookOpen, title: 'In-Depth Articles', desc: 'Rigorously researched articles that translate clinical psychology into insights you can actually apply.' },
              { icon: Gamepad2, title: 'Brain Training Games', desc: 'Science-backed memory exercises designed to strengthen recall and mental agility.' },
              { icon: Brain, title: 'Curated Book List', desc: 'Carefully selected psychology books I personally recommend.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card border border-border rounded-xl p-7 text-center">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-lg mb-3">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-foreground text-background rounded-3xl p-10 sm:p-14">
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ fontFamily: 'var(--font-playfair)' }}>Credentials & Experience</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              { title: 'PhD, Cognitive Psychology', org: 'Stockholm University, 2012' },
              { title: 'Licensed Psychologist', org: 'Swedish Board of Health, #LP-8842' },
              { title: 'Certified CBT Practitioner', org: 'Beck Institute, 2014' },
              { title: 'Mindfulness-Based Cognitive Therapy', org: 'Oxford Mindfulness Centre, 2016' },
              { title: 'Author, "Rewiring the Mind"', org: 'Published 2019, 15,000+ copies' },
              { title: 'TEDx Speaker', org: '"The Neuroscience of Compassion", 2021' },
            ].map(({ title, org }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                <div>
                  <div className="font-medium text-background/90">{title}</div>
                  <div className="text-background/50 text-sm">{org}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
