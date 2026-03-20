import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { login } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ message: '아이디와 비밀번호를 모두 입력해주세요.' }, { status: 400 })
    }

    const admin = await prisma.admin.findUnique({
      where: { username },
    })

    if (!admin) {
      return NextResponse.json({ message: '잘못된 계정 정보입니다.' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, admin.password)

    if (!isValid) {
      return NextResponse.json({ message: '잘못된 계정 정보입니다.' }, { status: 401 })
    }

    await login(username)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ message: '내부 서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
