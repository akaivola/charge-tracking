import { json } from '@remix-run/node'
import type { LoaderArgs , MetaFunction } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { getChargeEvents } from '~/models/chargeevents.server'
import { requireUserId } from '~/session.server'

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request)
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'numeric', day: 'numeric' }
  const rawChargeEvents = await getChargeEvents({ userId })
  const chargeEvents = rawChargeEvents.map(event => ({
    ...event,
    date: event.date.toLocaleDateString('fi-FI', options)
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

  return (
    <table className='table-auto'>
      {chargeEvents.map(
        ({ date, kiloWattHours, pricePerKiloWattHour, provider }) => (
          <tr>
            <td>{date}</td>
            <td>{kiloWattHours}</td>
            <td>{pricePerKiloWattHour}</td>
            <td>{Math.round((Number(kiloWattHours) * Number(pricePerKiloWattHour)) * 100) / 100}</td>
            <td>{provider}</td>
          </tr>
        )
      )}
    </table>
  )
}
