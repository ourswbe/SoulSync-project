"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Mail } from "lucide-react"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export default function VerifyEmailPage() {
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase configuration is missing")
      }

      const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      })

      if (!code) {
        throw new Error("Please enter the verification code")
      }

      // Get email from URL params or localStorage
      const email = new URLSearchParams(window.location.search).get("email") || localStorage.getItem("verifyEmail")

      if (!email) {
        throw new Error("Email not found. Please sign up again.")
      }

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "signup",
      })

      if (error) throw error

      if (data.user) {
        localStorage.removeItem("verifyEmail")
        router.push("/home")
      }
    } catch (error: unknown) {
      console.error("[v0] Verification error:", error)
      setError(error instanceof Error ? error.message : "Invalid verification code")
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
          <Button asChild className="bg-gray-800 text-white hover:bg-gray-900">
            <Link href="/auth/sign-up">Sign Up</Link>
          </Button>
        </nav>
      </header>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/60 rounded-full mb-4">
              <Mail className="w-8 h-8 text-gray-800" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Подтверждение e-mail</h1>
            <p className="text-gray-700">
              Мы отправили код на вашу почту. Введите его ниже для подтверждения аккаунта.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-800 mb-2">
                Код из письма
              </label>
              <Input
                id="code"
                type="text"
                placeholder="Введите код"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                required
                className="h-14 bg-white/60 backdrop-blur-sm border-white/80 text-gray-800 text-center text-2xl font-semibold placeholder:text-gray-500 rounded-2xl tracking-widest"
              />
            </div>

            {error && <p className="text-sm text-red-600 text-center bg-red-50 p-3 rounded-lg">{error}</p>}

            <Button
              type="submit"
              disabled={isLoading || code.length < 4}
              className="w-full h-14 bg-white/80 hover:bg-white text-gray-800 font-semibold rounded-full text-lg disabled:opacity-50"
            >
              {isLoading ? "Проверка..." : "Продолжить"}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-700">
                Не получили код?{" "}
                <button type="button" className="text-gray-900 font-semibold underline hover:text-gray-800">
                  Отправить повторно
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
