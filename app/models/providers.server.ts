import type { Provider } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { prisma } from '~/db.server'

import type { User } from '~/models/user.server'
export type { Provider } from '@prisma/client'

const defaultProviders = [
  'abc',
  'virta',
  'recharge',
  'office',
  'k-lataus',
  'lidl',
  'ikea',
  'home',
  'plugit',
  'other',
]

export type ProviderCount = Provider & { count: number }

export async function initializeProviders(userId: User['id']) {
  const count = await prisma.provider.count()
  if (count === 0) {
    await prisma.provider.createMany({
      data: defaultProviders.map((p) => {
        return { name: p!, userId }
      }),
    })
  }
}

export async function getProviderCounts(userId: User['id']) {
  return prisma.$queryRaw<ProviderCount[]>(
    Prisma.sql`select p.name, count(p.name) as count from "Provider" p 
    left join "ChargeEvent" c on c.provider = p.name and c."userId" = p.${userId} 
    and c.deletedAt is null
    group by p.name order by 2 desc`
  )
}

export async function addProvider(name: string, userId: User['id']) {
  return prisma.provider.create({
    data: { name, userId },
  })
}
