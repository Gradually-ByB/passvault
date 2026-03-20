import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  let initialMembers: any[] = []
  let initialAccounts: any[] = []

  try {
    initialMembers = await prisma.member.findMany({
      include: {
        _count: {
          select: { accounts: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    if (initialMembers.length > 0) {
      initialAccounts = await prisma.account.findMany({
        where: { memberId: initialMembers[0].id },
        orderBy: { siteName: 'asc' }
      })
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  }

  return (
    <DashboardClient 
      initialMembers={JSON.parse(JSON.stringify(initialMembers))} 
      initialAccounts={JSON.parse(JSON.stringify(initialAccounts))}
    />
  )
}
