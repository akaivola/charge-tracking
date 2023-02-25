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
  updateChargeEvent,
} from '~/models/chargeevents.server'
import { requireUserId } from '~/session.server'
import ChargeEntry from '../../components/chargetracker/ChargeEntry'
import Stats from '../../components/chargetracker/stats'
import { logger } from '../../logger.server'
import { getProviderCounts } from '../../models/providers.server'
import { parse } from '../../utils'

type PromiseLoader = Awaited<ReturnType<typeof loader>>['typedjson']
type Loader = Awaited<ReturnType<PromiseLoader>>
export type SerializedChargeEvent = Loader['chargeEvents'][number]

export async function loader({ request }: LoaderArgs) {
  const url = new URL(request.url)
  const kwh = url.searchParams.get('kwh')

  const userId = await requireUserId(request)
  const chargeEvents = await getChargeEvents({ userId })
  const providers = await getProviderCounts(userId)
  const lastDeleted = await getLastDeletedChargeEvent({ userId }).then((ce) =>
    ce ? toSerializable(ce) : null
  )
  return typedjson({
    chargeEvents: chargeEvents.map(toSerializable),
    providers,
    lastDeleted: lastDeleted || null,
    initialChargeEvent: kwh
      ? ({
          kiloWattHours: _.toNumber(kwh),
        } as Partial<ReturnType<typeof toSerializable>>)
      : null,
  })
}

export async function action({ request }: ActionArgs) {
  const userId = await requireUserId(request)
  const formData = await request.formData()
  const { _action, ...values } = Object.fromEntries(formData)

  logger.info(`action: ${_action} ${JSON.stringify(values)}`)

  const { date, kiloWattHours, pricePerCharge, providerId } = values
  if ('insert' === _action) {
    const parsedDate = parse(date.toString())
    const result = await createChargeEvent({
      userId,
      date: parsedDate!.toDate(),
      kiloWattHours: new Prisma.Decimal(kiloWattHours.toString()),
      pricePerCharge: new Prisma.Decimal(pricePerCharge.toString()),
      providerId: parseInt(providerId.toString()),
    })

    return typedjson({ result })
  }

  if ('update' === _action) {
    const parsedDate = parse(date.toString())
    const result = await updateChargeEvent({
      id: BigInt(values.id.toString()),
      date: parsedDate!.toDate(),
      kiloWattHours: new Prisma.Decimal(kiloWattHours.toString()),
      pricePerCharge: new Prisma.Decimal(pricePerCharge.toString()),
      user: {
        id: userId,
      },
      provider: {
        id: parseInt(providerId.toString()),
      },
    })

    logger.info(JSON.stringify(result))
    return typedjson({ result })
  }

  if ('delete' === _action) {
    const result = await deleteChargeEvent({
      user: { id: userId },
      id: BigInt(values.id.toString()),
    })
    return typedjson({ result })
  }

  if ('restore last' === _action) {
    const lastDeleted = await getLastDeletedChargeEvent({ userId })
    if (lastDeleted) {
      const updated = updateChargeEvent({
        ...lastDeleted,
        deletedAt: null,
      })
      return typedjson({ updated })
    } else return typedjson({ error: 'unable to restore last deleted' })
  }

  return typedjson({ error: 'unknown action' })
}

export const meta: MetaFunction = () => {
  return {
    title: 'Charge Tracking',
    viewport: 'initial-scale=1,viewport-fit=cover',
  }
}

export default function ChargeTrackerIndexPage() {
  const { chargeEvents, providers, lastDeleted, initialChargeEvent } =
    useTypedLoaderData<typeof loader>()
  const [event, setEvent] = useState(
    (initialChargeEvent ?? {}) as Partial<SerializedChargeEvent>
  )

  return (
    <section>
      <Stats chargeEvents={chargeEvents} />
      <div>
        <ChargeEntry
          event={event}
          providers={providers}
          lastDeleted={lastDeleted}
          newEvent={() => setEvent({} as Partial<SerializedChargeEvent>)}
        />
      </div>
      <section className="md:text-md grid select-none grid-cols-12 gap-x-6">
        <div className="col-span-3">Date</div>
        <div className="col-span-2 text-right">kWh</div>
        <div className="col-span-2 text-right">e/ charge</div>
        <div className="col-span-2 text-right">e * kWh</div>
        <div className="col-span-3">Provider</div>
        {chargeEvents.map((anEvent) => {
          const { id, date, kiloWattHours, pricePerCharge, provider } = anEvent
          const isSelected = event && event.id === id
          return (
            <div
              key={id.toString()}
              className={`col-span-full grid cursor-pointer grid-cols-12 gap-x-6 py-2 text-xs md:text-base ${
                isSelected ? 'text-warning' : ''
              }`}
              onClick={(e) => {
                e.preventDefault()
                return setEvent(anEvent)
              }}
            >
              <div className="col-span-3">{date}</div>
              <div className="col-span-2 text-right">{kiloWattHours}</div>
              <div className="col-span-2 text-right">{pricePerCharge}</div>
              <div className="col-span-2 text-right">
                {_.round(pricePerCharge / kiloWattHours, 2)}
              </div>
              <div className="col-span-3">{provider.name}</div>
            </div>
          )
        })}
      </section>
    </section>
  )
}
