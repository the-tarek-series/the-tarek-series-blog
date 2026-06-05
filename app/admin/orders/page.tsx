'use client';

import { useEffect, useState } from 'react';
import { supabase, type Order, type Book } from '@/lib/supabase';
import { ArrowLeft, ShoppingBag, Phone, Mail, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface OrderWithBook extends Order { book?: Book; }

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithBook[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data: orderData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (orderData) {
      const bookIds = orderData.map((o) => o.book_id).filter(Boolean);
      const { data: books } = await supabase.from('books').select('*').in('id', bookIds);
      const bookMap = new Map(books?.map((b) => [b.id, b]));
      const enriched = orderData.map((o) => ({ ...o, book: bookMap.get(o.book_id) }));
      setOrders(enriched);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: string) {
    await supabase.from('orders').update({ status }).eq('id', id);
    toast.success(`Order marked as ${status}`);
    load();
  }

  const pending = orders.filter((o) => o.status === 'pending').length;
  const paid = orders.filter((o) => o.status === 'paid').length;

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-2xl font-bold">Orders</h1>
            <p className="text-muted-foreground text-sm">{pending} pending bKash payments</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-card border border-border rounded-xl p-5 text-center">
            <ShoppingBag className="w-6 h-6 text-accent mx-auto mb-2" />
            <div className="text-2xl font-bold">{orders.length}</div>
            <div className="text-muted-foreground text-sm">Total Orders</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 text-center">
            <Clock className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-amber-500">{pending}</div>
            <div className="text-muted-foreground text-sm">Pending Payment</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 text-center">
            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{paid}</div>
            <div className="text-muted-foreground text-sm">Paid</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Book</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Customer</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-5 py-4"><div className="h-4 bg-muted animate-pulse rounded" /></td></tr>
              )) : orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-mono text-xs text-muted-foreground">{order.id.slice(0, 8).toUpperCase()}</div>
                    <div className="text-xs text-muted-foreground mt-1">{format(new Date(order.created_at), 'MMM d, h:mm a')}</div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    {order.book ? (
                      <div className="flex items-center gap-2">
                        {order.book.cover_image && <img src={order.book.cover_image} alt="" className="w-8 h-10 object-cover rounded" />}
                        <div>
                          <div className="text-sm font-medium line-clamp-1">{order.book.title}</div>
                          <div className="text-xs text-muted-foreground">${order.amount}</div>
                        </div>
                      </div>
                    ) : <span className="text-muted-foreground text-sm">-</span>}
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <div className="text-sm">{order.customer_name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{order.customer_phone}</div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge className={order.status === 'paid' ? 'bg-green-100 text-green-700 border-0' : order.status === 'cancelled' ? 'bg-red-100 text-red-700 border-0' : 'bg-amber-100 text-amber-700 border-0'}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {order.status === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => updateStatus(order.id, 'paid')} className="bg-green-600 hover:bg-green-700 text-white text-xs">Mark Paid</Button>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, 'cancelled')} className="text-xs">Cancel</Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && orders.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No orders yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
