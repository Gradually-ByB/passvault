import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const memberId = searchParams.get('memberId')

  if (!memberId) return NextResponse.json({ error: 'memberId is required' }, { status: 400 })

  try {
    const accounts = await prisma.account.findMany({
      where: { memberId },
      orderBy: { siteName: 'asc' }
    })
    return NextResponse.json(accounts)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { siteName, username, password, memberId } = await request.json()
    
    if (!siteName || !username || !password || !memberId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const account = await prisma.account.create({
      data: { siteName, username, password, memberId }
    })
    return NextResponse.json(account)
  } catch {
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

  try {
    await prisma.account.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id, siteName, username, password } = await request.json()
    
    if (!id || !siteName || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const account = await prisma.account.update({
      where: { id },
      data: { siteName, username, password }
    })
    return NextResponse.json(account)
  } catch {
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 })
  }
}
