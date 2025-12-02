import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json()

    // В режиме разработки логируем код
    console.log(`[v0] Отправка кода ${code} на email: ${email}`)

    // TODO: В production добавить реальную отправку через Resend или другой email сервис
    // Пример с Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'SoulSync <noreply@yourdomain.com>',
    //   to: email,
    //   subject: 'Код восстановления пароля',
    //   html: `<p>Ваш код восстановления: <strong>${code}</strong></p><p>Код действителен 10 минут.</p>`
    // })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error sending email:", error)
    return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 })
  }
}
