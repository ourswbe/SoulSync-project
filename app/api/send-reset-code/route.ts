import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: "Email и код обязательны" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Supabase не настроен" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        data: {
          reset_code: code,
        },
      },
    })

    if (error) {
      console.error("[SEND_CODE] Error:", error)
      return NextResponse.json({ error: "Не удалось отправить email" }, { status: 500 })
    }

    console.log(`[SEND_CODE] Код ${code} отправлен на ${email}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[SEND_CODE] Error:", error)
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}
