import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: string;
  tags: string[];
  author_id: string | null;
  published: boolean;
  featured: boolean;
  view_count: number;
  read_time: number;
  created_at: string;
  updated_at: string;
};

export type Book = {
  id: string;
  title: string;
  author: string;
  description: string;
  cover_image: string;
  price: number;
  original_price: number;
  isbn: string;
  pages: number;
  category: string;
  in_stock: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
};

export type Contact = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  created_at: string;
};

export type Order = {
  id: string;
  book_id: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  amount: number;
  status: string;
  bkash_trx_id: string;
  stripe_session_id: string;
  created_at: string;
};
