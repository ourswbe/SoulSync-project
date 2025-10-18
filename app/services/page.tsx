"use client"

import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Bell, Lock, Palette, Camera } from "lucide-react"
import { useState } from "react"

export default function ServicesPage() {
  const [profile, setProfile] = useState({
    name: "Alex Johnson",
    username: "alexjohnson",
    email: "alex@example.com",
    bio: "Creative soul sharing moments and stories. Photography enthusiast and coffee lover.",
    website: "https://alexjohnson.com",
  })

  const [notifications, setNotifications] = useState({
    likes: true,
    comments: true,
    follows: true,
    mentions: true,
    newsletter: false,
  })

  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    showEmail: false,
    allowMessages: true,
  })

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-20 pb-12 px-4 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-secondary">
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger
                value="privacy"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Lock className="w-4 h-4 mr-2" />
                Privacy
              </TabsTrigger>
              <TabsTrigger
                value="appearance"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Palette className="w-4 h-4 mr-2" />
                Appearance
              </TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="profile">
              <Card className="p-6 bg-card border-border">
                <h2 className="text-2xl font-semibold mb-6">Profile Information</h2>

                {/* Avatar Section */}
                <div className="flex items-center gap-6 mb-8 pb-8 border-b border-border">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src="/diverse-user-avatars.png" />
                    <AvatarFallback>AJ</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold mb-2">Profile Picture</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Upload a new profile picture. JPG, PNG or GIF. Max size 5MB.
                    </p>
                    <Button size="sm" variant="outline" className="bg-transparent">
                      <Camera className="w-4 h-4 mr-2" />
                      Change Photo
                    </Button>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={profile.username}
                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                        className="bg-background border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="bg-background border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      className="min-h-[100px] bg-background border-border"
                      placeholder="Tell us about yourself..."
                    />
                    <p className="text-sm text-muted-foreground">{profile.bio.length}/160 characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={profile.website}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      className="bg-background border-border"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button>Save Changes</Button>
                    <Button variant="outline" className="bg-transparent">
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Notifications Settings */}
            <TabsContent value="notifications">
              <Card className="p-6 bg-card border-border">
                <h2 className="text-2xl font-semibold mb-6">Notification Preferences</h2>
                <p className="text-muted-foreground mb-6">Choose what notifications you want to receive</p>

                <div className="space-y-6">
                  <div className="flex items-center justify-between py-4 border-b border-border">
                    <div>
                      <h3 className="font-semibold mb-1">Likes</h3>
                      <p className="text-sm text-muted-foreground">Get notified when someone likes your post</p>
                    </div>
                    <Switch
                      checked={notifications.likes}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, likes: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-border">
                    <div>
                      <h3 className="font-semibold mb-1">Comments</h3>
                      <p className="text-sm text-muted-foreground">Get notified when someone comments on your post</p>
                    </div>
                    <Switch
                      checked={notifications.comments}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, comments: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-border">
                    <div>
                      <h3 className="font-semibold mb-1">New Followers</h3>
                      <p className="text-sm text-muted-foreground">Get notified when someone follows you</p>
                    </div>
                    <Switch
                      checked={notifications.follows}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, follows: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-border">
                    <div>
                      <h3 className="font-semibold mb-1">Mentions</h3>
                      <p className="text-sm text-muted-foreground">Get notified when someone mentions you</p>
                    </div>
                    <Switch
                      checked={notifications.mentions}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, mentions: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between py-4">
                    <div>
                      <h3 className="font-semibold mb-1">Newsletter</h3>
                      <p className="text-sm text-muted-foreground">Receive our weekly newsletter with updates</p>
                    </div>
                    <Switch
                      checked={notifications.newsletter}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, newsletter: checked })}
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button>Save Preferences</Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Privacy Settings */}
            <TabsContent value="privacy">
              <Card className="p-6 bg-card border-border">
                <h2 className="text-2xl font-semibold mb-6">Privacy & Security</h2>
                <p className="text-muted-foreground mb-6">Control who can see your content and contact you</p>

                <div className="space-y-6">
                  <div className="flex items-center justify-between py-4 border-b border-border">
                    <div>
                      <h3 className="font-semibold mb-1">Public Profile</h3>
                      <p className="text-sm text-muted-foreground">Make your profile visible to everyone</p>
                    </div>
                    <Switch
                      checked={privacy.publicProfile}
                      onCheckedChange={(checked) => setPrivacy({ ...privacy, publicProfile: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-border">
                    <div>
                      <h3 className="font-semibold mb-1">Show Email</h3>
                      <p className="text-sm text-muted-foreground">Display your email address on your profile</p>
                    </div>
                    <Switch
                      checked={privacy.showEmail}
                      onCheckedChange={(checked) => setPrivacy({ ...privacy, showEmail: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-border">
                    <div>
                      <h3 className="font-semibold mb-1">Allow Messages</h3>
                      <p className="text-sm text-muted-foreground">Let other users send you direct messages</p>
                    </div>
                    <Switch
                      checked={privacy.allowMessages}
                      onCheckedChange={(checked) => setPrivacy({ ...privacy, allowMessages: checked })}
                    />
                  </div>

                  <div className="pt-4 space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Change Password</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Update your password to keep your account secure
                      </p>
                      <Button variant="outline" className="bg-transparent">
                        Update Password
                      </Button>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <h3 className="font-semibold mb-2 text-destructive">Danger Zone</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Permanently delete your account and all associated data
                      </p>
                      <Button variant="destructive">Delete Account</Button>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button>Save Settings</Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Appearance Settings */}
            <TabsContent value="appearance">
              <Card className="p-6 bg-card border-border">
                <h2 className="text-2xl font-semibold mb-6">Appearance</h2>
                <p className="text-muted-foreground mb-6">Customize how SoulSync looks for you</p>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Theme</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <button className="p-4 rounded-lg border-2 border-primary bg-card hover:bg-secondary transition-colors">
                        <div className="w-full h-20 rounded bg-gradient-to-br from-background to-secondary mb-3" />
                        <p className="font-medium">Dark</p>
                        <p className="text-xs text-muted-foreground">Current</p>
                      </button>
                      <button className="p-4 rounded-lg border border-border bg-card hover:bg-secondary transition-colors">
                        <div className="w-full h-20 rounded bg-gradient-to-br from-white to-gray-100 mb-3" />
                        <p className="font-medium">Light</p>
                        <p className="text-xs text-muted-foreground">Coming soon</p>
                      </button>
                      <button className="p-4 rounded-lg border border-border bg-card hover:bg-secondary transition-colors">
                        <div className="w-full h-20 rounded bg-gradient-to-br from-background via-secondary to-background mb-3" />
                        <p className="font-medium">Auto</p>
                        <p className="text-xs text-muted-foreground">Coming soon</p>
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h3 className="font-semibold mb-4">Display</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Compact Mode</p>
                          <p className="text-sm text-muted-foreground">Show more content on screen</p>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Animations</p>
                          <p className="text-sm text-muted-foreground">Enable smooth transitions and effects</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
