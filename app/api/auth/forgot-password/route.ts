import { createClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import crypto from "crypto"

// Rate limiting storage (in production, use Redis or database)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function getRateLimitKey(ip: string): string {
  return `forgot-password:${ip}`
}

function checkRateLimit(ip: string): boolean {
  const key = getRateLimitKey(ip)
  const now = Date.now()
  const limit = rateLimitMap.get(key)

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + 60 * 60 * 1000 }) // 1 hour
    return true
  }

  if (limit.count >= 5) {
    return false
  }

  limit.count++
  return true
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "Если аккаунт существует, мы отправили инструкцию на почту." },
        { status: 200 },
      )
    }

    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown"

    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Слишком много попыток. Попробуйте позже." }, { status: 429 })
    }

    const supabase = createClient()

    // Check if user exists
    const { data: user } = await supabase.from("profiles").select("id, email").eq("email", email.toLowerCase()).single()

    if (!user) {
      // Always return the same message for security
      return NextResponse.json(
        { message: "Если аккаунт существует, мы отправили инструкцию на почту." },
        { status: 200 },
      )
    }

    // Generate secure random token (32 bytes)
    const tokenBytes = crypto.randomBytes(32)
    const token = tokenBytes.toString("hex")
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex")

    // Set expiry to 15 minutes from now
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    // Store token hash in database
    const { error: insertError } = await supabase.from("password_reset_tokens").insert({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
      request_ip: ip,
      user_agent: request.headers.get("user-agent") || "unknown",
    })

    if (insertError) {
      console.error("Error creating reset token:", insertError)
      return NextResponse.json(
        { message: "Если аккаунт существует, мы отправили инструкцию на почту." },
        { status: 200 },
      )
    }

    // Create reset link
    const resetUrl = `${process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || "http://localhost:3000"}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`

    // Send email using Supabase (custom email template would be needed in production)
    // For now, we'll use a simple notification
    console.log("[v0] Reset link generated:", resetUrl)

    // In production, send actual email here
    // For development, just log it

    return NextResponse.json(
      {
        message: "Если аккаунт существует, мы отправили инструкцию на почту.",
        resetUrl, // Only for development - remove in production
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ message: "Если аккаунт существует, мы отправили инструкцию на почту." }, { status: 200 })
  }
}
