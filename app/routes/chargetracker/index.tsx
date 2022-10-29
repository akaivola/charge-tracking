import { json } from '@remix-run/node'
import type { LoaderArgs , MetaFunction , ActionArgs} from '@remix-run/node'
import { Form, useActionData, useLoaderData, useTransition } from '@remix-run/react'
import { getChargeEvents, upsertChargeEvent } from '~/models/chargeevents.server'
import { requireUserId } from '~/session.server'
import _ from 'lodash'
import { logger } from '../../logger.server'

const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'numeric', day: 'numeric' }

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request)
  logger.info(userId)
  const rawChargeEvents = await getChargeEvents({ userId })
  const chargeEvents = rawChargeEvents.map(event => ({
    ...event,
    id: event.id,
    date: event.date.toLocaleDateString('fi-FI', options),
    kiloWattHours: event.kiloWattHours.toNumber(),
    pricePerCharge: event.pricePerCharge.toNumber(),
  }))
  return json({ chargeEvents })
}

export async function action({request}: ActionArgs) {
  const formData = await request.formData()
  const { _action, ...values } = Object.fromEntries(formData)
  // upsertChargeEvent({

  // })
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

  const NewChargeEntry: React.FC<{}> = (props: {}) => {
    const currentDate = new Date().toLocaleDateString('fi-FI', options)
    return (
      <Form method='post' name='new'>
        <div className='grid grid-cols-4'>
            <div>
              <input type='text' className='bg-black' form='new' name='date' size={10} defaultValue={currentDate}/>
            </div>
            <div>
              <input type='text' className='bg-black' form='new' name='kiloWattHours' size={6} defaultValue={0}/>
            </div>
            <div>
              <input type='text' className='bg-black' form='new' name='pricePerCharge' size={4} defaultValue={0}/>
            </div>
            <div>
              <input type='text' className='bg-black' form='new' name='provider' size={4} defaultValue={'t'}/>
            </div>
        </div>
      </Form>
    )
  }

  const total = chargeEvents.reduce(({kWh, price, count}, ce) => {
    return {
      kWh: _.round(kWh + ce.kiloWattHours, 2),
      price: _.round(price + ce.pricePerCharge, 2),
      count: count + 1,
    }
  }, {kWh: 0, price: 0, count: 0})

  return (
    <div className='container mx-auto p-8'>
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
      <NewChargeEntry />
      <>
        {chargeEvents.map(({id}) => <Form method='post' name={id} />)}
      </>
      <table className='table-auto border-collapse cursor-pointer touch-pinch-zoom container mx-auto box-content'>
        <thead>
          <th>Date</th>
          <th>kWh</th>
          <th>e / charge</th>
          <th>e * kWh</th>
          <th>Provider</th>
        </thead>
        <tbody>
        {chargeEvents.map(
          ({ id, date, kiloWattHours, pricePerCharge, provider }) => {
            return (
            // multiple forms problem and place to put form. Can use form attribute and forms outside table
            <tr>
              <td className='py-1 pr-2'><input type='text' className='bg-black' name='date' size={10} form={id} defaultValue={date} /></td>
              <td className='text-right px-2'><input type='text' className='bg-black' name='kiloWattHours' size={6} form={id} defaultValue={kiloWattHours} /></td>
              <td className='text-right px-2'><input type='text' className='bg-black' name='pricePerCharge' size={4} form={id} defaultValue={pricePerCharge} /></td> 
              <td className='text-right px-2'>{_.round(pricePerCharge / kiloWattHours, 2)}</td> 
              <td className='pl-2'><input type='text' className='bg-black' name='provider' size={8} maxLength={20} form={id} defaultValue={provider} /></td>
            </tr>
          )}
        )}
        </tbody>
      </table>
  </div>
  )
}
