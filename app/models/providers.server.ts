import type { Provider } from '@prisma/client';
import { Prisma } from '@prisma/client'
import { prisma } from '~/db.server'

import type { User } from '~/models/user.server'
export type { Provider } from '@prisma/client'

export async function getProviderCounts(userId: User['id']) {
  return prisma.$queryRaw<Provider[]>(
    Prisma.sql`select p.name, count(p.name) as count from "Provider" p left join "ChargeEvent" c on c.provider = p.name and c."userId" = ${userId} group by p.name order by 2 desc`)
}