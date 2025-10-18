-- Create posts table
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  image_url text,
  likes_count integer default 0,
  comments_count integer default 0,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.posts enable row level security;

-- RLS Policies for posts
create policy "Anyone can view posts"
  on public.posts for select
  using (true);

create policy "Users can insert their own posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own posts"
  on public.posts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own posts"
  on public.posts for delete
  using (auth.uid() = user_id);
