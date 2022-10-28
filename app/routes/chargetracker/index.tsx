import { json } from '@remix-run/node'
import type { LoaderArgs , MetaFunction , ActionArgs} from '@remix-run/node'
import { Form, useActionData, useLoaderData, useTransition } from '@remix-run/react'
import { getChargeEvents, upsertChargeEvent } from '~/models/chargeevents.server'
import { requireUserId } from '~/session.server'
import _ from 'lodash'

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request)
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'numeric', day: 'numeric' }
  const rawChargeEvents = await getChargeEvents({ userId })
  const chargeEvents = rawChargeEvents.map(event => ({
    ...event,
    id: event.id,
    date: event.date.toLocaleDateString('fi-FI', options),
    kiloWattHours: Number(event.kiloWattHours),
    pricePerKiloWattHour: Number(event.pricePerKiloWattHour),
  }))
  return json({ chargeEvents })
}

export async function action({request}: ActionArgs) {
  const formData = await request.formData()
  const { _action, ...values } = Object.fromEntries(formData)
  upsertChargeEvent({

  })
}

export const meta: MetaFunction = () => {
  return {
    title: 'Charge Tracking',
  }
}

export default function ChargeTrackerIndexPage() {
  const data = useLoaderData<typeof loader>()
  const chargeEvents = data.chargeEvents

  const actionData = useActionData()
  const transition = useTransition()

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
        <>
        {chargeEvents.map(({id}) => <Form method='post' name={id} />)}
        </>
      </div>
      <table className='table-auto border-collapse cursor-pointer touch-pinch-zoom container mx-auto box-content'>
        <thead>
          <th>Date</th>
          <th>kWh</th>
          <th>e/kWh</th>
          <th>e * kWh</th>
          <th>Provider</th>
        </thead>
        <tbody>
        {chargeEvents.map(
          ({ id, date, kiloWattHours, pricePerKiloWattHour, provider }) => (
            // multiple forms problem and place to put form. Can use form attribute and forms outside table
            <tr>
              <td className='py-1 pr-2'><input type='text' form={id} defaultValue={date} /></td>
              <td className='text-right px-2'><input type='text' form={id} defaultValue={kiloWattHours} /></td>
              <td className='text-right px-2'><input type='text' form={id} defaultValue={pricePerKiloWattHour} /></td> 
              <td className='text-right px-2'><input type='text' form={id} defaultValue={Math.round((Number(kiloWattHours) * Number(pricePerKiloWattHour)) * 100) / 100} /></td> 
              <td className='pl-2'><input type='text' form={id} defaultValue={provider} /></td>
            </tr>
          )
        )}
        </tbody>
      </table>
  </div>
  )
}
