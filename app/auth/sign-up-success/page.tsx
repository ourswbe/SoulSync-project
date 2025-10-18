import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Pink gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-300 via-rose-300 to-pink-200">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-400/30 to-pink-400/30 blur-3xl animate-pulse" />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-white/40 backdrop-blur-xl border-white/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-white/60 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-gray-800" />
            </div>
            <CardTitle className="text-3xl text-gray-800">Check Your Email</CardTitle>
            <CardDescription className="text-gray-700 text-base">We've sent you a confirmation link</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-700">
              Please check your email and click the confirmation link to activate your account before signing in.
            </p>
            <Button asChild className="w-full bg-gray-800 text-white hover:bg-gray-900">
              <Link href="/auth/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
