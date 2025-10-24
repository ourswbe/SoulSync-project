import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  email: string
  first_name: string
  last_name: string
  username: string
  bio: string
  avatar_url: string
  created_at: string
}

export type Post = {
  id: string
  user_id: string
  content: string
  image_url: string | null
  likes_count: number
  created_at: string
  profiles: Profile
}
