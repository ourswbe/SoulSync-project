"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Lock, CheckCircle } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [hasValidSession, setHasValidSession] = useState(false)

  useEffect(() => {
    const verifyAndSetSession = async () => {
      const supabase = createClient()

      const code = searchParams.get("code")
      const type = searchParams.get("type")

      console.log("[v0] Reset password - code:", code, "type:", type)

      if (code && type === "recovery") {
        try {
          // Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            console.error("[v0] Error exchanging code:", error)
            setMessage({
              type: "error",
              text: "Invalid or expired reset link. Please request a new one.",
            })
            setTimeout(() => router.push("/auth/forgot-password"), 3000)
            return
          }

          if (data.session) {
            console.log("[v0] Session established successfully")
            setHasValidSession(true)
          }
        } catch (err) {
          console.error("[v0] Exception exchanging code:", err)
          setMessage({
            type: "error",
            text: "Failed to verify reset link. Please try again.",
          })
        }
      } else {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          console.log("[v0] Found existing session")
          setHasValidSession(true)
        } else {
          setMessage({
            type: "error",
            text: "Invalid or expired reset link. Please request a new one.",
          })
          setTimeout(() => router.push("/auth/forgot-password"), 3000)
        }
      }
    }

    verifyAndSetSession()
  }, [router, searchParams])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!hasValidSession) {
      setMessage({ type: "error", text: "No valid session. Please use the link from your email." })
      return
    }

    setIsLoading(true)
    setMessage(null)

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" })
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" })
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })

      if (error) throw error

      setMessage({ type: "success", text: "Password updated successfully! Redirecting to login..." })

      await supabase.auth.signOut()
      setTimeout(() => router.push("/auth/login"), 2000)
    } catch (error) {
      console.error("[v0] Error updating password:", error)
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to reset password",
      })
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
      </header>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Reset Password</h1>
            <p className="text-gray-700">Enter your new password</p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
              <Input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-12 h-14 bg-white/60 backdrop-blur-sm border-white/80 text-gray-800 placeholder:text-gray-600 rounded-full"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
              <Input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="pl-12 h-14 bg-white/60 backdrop-blur-sm border-white/80 text-gray-800 placeholder:text-gray-600 rounded-full"
              />
            </div>

            {message && (
              <p
                className={`text-sm text-center p-3 rounded-lg flex items-center justify-center gap-2 ${
                  message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {message.type === "success" && <CheckCircle className="w-4 h-4" />}
                {message.text}
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoading || !hasValidSession}
              className="w-full h-14 bg-white/80 hover:bg-white text-gray-800 font-semibold rounded-full text-lg disabled:opacity-50"
            >
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
