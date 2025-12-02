"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { User, Mail, Lock } from "lucide-react"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export default function SignUpPage() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      console.log("[v0] Supabase URL:", supabaseUrl)
      console.log("[v0] Supabase Key exists:", !!supabaseAnonKey)

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase configuration is missing. Please check environment variables.")
      }

      const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      })

      if (!email || !password || !firstName || !lastName) {
        throw new Error("Please fill in all fields")
      }

      localStorage.setItem("verifyEmail", email)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            username: email.split("@")[0],
          },
          emailRedirectTo: `${window.location.origin}/home`,
        },
      })

      console.log("[v0] Sign up response:", { data, error })

      if (error) throw error

      if (data.user && !data.user.identities?.length) {
        throw new Error("This email is already registered")
      }

      if (data.user) {
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`)
      }
    } catch (error: unknown) {
      console.error("[v0] Sign up error:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-300 via-rose-300 to-pink-200">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-400/30 to-pink-400/30 blur-3xl animate-pulse" />
          <div className="absolute inset-[10%] rounded-full bg-gradient-to-br from-rose-300/40 to-pink-300/40 blur-2xl animate-pulse delay-75" />
          <div className="absolute inset-[20%] rounded-full bg-gradient-to-br from-rose-200/50 to-pink-200/50 blur-xl animate-pulse delay-150" />
        </div>
      </div>

      <header className="absolute top-0 left-0 right-0 flex items-center justify-between p-6 z-10">
        <Link href="/" className="text-2xl font-bold text-gray-800">
          SoulSync
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/" className="text-gray-700 hover:text-gray-900 transition-colors">
            Home
          </Link>
          <Link href="/blog" className="text-gray-700 hover:text-gray-900 transition-colors">
            Blog
          </Link>
          <Link href="/settings" className="text-gray-700 hover:text-gray-900 transition-colors">
            Services
          </Link>
          <Link href="/about" className="text-gray-700 hover:text-gray-900 transition-colors">
            About
          </Link>
          <Button
            asChild
            variant="outline"
            className="bg-white/80 backdrop-blur-sm border-gray-300 text-gray-800 hover:bg-white"
          >
            <Link href="/auth/login">Sign In</Link>
          </Button>
          <Button className="bg-gray-800 text-white hover:bg-gray-900">Sign Up</Button>
        </nav>
      </header>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Sign Up</h1>
            <p className="text-gray-700">
              Have an account?{" "}
              <Link href="/auth/login" className="text-gray-900 font-semibold underline">
                Login
              </Link>
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                <Input
                  type="text"
                  placeholder="Firstname"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="pl-12 h-14 bg-white/60 backdrop-blur-sm border-white/80 text-gray-800 placeholder:text-gray-600 rounded-full"
                />
              </div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                <Input
                  type="text"
                  placeholder="Lastname"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="pl-12 h-14 bg-white/60 backdrop-blur-sm border-white/80 text-gray-800 placeholder:text-gray-600 rounded-full"
                />
              </div>
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-12 h-14 bg-white/60 backdrop-blur-sm border-white/80 text-gray-800 placeholder:text-gray-600 rounded-full"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-12 h-14 bg-white/60 backdrop-blur-sm border-white/80 text-gray-800 placeholder:text-gray-600 rounded-full"
              />
            </div>

            {error && <p className="text-sm text-red-600 text-center bg-red-50 p-2 rounded-lg">{error}</p>}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-white/80 hover:bg-white text-gray-800 font-semibold rounded-full text-lg"
            >
              {isLoading ? "Creating Account..." : "Register"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
