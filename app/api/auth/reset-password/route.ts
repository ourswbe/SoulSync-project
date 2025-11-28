import { createClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const { email, token, newPassword } = await request.json()

    if (!email || !token || !newPassword) {
      return NextResponse.json({ error: "Все поля обязательны" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Пароль должен содержать минимум 8 символов" }, { status: 400 })
    }

    const supabase = createClient()

    // Hash the token to compare with database
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex")

    // Find the reset token
    const { data: resetToken, error: tokenError } = await supabase
      .from("password_reset_tokens")
      .select("id, user_id, expires_at, used")
      .eq("token_hash", tokenHash)
      .single()

    if (tokenError || !resetToken) {
      return NextResponse.json({ error: "Неверная или истёкшая ссылка для восстановления" }, { status: 400 })
    }

    // Check if token is already used
    if (resetToken.used) {
      return NextResponse.json({ error: "Эта ссылка уже была использована" }, { status: 400 })
    }

    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(resetToken.expires_at)

    if (now > expiresAt) {
      return NextResponse.json({ error: "Ссылка истекла. Запросите новую ссылку для восстановления." }, { status: 400 })
    }

    // Get user profile to verify email matches
    const { data: profile } = await supabase.from("profiles").select("email").eq("id", resetToken.user_id).single()

    if (!profile || profile.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: "Неверные данные" }, { status: 400 })
    }

    // Update password using Supabase Admin API
    // Note: This requires admin privileges
    const { error: updateError } = await supabase.auth.admin.updateUserById(resetToken.user_id, {
      password: newPassword,
    })

    if (updateError) {
      console.error("Error updating password:", updateError)
      return NextResponse.json({ error: "Не удалось обновить пароль" }, { status: 500 })
    }

    // Mark token as used
    await supabase.from("password_reset_tokens").update({ used: true }).eq("id", resetToken.id)

    // Invalidate all other reset tokens for this user
    await supabase
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("user_id", resetToken.user_id)
      .eq("used", false)

    return NextResponse.json({ success: true, message: "Пароль успешно изменён" }, { status: 200 })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Произошла ошибка при смене пароля" }, { status: 500 })
  }
}
