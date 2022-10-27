import { json } from '@remix-run/node'
import type { LoaderArgs , MetaFunction } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { getChargeEvents } from '~/models/chargeevents.server'
import { requireUserId } from '~/session.server'
import _ from 'lodash'

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request)
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'numeric', day: 'numeric' }
  const rawChargeEvents = await getChargeEvents({ userId })
  const chargeEvents = rawChargeEvents.map(event => ({
    ...event,
    date: event.date.toLocaleDateString('fi-FI', options),
    kiloWattHours: Number(event.kiloWattHours),
    pricePerKiloWattHour: Number(event.pricePerKiloWattHour),
  }))
  return json({ chargeEvents })
}

export const meta: MetaFunction = () => {
  return {
    title: 'Charge Tracking',
  }
}

export default function ChargeTrackerIndexPage() {
  const data = useLoaderData<typeof loader>()
  const chargeEvents = data.chargeEvents
  const total = chargeEvents.reduce(({kWh, price, count}, ce) => {
    return {
      kWh: _.round(kWh + ce.kiloWattHours, 2),
      price: _.round(price + (ce.pricePerKiloWattHour * ce.kiloWattHours), 2),
      count: count + 1,
    }
  }, {kWh: 0, price: 0, count: 0})

  return (
    <div className='container mx-auto p-8'>
      <div>
        <div>
          {total.kWh ?? 0} kWh
        </div>
        <div>
          {total.price ?? 0} e
        </div>
        <div>
          {total.count} charges
        </div>
      </div>
      <table className='table-auto border-collapse cursor-pointer touch-pinch-zoom container mx-auto box-content'>
        {chargeEvents.map(
          ({ date, kiloWattHours, pricePerKiloWattHour, provider }) => (
            <tr>
              <td className='py-1 pr-2'>{date}</td>
              <td className='text-right px-2'>{kiloWattHours}</td>
              <td className='text-right px-2'>{pricePerKiloWattHour}</td>
              <td className='text-right px-2' >{Math.round((Number(kiloWattHours) * Number(pricePerKiloWattHour)) * 100) / 100}</td>
              <td className='pl-2'>{provider}</td>
            </tr>
          )
        )}
      </table>
  </div>
  )
}
