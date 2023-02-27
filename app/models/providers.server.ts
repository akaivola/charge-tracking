import type { Provider } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { prisma } from '~/db.server'

import type { User } from '~/models/user.server'
export type { Provider } from '@prisma/client'

// const defaultProviders = [
//   'abc',
//   'virta',
//   'recharge',
//   'office',
//   'k-lataus',
//   'lidl',
//   'ikea',
//   'home',
//   'plugit',
//   'other',
// ]

export type ProviderCount = Omit<Provider, 'userId'> & { count: number }

export async function getProviders(userId: User['id'] | number) {
  return prisma.provider.findMany({
    where: { userId },
    select: { id: true, name: true },
  })
}

export async function getProviderCounts(userId: User['id'] | number) {
  return prisma.$queryRaw<ProviderCount[]>(
    Prisma.sql`select p.id, p.name, count(p.name) as count from "Provider" p 
    left join "ChargeEvent" c on c."providerId" = p.id and c."userId" = ${userId} 
    and c."deletedAt" is null
    group by p.id, p.name order by 2 desc`
  )
}

export async function addProvider(name: string, userId: User['id'] | number) {
  return prisma.provider.create({
    select: {
      id: true,
      name: true,
    },
    data: {
      name,
      user: {
        connect: { id: userId },
      },
    },
  })
}
