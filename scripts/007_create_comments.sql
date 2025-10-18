-- Create comments table
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.comments enable row level security;

-- RLS Policies for comments
create policy "Anyone can view comments"
  on public.comments for select
  using (true);

create policy "Users can insert their own comments"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

-- Create function to update comments count
create or replace function update_comments_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts
    set comments_count = comments_count + 1
    where id = NEW.post_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update public.posts
    set comments_count = comments_count - 1
    where id = OLD.post_id;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql;

-- Create trigger for comments count
drop trigger if exists update_comments_count_trigger on public.comments;
create trigger update_comments_count_trigger
  after insert or delete on public.comments
  for each row
  execute function update_comments_count();
