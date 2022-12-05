import type {
  ChargeEvent, Provider,
  User
} from '@prisma/client'
import _ from 'lodash'
import invariant from 'tiny-invariant'

import { prisma } from '~/db.server'
import { format } from '../utils'

export type { ChargeEvent } from '@prisma/client'

const chargeEventSelect = {
  id: true,
  date: true,
  kiloWattHours: true,
  pricePerCharge: true,
  userId: true,
  providerFK: {
    select: {
      name: true,
    },
  },
}

type FK = { providerFK: Provider }
type ChargeEventSelect = Exclude<keyof typeof chargeEventSelect, keyof FK>
export type SerializableChargeEvent = Required<
  Pick<Partial<ChargeEvent>, ChargeEventSelect>
> &
  FK

export function toSerializable(event: SerializableChargeEvent) {
  return {
    ...event,
    id: event.id,
    date: format(event.date),
    kiloWattHours: event.kiloWattHours.toNumber(),
    pricePerCharge: event.pricePerCharge.toNumber(),
    providerFK: event.providerFK,
  }
}

export async function getChargeEvents({
  userId,
}: {
  userId: User['id']
}): Promise<SerializableChargeEvent[]> {
  return prisma.chargeEvent.findMany({
    select: chargeEventSelect,
    where: {
      userId,
      deletedAt: {
        equals: null,
      },
    },
    orderBy: {
      date: 'desc',
    },
  })
}

export function getLastDeletedChargeEvent({
  userId,
}: {
  userId: User['id']
}): Promise<SerializableChargeEvent | null> {
  return prisma.chargeEvent.findFirst({
    select: chargeEventSelect,
    where: {
      userId,
      deletedAt: {
        not: null,
      },
    },
    orderBy: {
      deletedAt: 'desc',
    },
  })
}

export function createChargeEvent(
  chargeEvent: Omit<ChargeEvent, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
) {
  return prisma.chargeEvent.create({
    data: chargeEvent,
  })
}

export async function updateChargeEvent(
  chargeEvent: Omit<ChargeEvent, 'createdAt' | 'updatedAt' | 'deletedAt'>
) {
  // updatedAt could be used as an optimistic lock
  invariant(chargeEvent.userId, 'userId cannot be missing')
  return prisma.chargeEvent.updateMany({
    where: {
      id: chargeEvent.id,
      user: {
        id: chargeEvent.userId,
      },
    },
    data: { ..._.omit(chargeEvent, 'createdAt'), updatedAt: new Date() },
  })
}

export async function deleteChargeEvent(
  chargeEvent: Pick<ChargeEvent, 'id' | 'userId'>
) {
  invariant(chargeEvent.id, 'id cannot be missing')
  invariant(chargeEvent.userId, 'userId cannot be missing')
  return prisma.chargeEvent.updateMany({
    where: {
      id: chargeEvent.id,
      user: {
        id: chargeEvent.userId,
      },
    },
    data: {
      updatedAt: new Date(),
      deletedAt: new Date(),
    },
  })
}
