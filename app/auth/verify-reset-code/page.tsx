"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ArrowLeft, Mail } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function VerifyResetCodePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [code, setCode] = useState("")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    const emailParam = searchParams.get("email")
    if (emailParam) {
      setEmail(emailParam)
    } else {
      router.push("/auth/forgot-password")
    }
  }, [searchParams, router])

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      if (code.length !== 6) {
        throw new Error("Код должен содержать 6 цифр")
      }

      // Verify code from database
      const { data: resetData, error: resetError } = await supabase
        .from("password_reset_codes")
        .select("*")
        .eq("email", email)
        .eq("code", code)
        .eq("used", false)
        .single()

      if (resetError || !resetData) {
        throw new Error("Неверный код")
      }

      // Check if code is expired
      const expiresAt = new Date(resetData.expires_at)
      if (expiresAt < new Date()) {
        throw new Error("Код истёк. Запросите новый код.")
      }

      // Mark code as used
      await supabase.from("password_reset_codes").update({ used: true }).eq("id", resetData.id)

      setMessage({ type: "success", text: "Код подтверждён! Переход к смене пароля..." })

      // Redirect to reset password page
      setTimeout(() => {
        router.push(`/auth/reset-password?email=${encodeURIComponent(email)}&verified=true`)
      }, 1500)
    } catch (error) {
      console.error("[VERIFY] Error:", error)
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Не удалось проверить код",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6)
    setCode(value)
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
          <Link
            href="/auth/forgot-password"
            className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Link>

          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center">
                <Mail className="w-8 h-8 text-rose-500" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Код из письма</h1>
            <p className="text-gray-700">
              Введите 6-значный код, который мы отправили на
              <br />
              <span className="font-semibold">{email}</span>
            </p>
          </div>

          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={code}
                onChange={handleCodeChange}
                required
                maxLength={6}
                className="h-16 bg-white/60 backdrop-blur-sm border-2 border-white/80 text-gray-800 placeholder:text-gray-400 rounded-2xl text-center text-2xl font-semibold tracking-widest"
              />
              <p className="text-xs text-gray-600 mt-2 text-center">Код действителен 10 минут</p>
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
              disabled={isLoading || code.length < 4}
              className="w-full h-14 bg-white/80 hover:bg-white text-gray-800 font-semibold rounded-full text-lg disabled:opacity-50"
            >
              {isLoading ? "Проверка..." : "Продолжить"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push("/auth/forgot-password")}
                className="text-sm text-gray-700 hover:text-gray-900 underline"
              >
                Не получили код? Отправить повторно
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
