'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from 'sonner'
import { Plus, User, LogOut, Shield, Copy, Trash2, Key, Globe, Eye, EyeOff, Search, Loader2, Users, Pencil, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type Member = {
  id: string
  name: string
  _count: { accounts: number }
}

type Account = {
  id: string
  siteName: string
  username: string
  password: string
}

interface DashboardClientProps {
  initialMembers: Member[]
  initialAccounts: Account[]
}

export default function DashboardClient({ initialMembers, initialAccounts }: DashboardClientProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [activeMemberId, setActiveMemberId] = useState<string | null>(initialMembers[0]?.id || null)
  const [accountsMap, setAccountsMap] = useState<Record<string, Account[]>>(
    initialMembers[0] ? { [initialMembers[0].id]: initialAccounts } : {}
  )
  const [fetchingAccounts, setFetchingAccounts] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [newMemberName, setNewMemberName] = useState('')
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false)
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [accountError, setAccountError] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [accountSuccess, setAccountSuccess] = useState<string | null>(null)
  const [editSuccess, setEditSuccess] = useState<string | null>(null)
  const [memberSuccess, setMemberSuccess] = useState<string | null>(null)
  const [memberError, setMemberError] = useState<string | null>(null)
  const [showAllMembers, setShowAllMembers] = useState(false)

  // Account Form State
  const [newAccount, setNewAccount] = useState({
    siteName: '',
    username: '',
    password: ''
  })

  const [editingAccount, setEditingAccount] = useState<Account | null>(null)

  const router = useRouter()

  // No initial fetch useEffect needed, handled via SSR and state initialization
  useEffect(() => {
    if (isAccountDialogOpen) {
      setAccountError(null)
      setAccountSuccess(null)
    }
  }, [isAccountDialogOpen])

  useEffect(() => {
    if (isEditDialogOpen) {
      setEditError(null)
      setEditSuccess(null)
    }
  }, [isEditDialogOpen])

  useEffect(() => {
    if (isMemberDialogOpen) {
      setMemberError(null)
      setMemberSuccess(null)
    }
  }, [isMemberDialogOpen])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchMembers = async () => {
    // Only fetch for updates/refreshes manually triggered
    try {
      const res = await fetch('/api/members')
      if (res.ok) {
        const data = await res.json()
        setMembers(data)
      }
    } catch {
      toast.error('팀원 목록을 가져오는데 실패했습니다.')
    }
  }

  const fetchAccounts = async (memberId: string) => {
    if (accountsMap[memberId] || fetchingAccounts[memberId]) return

    setFetchingAccounts(prev => ({ ...prev, [memberId]: true }))
    try {
      const res = await fetch(`/api/accounts?memberId=${memberId}`)
      if (res.ok) {
        const data = await res.json()
        setAccountsMap(prev => ({ ...prev, [memberId]: data }))
      }
    } catch {
      toast.error('계정 목록을 가져오는데 실패했습니다.')
    } finally {
      setFetchingAccounts(prev => ({ ...prev, [memberId]: false }))
    }
  }

  const handleCreateMember = async () => {
    if (!newMemberName.trim()) return
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newMemberName }),
      })
      if (res.ok) {
        const newMember = await res.json()
        setMembers(prev => [...prev, { ...newMember, _count: { accounts: 0 } }].sort((a, b) => a.name.localeCompare(b.name)))
        setMemberSuccess('팀원이 추가되었습니다.')
        setNewMemberName('')
      }
    } catch {
      setMemberError('팀원 추가에 실패했습니다.')
    }
  }

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (!confirm(`"${memberName}" 팀원을 삭제하시겠습니까?\n해당 팀원의 모든 계정도 함께 삭제됩니다.`)) return
    try {
      const res = await fetch(`/api/members?memberId=${memberId}`, { method: 'DELETE' })
      if (res.ok) {
        setMembers(prev => prev.filter(m => m.id !== memberId))
        toast.success(`"${memberName}" 팀원이 삭제되었습니다.`)
        if (activeMemberId === memberId) {
          setActiveMemberId('')
        }
      } else {
        toast.error('팀원 삭제에 실패했습니다.')
      }
    } catch {
      toast.error('팀원 삭제에 실패했습니다.')
    }
  }

  const handleCreateAccount = async () => {
    if (!activeMemberId) return
    if (!newAccount.siteName || !newAccount.username || !newAccount.password) {
      setAccountError('모든 정보를 입력해주세요.')
      return
    }

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAccount, memberId: activeMemberId }),
      })
      if (res.ok) {
        const addedAccount = await res.json()
        setAccountsMap(prev => {
          const currentList = prev[activeMemberId] || []
          return {
            ...prev,
            [activeMemberId]: [...currentList, addedAccount].sort((a, b) => a.siteName.localeCompare(b.siteName))
          }
        })
        setMembers(prev => prev.map(m => m.id === activeMemberId ? { ...m, _count: { accounts: m._count.accounts + 1 } } : m))
        setAccountSuccess('저장되었습니다.')
        setNewAccount({ siteName: '', username: '', password: '' })
        setAccountError(null)
      }
    } catch {
      setAccountError('계정 저장에 실패했습니다.')
    }
  }

  const handleUpdateAccount = async () => {
    if (!editingAccount || !activeMemberId) return
    if (!editingAccount.siteName || !editingAccount.username || !editingAccount.password) {
      setEditError('모든 정보를 입력해주세요.')
      return
    }

    try {
      const res = await fetch('/api/accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingAccount),
      })
      if (res.ok) {
        const updated = await res.json()
        setAccountsMap(prev => {
          const currentList = prev[activeMemberId] || []
          return {
            ...prev,
            [activeMemberId]: currentList.map(acc => acc.id === updated.id ? updated : acc).sort((a, b) => a.siteName.localeCompare(b.siteName))
          }
        })
        setEditSuccess('수정되었습니다.')
        setEditError(null)
      }
    } catch {
      setEditError('계정 수정에 실패했습니다.')
    }
  }

  const handleDeleteAccount = async (id: string, memberId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      const res = await fetch(`/api/accounts?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setAccountsMap(prev => ({
          ...prev,
          [memberId]: (prev[memberId] || []).filter(acc => acc.id !== id)
        }))
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, _count: { accounts: m._count.accounts - 1 } } : m))
        toast.success('삭제되었습니다.')
      }
    } catch {
      toast.error('삭제에 실패했습니다.')
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const copyToClipboard = (text: string, label: string) => {
    toast.success(`${label}이(가) 복사되었습니다.`)
    navigator.clipboard.writeText(text)
  }

  const togglePasswordVisibility = (id: string) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const filteredMembers = useMemo(() => {
    return members.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [members, searchTerm])

  const activeMember = members.find(m => m.id === activeMemberId)

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFDFD] font-sans text-[#431407]">
      {/* Header */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-[#FFF7ED] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center">
              <Image src="/logo.png" alt="Logo" width={60} height={60} className="object-contain" priority />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-rose-400">
              환경팀 계정 관리
            </h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-[#9A3412] hover:text-[#431407] hover:bg-[#FFF7ED]">
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 lg:p-8 flex flex-col md:flex-row gap-6">
        {/* Sidebar / Member Picker */}
        <aside className="w-full md:w-60 space-y-6">
          <div className="space-y-6">
            <div className="flex items-center min-h-[44px] px-1">
              <h2 className="text-xl font-extrabold text-[#431407] flex items-baseline gap-2 tracking-tight transform scale-y-[1.2]">
                <Users className="w-4 h-4" />
                팀원 관리
              </h2>
            </div>

            <div className="bg-white rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#FFF7ED] p-2 pt-4">
              <div className="px-3 mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-[#7C2D12]">팀원 목록</span>
                <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
                  <DialogTrigger render={
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-orange-500 hover:bg-orange-500/10">
                      <Plus className="w-4 h-4" />
                    </Button>
                  } />
                  <DialogContent className="bg-white border-[#FFEDD5] text-[#431407]" showCloseButton={false}>
                    <DialogHeader>
                      <DialogTitle>팀원 추가</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="space-y-2.5">
                        <Label htmlFor="memberName" className="text-sm font-bold text-[#9A3412] tracking-tight ml-1">이름</Label>
                        <div className="relative group transition-all duration-300 rounded-2xl bg-[#FFF7ED] focus-within:ring-2 focus-within:ring-orange-400/20 focus-within:bg-white focus-within:shadow-sm">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors text-[#FB923C] group-focus-within:text-orange-500" />
                          <Input
                            id="memberName"
                            value={newMemberName}
                            onChange={(e) => {
                              setNewMemberName(e.target.value)
                              setMemberError(null)
                              setMemberSuccess(null)
                            }}
                            placeholder="이름 입력"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCreateMember()
                            }}
                            className="h-14 pl-12 bg-transparent border-none focus-visible:ring-0 text-[#431407] text-base placeholder:text-[#FDBA74]"
                          />
                        </div>
                      </div>
                    </div>
                    {memberError && (
                      <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                        <p className="text-xs font-semibold text-red-600 leading-tight tracking-tight">{memberError}</p>
                      </div>
                    )}
                    {memberSuccess && (
                      <div className="mx-4 mt-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                        <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                        <p className="text-xs font-semibold text-emerald-600 leading-tight tracking-tight">{memberSuccess}</p>
                      </div>
                    )}
                    <DialogFooter className="flex-row gap-2 mt-4">
                      <Button variant="ghost" onClick={() => setIsMemberDialogOpen(false)} className="flex-1 rounded-2xl h-14 border border-[#FFEDD5] hover:bg-[#FFF7ED] text-base font-semibold">닫기</Button>
                      <Button onClick={handleCreateMember} className="flex-1 rounded-2xl h-14 bg-gradient-to-r from-[#FF7A6E] to-[#FFA73D] hover:from-[#FF6A5E] hover:to-[#FF972D] text-white border-none text-base font-semibold shadow-md">추가</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="relative mb-3 px-3">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#EA580C]" />
                <Input
                  placeholder="이름 검색..."
                  className="h-10 pl-9 bg-[#FDFDFD]/50 border-transparent text-sm text-[#431407] rounded-xl shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-1 px-1 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar pb-2">
                {filteredMembers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#EA580C]">팀원이 없습니다.</div>
                ) : (() => {
                  const LIMIT = 10
                  const isSearching = searchTerm.trim().length > 0
                  const visibleMembers = (isSearching || showAllMembers) ? filteredMembers : filteredMembers.slice(0, LIMIT)
                  const hiddenCount = filteredMembers.length - LIMIT
                  return (
                    <>
                      {visibleMembers.map(member => (
                        <div
                          key={member.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setActiveMemberId(member.id)
                            fetchAccounts(member.id)
                          }}
                          className={cn(
                            "w-full text-left px-4 py-3.5 rounded-xl transition-all flex items-center justify-between group relative overflow-hidden focus:outline-none",
                            activeMemberId === member.id
                              ? "bg-orange-50 text-black shadow-sm ring-1 ring-orange-500/20 font-bold"
                              : "text-[#1C2434] hover:bg-[#FFF7ED]/40 hover:text-black font-medium"
                          )}
                        >
                          <div className="flex items-center gap-3 relative z-10 flex-1 min-w-0">
                            <div className={cn(
                              "w-2 h-2 rounded-full transition-all shrink-0",
                              activeMemberId === member.id ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "bg-[#FDBA74] group-hover:bg-[#EA580C]"
                            )}></div>
                            <span className="font-semibold truncate">{member.name}</span>
                          </div>
                          <div className="flex items-center gap-2 relative z-10 shrink-0">
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors",
                              activeMemberId === member.id
                                ? "bg-orange-500/20 text-orange-500"
                                : "bg-[#FFF7ED] text-[#EA580C] group-hover:bg-[#FFEDD5] group-hover:text-[#7C2D12]"
                            )}>
                              {member._count.accounts}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteMember(member.id, member.name)
                              }}
                              className="p-1 rounded-md hover:bg-red-50 text-[#EA580C] hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {activeMemberId === member.id && (
                            <div className="absolute left-0 top-0 w-1 h-full bg-orange-500"></div>
                          )}
                        </div>
                      ))}
                      {!isSearching && !showAllMembers && hiddenCount > 0 && (
                        <button
                          onClick={() => setShowAllMembers(true)}
                          className="w-full text-left px-4 py-2.5 rounded-xl text-[#EA580C] hover:text-[#7C2D12] text-xs font-semibold flex items-center gap-2 hover:bg-[#FFF7ED] transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          더보기 ({hiddenCount}명)
                        </button>
                      )}
                      {!isSearching && showAllMembers && filteredMembers.length > LIMIT && (
                        <button
                          onClick={() => setShowAllMembers(false)}
                          className="w-full text-left px-4 py-2.5 rounded-xl text-[#EA580C] hover:text-[#7C2D12] text-xs font-semibold flex items-center gap-2 hover:bg-[#FFF7ED] transition-all"
                        >
                          접기
                        </button>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 space-y-6">
          {!activeMemberId ? (
            <Card className="h-full min-h-[400px] border-[#FFF7ED] bg-white border-dashed flex items-center justify-center rounded-[32px] shadow-sm">
              <div className="text-center space-y-3">
                <User className="w-12 h-12 text-orange-200 mx-auto" />
                <p className="text-[#EA580C] font-medium">관리하실 팀원을 선택해 주세요.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold flex items-baseline gap-2 tracking-tight transform scale-y-[1.2] text-[#111827]">
                    {activeMember?.name}
                    <span className="text-sm text-[#4B5563]" >
                      님의 계정 상세
                    </span>
                  </h2>
                </div>

                <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
                  <DialogTrigger render={
                    <Button className="bg-gradient-to-r from-[#FF7A6E] to-[#FFA73D] hover:from-[#FF6A5E] hover:to-[#FF972D] text-white border-none rounded-xl shadow-lg shadow-blue-900/20 px-6 h-11">
                      <Plus className="w-4 h-4 mr-2" />
                      계정 추가
                    </Button>
                  } />
                  <DialogContent className="bg-white border-[#FFEDD5] text-[#431407] rounded-2xl shadow-2xl" showCloseButton={false}>
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">계정 추가</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <div className="space-y-2.5">
                        <Label className="text-sm font-bold text-[#9A3412] tracking-tight ml-1">홈페이지</Label>
                        <div className="relative group transition-all duration-300 rounded-2xl bg-[#FFF7ED] focus-within:ring-2 focus-within:ring-orange-400/20 focus-within:bg-white focus-within:shadow-sm">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors text-[#FB923C] group-focus-within:text-orange-500" />
                          <Input
                            placeholder="예: 아마란스10, ForMe .."
                            className="h-14 pl-12 bg-transparent border-none focus-visible:ring-0 text-[#431407] text-base placeholder:text-[#FDBA74]"
                            value={newAccount.siteName}
                            onChange={(e) => {
                              setNewAccount({ ...newAccount, siteName: e.target.value })
                              setAccountError(null)
                              setAccountSuccess(null)
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateAccount()}
                          />
                        </div>
                      </div>
                      <div className="space-y-2.5">
                        <Label className="text-sm font-bold text-[#9A3412] tracking-tight ml-1">아이디</Label>
                        <div className="relative group transition-all duration-300 rounded-2xl bg-[#FFF7ED] focus-within:ring-2 focus-within:ring-orange-400/20 focus-within:bg-white focus-within:shadow-sm">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors text-[#FB923C] group-focus-within:text-orange-500" />
                          <Input
                            placeholder="아이디 또는 이메일"
                            className="h-14 pl-12 bg-transparent border-none focus-visible:ring-0 text-[#431407] text-base placeholder:text-[#FDBA74]"
                            value={newAccount.username}
                            onChange={(e) => {
                              setNewAccount({ ...newAccount, username: e.target.value })
                              setAccountError(null)
                              setAccountSuccess(null)
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateAccount()}
                          />
                        </div>
                      </div>
                      <div className="space-y-2.5">
                        <Label className="text-sm font-bold text-[#9A3412] tracking-tight ml-1">비밀번호</Label>
                        <div className="relative group transition-all duration-300 rounded-2xl bg-[#FFF7ED] focus-within:ring-2 focus-within:ring-orange-400/20 focus-within:bg-white focus-within:shadow-sm">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors text-[#FB923C] group-focus-within:text-orange-500" />
                          <Input
                            type="password"
                            placeholder="비밀번호 정보"
                            className="h-14 pl-12 bg-transparent border-none focus-visible:ring-0 text-[#431407] text-base placeholder:text-[#FDBA74]"
                            value={newAccount.password}
                            onChange={(e) => {
                              setNewAccount({ ...newAccount, password: e.target.value })
                              setAccountError(null)
                              setAccountSuccess(null)
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateAccount()}
                          />
                        </div>
                      </div>
                    </div>
                    {accountError && (
                      <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                        <p className="text-xs font-semibold text-red-600 leading-tight tracking-tight">{accountError}</p>
                      </div>
                    )}
                    {accountSuccess && (
                      <div className="mx-4 mt-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                        <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                        <p className="text-xs font-semibold text-emerald-600 leading-tight tracking-tight">{accountSuccess}</p>
                      </div>
                    )}
                    <DialogFooter className="flex-row gap-2 mt-4">
                      <Button variant="ghost" onClick={() => setIsAccountDialogOpen(false)} className="flex-1 rounded-2xl h-14 border border-[#FFEDD5] hover:bg-[#FFF7ED] text-base font-semibold">닫기</Button>
                      <Button onClick={handleCreateAccount} className="flex-1 rounded-2xl h-14 bg-gradient-to-r from-[#FF7A6E] to-[#FFA73D] hover:from-[#FF6A5E] hover:to-[#FF972D] text-white border-none text-base font-semibold shadow-md">저장</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Card className="border-none bg-white/40 backdrop-blur-sm overflow-hidden rounded-3xl shadow-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <CardContent className="p-0">
                  {fetchingAccounts[activeMemberId] ? (
                    <div className="p-16 text-center text-[#EA580C] flex flex-col items-center gap-4">
                      <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                      <p className="font-medium">기밀 정보를 안전하게 불러오는 중...</p>
                    </div>
                  ) : !accountsMap[activeMemberId] || accountsMap[activeMemberId].length === 0 ? (
                    <div className="p-16 text-center text-[#EA580C] flex flex-col items-center gap-4">
                      <Key className="w-12 h-12 text-orange-200" />
                      <div className="space-y-1">
                        <p className="text-lg font-semibold text-[#9A3412]">등록된 계정이 없습니다.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-[#FFF7ED]/60 border-b-2 border-[#FFEDD5]">
                          <TableRow className="border-none hover:bg-transparent h-14">
                            <TableHead className="text-[#9A3412] font-black text-center uppercase text-[13px] tracking-[0.2em] px-8 py-4">홈페이지</TableHead>
                            <TableHead className="text-[#9A3412] font-black text-center uppercase text-[13px] tracking-[0.2em] px-6 py-4">계정 ID</TableHead>
                            <TableHead className="text-[#9A3412] font-black text-center uppercase text-[13px] tracking-[0.2em] px-6 py-4">비밀번호</TableHead>
                            <TableHead className="text-[#9A3412] font-black text-center uppercase text-[13px] tracking-[0.2em] px-6 py-4">관리</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {accountsMap[activeMemberId].map(account => (
                            <TableRow key={account.id} className="border-b border-dashed border-gray-300 last:border-0 hover:bg-[#FFF7ED]/40 transition-all group/row h-20">
                              <TableCell className="text-[#7C2D12] px-8 text-left">
                                <div className="flex items-center justify-start gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center ring-1 ring-orange-100 group-hover/row:scale-110 transition-transform">
                                    <Globe className="w-4 h-4 text-orange-500" />
                                  </div>
                                  <span className="text-sm tracking-tighter inline-block transform scale-y-[1.2] origin-center">{account.siteName}</span>
                                </div>
                              </TableCell>
                              <TableCell className="px-6 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <span className="text-[#7C2D12] font-medium">{account.username}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 text-[#EA580C] hover:text-orange-500 hover:bg-orange-500/10 rounded-lg group-hover/row:scale-110 transition-transform"
                                    onClick={() => copyToClipboard(account.username, '아이디')}
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="px-6 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <span className={cn(
                                    "font-medium inline-block w-32 truncate text-center",
                                    showPassword[account.id] ? "text-[#7C2D12]" : "text-[#EA580C]"
                                  )}>
                                    {showPassword[account.id] ? account.password : '••••••••'}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 text-[#EA580C] hover:text-orange-500 hover:bg-orange-500/10 rounded-lg"
                                    onClick={() => togglePasswordVisibility(account.id)}
                                  >
                                    {showPassword[account.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 text-[#EA580C] hover:text-orange-500 hover:bg-orange-500/10 rounded-lg"
                                    onClick={() => copyToClipboard(account.password, '비밀번호')}
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="text-center px-6">
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-10 h-10 text-[#9A3412] hover:text-orange-500 hover:bg-orange-500/10 rounded-xl transition-all"
                                    onClick={() => {
                                      setEditingAccount(account)
                                      setIsEditDialogOpen(true)
                                    }}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-10 h-10 text-[#9A3412] hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                    onClick={() => handleDeleteAccount(account.id, activeMemberId)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </section>
      </main>

      {/* Edit Account Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white border-[#FFEDD5] text-[#431407] rounded-2xl shadow-2xl" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">계정 정보 수정</DialogTitle>
          </DialogHeader>
          {editingAccount && (
            <div className="py-4 space-y-4">
              <div className="space-y-2.5">
                <Label className="text-sm font-bold text-[#9A3412] tracking-tight ml-1">홈페이지</Label>
                <div className="relative group transition-all duration-300 rounded-2xl bg-[#FFF7ED] focus-within:ring-2 focus-within:ring-orange-400/20 focus-within:bg-white focus-within:shadow-sm">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors text-[#FB923C] group-focus-within:text-orange-500" />
                  <Input
                    placeholder="예: 아마란스10, ForMe .."
                    value={editingAccount.siteName}
                    onChange={(e) => {
                      setEditingAccount({ ...editingAccount, siteName: e.target.value })
                      setEditError(null)
                      setEditSuccess(null)
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateAccount()}
                    className="h-14 pl-12 bg-transparent border-none focus-visible:ring-0 text-[#431407] text-base placeholder:text-[#FDBA74]"
                  />
                </div>
              </div>
              <div className="space-y-2.5">
                <Label className="text-sm font-bold text-[#9A3412] tracking-tight ml-1">아이디</Label>
                <div className="relative group transition-all duration-300 rounded-2xl bg-[#FFF7ED] focus-within:ring-2 focus-within:ring-orange-400/20 focus-within:bg-white focus-within:shadow-sm">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors text-[#FB923C] group-focus-within:text-orange-500" />
                  <Input
                    placeholder="아이디 또는 이메일"
                    value={editingAccount.username}
                    onChange={(e) => {
                      setEditingAccount({ ...editingAccount, username: e.target.value })
                      setEditError(null)
                      setEditSuccess(null)
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateAccount()}
                    className="h-14 pl-12 bg-transparent border-none focus-visible:ring-0 text-[#431407] text-base placeholder:text-[#FDBA74]"
                  />
                </div>
              </div>
              <div className="space-y-2.5">
                <Label className="text-sm font-bold text-[#9A3412] tracking-tight ml-1">비밀번호</Label>
                <div className="relative group transition-all duration-300 rounded-2xl bg-[#FFF7ED] focus-within:ring-2 focus-within:ring-orange-400/20 focus-within:bg-white focus-within:shadow-sm">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors text-[#FB923C] group-focus-within:text-orange-500" />
                  <Input
                    type="password"
                    placeholder="비밀번호 정보"
                    value={editingAccount.password}
                    onChange={(e) => {
                      setEditingAccount({ ...editingAccount, password: e.target.value })
                      setEditError(null)
                      setEditSuccess(null)
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateAccount()}
                    className="h-14 pl-12 bg-transparent border-none focus-visible:ring-0 text-[#431407] text-base placeholder:text-[#FDBA74]"
                  />
                </div>
              </div>
            </div>
          )}
          {editError && (
            <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs font-semibold text-red-600 leading-tight tracking-tight">{editError}</p>
            </div>
          )}
          {editSuccess && (
            <div className="mx-4 mt-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
              <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-xs font-semibold text-emerald-600 leading-tight tracking-tight">{editSuccess}</p>
            </div>
          )}
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="flex-1 rounded-xl h-11 border border-[#FFEDD5] hover:bg-[#FFF7ED]">닫기</Button>
            <Button onClick={handleUpdateAccount} className="bg-gradient-to-r from-[#FF7A6E] to-[#FFA73D] hover:from-[#FF6A5E] hover:to-[#FF972D] text-white border-none flex-1 h-11 rounded-xl">저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="py-10 bg-[#FDFDFD]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[12px] text-[#EA580C] uppercase tracking-[0.1em] font-bold">© 2026 PassVault • 환경팀 계정관리 • 국제학교지원처</p>
        </div>
      </footer>
    </div>
  )
}