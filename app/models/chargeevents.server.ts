import type { ChargeEvent, User } from '@prisma/client'
import _ from 'lodash'
import invariant from 'tiny-invariant'

import { prisma } from '~/db.server'

export type { ChargeEvent } from '@prisma/client'

export function getChargeEvents({ userId }: { userId: User['id'] }) {
  return prisma.chargeEvent.findMany({
    where: { userId },
    include: {
      providerFK: true,
    },
    orderBy: { date: 'desc' },
  })
}

export function createChargeEvent(
  chargeEvent: Omit<ChargeEvent, 'id' | 'createdAt' | 'updatedAt'>
) {
  return prisma.chargeEvent.create({
    data: chargeEvent,
  })
}

export async function updateChargeEvent(
  chargeEvent: Omit<ChargeEvent, 'createdAt' | 'updatedAt'>
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
  return prisma.chargeEvent.deleteMany({
    where: {
      id: chargeEvent.id,
      user: {
        id: chargeEvent.userId,
      },
    },
  })
}
