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
].map((name) => ({ name }))

export type ProviderCount = Provider & { count: number }

export async function getProviders(userId: User['id'] | number) {
  return prisma.provider.findMany({
    where: { userId },
    select: { id: true, name: true },
  })
}

/**
 * Retrieves the count of providers associated with a user.
 *
 * @param {User['id'] | number} userId - The ID of the user to retrieve the provider count for.
 *
 * @returns {ProviderCount[]} An array of objects containing the provider ID, name, user ID, and count.
 */
export async function getProviderCounts(userId: User['id'] | number) {
  return prisma.$queryRaw<ProviderCount[]>(
    Prisma.sql`select p.id, p.name, p."userId", count(p.name) as count from "Provider" p 
    left join "ChargeEvent" c on c."providerId" = p.id and c."userId" = ${userId} 
    and c."deletedAt" is null
    where p."userId" = ${userId}
    group by p.id, p.name order by 2 desc`
  )
}

export async function createDefaultProviders(userId: User['id'] | number) {
  return prisma.provider.createMany({
    data: defaultProviders.map((provider) => ({
      ...provider,
      userId,
    })),
  })
}

export async function addProvider(name: string, userId: User['id'] | number) {
  const existingProvider = await prisma.provider.findFirst({
    select: {
      id: true,
      name: true,
    },
    where: {
      name,
      userId,
    },
  })

  // If the provider exists, skip adding it
  if (existingProvider) {
    throw `Provider ${name} exists`
  }

  // If the provider does not exist, create it
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

/**
 * Removes a provider from the database.
 *
 * @param {string} name - The name of the provider to be removed.
 * @param {User['id'] | number} userId - The ID of the user associated with the provider.
 *
 * @throws {string} - If the provider has existing charge events, an error is thrown.
 *
 * @returns {Promise<void>} - A promise that resolves when the provider is successfully removed.
 */
export async function removeProvider(
  name: string,
  userId: User['id'] | number
) {
  const chargeEventsCount = await prisma.chargeEvent.count({
    where: {
      provider: {
        name,
        userId,
      },
      deletedAt: null,
    },
  })

  if (chargeEventsCount > 0) {
    throw 'Cannot delete provider with existing charge events'
  }

  return prisma.provider.deleteMany({
    where: {
      name,
      userId,
    },
  })
}
