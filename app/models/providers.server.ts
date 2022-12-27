import type { Provider } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { prisma } from '~/db.server'

import type { User } from '~/models/user.server'
export type { Provider } from '@prisma/client'

const providers = [
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

export async function initializeProviders() {
  const count = await prisma.provider.count()
  if (count === 0) {
    await prisma.provider.createMany({
      data: providers.map((p) => {
        return { name: p! }
      }),
    })
  }
}

export async function getProviderCounts(userId: User['id']) {
  return prisma.$queryRaw<ProviderCount[]>(
    Prisma.sql`select p.name, count(p.name) as count from "Provider" p left join "ChargeEvent" c on c.provider = p.name and c."userId" = ${userId} group by p.name order by 2 desc`
  )
}

initializeProviders().then(() => console.log('providers initialized'))
