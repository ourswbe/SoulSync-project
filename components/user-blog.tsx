"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Heart,
  MessageCircle,
  Share2,
  ImageIcon,
  LogOut,
  Home,
  User,
  SettingsIcon,
  Users,
  Trash2,
  X,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Profile = {
  id: string
  first_name: string
  last_name: string
  username: string
  avatar_url: string | null
  bio: string | null
}

type Post = {
  id: string
  content: string
  image_url: string | null
  likes_count: number
  comments_count: number
  created_at: string
  profiles: {
    id: string
    first_name: string
    last_name: string
    username: string
    avatar_url: string | null
  }
}

export function UserBlog({
  profile,
  initialPosts,
  currentUserId,
  initialLikedPostIds,
}: {
  profile: Profile | null
  initialPosts: Post[]
  currentUserId: string
  initialLikedPostIds: Set<string>
}) {
  const [posts, setPosts] = useState(initialPosts)
  const [newPost, setNewPost] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [showImageInput, setShowImageInput] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [likedPosts, setLikedPosts] = useState(initialLikedPostIds)
  const router = useRouter()

  const handleCreatePost = async () => {
    if (!newPost.trim()) return

    setIsPosting(true)

    try {
      const { data, error } = await supabase
        .from("posts")
        .insert({
          content: newPost,
          user_id: currentUserId,
          image_url: imageUrl || null,
        })
        .select()
        .single()

      if (error) throw error

      const newPostWithProfile = {
        ...data,
        profiles: {
          id: profile!.id,
          first_name: profile!.first_name,
          last_name: profile!.last_name,
          username: profile!.username,
          avatar_url: profile!.avatar_url,
        },
      }

      setPosts([newPostWithProfile, ...posts])
      setNewPost("")
      setImageUrl("")
      setShowImageInput(false)
    } catch (error) {
      console.error("Error creating post:", error)
    } finally {
      setIsPosting(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId)

      if (error) throw error

      setPosts((prev) => prev.filter((post) => post.id !== postId))
    } catch (error) {
      console.error("Error deleting post:", error)
    }
  }

  const handleLike = async (postId: string) => {
    const isLiked = likedPosts.has(postId)

    try {
      if (isLiked) {
        await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", currentUserId)

        setLikedPosts((prev) => {
          const newSet = new Set(prev)
          newSet.delete(postId)
          return newSet
        })

        setPosts((prev) =>
          prev.map((post) => (post.id === postId ? { ...post, likes_count: post.likes_count - 1 } : post)),
        )
      } else {
        await supabase.from("likes").insert({
          post_id: postId,
          user_id: currentUserId,
        })

        setLikedPosts((prev) => new Set(prev).add(postId))

        setPosts((prev) =>
          prev.map((post) => (post.id === postId ? { ...post, likes_count: post.likes_count + 1 } : post)),
        )
      }
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/home" className="text-2xl font-bold">
            SoulSync<span className="text-primary">.</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/home"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link href="/blog" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
              <User className="w-5 h-5" />
              <span className="hidden sm:inline">Blog</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <SettingsIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
            <Link
              href="/about"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Users className="w-5 h-5" />
              <span className="hidden sm:inline">About</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Profile Header */}
        <Card className="p-6 mb-6">
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {profile?.first_name[0]}
                {profile?.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {profile?.first_name} {profile?.last_name}
              </h1>
              <p className="text-muted-foreground">@{profile?.username}</p>
              {profile?.bio && <p className="mt-2 text-foreground">{profile.bio}</p>}
              <div className="flex gap-4 mt-3 text-sm">
                <span>
                  <strong>{posts.length}</strong> <span className="text-muted-foreground">Posts</span>
                </span>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href="/settings">Edit Profile</Link>
            </Button>
          </div>
        </Card>

        {/* Create Post */}
        <Card className="p-6 mb-6">
          <div className="flex gap-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback>
                {profile?.first_name[0]}
                {profile?.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Share your thoughts..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-[100px] resize-none border-0 focus-visible:ring-0 p-0 text-base"
              />

              {showImageInput && (
                <div className="mt-3 flex items-center gap-2">
                  <Input
                    placeholder="Enter image URL..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowImageInput(false)
                      setImageUrl("")
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {imageUrl && (
                <div className="mt-3 relative">
                  <img
                    src={imageUrl || "/placeholder.svg"}
                    alt="Preview"
                    className="rounded-lg max-h-48 object-cover"
                  />
                </div>
              )}

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setShowImageInput(!showImageInput)}
                >
                  <ImageIcon className="w-5 h-5 mr-2" />
                  {showImageInput ? "Hide" : "Add"} Photo
                </Button>
                <Button onClick={handleCreatePost} disabled={!newPost.trim() || isPosting} size="sm">
                  {isPosting ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* User's Posts */}
        <div className="space-y-6">
          {posts.map((post) => (
            <Card key={post.id} className="p-6">
              <div className="flex gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={post.profiles.avatar_url || undefined} />
                  <AvatarFallback>
                    {post.profiles.first_name[0]}
                    {post.profiles.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {post.profiles.first_name} {post.profiles.last_name}
                      </span>
                      <span className="text-sm text-muted-foreground">@{post.profiles.username}</span>
                      <span className="text-sm text-muted-foreground">·</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePost(post.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-foreground mb-4 leading-relaxed">{post.content}</p>

                  {post.image_url && (
                    <img
                      src={post.image_url || "/placeholder.svg"}
                      alt="Post image"
                      className="rounded-lg w-full mb-4 max-h-96 object-cover"
                    />
                  )}

                  <div className="flex items-center gap-6 text-muted-foreground">
                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-2 hover:text-red-500 transition-colors group"
                    >
                      <Heart
                        className={`w-5 h-5 ${likedPosts.has(post.id) ? "fill-red-500 text-red-500" : "group-hover:fill-red-500"}`}
                      />
                      <span className="text-sm">{post.likes_count || 0}</span>
                    </button>
                    <button className="flex items-center gap-2 opacity-50 cursor-not-allowed">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm">{post.comments_count || 0}</span>
                    </button>
                    <button className="flex items-center gap-2 opacity-50 cursor-not-allowed">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {posts.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">You haven't posted anything yet. Share your first post above!</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
