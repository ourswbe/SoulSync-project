"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Lock, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    const emailParam = searchParams.get("email")
    const verified = searchParams.get("verified")

    if (!emailParam || verified !== "true") {
      router.push("/auth/forgot-password")
      return
    }

    setEmail(emailParam)
  }, [searchParams, router])

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
      // First, get the user ID from profiles
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single()

      if (profileError || !profileData) {
        throw new Error("Пользователь не найден")
      }

      // Sign in the user temporarily to update password
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: "temporary", // This will fail, but we need to get auth context
      })

      // Alternative: Use Supabase Admin API (requires service role key)
      // For now, we'll use a workaround: update the password via direct database access
      // Note: In production, this should use Supabase Admin SDK

      // Direct password update (simplified for development)
      const { error: updateError } = await supabase.rpc("update_user_password", {
        user_email: email,
        new_password: password,
      })

      if (updateError) {
        // If RPC doesn't exist, fall back to manual update
        // This requires creating a custom SQL function or using admin API
        throw new Error("Не удалось обновить пароль. Обратитесь к администратору.")
      }

      setMessage({ type: "success", text: "Пароль успешно изменён! Перенаправление на страницу входа..." })

      setTimeout(() => router.push("/auth/login"), 2000)
    } catch (error) {
      console.error("[RESET] Error:", error)
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Не удалось сбросить пароль",
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
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Новый пароль</h1>
            <p className="text-gray-700">Введите новый пароль для вашего аккаунта</p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
              <Input
                type="password"
                placeholder="Новый пароль"
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
                placeholder="Подтвердите пароль"
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
              {isLoading ? "Обновление..." : "Изменить пароль"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
