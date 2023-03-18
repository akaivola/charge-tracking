import type {
  ChargeEvent as PrismaChargeEvent,
  Provider,
  User,
} from '@prisma/client'
import _, { compact } from 'lodash'
import invariant from 'tiny-invariant'
import type { Overwrite } from 'utility-types'

import { prisma } from '~/db.server'

export type ChargeEvent = Overwrite<
  PrismaChargeEvent,
  {
    kiloWattHours: number
    pricePerCharge: number
  }
>

type ProviderAndUser = {
  provider: Provider
  user: User
}

type PrismaChargeEventRelation = PrismaChargeEvent & ProviderAndUser

export type ChargeEventRelation = ChargeEvent & ProviderAndUser

export type ChargeEventUpdate = Omit<ChargeEvent, 'updatedAt' | 'createdAt'>
export type ChargeEventDelete = Pick<ChargeEventRelation, 'id' | 'userId'>

const convertDecimalToNumber = (
  event: PrismaChargeEventRelation | null
): ChargeEventRelation | null => {
  if (!event) return null
  return {
    ...event,
    kiloWattHours: event.kiloWattHours.toNumber(),
    pricePerCharge: event.pricePerCharge.toNumber(),
  }
}

const convertDecimalsToNumbers = (
  events: PrismaChargeEventRelation[]
): ChargeEventRelation[] => compact(events.map(convertDecimalToNumber))

export async function getChargeEvents({
  userId,
}: {
  userId: User['id']
}): Promise<ChargeEventRelation[]> {
  return prisma.chargeEvent
    .findMany({
      include: {
        provider: true,
        user: true,
      },
      where: {
        userId,
        deletedAt: {
          equals: null,
        },
      },
      orderBy: [
        {
          date: 'desc',
        },
        { id: 'desc' },
      ],
    })
    .then(convertDecimalsToNumbers)
}

export async function getLastDeletedChargeEvent({
  userId,
}: {
  userId: User['id']
}): Promise<ChargeEventRelation | null> {
  return await prisma.chargeEvent
    .findFirst({
      include: {
        provider: true,
        user: true,
      },
      where: {
        userId,
        deletedAt: {
          not: null,
        },
      },
      orderBy: {
        deletedAt: 'desc',
      },
    }).then(convertDecimalToNumber)
}

export function createChargeEvent(
  chargeEvent: Omit<ChargeEvent, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
) {
  invariant(chargeEvent.providerId, 'providerId cannot be missing')
  return prisma.chargeEvent.create({
    data: {
      ..._.omit(chargeEvent, 'id', 'createdAt', 'updatedAt', 'deletedAt'),
      deletedAt: null,
    },
  })
}

export async function updateChargeEvent(chargeEvent: ChargeEventUpdate) {
  // updatedAt could be used as an optimistic lock
  invariant(chargeEvent.id, 'id cannot be missing')
  invariant(chargeEvent.userId, 'userId cannot be missing')
  invariant(chargeEvent.providerId, 'providerId cannot be missing')
  return prisma.chargeEvent.updateMany({
    where: {
      id: chargeEvent.id,
      userId: chargeEvent.userId,
    },
    data: {
      ..._.omit(chargeEvent, 'id', 'createdAt', 'userId'),
      updatedAt: new Date(),
    },
  })
}

export async function deleteChargeEvent(chargeEvent: ChargeEventDelete) {
  invariant(chargeEvent.id, 'id cannot be missing')
  invariant(chargeEvent.userId, 'userId cannot be missing')
  return prisma.chargeEvent.updateMany({
    where: {
      id: chargeEvent.id,
      userId: chargeEvent.userId,
    },
    data: {
      updatedAt: new Date(),
      deletedAt: new Date(),
    },
  })
}
