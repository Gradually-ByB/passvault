'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AlertCircle, User, Lock, Eye, EyeOff, LogIn } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isFocused, setIsFocused] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (res.ok) {
        router.push('/')
        router.refresh()
      } else {
        const err = await res.json()
        setError(err.message || '정보가 올바르지 않습니다. 다시 시도해주세요.')
      }
    } catch {
      setError('서버와 통신하는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#FDFDFD] overflow-hidden selection:bg-orange-500/30">
      {/* Background Aesthetic Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-rose-100/40 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-50/60 blur-[120px]" />
      </div>

      {/* Top Badge */}
      <div className="absolute top-8 z-20 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/60 backdrop-blur-md rounded-full border border-orange-100/50 shadow-sm text-orange-500 text-sm font-bold">
          <div className="w-2 h-2 rounded-full bg-emerald-400 border border-white" />
          환경팀 전용 보안 시스템 · 국제학교지원처
        </div>
      </div>

      {/* Login Card Container */}
      <div className="relative z-10 w-full max-w-[420px] px-4 animate-in fade-in zoom-in-95 duration-700">
        <Card className="border-none bg-white/95 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden rounded-[32px] pt-12">
          <div className="text-center mb-8 space-y-4">
            <div className="inline-flex items-center justify-center h-28 mb-2">
              <Image src="/logo.png" alt="Logo" width={112} height={112} className="object-contain" priority />
            </div>
            <h1 className="text-3xl font-extrabold tracking-widest text-[#431407]">
              PASSVAULT
            </h1>
            <p className="text-[#C2410C] text-[15px] font-semibold tracking-tight">
              환경팀 전용 계정관리 시스템
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <CardContent className="space-y-6 px-10">
              <div className="space-y-2.5">
                <Label htmlFor="username" className="text-sm font-bold text-[#9A3412] tracking-tight ml-1">아이디</Label>
                <div className={cn(
                  "relative transition-all duration-300 rounded-2xl bg-[#FFF7ED]",
                  isFocused === 'username' ? "ring-2 ring-orange-400/20 bg-white shadow-sm" : ""
                )}>
                  <User className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors",
                    isFocused === 'username' ? "text-orange-500" : "text-[#FB923C]"
                  )} />
                  <Input
                    id="username"
                    type="text"
                    autoComplete="off"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setIsFocused('username')}
                    onBlur={() => setIsFocused(null)}
                    required
                    className="h-14 pl-12 bg-transparent border-none focus-visible:ring-0 text-[#431407] text-base placeholder:text-[#FDBA74]"
                    placeholder="관리자 아이디"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="password" className="text-sm font-bold text-[#9A3412] tracking-tight ml-1">비밀번호</Label>
                <div className={cn(
                  "relative transition-all duration-300 rounded-2xl bg-[#FFF7ED]",
                  isFocused === 'password' ? "ring-2 ring-orange-400/20 bg-white shadow-sm" : ""
                )}>
                  <Lock className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors",
                    isFocused === 'password' ? "text-orange-500" : "text-[#FB923C]"
                  )} />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsFocused('password')}
                    onBlur={() => setIsFocused(null)}
                    required
                    className="h-14 pl-12 pr-12 bg-transparent border-none focus-visible:ring-0 text-[#431407] text-base placeholder:text-[#FDBA74]"
                    placeholder="비밀번호 입력"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#FB923C] hover:text-[#EA580C] transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-semibold leading-tight">{error}</p>
                </div>
              )}
            </CardContent>

            <CardFooter className="pb-10 px-10">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#FF7A6E] to-[#FFA73D] hover:from-[#FF6A5E] hover:to-[#FF972D] text-white font-bold h-14 text-lg rounded-2xl transition-all shadow-[0_8px_20px_rgba(255,167,61,0.3)] active:scale-[0.98] border-none"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>로딩중...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="w-5 h-5" />
                    <span>로그인</span>
                  </div>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="mt-8 text-center text-[13px] text-[#D97706] font-semibold">
          © 2026 PASSVAULT · 국제학교지원처
        </p>
      </div>
    </div>
  )
}
