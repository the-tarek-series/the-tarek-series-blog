'use client';

import { useEffect, useState } from 'react';
import { supabase, type Book } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, ShoppingCart, Star, Search, X, Phone, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Trauma', value: 'trauma' },
  { label: 'Cognitive', value: 'cognitive' },
  { label: 'Relationships', value: 'relationships' },
  { label: 'Mindfulness', value: 'mindfulness' },
  { label: 'Existential', value: 'existential' },
];

export function BookStorePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState({ name: '', phone: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      let q = supabase.from('books').select('*').order('created_at', { ascending: false });
      if (category) q = q.eq('category', category);
      const { data } = await q;
      if (data) setBooks(data);
      setLoading(false);
    }
    load();
  }, [category]);

  const filtered = query
    ? books.filter((b) => b.title.toLowerCase().includes(query.toLowerCase()) || b.author.toLowerCase().includes(query.toLowerCase()))
    : books;

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBook) return;
    setSubmitting(true);

    const { data, error } = await supabase.from('orders').insert({
      book_id: selectedBook.id,
      customer_name: orderForm.name,
      customer_phone: orderForm.phone,
      customer_email: orderForm.email,
      amount: selectedBook.price,
      status: 'pending',
    }).select('id').single();

    setSubmitting(false);

    if (error) {
      toast.error('Order failed. Please try again.');
    } else {
      setOrderId(data.id);
      setOrderPlaced(true);
      toast.success('Order placed successfully!');
    }
  }

  function resetOrder() {
    setSelectedBook(null);
    setShowOrderForm(false);
    setOrderPlaced(false);
    setOrderForm({ name: '', phone: '', email: '' });
    setOrderId('');
  }

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-7 h-7 text-accent" />
          </div>
          <p className="text-accent text-sm font-medium uppercase tracking-widest mb-3">Psychology Bookstore</p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-5" style={{ fontFamily: 'var(--font-playfair)' }}>Essential Reading</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Carefully curated books to deepen your understanding of the human mind.
          </p>
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search books or authors..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all',
                  category === cat.value
                    ? 'bg-accent text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                )}
              >{cat.label}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-96 bg-muted animate-pulse rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onBuy={() => {
                  setSelectedBook(book);
                  setShowOrderForm(true);
                  setOrderPlaced(false);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Order Modal */}
      {(showOrderForm || orderPlaced) && selectedBook && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{orderPlaced ? 'Order Confirmed' : 'Complete Your Order'}</h2>
              <button onClick={resetOrder}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            {!orderPlaced ? (
              <>
                {/* Book summary */}
                <div className="flex gap-4 mb-6 p-4 bg-muted/50 rounded-xl">
                  {selectedBook.cover_image && (
                    <img src={selectedBook.cover_image} alt={selectedBook.title} className="w-16 h-20 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1">{selectedBook.title}</h3>
                    <p className="text-muted-foreground text-xs mb-2">{selectedBook.author}</p>
                    <p className="font-bold text-accent text-lg">${selectedBook.price}</p>
                  </div>
                </div>

                <form onSubmit={handleOrder} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name *</label>
                    <input
                      required
                      value={orderForm.name}
                      onChange={(e) => setOrderForm({ ...orderForm, name: e.target.value })}
                      className="w-full h-11 px-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number (bKash) *</label>
                    <input
                      required
                      value={orderForm.phone}
                      onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                      className="w-full h-11 px-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                      placeholder="01XXXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email (optional)</label>
                    <input
                      type="email"
                      value={orderForm.email}
                      onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
                      className="w-full h-11 px-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                      placeholder="your@email.com"
                    />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full h-12 bg-accent hover:bg-accent/90 text-white gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    {submitting ? 'Processing...' : `Order Now - $${selectedBook.price}`}
                  </Button>
                </form>
              </>
            ) : (
              <>
                <div className="text-center py-6">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Order Placed Successfully!</h3>
                  <p className="text-muted-foreground text-sm mb-6">Order ID: {orderId}</p>
                </div>

                {/* bKash Payment Instructions */}
                <div className="bg-pink-50 border border-pink-200 rounded-xl p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-pink-700">Pay with bKash</h4>
                      <p className="text-pink-600 text-xs">Send payment to complete your order</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between p-3 bg-white rounded-lg">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-bold text-pink-600">${selectedBook.price}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-white rounded-lg">
                      <span className="text-muted-foreground">bKash Number:</span>
                      <span className="font-bold font-mono">01712-345678</span>
                    </div>
                    <div className="flex justify-between p-3 bg-white rounded-lg">
                      <span className="text-muted-foreground">Reference:</span>
                      <span className="font-mono text-xs">{orderId.slice(0, 8).toUpperCase()}</span>
                    </div>
                  </div>

                  <ol className="mt-4 space-y-2 text-xs text-pink-800">
                    <li>1. Open bKash app or dial *247#</li>
                    <li>2. Select &quot;Send Money&quot;</li>
                    <li>3. Enter: 01712-345678</li>
                    <li>4. Enter amount: ${selectedBook.price}</li>
                    <li>5. Use reference: {orderId.slice(0, 8).toUpperCase()}</li>
                    <li>6. Enter your PIN and confirm</li>
                  </ol>
                </div>

                <p className="text-muted-foreground text-xs text-center">
                  After payment, your book will be delivered within 24-48 hours.
                  We&apos;ll send confirmation to {orderForm.phone || 'your phone'}.
                </p>

                <Button onClick={resetOrder} className="w-full mt-6" variant="outline">Continue Shopping</Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BookCard({ book, onBuy }: { book: Book; onBuy: () => void }) {
  const discount = book.original_price > book.price
    ? Math.round(((book.original_price - book.price) / book.original_price) * 100)
    : 0;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col card-hover">
      <div className="relative h-60 overflow-hidden">
        <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover" />
        {discount > 0 && (
          <Badge className="absolute top-3 right-3 bg-red-500 text-white border-0">-{discount}%</Badge>
        )}
        {book.featured && (
          <Badge className="absolute top-3 left-3 bg-accent text-white border-0">Featured</Badge>
        )}
      </div>
      <div className="p-6 flex flex-col flex-1">
        <Badge variant="secondary" className="text-xs capitalize w-fit mb-3">{book.category}</Badge>
        <h3 className="font-bold text-base mb-1 line-clamp-2">{book.title}</h3>
        <p className="text-accent text-sm font-medium mb-2">{book.author}</p>
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
          <span className="text-xs text-muted-foreground ml-1">(4.8)</span>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-5 flex-1">{book.description}</p>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-xl text-accent">${book.price}</span>
            {book.original_price > book.price && (
              <span className="text-muted-foreground text-sm line-through">${book.original_price}</span>
            )}
          </div>
          <Button
            size="sm"
            onClick={onBuy}
            disabled={!book.in_stock}
            className={cn(
              'gap-1.5 text-sm',
              !book.in_stock ? 'bg-muted text-muted-foreground' : 'bg-accent hover:bg-accent/90 text-white'
            )}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {book.in_stock ? 'Buy Now' : 'Out of Stock'}
          </Button>
        </div>
      </div>
    </div>
  );
}
