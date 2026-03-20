'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Lock, AlertCircle, ShieldCheck, Mail, KeyRound } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isFocused, setIsFocused] = useState<string | null>(null)
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
    } catch (err) {
      setError('서버와 통신하는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[#020617] overflow-hidden selection:bg-blue-500/30">
      {/* Background Aesthetic Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] animate-pulse [animation-delay:2s]" />
      </div>

      {/* Login Card Container */}
      <div className="relative z-10 w-full max-w-[420px] px-4 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center p-3 mb-2 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-[0.1em] text-white transform scale-x-[1.2] sm:text-4xl">
            ID/PW 관리
          </h1>
          <p className="text-slate-400 text-sm font-medium inline-block transform scale-x-[1.2] origin-center">
            환경팀 전용
          </p>
        </div>

        <Card className="border-slate-800/50 bg-slate-900/40 backdrop-blur-2xl shadow-2xl shadow-black/50 border-t border-slate-700/30 overflow-hidden">
          <form onSubmit={handleLogin} className="space-y-8">
            <CardContent className="space-y-8 pt-10 pb-4 px-8">
              <div className="space-y-3.5">
                <Label htmlFor="username" className="text-sm font-bold text-slate-400 capitalize tracking-wide ml-1">아이디</Label>
                <div className={cn(
                  "relative transition-all duration-300 rounded-2xl bg-slate-950/50 border border-slate-800",
                  isFocused === 'username' ? "border-blue-500/50 ring-2 ring-blue-500/10" : "hover:border-slate-700"
                )}>
                  <Mail className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors",
                    isFocused === 'username' ? "text-blue-400" : "text-slate-500"
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
                    className="h-14 pl-12 bg-transparent border-none focus-visible:ring-0 text-slate-100 text-base placeholder:text-slate-600"
                    placeholder="관리자 아이디"
                  />
                </div>
              </div>

              <div className="space-y-3.5">
                <Label htmlFor="password" className="text-sm font-bold text-slate-400 capitalize tracking-wide ml-1">비밀번호</Label>
                <div className={cn(
                  "relative transition-all duration-300 rounded-2xl bg-slate-950/50 border border-slate-800",
                  isFocused === 'password' ? "border-blue-500/50 ring-2 ring-blue-500/10" : "hover:border-slate-700"
                )}>
                  <KeyRound className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors",
                    isFocused === 'password' ? "text-blue-400" : "text-slate-500"
                  )} />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsFocused('password')}
                    onBlur={() => setIsFocused(null)}
                    required
                    className="h-14 pl-12 bg-transparent border-none focus-visible:ring-0 text-slate-100 text-base placeholder:text-slate-600"
                    placeholder="********"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-sm font-semibold text-red-400 leading-tight tracking-tight">{error}</p>
                </div>
              )}
            </CardContent>

            <CardFooter className="pb-8 pt-8 px-8">
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-14 text-lg rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>확인 중...</span>
                  </div>
                ) : '로그인'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="mt-8 text-center text-[12px] text-slate-500 uppercase tracking-[0.1em] font-bold">
          © 2026 PassVault • 환경팀 계정관리 • 국제학교지원처
        </p>
      </div>
    </div>
  )
}
