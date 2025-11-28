import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Supabase environment variables are not set")
    throw new Error("Supabase configuration is missing")
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = createClient()

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
