"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, ImageIcon, LogOut, Home, User, SettingsIcon, Users, X, Send } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

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

type Comment = {
  id: string
  content: string
  created_at: string
  profiles: {
    id: string
    first_name: string
    last_name: string
    username: string
    avatar_url: string | null
  }
}

export function HomeFeed({
  initialPosts,
  currentUserId,
  initialLikedPostIds,
}: {
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
  const [showComments, setShowComments] = useState<Record<string, boolean>>({})
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [newComment, setNewComment] = useState<Record<string, string>>({})
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({})
  const router = useRouter()

  const handleCreatePost = async () => {
    if (!newPost.trim()) return

    setIsPosting(true)

    try {
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", currentUserId).single()

      const { data, error } = await supabase
        .from("posts")
        .insert({
          content: newPost,
          user_id: currentUserId,
          image_url: imageUrl || null,
        })
        .select("*")
        .single()

      if (error) throw error

      const newPostWithProfile = {
        ...data,
        profiles: profile,
      }

      setPosts([newPostWithProfile, ...posts])
      setNewPost("")
      setImageUrl("")
      setShowImageInput(false)
    } catch (error) {
      console.error("Error creating post:", error)
      alert("Error creating post. Please try again.")
    } finally {
      setIsPosting(false)
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

  const loadComments = async (postId: string) => {
    if (comments[postId]) {
      setShowComments((prev) => ({ ...prev, [postId]: !prev[postId] }))
      return
    }

    setLoadingComments((prev) => ({ ...prev, [postId]: true }))

    try {
      const { data, error } = await supabase
        .from("comments")
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
        .eq("post_id", postId)
        .order("created_at", { ascending: false })

      if (error) throw error

      setComments((prev) => ({ ...prev, [postId]: data || [] }))
      setShowComments((prev) => ({ ...prev, [postId]: true }))
    } catch (error) {
      console.error("Error loading comments:", error)
    } finally {
      setLoadingComments((prev) => ({ ...prev, [postId]: false }))
    }
  }

  const handleAddComment = async (postId: string) => {
    const commentText = newComment[postId]?.trim()
    if (!commentText) return

    try {
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", currentUserId).single()

      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: currentUserId,
          content: commentText,
        })
        .select("*")
        .single()

      if (error) throw error

      const newCommentWithProfile = {
        ...data,
        profiles: profile,
      }

      setComments((prev) => ({
        ...prev,
        [postId]: [newCommentWithProfile, ...(prev[postId] || [])],
      }))

      setNewComment((prev) => ({ ...prev, [postId]: "" }))

      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, comments_count: post.comments_count + 1 } : post)),
      )
    } catch (error) {
      console.error("Error adding comment:", error)
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
            <Link href="/home" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link
              href="/blog"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
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
        {/* Create Post */}
        <Card className="p-6 mb-6">
          <div className="flex gap-4">
            <Avatar className="w-12 h-12">
              <AvatarFallback>You</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="What's on your mind?"
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

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.map((post) => (
            <Card key={post.id} className="p-6">
              <div className="flex gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={post.profiles?.avatar_url || undefined} />
                  <AvatarFallback>
                    {post.profiles?.first_name?.[0] || "U"}
                    {post.profiles?.last_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">
                      {post.profiles?.first_name} {post.profiles?.last_name}
                    </span>
                    <span className="text-sm text-muted-foreground">@{post.profiles?.username}</span>
                    <span className="text-sm text-muted-foreground">·</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
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
                    <button
                      onClick={() => loadComments(post.id)}
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm">{post.comments_count || 0}</span>
                    </button>
                  </div>

                  {showComments[post.id] && (
                    <div className="mt-4 pt-4 border-t border-border space-y-4">
                      {/* Add comment input */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Write a comment..."
                          value={newComment[post.id] || ""}
                          onChange={(e) => setNewComment((prev) => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              handleAddComment(post.id)
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddComment(post.id)}
                          disabled={!newComment[post.id]?.trim()}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Comments list */}
                      {loadingComments[post.id] ? (
                        <p className="text-sm text-muted-foreground text-center">Loading comments...</p>
                      ) : (
                        <div className="space-y-3">
                          {comments[post.id]?.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {comment.profiles?.first_name?.[0]}
                                  {comment.profiles?.last_name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 bg-muted/50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-semibold">
                                    {comment.profiles?.first_name} {comment.profiles?.last_name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(comment.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                          {comments[post.id]?.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center">No comments yet</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {posts.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
