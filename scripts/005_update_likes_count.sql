-- Create function to update likes count
create or replace function public.update_post_likes_count()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts
    set likes_count = likes_count + 1
    where id = new.post_id;
    return new;
  elsif TG_OP = 'DELETE' then
    update public.posts
    set likes_count = likes_count - 1
    where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

-- Create trigger for likes count
drop trigger if exists on_like_change on public.likes;

create trigger on_like_change
  after insert or delete on public.likes
  for each row
  execute function public.update_post_likes_count();
