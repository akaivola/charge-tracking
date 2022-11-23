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
  deleteChargeEvent,
  getChargeEvents,
  updateChargeEvent
} from '~/models/chargeevents.server'
import { requireUserId } from '~/session.server'
import { logger } from '../../logger.server'
import type { Provider } from '../../models/providers.server'
import { getProviderCounts } from '../../models/providers.server'

dayjs.extend(customParseFormat)
dayjs.extend(utc)

function formatDay(dayjs: Dayjs) {
  return dayjs.format('DD.MM.YYYY')
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

  if ('delete' === _action) {
    const result = await deleteChargeEvent({
      userId,
      id: BigInt(values.id.toString()),
    })
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
  const newDate = oldDate.add(props.value, 'day')
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
  newEvent: () => void
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
    setDate(event?.date ?? format(new Date()))
    setKiloWattHours(event?.kiloWattHours ?? 0)
    setPrice(event?.pricePerCharge ?? 0)
    setProvider(event?.providerFK ?? _.first(providers))
  }, [event])

  return (
    <Form method="post">
      {event && (
        <input type="hidden" name="id" value={event.id?.toString()} readOnly />
      )}
      <div className="grid grid-cols-4">
        <div className="col-span-4 grid grid-cols-3">
          <div className="grid justify-self-center">
            <div className="grid w-full grid-cols-1">
              <DateAdjustButton value={1} getter={date} setter={setDate} />
            </div>
            <input
              type="text"
              className="bg-black"
              name="date"
              size={10}
              readOnly
              value={date}
            />
            <div className="grid w-full grid-cols-1">
              <DateAdjustButton value={-1} getter={date} setter={setDate} />
            </div>
          </div>
          <div className="grid justify-self-center">
            <div className="mr-2 grid grid-cols-2">
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
            <span className="grid grid-cols-2 items-center">
              <input
                type="text"
                className="justify-self-center bg-black text-center"
                name="kiloWattHours"
                size={6}
                onChange={(e) => setKiloWattHours(Number(e.target.value))}
                value={kiloWattHours}
              />{' '}
              <span className="select-none">kWh</span>
            </span>
            <div className="mr-2 grid grid-cols-2">
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
          </div>
          <div className="grid justify-self-center">
            <div className="grid grid-cols-2">
              <AdjustButton value={1} getter={price} setter={setPrice} />
              <AdjustButton value={0.1} getter={price} setter={setPrice} />
            </div>
            <span className="grid grid-cols-2 items-center">
              <input
                type="text"
                className="justify-self-center bg-black text-center"
                name="pricePerCharge"
                size={6}
                onChange={(e) => setPrice(Number(e.target.value))}
                value={price}
              />{' '}
              <span className="select-none">e</span>
            </span>
            <div className="grid grid-cols-2">
              <AdjustButton value={-1} getter={price} setter={setPrice} />
              <AdjustButton value={-0.1} getter={price} setter={setPrice} />
            </div>
          </div>
        </div>
        <div className="col-span-2 col-start-2 row-start-2 my-4 grid">
          <div className="dropdown-down dropdown justify-self-center">
            <input
              type="hidden"
              value={provider?.name || ''}
              name="provider"
              readOnly
            />
            <label
              tabIndex={0}
              className="btn btn-secondary btn-sm m-1 rounded p-2"
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
        <input
          type="button"
          defaultValue="Clear fields"
          onClick={(_) => props.newEvent()}
          className="btn btn-accent col-span-2 my-2 justify-self-center rounded px-2"
        />
        <input
          type="submit"
          name="_action"
          className="btn btn-accent col-span-2 my-2 justify-self-center rounded"
          readOnly
          value={mode}
        />
        <input
          type="submit"
          name="_action"
          className="btn btn-accent col-span-2 row-start-4 my-4 justify-self-center rounded"
          readOnly
          value="restore last"
        />
        {'update' === mode && (
          <input
            type="submit"
            name="_action"
            className="btn btn-accent col-span-2 col-start-3 row-start-4 my-4 justify-self-center rounded"
            readOnly
            value={'delete'}
          />
        )}
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
        <div>{total.kWh ?? 0} kWh</div>
        <div>{total.price ?? 0} e</div>
      </section>

      <section>
        <div>
          <ChargeEntry
            event={event}
            providers={providers}
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
