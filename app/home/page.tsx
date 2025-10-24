"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { HomeFeed } from "@/components/home-feed"
import { Navigation } from "@/components/navigation"

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
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
    await fetchPosts(user.id)
    setIsLoading(false)
  }

  const fetchPosts = async (userId: string) => {
    const { data: postsData, error: postsError } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })

    if (postsError) {
      console.error("Error fetching posts:", postsError)
      return
    }

    const userIds = [...new Set(postsData?.map((p) => p.user_id) || [])]
    const { data: profilesData, error: profilesError } = await supabase.from("profiles").select("*").in("id", userIds)

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError)
      return
    }

    const postsWithProfiles = postsData?.map((post) => ({
      ...post,
      profiles: profilesData?.find((p) => p.id === post.user_id) || null,
    }))

    setPosts(postsWithProfiles || [])

    const { data: userLikes } = await supabase.from("likes").select("post_id").eq("user_id", userId)
    setLikedPostIds(new Set(userLikes?.map((like) => like.post_id) || []))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-200 via-rose-200 to-pink-300">
        <p className="text-gray-800 text-xl">Загрузка...</p>
      </div>
    )
  }

  return (
    <>
      <Navigation />
      <HomeFeed initialPosts={posts} currentUserId={user?.id} initialLikedPostIds={likedPostIds} />
    </>
  )
}
