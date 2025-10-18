"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, LogOut, Home, User, SettingsIcon, Users } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
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

    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    setProfile(profileData)

    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    setPosts(postsData || [])
    setIsLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-200 via-rose-200 to-pink-300">
        <p className="text-gray-800 text-xl">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-rose-200 to-pink-300">
      {/* Navigation */}
      <nav className="bg-white/40 backdrop-blur-xl border-b border-white/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/home" className="text-2xl font-bold text-gray-800">
            SoulSync
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/home" className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link href="/blog" className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
              <User className="w-5 h-5" />
              <span className="hidden sm:inline">Blog</span>
            </Link>
            <Link href="/settings" className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
              <SettingsIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
            <Link href="/about" className="flex items-center gap-2 text-gray-800 hover:text-gray-900 font-medium">
              <Users className="w-5 h-5" />
              <span className="hidden sm:inline">About</span>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-700 hover:text-gray-900">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Header */}
        <Card className="p-8 mb-8 bg-white/40 backdrop-blur-xl border-white/50">
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {profile?.first_name?.[0] || "U"}
                {profile?.last_name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-1">
                {profile?.first_name} {profile?.last_name}
              </h1>
              <p className="text-gray-700 mb-2">@{profile?.username}</p>
              {profile?.bio && <p className="text-gray-700">{profile.bio}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/50">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{posts.length}</p>
              <p className="text-sm text-gray-700">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">
                {posts.reduce((sum, post) => sum + (post.likes_count || 0), 0)}
              </p>
              <p className="text-sm text-gray-700">Likes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">
                {posts.reduce((sum, post) => sum + (post.comments_count || 0), 0)}
              </p>
              <p className="text-sm text-gray-700">Comments</p>
            </div>
          </div>
        </Card>

        {/* User's Posts */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4">My Posts</h2>
        <div className="space-y-6">
          {posts.map((post) => (
            <Card key={post.id} className="p-6 bg-white/40 backdrop-blur-xl border-white/50">
              <p className="text-gray-800 mb-4 leading-relaxed">{post.content}</p>

              {post.image_url && (
                <img
                  src={post.image_url || "/placeholder.svg"}
                  alt="Post"
                  className="w-full rounded-lg mb-4 max-h-96 object-cover"
                />
              )}

              <div className="flex items-center gap-6 text-gray-700 text-sm">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  <span>{post.likes_count || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>{post.comments_count || 0}</span>
                </div>
                <span className="ml-auto text-gray-600">{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
            </Card>
          ))}

          {posts.length === 0 && (
            <Card className="p-12 text-center bg-white/40 backdrop-blur-xl border-white/50">
              <p className="text-gray-700">You haven't posted anything yet.</p>
              <Button asChild className="mt-4 bg-gray-800 text-white hover:bg-gray-900">
                <Link href="/home">Create Your First Post</Link>
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
