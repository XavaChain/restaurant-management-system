-- 0. CLEANUP EXISTING TYPES & TABLES (Fixes Error 42710)
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS account_status CASCADE;
DROP TYPE IF EXISTS stock_movement_type CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.stock_movements CASCADE;
DROP TABLE IF EXISTS public.stock_items CASCADE;
DROP TABLE IF EXISTS public.sales_tickets CASCADE;
DROP TABLE IF EXISTS public.cooking_tickets CASCADE;
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. EXTENSIONS & TYPES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('owner', 'admin', 'chef', 'waiter');
CREATE TYPE account_status AS ENUM ('active', 'suspended');
CREATE TYPE stock_movement_type AS ENUM ('received', 'used', 'adjustment');

-- 2. TABLE DEFINITIONS

-- Profiles Table (Linked to auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    mobile_number TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'waiter',
    account_status account_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Items Table
CREATE TABLE public.menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_code INT UNIQUE NOT NULL,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cooking Tickets (Append-Only)
CREATE TABLE public.cooking_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    chef_id UUID NOT NULL REFERENCES public.profiles(id),
    business_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Tickets (Append-Only)
CREATE TABLE public.sales_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price_snapshot NUMERIC(10, 2) NOT NULL,
    waiter_id UUID NOT NULL REFERENCES public.profiles(id),
    business_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Items
CREATE TABLE public.stock_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_name TEXT UNIQUE NOT NULL,
    unit TEXT NOT NULL, -- L, kg, pcs, pack
    minimum_stock NUMERIC(10, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Movements (Append-Only)
CREATE TABLE public.stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_item_id UUID NOT NULL REFERENCES public.stock_items(id) ON DELETE RESTRICT,
    movement_type stock_movement_type NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_reference TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'qr', 'other')),
    recorded_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs (Immutable)
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEXES FOR FAST REPORTING & REALTIME
CREATE INDEX idx_cooking_date ON public.cooking_tickets (business_date);
CREATE INDEX idx_sales_date ON public.sales_tickets (business_date);
CREATE INDEX idx_stock_mov_item ON public.stock_movements (stock_item_id);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooking_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper Function to Get Current User's Role
CREATE OR REPLACE FUNCTION get_auth_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper Function to Check if User is Active
CREATE OR REPLACE FUNCTION is_auth_active()
RETURNS BOOLEAN AS $$
  SELECT account_status = 'active' FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES POLICIES
CREATE POLICY "Profiles read by authenticated staff" ON public.profiles
    FOR SELECT TO authenticated USING (is_auth_active());

CREATE POLICY "Profiles manage by Admin or Owner" ON public.profiles
    FOR ALL TO authenticated USING (
        is_auth_active() AND get_auth_role() IN ('owner', 'admin')
    );

-- MENU ITEMS POLICIES
CREATE POLICY "Menu read by all staff" ON public.menu_items
    FOR SELECT TO authenticated USING (is_auth_active());

CREATE POLICY "Menu edit by Admin or Owner" ON public.menu_items
    FOR ALL TO authenticated USING (
        is_auth_active() AND get_auth_role() IN ('owner', 'admin')
    );

-- COOKING TICKETS POLICIES (Append-Only)
CREATE POLICY "Cooking tickets read by all staff" ON public.cooking_tickets
    FOR SELECT TO authenticated USING (is_auth_active());

CREATE POLICY "Cooking tickets insert by Chef, Admin, Owner" ON public.cooking_tickets
    FOR INSERT TO authenticated WITH CHECK (
        is_auth_active() AND get_auth_role() IN ('chef', 'admin', 'owner')
    );

-- SALES TICKETS POLICIES (Append-Only)
CREATE POLICY "Sales tickets read by all staff" ON public.sales_tickets
    FOR SELECT TO authenticated USING (is_auth_active());

CREATE POLICY "Sales tickets insert by Waiter, Admin, Owner" ON public.sales_tickets
    FOR INSERT TO authenticated WITH CHECK (
        is_auth_active() AND get_auth_role() IN ('waiter', 'admin', 'owner')
    );

-- STOCK ITEMS POLICIES
CREATE POLICY "Stock items read by all staff" ON public.stock_items
    FOR SELECT TO authenticated USING (is_auth_active());

CREATE POLICY "Stock items manage by Chef, Admin, Owner" ON public.stock_items
    FOR ALL TO authenticated USING (
        is_auth_active() AND get_auth_role() IN ('chef', 'admin', 'owner')
    );

-- STOCK MOVEMENTS POLICIES
CREATE POLICY "Stock movements read by all staff" ON public.stock_movements
    FOR SELECT TO authenticated USING (is_auth_active());

CREATE POLICY "Stock movements insert by Chef, Admin, Owner" ON public.stock_movements
    FOR INSERT TO authenticated WITH CHECK (
        is_auth_active() AND get_auth_role() IN ('chef', 'admin', 'owner')
    );

-- PAYMENTS POLICIES
CREATE POLICY "Payments read by all staff" ON public.payments
    FOR SELECT TO authenticated USING (is_auth_active());

CREATE POLICY "Payments insert by Waiter, Admin, Owner" ON public.payments
    FOR INSERT TO authenticated WITH CHECK (
        is_auth_active() AND get_auth_role() IN ('waiter', 'admin', 'owner')
    );

-- AUDIT LOGS POLICIES
CREATE POLICY "Audit logs read by Admin and Owner" ON public.audit_logs
    FOR SELECT TO authenticated USING (
        is_auth_active() AND get_auth_role() IN ('owner', 'admin')
    );

-- 5. INITIAL MENU SEED DATA ("সপ্ন Fast Food & ক্যাফে")
INSERT INTO public.menu_items (item_code, item_name, category, price) VALUES
(1, 'নরমাল ফুচকা (৮ পিছ)', 'Fuchka / Jhalmuri', 60.00),
(2, 'স্পেশাল ফুচকা (১২ পিছ)', 'Fuchka / Jhalmuri', 100.00),
(3, 'ডাই ফুচকা (৮ পিছ)', 'Fuchka / Jhalmuri', 100.00),
(4, 'নাগা ফুচকা (৮ পিছ)', 'Fuchka / Jhalmuri', 100.00),
(5, 'মিনি ফুচকা (৮ পিছ)', 'Fuchka / Jhalmuri', 80.00),
(6, 'নরমাল ঝালমুড়ি (১ প্লেট)', 'Fuchka / Jhalmuri', 50.00),
(7, 'চিকেন ঝালমুড়ি (১ প্লেট)', 'Fuchka / Jhalmuri', 100.00),
(8, 'স্পেশাল চাটপটি (১ প্লেট)', 'Fuchka / Jhalmuri', 100.00),
(9, 'চিকেন বার্গার (১ পিছ)', 'Burger Items', 120.00),
(10, 'চিকেন চিজ বার্গার (১ পিছ)', 'Burger Items', 150.00),
(11, 'BBQ বার্গার (১ পিছ)', 'Burger Items', 180.00),
(12, 'NAGA বার্গার (১ পিছ)', 'Burger Items', 180.00),
(13, 'ডাবল ডেকার বার্গার (১ পিছ)', 'Burger Items', 250.00),
(14, 'ফালুদা', 'Dessert', 150.00),
(15, 'স্পেশাল ফালুদা', 'Dessert', 200.00),
(16, 'BBQ মোমো (৬ পিছ)', 'Momo', 150.00),
(17, 'NAGA মোমো (৬ পিছ)', 'Momo', 150.00),
(18, 'TANDORI মোমো (৬ পিছ)', 'Momo', 200.00),
(19, 'সুইট লাচ্ছি', 'Lassi Items', 500.00),
(20, 'সল্ট লাচ্ছি', 'Lassi Items', 500.00),
(21, 'ম্যাঙ্গো লাচ্ছি', 'Lassi Items', 150.00),
(22, 'চকলেট লাচ্ছি', 'Lassi Items', 120.00),
(23, 'স্ট্রবেরি লাচ্ছি', 'Lassi Items', 150.00),
(24, 'চকলেট কোল্ড কফি', 'Lassi Items', 150.00),
(25, 'স্ট্রবেরি মিল্কসেক', 'Milkshake', 150.00),
(26, 'ব্যানানা মিল্কসেক', 'Milkshake', 150.00),
(27, 'ম্যাঙ্গো মিল্কসেক', 'Milkshake', 150.00),
(28, 'ভ্যানিলা মিল্কসেক', 'Milkshake', 150.00),
(29, 'চকলেট মিল্কসেক', 'Milkshake', 150.00),
(30, 'হট কফি', 'Hot Items', 80.00),
(31, 'নাট কফি', 'Hot Items', 100.00),
(32, 'ব্লাক কফি', 'Hot Items', 50.00),
(33, 'BBQ পিজ্জা (৮")', 'Pizza Items', 300.00),
(34, 'BBQ পিজ্জা (১০")', 'Pizza Items', 400.00),
(35, 'BBQ পিজ্জা (১২")', 'Pizza Items', 500.00),
(36, 'NAGA পিজ্জা (৮")', 'Pizza Items', 300.00),
(37, 'NAGA পিজ্জা (১০")', 'Pizza Items', 400.00),
(38, 'NAGA পিজ্জা (১২")', 'Pizza Items', 500.00),
(39, '4 SIGON পিজ্জা (৮")', 'Pizza Items', 320.00),
(40, '4 SIGON পিজ্জা (১০")', 'Pizza Items', 420.00),
(41, '4 SIGON পিজ্জা (১২")', 'Pizza Items', 620.00),
(42, 'SAUCES পিজ্জা (৮")', 'Pizza Items', 320.00),
(43, 'SAUCES পিজ্জা (১০")', 'Pizza Items', 420.00),
(44, 'SAUCES পিজ্জা (১২")', 'Pizza Items', 620.00),
(45, 'ইতালিয়ান পিজ্জা (৮")', 'Pizza Items', 340.00),
(46, 'ইতালিয়ান পিজ্জা (১০")', 'Pizza Items', 450.00),
(47, 'ইতালিয়ান পিজ্জা (১২")', 'Pizza Items', 650.00),
(48, 'আমেরিকানো পিজ্জা (৮")', 'Pizza Items', 340.00),
(49, 'আমেরিকানো পিজ্জা (১০")', 'Pizza Items', 450.00),
(50, 'আমেরিকানো পিজ্জা (১২")', 'Pizza Items', 650.00),
(51, 'চিজ লাভার পিজ্জা (৮")', 'Pizza Items', 500.00),
(52, 'চিজ লাভার পিজ্জা (১০")', 'Pizza Items', 600.00),
(53, 'চিজ লাভার পিজ্জা (১২")', 'Pizza Items', 700.00),
(54, 'বিফ পিজ্জা (৮")', 'Pizza Items', 380.00),
(55, 'বিফ পিজ্জা (১০")', 'Pizza Items', 460.00),
(56, 'বিফ পিজ্জা (১২")', 'Pizza Items', 600.00),
(57, 'চিকেন ফ্রাই (১ পিছ)', 'Fry Items', 100.00),
(58, 'BBQ চিকেন (১ পিছ)', 'Fry Items', 140.00),
(59, 'NAGA চিকেন (১ পিছ)', 'Fry Items', 140.00),
(60, 'BBQ উইংস (৬ পিছ)', 'Fry Items', 200.00),
(61, 'NAGA উইংস (৬ পিছ)', 'Fry Items', 200.00),
(62, 'POP চিকেন (৮ পিছ)', 'Fry Items', 160.00),
(63, 'স্ট্রিপ চিকেন (৮ পিছ)', 'Fry Items', 160.00),
(64, 'নান (১ পিছ)', 'Naan / Tandoori', 30.00),
(65, 'চিকেন তন্দুরি (১ পিছ)', 'Naan / Tandoori', 150.00),
(66, 'চিকেন মাসালা (১:১)', 'Naan / Tandoori', 150.00),
(67, 'চিকেন চাপ (১ পিছ)', 'Naan / Tandoori', 120.00),
(68, 'এগ চাউমিন (১:১)', 'Chowmein Items', 120.00),
(69, 'এগ চাউমিন (১:২)', 'Chowmein Items', 200.00),
(70, 'চিকেন চাউমিন (১:১)', 'Chowmein Items', 150.00),
(71, 'চিকেন চাউমিন (১:২)', 'Chowmein Items', 240.00),
(72, 'ভেজিটেবল চাউমিন (১:১)', 'Chowmein Items', 200.00),
(73, 'ভেজিটেবল চাউমিন (১:২)', 'Chowmein Items', 300.00),
(74, 'পর্ন চাউমিন (১:১)', 'Chowmein Items', 300.00),
(75, 'পর্ন চাউমিন (১:২)', 'Chowmein Items', 400.00),
(76, 'রেগুলার মিট বক্স', 'Meat Box', 200.00),
(77, 'BBQ মিট বক্স', 'Meat Box', 250.00),
(78, 'ম্যাক্সিকান মিট বক্স', 'Meat Box', 250.00),
(79, 'চিজ মিট বক্স', 'Meat Box', 300.00),
(80, 'RED SAUCE পাস্তা', 'Pasta Items', 200.00),
(81, 'WHITE SAUCE পাস্তা', 'Pasta Items', 200.00),
(82, 'OVEN BAKED পাস্তা', 'Pasta Items', 300.00),
(83, 'পেনে পাস্তা', 'Pasta Items', 250.00),
(84, 'হ্যান্ডি বিরিয়ানী (বাসমতি চাল + গরুর মাংস + সালাদ)', 'Biryani', 300.00),
(85, 'বাকেট বিরিয়ানী (বাসমতি চাল + হাসিম মাংস + সালাদ)', 'Biryani', 300.00),
(86, 'আফগানি বিরিয়ানী (টিনডা চাল + গরুর মাংস + সালাদ)', 'Biryani', 250.00),
(87, 'স্পেশাল ভুনা খিচুড়ি (টিনডা চাল + গরুর মাংস + সালাদ)', 'Biryani', 200.00),
(88, 'রাইস + ক্রিস্পি চিকেন + ভেজিটেবল', 'Set Menu', 220.00),
(89, 'রাইস + BBQ চিকেন + ভেজিটেবল', 'Set Menu', 200.00),
(90, 'রাইস + তন্দুরি চিকেন + ভেজিটেবল', 'Set Menu', 300.00);

-- Initial Stock Items Seed
INSERT INTO public.stock_items (stock_name, unit, minimum_stock) VALUES
('Cooking Oil', 'L', 10.0),
('Bread / Bun', 'pcs', 30.0),
('Rice', 'kg', 25.0),
('Chicken', 'kg', 15.0),
('Beef', 'kg', 10.0),
('Cheese', 'kg', 5.0);
    
