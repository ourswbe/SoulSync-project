import { NextResponse } from "next/server"
import { Resend } from "resend"

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json()

    console.log(`[v0] Отправка кода ${code} на email: ${email}`)

    if (!process.env.RESEND_API_KEY) {
      console.error("[v0] RESEND_API_KEY не найден в environment variables")
      return NextResponse.json({ success: false, error: "Email сервис не настроен" }, { status: 500 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const { data, error } = await resend.emails.send({
      from: "SoulSync <onboarding@resend.dev>",
      to: email,
      subject: "Код восстановления пароля SoulSync",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ec4899; text-align: center;">SoulSync</h1>
          <h2 style="color: #374151; margin-top: 30px;">Восстановление пароля</h2>
          <p style="color: #6b7280; font-size: 16px; line-height: 1.5;">
            Вы запросили восстановление пароля. Используйте код ниже для подтверждения:
          </p>
          <div style="background: linear-gradient(135deg, #fce7f3 0%, #fecdd3 100%); padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">Ваш код восстановления:</p>
            <h1 style="color: #ec4899; font-size: 48px; margin: 0; letter-spacing: 8px; font-weight: bold;">${code}</h1>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            ⏰ Код действителен в течение <strong>10 минут</strong>.
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.
          </p>
        </div>
      `,
    })

    if (error) {
      console.error("[v0] Resend error:", error)
      return NextResponse.json({ success: false, error: `Ошибка отправки email: ${error.message}` }, { status: 500 })
    }

    console.log("[v0] Email успешно отправлен! ID:", data?.id)
    return NextResponse.json({ success: true, messageId: data?.id })
  } catch (error) {
    console.error("[v0] Error sending email:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Не удалось отправить email",
      },
      { status: 500 },
    )
  }
}
