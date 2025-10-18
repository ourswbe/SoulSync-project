import Link from "next/link"

export default function Page() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-rose-200 to-pink-300">
        {/* Heart shapes background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-300/40 to-rose-300/40 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]">
            <svg viewBox="0 0 200 200" className="w-full h-full opacity-20">
              <path
                d="M100,170 C100,170 30,120 30,80 C30,50 50,30 70,30 C85,30 95,40 100,50 C105,40 115,30 130,30 C150,30 170,50 170,80 C170,120 100,170 100,170 Z"
                fill="url(#heartGradient1)"
              />
              <defs>
                <linearGradient id="heartGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fda4af" />
                  <stop offset="100%" stopColor="#fb7185" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px]">
            <svg viewBox="0 0 200 200" className="w-full h-full opacity-10">
              <path
                d="M100,170 C100,170 30,120 30,80 C30,50 50,30 70,30 C85,30 95,40 100,50 C105,40 115,30 130,30 C150,30 170,50 170,80 C170,120 100,170 100,170 Z"
                fill="url(#heartGradient2)"
              />
              <defs>
                <linearGradient id="heartGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f9a8d4" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <Link href="/" className="text-2xl font-bold text-gray-800">
          SoulSync
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="px-6 py-2 bg-white/80 backdrop-blur-sm text-gray-800 rounded-full hover:bg-white transition-all font-medium shadow-sm"
          >
            Sign In
          </Link>
          <Link
            href="/auth/sign-up"
            className="px-6 py-2 bg-gray-800 text-white rounded-full hover:bg-gray-900 transition-all font-medium shadow-md"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-8 text-center">
        <h1 className="text-6xl md:text-7xl font-bold text-gray-800 mb-6 text-balance">
          Connect, Share, and <br />
          <span className="text-rose-600">Sync Your Soul</span>
        </h1>
        <p className="text-xl text-gray-700 mb-12 max-w-2xl text-pretty leading-relaxed">
          Your personal space to share moments, express yourself, and connect with a community that values authentic
          storytelling.
        </p>
        <div className="flex gap-4">
          <Link
            href="/auth/sign-up"
            className="px-8 py-4 bg-gray-800 text-white rounded-full hover:bg-gray-900 transition-all font-medium shadow-lg text-lg"
          >
            Get Started
          </Link>
          <Link
            href="/about"
            className="px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-800 rounded-full hover:bg-white transition-all font-medium shadow-md text-lg"
          >
            Explore
          </Link>
        </div>
      </div>
    </div>
  )
}
