"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Heart,
  MessageCircle,
  Search,
  Grid3x3,
  LayoutGrid,
  LogOut,
  Home,
  User,
  SettingsIcon,
  Users,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

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

type Stats = {
  totalPosts: number
  totalUsers: number
  totalLikes: number
  totalComments: number
}

export function CommunityGallery({ posts, stats }: { posts: Post[]; stats: Stats }) {
  const [viewMode, setViewMode] = useState<"grid" | "masonry">("masonry")
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const filteredPosts = posts.filter(
    (post) =>
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.profiles.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${post.profiles.first_name} ${post.profiles.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
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

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Community Gallery</h1>
          <p className="text-muted-foreground">Discover amazing content from creators around the world</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search posts, users..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "masonry" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("masonry")}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-primary mb-1">{stats.totalPosts}</p>
            <p className="text-sm text-muted-foreground">Total Posts</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-primary mb-1">{stats.totalUsers}</p>
            <p className="text-sm text-muted-foreground">Contributors</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-primary mb-1">{stats.totalLikes}</p>
            <p className="text-sm text-muted-foreground">Total Likes</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-primary mb-1">{stats.totalComments}</p>
            <p className="text-sm text-muted-foreground">Comments</p>
          </Card>
        </div>

        {/* Posts Gallery */}
        {viewMode === "masonry" ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {filteredPosts.map((post) => (
              <Card
                key={post.id}
                className="break-inside-avoid overflow-hidden group cursor-pointer hover:border-primary/50 transition-all"
              >
                {post.image_url && (
                  <div className="relative overflow-hidden">
                    <img
                      src={post.image_url || "/placeholder.svg"}
                      alt="Post content"
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="w-8 h-8 border-2 border-background">
                            <AvatarImage src={post.profiles.avatar_url || undefined} />
                            <AvatarFallback>
                              {post.profiles.first_name[0]}
                              {post.profiles.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {post.profiles.first_name} {post.profiles.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">@{post.profiles.username}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-foreground">
                          <span className="flex items-center gap-1 text-sm">
                            <Heart className="w-4 h-4" />
                            {post.likes_count}
                          </span>
                          <span className="flex items-center gap-1 text-sm">
                            <MessageCircle className="w-4 h-4" />
                            {post.comments_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="p-4">
                  <p className="text-sm leading-relaxed line-clamp-3">{post.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(post.created_at).toLocaleDateString()}</p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPosts.map((post) => (
              <Card
                key={post.id}
                className="overflow-hidden group cursor-pointer hover:border-primary/50 transition-all"
              >
                {post.image_url && (
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={post.image_url || "/placeholder.svg"}
                      alt="Post content"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="w-8 h-8 border-2 border-background">
                            <AvatarImage src={post.profiles.avatar_url || undefined} />
                            <AvatarFallback>
                              {post.profiles.first_name[0]}
                              {post.profiles.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {post.profiles.first_name} {post.profiles.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">@{post.profiles.username}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-foreground">
                          <span className="flex items-center gap-1 text-sm">
                            <Heart className="w-4 h-4" />
                            {post.likes_count}
                          </span>
                          <span className="flex items-center gap-1 text-sm">
                            <MessageCircle className="w-4 h-4" />
                            {post.comments_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="p-4">
                  <p className="text-sm leading-relaxed line-clamp-2">{post.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(post.created_at).toLocaleDateString()}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {filteredPosts.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No posts found. Try a different search term.</p>
          </Card>
        )}
      </div>
    </div>
  )
}
