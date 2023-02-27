import type { ChargeEvent, Provider, User } from '@prisma/client'
import _ from 'lodash'
import invariant from 'tiny-invariant'
import type { Overwrite } from 'utility-types'

import { prisma } from '~/db.server'
import { format } from '../utils'

export type { ChargeEvent } from '@prisma/client'

const chargeEventSelect = {
  id: true,
  date: true,
  kiloWattHours: true,
  pricePerCharge: true,
  user: {
    select: {
      id: true,
    },
  },
  provider: {
    select: {
      id: true,
      name: true,
    },
  },
  deletedAt: true,
  updatedAt: true,
}

type ChargeEventSelect = keyof typeof chargeEventSelect
type Intersect = keyof ChargeEvent & ChargeEventSelect

export type SerializableChargeEvent = Pick<ChargeEvent, Intersect> & {
  provider: Provider
  user: Pick<User, 'id'>
}

export type ChargeEventUpdate = Overwrite<
  SerializableChargeEvent,
  {
    provider: { id: Provider['id'] }
    deletedAt?: Date | null
    updatedAt?: Date | null
  }
>

export type ChargeEventDelete = Overwrite<
  Pick<SerializableChargeEvent, 'id' | 'user'>,
  { user: { id: User['id'] } }
>

export function toSerializable(event: SerializableChargeEvent) {
  return {
    ...event,
    id: event.id,
    date: format(event.date),
    kiloWattHours: event.kiloWattHours.toNumber(),
    pricePerCharge: event.pricePerCharge.toNumber(),
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
    orderBy: [
      {
        date: 'desc',
      },
      { id: 'desc' },
    ],
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
  invariant(chargeEvent.providerId, 'providerId cannot be missing')
  return prisma.chargeEvent.create({
    data: {
      ..._.omit(chargeEvent, 'createdAt', 'updatedAt', 'deletedAt'),
      deletedAt: null,
    },
  })
}

export async function updateChargeEvent(chargeEvent: ChargeEventUpdate) {
  // updatedAt could be used as an optimistic lock
  invariant(chargeEvent.user.id, 'userId cannot be missing')
  invariant(chargeEvent.provider.id, 'providerId cannot be missing')
  return prisma.chargeEvent.updateMany({
    where: {
      id: chargeEvent.id,
      user: {
        id: chargeEvent.user.id,
      },
      provider: {
        id: chargeEvent.provider.id,
      },
    },
    data: { ..._.omit(chargeEvent, 'createdAt'), updatedAt: new Date() },
  })
}

export async function deleteChargeEvent(chargeEvent: ChargeEventDelete) {
  invariant(chargeEvent.id, 'id cannot be missing')
  invariant(chargeEvent.user.id, 'userId cannot be missing')
  return prisma.chargeEvent.updateMany({
    where: {
      id: chargeEvent.id,
      user: {
        id: chargeEvent.user.id,
      },
    },
    data: {
      updatedAt: new Date(),
      deletedAt: new Date(),
    },
  })
}
