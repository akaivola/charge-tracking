import { Prisma } from '@prisma/client'
import type { ActionArgs, LoaderArgs, MetaFunction } from '@remix-run/node'
import _ from 'lodash'
import { useState } from 'react'
import { typedjson, useTypedLoaderData } from 'remix-typedjson'
import {
  createChargeEvent,
  deleteChargeEvent,
  getChargeEvents,
  getLastDeletedChargeEvent,
  toSerializable,
  updateChargeEvent
} from '~/models/chargeevents.server'
import { requireUserId } from '~/session.server'
import ChargeEntry from '../../components/chargetracker/ChargeEntry'
import { Stats } from '../../components/chargetracker/stats'
import { logger } from '../../logger.server'
import { getProviderCounts } from '../../models/providers.server'
import { parse } from '../../utils'

type PromiseLoader = Awaited<ReturnType<typeof loader>>['typedjson']
type Loader = Awaited<ReturnType<PromiseLoader>>
export type SerializedChargeEvent = Loader['chargeEvents'][number]

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request)
  const rawChargeEvents = await getChargeEvents({ userId })
  const chargeEvents = rawChargeEvents
  const providers = (await getProviderCounts(userId)).map((p) => ({
    name: p.name,
  }))
  const lastDeleted = await getLastDeletedChargeEvent({ userId })
  return typedjson({
    chargeEvents: chargeEvents.map(toSerializable),
    providers,
    lastDeleted: lastDeleted ? toSerializable(lastDeleted) : null,
  })
}

export async function action({ request }: ActionArgs) {
  const userId = await requireUserId(request)
  const formData = await request.formData()
  const { _action, ...values } = Object.fromEntries(formData)

  logger.info(`action: ${_action} ${JSON.stringify(values)}`)

  const { date, kiloWattHours, pricePerCharge, provider } = values
  if ('insert' === _action) {
    const parsedDate = parse(date.toString())
    const result = await createChargeEvent({
      userId,
      date: parsedDate!.toDate(),
      kiloWattHours: new Prisma.Decimal(kiloWattHours.toString()),
      pricePerCharge: new Prisma.Decimal(pricePerCharge.toString()),
      provider: provider.toString(),
    })

    return typedjson({ result })
  }

  if ('update' === _action) {
    const parsedDate = parse(date.toString())
    const result = await updateChargeEvent({
      userId,
      id: BigInt(values.id.toString()),
      date: parsedDate!.toDate(),
      kiloWattHours: new Prisma.Decimal(kiloWattHours.toString()),
      pricePerCharge: new Prisma.Decimal(pricePerCharge.toString()),
      provider: provider.toString(),
    })

    logger.info(JSON.stringify(result))
    return typedjson({ result })
  }

  if ('delete' === _action) {
    const result = await deleteChargeEvent({
      userId,
      id: BigInt(values.id.toString()),
    })
    return typedjson({ result })
  }

  if ('restore last' === _action) {
    const lastDeleted = await getLastDeletedChargeEvent({ userId })
    if (lastDeleted) {
      const { date, kiloWattHours, pricePerCharge, id, userId, providerFK } =
        lastDeleted
      const updated = updateChargeEvent({
        id,
        userId,
        date,
        kiloWattHours,
        pricePerCharge,
        deletedAt: null,
        provider: providerFK.name,
      })
      return typedjson({ updated })
    } else return typedjson({ error: 'unable to restore last deleted' })
  }

  return typedjson({ error: 'unknown action' })
}

export const meta: MetaFunction = () => {
  return {
    title: 'Charge Tracking',
  }
}

type Tab = 'info' | 'calculator'

export default function ChargeTrackerIndexPage() {
  const { chargeEvents, providers, lastDeleted } =
    useTypedLoaderData<typeof loader>()
  const [event, setEvent] = useState({} as SerializedChargeEvent)
  const [tab, setTab] = useState('info' as Tab)

  return (
    <main className="container bg-black mx-auto p-4">
      <Stats chargeEvents={chargeEvents} />

      <section>
        <div>
          <ChargeEntry
            event={event}
            providers={providers}
            lastDeleted={lastDeleted}
            newEvent={() => setEvent({} as SerializedChargeEvent)}
          />
        </div>
        <section className="md:text-md grid grid-cols-12 gap-x-6">
          <div className="col-span-3">Date</div>
          <div className="col-span-2 text-right">kWh</div>
          <div className="col-span-2 text-right">e/ charge</div>
          <div className="col-span-2 text-right">e * kWh</div>
          <div className="col-span-3">Provider</div>
          {chargeEvents.map((anEvent) => {
            const { id, date, kiloWattHours, pricePerCharge, providerFK } =
              anEvent
            const isSelected = event && event.id === id
            return (
              <div
                key={id.toString()}
                className={`col-span-full grid cursor-pointer grid-cols-12 gap-x-6 py-2 text-xs md:text-base ${
                  isSelected ? 'text-warning' : ''
                }`}
                onClick={() => setEvent(anEvent)}
              >
                <div className="col-span-3">{date}</div>
                <div className="col-span-2 text-right">{kiloWattHours}</div>
                <div className="col-span-2 text-right">{pricePerCharge}</div>
                <div className="col-span-2 text-right">
                  {_.round(pricePerCharge / kiloWattHours, 2)}
                </div>
                <div className="col-span-3">{providerFK.name}</div>
              </div>
            )
          })}
        </section>
      </section>
    </main>
  )
}
