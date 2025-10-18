"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { UserBlog } from "@/components/user-blog"

export default function BlogPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkUserAndFetchData()
  }, [])

  const checkUserAndFetchData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    setUser(user)

    // Fetch user profile
    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    setProfile(profileData)

    // Fetch user's posts only
    const { data: postsData } = await supabase
      .from("posts")
      .select(
        `
        *,
        profiles:user_id (
          id,
          first_name,
          last_name,
          username,
          avatar_url
        )
      `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    setPosts(postsData || [])

    // Fetch user's likes
    const { data: userLikes } = await supabase.from("likes").select("post_id").eq("user_id", user.id)
    setLikedPostIds(new Set(userLikes?.map((like) => like.post_id) || []))

    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-200 via-rose-200 to-pink-300">
        <p className="text-gray-800 text-xl">Loading...</p>
      </div>
    )
  }

  return <UserBlog profile={profile} initialPosts={posts} currentUserId={user?.id} initialLikedPostIds={likedPostIds} />
}
