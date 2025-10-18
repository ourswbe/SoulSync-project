"use client"

import type React from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { User, Lock } from "lucide-react"

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false) // Add remember me state
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const isEmail = identifier.includes("@")

      if (isEmail) {
        const { error } = await supabase.auth.signInWithPassword({
          email: identifier,
          password,
          options: {
            persistSession: rememberMe,
          },
        })
        if (error) throw error
      } else {
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("id, email")
          .eq("username", identifier)

        if (profileError || !profiles || profiles.length === 0) {
          throw new Error("Username not found")
        }

        const profile = profiles[0]

        const { error } = await supabase.auth.signInWithPassword({
          email: profile.email,
          password,
          options: {
            persistSession: rememberMe,
          },
        })
        if (error) throw error
      }

      router.push("/blog")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Invalid username/email or password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Pink gradient background with hearts */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-300 via-rose-300 to-pink-200">
        {/* Animated heart shapes */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-400/30 to-pink-400/30 blur-3xl animate-pulse" />
          <div className="absolute inset-[10%] rounded-full bg-gradient-to-br from-rose-300/40 to-pink-300/40 blur-2xl animate-pulse delay-75" />
          <div className="absolute inset-[20%] rounded-full bg-gradient-to-br from-rose-200/50 to-pink-200/50 blur-xl animate-pulse delay-150" />
        </div>
      </div>

      {/* Header */}
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
          <Link href="/services" className="text-gray-700 hover:text-gray-900 transition-colors">
            Services
          </Link>
          <Link href="/about" className="text-gray-700 hover:text-gray-900 transition-colors">
            About
          </Link>
          <Button
            variant="outline"
            className="bg-white/80 backdrop-blur-sm border-gray-300 text-gray-800 hover:bg-white"
          >
            Sign In
          </Button>
          <Button asChild className="bg-gray-800 text-white hover:bg-gray-900">
            <Link href="/auth/sign-up">Sign Up</Link>
          </Button>
        </nav>
      </header>

      {/* Login Form */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Login</h1>
            <p className="text-gray-700">
              Don't have an account?{" "}
              <Link href="/auth/sign-up" className="text-gray-900 font-semibold underline">
                Sign Up
              </Link>
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
              <Input
                type="text"
                placeholder="Username or Email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
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
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember Me
              </label>
              <Link href="/auth/forgot-password" className="text-gray-800 hover:text-gray-900 font-medium">
                Forgot password?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
