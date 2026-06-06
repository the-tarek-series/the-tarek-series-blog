/*
  # Create schema for blog application

  1. New Tables:
    - `posts`: Blog posts with metadata
    - `books`: Bookstore inventory
    - `contacts`: Contact form submissions
    - `orders`: Book orders with payment info
    - `newsletter_subscribers`: Newsletter sign-ups
    - `analytics_events`: Analytics tracking
    - `analytics_sessions`: User sessions for tracking

  2. Security:
    - Enable RLS on all tables
    - Public read for published posts
    - Admin-only access for management tables
*/

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text,
  content text NOT NULL,
  cover_image text,
  category text DEFAULT 'general',
  tags text[] DEFAULT '{}',
  author_id uuid,
  published boolean DEFAULT false,
  featured boolean DEFAULT false,
  view_count integer DEFAULT 0,
  read_time integer DEFAULT 5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  description text,
  cover_image text,
  price numeric(10, 2) DEFAULT 0,
  original_price numeric(10, 2) DEFAULT 0,
  isbn text,
  pages integer,
  category text DEFAULT 'psychology',
  in_stock boolean DEFAULT true,
  featured boolean DEFAULT false,
  bkash_info text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) ON DELETE SET NULL,
  user_id uuid,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text NOT NULL,
  amount numeric(10, 2) NOT NULL,
  status text DEFAULT 'pending',
  bkash_trx_id text,
  stripe_session_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  subscribed boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  page_url text,
  post_id uuid REFERENCES posts(id) ON DELETE SET NULL,
  user_session_id text,
  created_at timestamptz DEFAULT now()
);

-- Create analytics_sessions table
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  user_agent text,
  referrer text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for posts (public read for published)
CREATE POLICY "Published posts are public" ON posts
  FOR SELECT USING (published = true);

-- Create policies for books (public read)
CREATE POLICY "Books are public" ON books
  FOR SELECT USING (true);

-- Allow anonymous inserts for contacts
CREATE POLICY "Anyone can submit contacts" ON contacts
  FOR INSERT WITH CHECK (true);

-- Allow anonymous inserts for newsletter
CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read newsletter status" ON newsletter_subscribers
  FOR SELECT USING (true);

-- Allow anonymous inserts for orders
CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT WITH CHECK (true);

-- Allow public read for analytics
CREATE POLICY "Analytics events are logged publicly" ON analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Analytics sessions are public" ON analytics_sessions
  FOR INSERT WITH CHECK (true);
