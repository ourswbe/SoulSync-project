"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Lock, CheckCircle } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash
      console.log("[v0] Full URL:", window.location.href)
      console.log("[v0] Hash:", hash)

      if (hash && hash.includes("access_token")) {
        try {
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          )

          const hashParams = new URLSearchParams(hash.substring(1))
          const accessToken = hashParams.get("access_token")
          const refreshToken = hashParams.get("refresh_token")

          console.log("[v0] Access token exists:", !!accessToken)
          console.log("[v0] Refresh token exists:", !!refreshToken)

          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            if (error) {
              console.error("[v0] Session error:", error)
              setMessage({ type: "error", text: "Неверная ссылка или она истекла. Запросите новую." })
            } else {
              console.log("[v0] Session set successfully")
              setMessage({ type: "success", text: "Сессия установлена. Введите новый пароль." })
            }
          }
        } catch (error) {
          console.error("[v0] Error setting session:", error)
          setMessage({ type: "error", text: "Ошибка при обработке ссылки" })
        }
      }
    }

    handleHashChange()
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Пароли не совпадают" })
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setMessage({ type: "error", text: "Пароль должен содержать минимум 6 символов" })
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      setMessage({ type: "success", text: "Пароль успешно изменён! Перенаправление на страницу входа..." })

      await supabase.auth.signOut()

      setTimeout(() => router.push("/auth/login"), 2000)
    } catch (error) {
      console.error("[v0] Error:", error)
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Не удалось сбросить пароль. Попробуйте запросить новую ссылку.",
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
              disabled={isLoading}
              className="w-full h-14 bg-white/80 hover:bg-white text-gray-800 font-semibold rounded-full text-lg disabled:opacity-50"
            >
              {isLoading ? "Обновление..." : "Обновить пароль"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
