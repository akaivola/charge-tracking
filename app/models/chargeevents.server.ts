import type { User, ChargeEvent } from '@prisma/client'
import _ from 'lodash'

import { prisma } from '~/db.server'

export type { ChargeEvent } from '@prisma/client'

export function getChargeEvents({ userId }: { userId: User['id'] }) {
  return prisma.chargeEvent.findMany({
    where: { userId },
    select: {
      id: true,
      date: true,
      kiloWattHours: true,
      pricePerKiloWattHour: true,
      provider: true,
    },
    orderBy: { date: 'desc' },
  })
}

export function upsertChargeEvent(chargeEvent: ChargeEvent) {
  return prisma.chargeEvent.upsert({
    where: { id: chargeEvent.id },
    update: chargeEvent,
    create: chargeEvent,
  })
}
