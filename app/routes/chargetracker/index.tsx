import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import _ from 'lodash'
import { useState } from 'react'
import { typedjson, useTypedLoaderData } from 'remix-typedjson'
import type { ChargeEventRelation } from '~/models/chargeevents.server'
import {
  createChargeEvent,
  deleteChargeEvent,
  getChargeEvents,
  getLastDeletedChargeEvent,
  updateChargeEvent,
} from '~/models/chargeevents.server'
import { requireUserId } from '~/session.server'
import ChargeEntry from '../../components/chargetracker/ChargeEntry'
import Stats from '../../components/chargetracker/stats'
import { logger } from '../../logger.server'
import { getProviderCounts } from '../../models/providers.server'
import { format, parse } from '../../utils'

export async function loader({ request }: LoaderArgs) {
  const url = new URL(request.url)
  const kWh = url.searchParams.get('kWh')

  const userId = await requireUserId(request)
  const chargeEvents = await getChargeEvents({ userId })
  const providers = await getProviderCounts(userId).then((p) =>
    p.map(({ id, name, userId }) => ({
      id,
      name,
      userId,
    }))
  )

  const lastDeleted = await getLastDeletedChargeEvent({ userId })
  return typedjson({
    chargeEvents,
    providers,
    lastDeleted: lastDeleted || null,
    initialChargeEvent: kWh
      ? ({
          kiloWattHours: parseFloat(kWh),
        } as Partial<ChargeEventRelation>)
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
      kiloWattHours: parseFloat(kiloWattHours.toString()),
      pricePerCharge: parseFloat(pricePerCharge.toString()),
      providerId: parseInt(providerId.toString()),
    })

    return typedjson({ result })
  }

  if ('update' === _action) {
    const parsedDate = parse(date.toString())
    const result = await updateChargeEvent({
      id: BigInt(values.id.toString()),
      date: parsedDate!.toDate(),
      kiloWattHours: parseFloat(kiloWattHours.toString()),
      pricePerCharge: parseFloat(pricePerCharge.toString()),
      userId,
      providerId: parseInt(providerId.toString()),
      deletedAt: null,
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
      const updated = updateChargeEvent({
        ...lastDeleted,
        deletedAt: null,
      })
      return typedjson({ updated })
    } else return typedjson({ error: 'unable to restore last deleted' })
  }

  return typedjson({ error: 'unknown action' })
}

export default function ChargeTrackerIndexPage() {
  const { chargeEvents, providers, lastDeleted, initialChargeEvent } =
    useTypedLoaderData<typeof loader>()
  const [event, setEvent] = useState(initialChargeEvent ?? {})

  return (
    <section>
      <Stats chargeEvents={chargeEvents} />
      <div>
        <ChargeEntry
          event={event}
          providers={providers}
          lastDeleted={lastDeleted}
          newEvent={() => setEvent({} as Partial<ChargeEventRelation>)}
        />
      </div>
      <section
        data-test-id="chargeEventsTable"
        className="md:text-md grid select-none grid-cols-12 gap-x-6"
      >
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
              className={`table-item col-span-full grid cursor-pointer grid-cols-12 gap-x-6 py-2 text-xs md:text-base ${
                isSelected ? 'text-warning' : ''
              }`}
              onClick={(e) => {
                e.preventDefault()
                return setEvent(anEvent)
              }}
            >
              <div className="col-span-3">{format(date)}</div>
              <div className="col-span-2 text-right">
                {_.round(kiloWattHours, 2)}
              </div>
              <div className="col-span-2 text-right">
                {_.round(pricePerCharge, 2)}
              </div>
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
