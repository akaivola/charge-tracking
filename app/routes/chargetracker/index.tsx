import { Prisma } from '@prisma/client'
import type { ActionArgs, LoaderArgs, MetaFunction } from '@remix-run/node'
import { Form } from '@remix-run/react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import utc from 'dayjs/plugin/utc'
import _ from 'lodash'
import type { SyntheticEvent } from 'react'
import React, { useState } from 'react'
import { typedjson, useTypedLoaderData } from 'remix-typedjson'
import {
  createChargeEvent,
  getChargeEvents,
  updateChargeEvent,
} from '~/models/chargeevents.server'
import { requireUserId } from '~/session.server'
import { logger } from '../../logger.server'
import type { Provider } from '../../models/providers.server'
import { getProviderCounts } from '../../models/providers.server'

dayjs.extend(customParseFormat)
dayjs.extend(utc)

function formatDay(dayjs: Dayjs) {
  return dayjs.format('DD.MM.YYY')
}

function format(date: Date) {
  return dayjs.utc(date).format('DD.MM.YYYY')
}

function parse(dateStr: string) {
  return dayjs.utc(dateStr, 'DD.MM.YYYY')
}

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request)
  const rawChargeEvents = await getChargeEvents({ userId })
  const chargeEvents = rawChargeEvents.map((event) => ({
    ...event,
    id: event.id,
    date: format(event.date),
    kiloWattHours: event.kiloWattHours.toNumber(),
    pricePerCharge: event.pricePerCharge.toNumber(),
    providerFK: event.providerFK,
  }))
  const providers = await getProviderCounts(userId)
  return typedjson({ chargeEvents, providers })
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
      date: parsedDate.toDate(),
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
      date: parsedDate.toDate(),
      kiloWattHours: new Prisma.Decimal(kiloWattHours.toString()),
      pricePerCharge: new Prisma.Decimal(pricePerCharge.toString()),
      provider: provider.toString(),
    })

    logger.info(JSON.stringify(result))
    return typedjson({ result })
  }

  return typedjson({ error: 'unknown action' })
}

export const meta: MetaFunction = () => {
  return {
    title: 'Charge Tracking',
  }
}

function AdjustButton(props: {
  value: number
  getter: number
  setter: (newValue: number) => unknown
}) {
  const onClick = (_e: SyntheticEvent) =>
    props.setter(Math.max(0, _.round(props.getter + props.value, 2)))
  return (
    <input
      type="button"
      onClick={onClick}
      className="btn btn-primary btn-sm m-1 rounded p-1"
      value={props.value}
    />
  )
}
function DateAdjustButton(props: {
  value: number
  getter: string
  setter: (newValue: string) => unknown
}) {
  const oldDate = parse(props.getter)
  const newDate = oldDate.add(1, 'day')
  const onClick = (_e: SyntheticEvent) => props.setter(formatDay(newDate))
  return (
    <input
      type="button"
      onClick={onClick}
      className="btn btn-primary btn-sm m-1 rounded p-1"
      value={props.value}
    />
  )
}

type PromiseLoader = Awaited<ReturnType<typeof loader>>['typedjson']
type Loader = Awaited<ReturnType<PromiseLoader>>
type SerializedChargeEvent = Loader['chargeEvents'][number]

interface ChargeEntryProps {
  providers: Provider[]
  event?: Partial<SerializedChargeEvent>
}

function ChargeEntry(props: ChargeEntryProps) {
  const { providers, event } = props
  const mode = event?.id ? 'update' : 'insert'

  const [date, setDate] = useState(event?.date ?? format(new Date()))
  const [kiloWattHours, setKiloWattHours] = useState(event?.kiloWattHours ?? 0)
  const [price, setPrice] = useState(event?.pricePerCharge ?? 0)
  const [provider, setProvider] = useState(
    event?.providerFK ?? _.first(providers)
  )

  React.useEffect(() => {
    if (event?.id) {
      setDate(event?.date!)
      setKiloWattHours(event?.kiloWattHours!)
      setPrice(event?.pricePerCharge!)
      setProvider(event?.providerFK)
    }
  }, [event])

  return (
    <Form method="post">
      <input type="hidden" name="_action" value={mode} readOnly />
      {event && (
        <input type="hidden" name="id" value={event.id?.toString()} readOnly />
      )}
      <div className="grid grid-cols-4">
        <div className="grid justify-self-center">
          <div className="grid w-1/2 grid-cols-1">
            <DateAdjustButton value={-1} getter={date} setter={setDate} />
          </div>
          <input
            type="text"
            className="bg-black"
            name="date"
            size={10}
            value={date}
          />
          <div className="grid w-1/2 grid-cols-1">
            <DateAdjustButton value={1} getter={date} setter={setDate} />
          </div>
        </div>
        <div className="grid justify-self-center">
          <div className="grid grid-cols-2">
            <AdjustButton
              value={-1}
              getter={kiloWattHours}
              setter={setKiloWattHours}
            />
            <AdjustButton
              value={-0.1}
              getter={kiloWattHours}
              setter={setKiloWattHours}
            />
          </div>
          <span className="grid grid-cols-2 items-center">
            <input
              type="text"
              className="justify-self-center bg-black text-center"
              name="kiloWattHours"
              size={6}
              value={kiloWattHours}
            />{' '}
            kWh
          </span>
          <div className="grid grid-cols-2">
            <AdjustButton
              value={1}
              getter={kiloWattHours}
              setter={setKiloWattHours}
            />
            <AdjustButton
              value={0.1}
              getter={kiloWattHours}
              setter={setKiloWattHours}
            />
          </div>
        </div>
        <div className="grid justify-self-center">
          <div className="grid grid-cols-2">
            <AdjustButton value={-1} getter={price} setter={setPrice} />
            <AdjustButton value={-0.1} getter={price} setter={setPrice} />
          </div>
          <span className="grid grid-cols-2 items-center">
            <input
              type="text"
              className="justify-self-center bg-black text-center"
              name="pricePerCharge"
              size={6}
              value={price}
            />{' '}
            e
          </span>
          <div className="grid grid-cols-2">
            <AdjustButton value={1} getter={price} setter={setPrice} />
            <AdjustButton value={0.1} getter={price} setter={setPrice} />
          </div>
        </div>
        <div className="grid grid-rows-3">
          <div className="dropdown dropdown-left row-start-1">
            <input
              type="hidden"
              value={provider?.name || ''}
              name="provider"
              readOnly
            />
            <label
              tabIndex={0}
              className="btn btn-primary btn-sm m-1 rounded p-1"
            >
              {provider?.name || '???'}
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content menu w-52 rounded bg-base-100 p-2 shadow"
            >
              {providers.map((p) => (
                <li key={p.name} className="rounded">
                  <a onClick={() => setProvider(p)}>{p.name}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-primary col-span-4 my-4 justify-self-center rounded"
          value={mode}
        >
          {mode}
        </button>
      </div>
    </Form>
  )
}

export default function ChargeTrackerIndexPage() {
  const { chargeEvents, providers } = useTypedLoaderData<typeof loader>()
  const [event, setEvent] = useState({} as SerializedChargeEvent)

  const total = chargeEvents.reduce(
    ({ kWh, price, count }, ce) => {
      return {
        kWh: _.round(kWh + ce.kiloWattHours, 2),
        price: _.round(price + ce.pricePerCharge, 2),
        count: count + 1,
      }
    },
    { kWh: 0, price: 0, count: 0 }
  )

  return (
    <main className="container mx-auto p-4">
      <section className="my-2 grid grid-cols-3 text-lg font-bold">
        <div>{total.count} charges</div>
        <div>{total.kWh ?? 0}kWh</div>
        <div>{total.price ?? 0}e</div>
      </section>

      <section>
        <div>
          New Entry
          <ChargeEntry event={event} providers={providers} />
        </div>
        <div className="md:text-md grid grid-cols-12 gap-y-3 gap-x-6 sm:text-xs lg:text-lg">
          <div className="col-span-3">Date</div>
          <div className="col-span-2 text-right">kWh</div>
          <div className="col-span-2 text-right">e/ charge</div>
          <div className="col-span-2 text-right">e * kWh</div>
          <div className="col-span-3">Provider</div>
          {chargeEvents.map((event) => {
            const { id, date, kiloWattHours, pricePerCharge, provider } = event
            return (
              <React.Fragment key={id}>
                <div
                  onClick={(_) => setEvent(event)}
                  className="col-span-3 cursor-pointer"
                >
                  {date}
                </div>
                <div
                  onClick={(_) => setEvent(event)}
                  className="col-span-2 text-right"
                >
                  {kiloWattHours}
                </div>
                <div
                  onClick={(_) => setEvent(event)}
                  className="col-span-2 text-right"
                >
                  {pricePerCharge}
                </div>
                <div
                  onClick={(_) => setEvent(event)}
                  className="col-span-2 text-right"
                >
                  {_.round(pricePerCharge / kiloWattHours, 2)}
                </div>
                <div onClick={(_) => setEvent(event)} className="col-span-3">
                  {provider}
                </div>
              </React.Fragment>
            )
          })}
        </div>
      </section>
    </main>
  )
}
