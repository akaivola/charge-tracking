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

export function upsertChargeEvent(
  chargeEvent: Omit<ChargeEvent, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: bigint
  }
) {
  // updatedAt could be used as an optimistic lock
  invariant(chargeEvent.userId, 'userId cannot be missing')
  return prisma.chargeEvent.upsert({
    where: { id: chargeEvent.id },
    update: { ..._.omit(chargeEvent, 'createdAt'), updatedAt: new Date() },
    create: _.omit(chargeEvent, 'createdAt', 'updatedAt', 'id'),
  })
}
