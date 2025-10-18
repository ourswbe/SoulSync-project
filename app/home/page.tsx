import { redirect } from "next/navigation"
import { HomeFeed } from "@/components/home-feed"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export default async function HomePage() {
  const cookieStore = await cookies()

  const supabaseServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabaseServer.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: posts } = await supabaseServer
    .from("posts")
    .select(`
      *,
      profiles:user_id (
        id,
        first_name,
        last_name,
        username,
        avatar_url
      )
    `)
    .order("created_at", { ascending: false })

  const { data: likes } = await supabaseServer.from("likes").select("post_id").eq("user_id", user.id)

  const likedPostIds = new Set(likes?.map((like) => like.post_id) || [])

  return <HomeFeed initialPosts={posts || []} currentUserId={user.id} initialLikedPostIds={likedPostIds} />
}
