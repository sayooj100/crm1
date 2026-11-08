-- Supabase Database Schema for CRM + Billing + Accounting System
-- Paste this into the Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop existing tables/triggers if any to start fresh
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.ledger cascade;
drop table if exists public.bills cascade;
drop table if exists public.submissions cascade;
drop table if exists public.services cascade;
drop table if exists public.users cascade;
drop table if exists public.employees cascade;

-- 1. Users (Customers) Table
create table public.users (
    id uuid primary key default gen_random_uuid(),
    company_name text,
    owner_name text not null,
    sector text,
    phone text,
    email text,
    remark text,
    created_at timestamptz default now() not null
);

-- 2. Services Table
create table public.services (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    active boolean default true not null,
    questions jsonb default '[]'::jsonb not null, -- Array of question objects: {id, label, type, options[], required}
    created_at timestamptz default now() not null
);

-- 3. Submissions Table
create table public.submissions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    service_id uuid not null references public.services(id) on delete restrict,
    answers jsonb default '{}'::jsonb not null, -- Key-value pairs keyed by question id
    status text not null default 'pending' check (status in ('pending', 'processing', 'completed')),
    remark text,
    govt_expense numeric(15, 2) default 0.00 not null,
    service_charge numeric(15, 2) default 0.00 not null,
    next_due_date date,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    status_history jsonb default '[]'::jsonb not null, -- Array of {status, date, note}
    attachments jsonb default '[]'::jsonb not null -- Array of {key, filename, uploaded_by, uploaded_at}
);

-- 4. Bills Table
create table public.bills (
    id uuid primary key default gen_random_uuid(),
    submission_id uuid not null references public.submissions(id) on delete cascade,
    govt_fee numeric(15, 2) default 0.00 not null,
    service_charge numeric(15, 2) default 0.00 not null,
    extra_fee numeric(15, 2) default 0.00 not null,
    remarks text,
    total numeric(15, 2) default 0.00 not null,
    created_at timestamptz default now() not null
);

-- 5. Ledger Table
create table public.ledger (
    id uuid primary key default gen_random_uuid(),
    type text not null check (type in ('income', 'expense')),
    amount numeric(15, 2) not null,
    date date default current_date not null,
    source text not null check (source in ('auto', 'manual')),
    linked_submission_id uuid references public.submissions(id) on delete set null,
    remark text,
    created_at timestamptz default now() not null
);

-- 6. Employees Table
create table public.employees (
    id uuid primary key references auth.users(id) on delete cascade,
    name text not null,
    email text not null unique,
    created_at timestamptz default now() not null
);

-- Enable Row Level Security (RLS) on all tables
alter table public.users enable row level security;
alter table public.services enable row level security;
alter table public.submissions enable row level security;
alter table public.bills enable row level security;
alter table public.ledger enable row level security;
alter table public.employees enable row level security;

-- Create simple RLS Policies requiring authentication for any access
create policy "Allow authenticated users full access on users" on public.users
  for all to authenticated using (true) with check (true);

create policy "Allow authenticated users full access on services" on public.services
  for all to authenticated using (true) with check (true);

create policy "Allow authenticated users full access on submissions" on public.submissions
  for all to authenticated using (true) with check (true);

create policy "Allow authenticated users full access on bills" on public.bills
  for all to authenticated using (true) with check (true);

create policy "Allow authenticated users full access on ledger" on public.ledger
  for all to authenticated using (true) with check (true);

create policy "Allow authenticated users full access on employees" on public.employees
  for all to authenticated using (true) with check (true);

-- Trigger to auto-create public.employees entry when a new user registers in auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.employees (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Seed Services
insert into public.services (name, description, active, questions) values
('PAN Card', 'Permanent Account Number application for individuals and businesses.', true, '[
  {"id": "full_name", "label": "Full Name as per Aadhaar", "type": "text", "required": true},
  {"id": "date_of_birth", "label": "Date of Birth", "type": "date", "required": true},
  {"id": "father_name", "label": "Father''s Name", "type": "text", "required": true},
  {"id": "aadhaar_number", "label": "Aadhaar Number", "type": "number", "required": true},
  {"id": "gender", "label": "Gender", "type": "dropdown", "options": ["Male", "Female", "Transgender"], "required": true}
]'::jsonb),

('Trademark Registration', 'Register your brand name or logo to protect your intellectual property.', true, '[
  {"id": "brand_name", "label": "Proposed Brand Name", "type": "text", "required": true},
  {"id": "logo_description", "label": "Logo Description (if applicable)", "type": "textarea", "required": false},
  {"id": "class_category", "label": "TM Class (e.g. 9, 35, 42)", "type": "number", "required": true},
  {"id": "applicant_type", "label": "Applicant Type", "type": "dropdown", "options": ["Individual", "Proprietorship", "Partnership", "Private Limited"], "required": true}
]'::jsonb),

('Company Registration', 'Incorporate a new Private Limited Company or LLP in India.', true, '[
  {"id": "proposed_name_1", "label": "Proposed Company Name (Option 1)", "type": "text", "required": true},
  {"id": "proposed_name_2", "label": "Proposed Company Name (Option 2)", "type": "text", "required": false},
  {"id": "capital_amount", "label": "Authorized Share Capital (INR)", "type": "number", "required": true},
  {"id": "business_activity", "label": "Main Business Activity Description", "type": "textarea", "required": true},
  {"id": "number_of_directors", "label": "Number of Directors", "type": "number", "required": true}
]'::jsonb);

-- Seed Customers (public.users)
insert into public.users (company_name, owner_name, sector, phone, email, remark) values
('Acme Technologies Pvt Ltd', 'John Doe', 'Technology', '+919876543210', 'john@acme.com', 'Primary contact for tech services.'),
('Sharma Sweets & Bakers', 'Rajesh Sharma', 'Food & Beverage', '+919876543211', 'rajesh@sharmasweets.com', 'Prefers phone communication.'),
('Global Logistics Corp', 'Sarah Jenkins', 'Logistics', '+919876543212', 'sarah.j@globallogistics.in', 'Invoicing monthly.');
