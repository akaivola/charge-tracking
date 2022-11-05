import type { ChargeEvent} from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { ActionArgs, LoaderArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useFetcher, useLoaderData } from '@remix-run/react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc'
import _ from 'lodash';
import type { SyntheticEvent } from 'react';
import { useState } from 'react';
import { createChargeEvent, getChargeEvents } from '~/models/chargeevents.server';
import { requireUserId } from '~/session.server';
import { logger } from '../../logger.server';
import type { Provider } from '../../models/providers.server';
import { getProviderCounts } from '../../models/providers.server';

dayjs.extend(customParseFormat)
dayjs.extend(utc)

function format(date: Date) {
  return dayjs.utc(date).format('DD.MM.YYYY')
}

function parse(dateStr: string) {
  return dayjs.utc(dateStr, 'DD.MM.YYYY').toDate()
}

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request)
  const rawChargeEvents = await getChargeEvents({ userId })
  const chargeEvents = rawChargeEvents.map(event => ({
    ...event,
    id: event.id,
    date: format(event.date),
    kiloWattHours: event.kiloWattHours.toNumber(),
    pricePerCharge: event.pricePerCharge.toNumber(),
    providerFK: event.providerFK
  }))
  const providers = (await getProviderCounts(userId))
  return json({ chargeEvents, providers })
}

export async function action({request}: ActionArgs) {
  const userId = await requireUserId(request)
  const formData = await request.formData()
  const { _action, ...values } = Object.fromEntries(formData)

  logger.info(`action: ${_action} ${JSON.stringify(values)}`)

  if ('new' === _action) {
    const { date, kiloWattHours, pricePerCharge, provider } = values

    const parsedDate = parse(date.toString())
    logger.info(`parsedDate ${date} ${parsedDate}`)

    const result = await createChargeEvent({
      userId,
      date: parsedDate,
      kiloWattHours: new Prisma.Decimal(kiloWattHours.toString()), 
      pricePerCharge: new Prisma.Decimal(pricePerCharge.toString()),
      provider: provider.toString()
    })

    logger.info(JSON.stringify(result))
  }

  return null
}

export const meta: MetaFunction = () => {
  return {
    title: 'Charge Tracking',
  }
}

function AdjustButton(props: { value: number, getter: number, setter: (newValue: number) => unknown}) {
  const onClick = (_e: SyntheticEvent) => props.setter(Math.max(0, _.round(props.getter + props.value, 2)))
  return (
    <input type='button' onClick={onClick} className='btn btn-sm btn-primary rounded p-1 m-1' value={props.value} />
  )
}
function DateAdjustButton(props: { value: number, getter: Date, setter: (newValue: Date) => unknown}) {
  const oldDate = props.getter
  const newDate = new Date(oldDate.getFullYear(), oldDate.getMonth(), oldDate.getDate() + props.value)
  const onClick = (_e: SyntheticEvent) => props.setter(newDate)
  return (
    <input type='button' onClick={onClick} className='btn btn-sm btn-primary rounded p-1 m-1' value={props.value} />
  )
}

interface ChargeEntryProps {
  providers: Provider[]
  event?: ChargeEvent & { providerFK: Provider }
}

function ChargeEntry(props: ChargeEntryProps) {
  const { providers, event } = props
  const mode = event ? 'update' : 'insert'

  const [date, setDate] = useState(event?.date ?? new Date())
  const [kiloWattHours, setKiloWattHours] = useState(event?.kiloWattHours.toNumber() ?? 0)
  const [price, setPrice] = useState(event?.pricePerCharge.toNumber() ?? 0)
  const [provider, setProvider] = useState(event?.providerFK ?? _.first(providers))

  return (
    <Form method='post'>
      <input type='hidden' name='_action' value={mode} readOnly />
      {event && <input type='hidden' name='id' value={event.id.toString()} readOnly /> }
      <div className='grid grid-cols-4'>
        <div className='justify-self-center grid'>
          <div className='grid grid-cols-1 w-1/2'>
            <DateAdjustButton value={-1} getter={date} setter={setDate} />
          </div>
          <input type='text' className='bg-black' name='date' size={10} value={format(date)}/>
          <div className='grid grid-cols-1 w-1/2'>
            <DateAdjustButton value={1} getter={date} setter={setDate} />
          </div>
        </div>
        <div className='justify-self-center grid'>
          <div className='grid grid-cols-2'>
            <AdjustButton value={-1} getter={kiloWattHours} setter={setKiloWattHours} />
            <AdjustButton value={-0.1} getter={kiloWattHours} setter={setKiloWattHours} />
          </div>
          <span className='grid grid-cols-2 items-center'>
            <input type='text' className='bg-black justify-self-center text-center' name='kiloWattHours' size={6} value={kiloWattHours}/>{' '}kWh
          </span>
          <div className='grid grid-cols-2'>
            <AdjustButton value={1} getter={kiloWattHours} setter={setKiloWattHours} />
            <AdjustButton value={0.1} getter={kiloWattHours} setter={setKiloWattHours} />
          </div>
        </div>
        <div className='justify-self-center grid'>
          <div className='grid grid-cols-2'>
            <AdjustButton value={-1} getter={price} setter={setPrice} />
            <AdjustButton value={-0.1} getter={price} setter={setPrice} />
          </div>
          <span className='grid grid-cols-2 items-center'>
            <input type='text' className='bg-black justify-self-center text-center' name='pricePerCharge' size={6} value={price}/>{' '}e
          </span>
          <div className='grid grid-cols-2'>
            <AdjustButton value={1} getter={price} setter={setPrice} />
            <AdjustButton value={0.1} getter={price} setter={setPrice} />
          </div>
        </div>
        <div className='grid grid-rows-3'>
          <div className='dropdown dropdown-left row-start-1'>
            <input type='hidden' value={provider?.name || ''} name='provider' readOnly />
            <label tabIndex={0} className='btn btn-sm btn-primary rounded p-1 m-1'>{provider?.name || '???'}</label>
            <ul tabIndex={0} className='dropdown-content menu p-2 shadow bg-base-100 rounded w-52'>
              { providers.map(p =>
                <li key={p.name} className='rounded'><a onClick={() => setProvider(p)}>{p.name}</a></li>
              )}
            </ul>
          </div>
        </div>
        <button type='submit' 
          className='my-4 col-span-4 justify-self-center btn btn-primary rounded' 
          value={mode}>{mode}</button>
      </div>
    </Form>
  )
}

export default function ChargeTrackerIndexPage() {
  const { chargeEvents, providers } = useLoaderData<typeof loader>()
  const { state, type, submission, data, submit, load } = useFetcher()
  console.log(state, type, submission, data)

  const total = chargeEvents.reduce(({kWh, price, count}, ce) => {
    return {
      kWh: _.round(kWh + ce.kiloWattHours, 2),
      price: _.round(price + ce.pricePerCharge, 2),
      count: count + 1,
    }
  }, {kWh: 0, price: 0, count: 0})

  return (
    <div className='container mx-auto p-4'>
      <div className='grid grid-cols-3 my-2 text-lg font-bold'>
        <div>
          {total.count} charges
        </div>
        <div>
          {total.kWh ?? 0}kWh
        </div>
        <div>
          {total.price ?? 0}e
        </div>
      </div>
      <table className='table-auto border-collapse cursor-pointer touch-pinch-zoom container mx-auto box-content text-xs'>
        <thead>
          <tr>
            <th>Date</th>
            <th>kWh</th>
            <th>e / charge</th>
            <th>e * kWh</th>
            <th>Provider</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={5}>
              <ChargeEntry providers={providers} />
            </td>
          </tr>
        { chargeEvents.map(
          ({ id, date, kiloWattHours, pricePerCharge, provider }) => {
            return (
              <tr key={`tr-${id}`}>
                <td className='py-1 pr-1'>
                  {date}
                </td>
                <td className='text-right px-1'>
                  {kiloWattHours}
                </td>
                <td className='text-right px-1'>
                  {pricePerCharge}
                </td> 
                <td className='text-right px-1'>
                  {_.round(pricePerCharge / kiloWattHours, 2)}
                </td> 
                <td className='pl-2'>
                  {provider}
                </td>
                <td>
                  <input type='button' className='btn btn-outline  btn-error min-h-0 h-7 rounded p-2' value='X' />
                </td>
              </tr>
            )})}
        </tbody>
      </table>
  </div>
  )
}
