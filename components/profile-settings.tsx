"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, Home, User, SettingsIcon, Users, Save } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Profile = {
  id: string
  email: string
  first_name: string
  last_name: string
  username: string
  avatar_url: string | null
  bio: string | null
}

export function ProfileSettings({
  profile,
  userId,
  userEmail,
}: {
  profile: Profile | null
  userId: string
  userEmail: string
}) {
  const [firstName, setFirstName] = useState(profile?.first_name || "")
  const [lastName, setLastName] = useState(profile?.last_name || "")
  const [username, setUsername] = useState(profile?.username || "")
  const [bio, setBio] = useState(profile?.bio || "")
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "")
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          username: username,
          bio: bio,
          avatar_url: avatarUrl || null,
        })
        .eq("id", userId)

      if (error) throw error

      setMessage({ type: "success", text: "Profile updated successfully!" })
      router.refresh()
    } catch (error) {
      console.error("Error updating profile:", error)
      setMessage({ type: "error", text: "Failed to update profile. Please try again." })
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" })
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      setMessage({ type: "success", text: "Password changed successfully!" })
      setShowPasswordChange(false)
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      setMessage({ type: "error", text: "Failed to change password" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsSaving(true)
    try {
      // Delete user's posts
      await supabase.from("posts").delete().eq("user_id", userId)

      // Delete user's likes
      await supabase.from("likes").delete().eq("user_id", userId)

      // Delete user's profile
      await supabase.from("profiles").delete().eq("id", userId)

      // Sign out
      await supabase.auth.signOut()

      router.push("/auth/login")
    } catch (error) {
      setMessage({ type: "error", text: "Failed to delete account" })
      setIsSaving(false)
    }
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
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account and profile information</p>
        </div>

        {message && (
          <Card
            className={`p-4 mb-6 ${message.type === "success" ? "bg-green-500/10 border-green-500/50" : "bg-red-500/10 border-red-500/50"}`}
          >
            <p className={message.type === "success" ? "text-green-600" : "text-red-600"}>{message.text}</p>
          </Card>
        )}

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Profile Picture</h2>
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-2xl">
                {firstName[0] || "U"}
                {lastName[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label htmlFor="avatarUrl">Avatar URL</Label>
              <Input
                id="avatarUrl"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">Enter a URL to your profile picture</p>
            </div>
          </div>
        </Card>

        {/* Personal Information */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={userEmail} disabled className="bg-muted" />
              <p className="text-sm text-muted-foreground mt-1">Email cannot be changed</p>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="min-h-[100px]"
              />
            </div>
          </div>
        </Card>

        {/* Account Actions */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Account</h2>
          <div className="space-y-3">
            {!showPasswordChange ? (
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => setShowPasswordChange(true)}
              >
                Change Password
              </Button>
            ) : (
              <div className="space-y-3 p-4 border rounded-lg">
                <Input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={handleChangePassword} disabled={isSaving} size="sm">
                    Save Password
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasswordChange(false)
                      setNewPassword("")
                      setConfirmPassword("")
                    }}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {!showDeleteConfirm ? (
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive bg-transparent"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Account
              </Button>
            ) : (
              <div className="p-4 border border-destructive rounded-lg space-y-3">
                <p className="text-sm text-destructive font-medium">Are you sure? This action cannot be undone.</p>
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={handleDeleteAccount} disabled={isSaving} size="sm">
                    Yes, Delete My Account
                  </Button>
                  <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.push("/blog")}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  )
}
