"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Mail, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("email")
        .eq("email", email)
        .single()

      if (userError || !userData) {
        throw new Error("Пользователь с таким email не найден")
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString()

      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + 10)

      const { error: insertError } = await supabase.from("password_reset_codes").insert({
        email,
        code,
        expires_at: expiresAt.toISOString(),
        used: false,
      })

      if (insertError) throw insertError

      const { error: emailError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          data: {
            reset_code: code,
          },
        },
      })

      if (emailError) {
        console.error("[FORGOT] Email error:", emailError)
      }

      console.log("[FORGOT] Password reset code for", email, ":", code)

      setMessage({
        type: "success",
        text: `Код подтверждения отправлен на ${email}. Код действителен 10 минут. (Для разработки: ${code})`,
      })

      setTimeout(() => {
        router.push(`/auth/verify-reset-code?email=${encodeURIComponent(email)}`)
      }, 2000)
    } catch (error) {
      console.error("[FORGOT] Error:", error)
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Не удалось отправить код",
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
          <Link href="/auth/login" className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Назад к входу
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Забыли пароль?</h1>
            <p className="text-gray-700">Введите ваш email для получения кода восстановления</p>
          </div>

          <form onSubmit={handleSendCode} className="space-y-6">
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

            {message && (
              <p
                className={`text-sm text-center p-3 rounded-lg ${
                  message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {message.text}
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-white/80 hover:bg-white text-gray-800 font-semibold rounded-full text-lg"
            >
              {isLoading ? "Отправка..." : "Отправить код"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
