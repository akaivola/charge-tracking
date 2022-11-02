import type { ActionArgs, LoaderArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useFetcher, useLoaderData } from '@remix-run/react';
import _ from 'lodash';
import type { FormEvent, SyntheticEvent} from 'react';
import { useState } from 'react';
import React from 'react';
import { getChargeEvents } from '~/models/chargeevents.server';
import { requireUserId } from '~/session.server';
import { logger } from '../../logger.server';

const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'numeric', day: 'numeric' }

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request)
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

  logger.info(`action: ${_action} ${JSON.stringify(values)}`)

  return null
  // upsertChargeEvent({

  // })
}

export const meta: MetaFunction = () => {
  return {
    title: 'Charge Tracking',
  }
}

function AdjustButton(value: string, onClick: (event: SyntheticEvent) => void) {
  return (
    <input type='button' onClick={onClick} className='btn btn-sm btn-primary rounded p-1 m-1' value={value} />
  )
}

export default function ChargeTrackerIndexPage() {
  const loaderData = useLoaderData<typeof loader>()
  const chargeEvents = loaderData.chargeEvents

  const { state, type, submission, data, submit, load } = useFetcher()
  console.log(state, type, submission, data)

  const NewChargeEntry: React.FC<{}> = (props: {}) => {
    const currentDate = new Date().toLocaleDateString('fi-FI', options)
    const formSubmit = (e: FormEvent<HTMLFormElement>) => { 
      e.preventDefault()
      console.log(e.target)
      submit(new FormData(e.currentTarget), { method: 'post' })
    }

    const [kiloWattHours, setKiloWattHours] = useState(0)
    return (
      <Form id='new' method='post'>
        <div className='grid grid-cols-4'>
          <div className='justify-self-center'>Date</div>
          <div className='justify-self-center'>kWh</div>
          <div className='justify-self-end'>e / charge</div>
          <div>provider</div>
        </div>
        <div className='grid grid-cols-4'>
          <div className='justify-self-center grid'>
            <div className='grid grid-cols-1 w-1/2'>
              <input type='button' className='btn btn-sm btn-primary rounded p-1 m-1' value='-1' />
            </div>
            <input type='text' className='bg-black' form='new' name='date' size={10} defaultValue={currentDate}/>
            <div className='grid grid-cols-1 w-1/2'>
              <input type='button' className='btn btn-sm btn-primary rounded p-1 m-1' value='+1' />
            </div>
          </div>
          <div className='justify-self-center grid'>
            <div className='grid grid-cols-2'>
              <input type='button' className='btn btn-sm btn-primary rounded p-1 m-1' value='-1' />
              <input type='button' className='btn btn-sm btn-primary rounded p-1 m-1' value='-0.1' />
            </div>
            <input type='text' className='bg-black justify-self-center text-center' form='new' name='kiloWattHours' size={6} defaultValue={0}/>
            <div className='grid grid-cols-2'>
              <input type='button' className='btn btn-sm btn-primary rounded p-1 m-1' value='+1' />
              <input type='button' className='btn btn-sm btn-primary rounded p-1 m-1' value='+0.1' />
            </div>
          </div>
          <div className='justify-self-center grid'>
            <div className='grid grid-cols-2'>
              <input type='button' className='btn btn-sm btn-primary rounded p-1 m-1' value='-1' />
              <input type='button' className='btn btn-sm btn-primary rounded p-1 m-1' value='-0.1' />
            </div>
            <input type='text' className='bg-black justify-self-center text-center' form='new' name='pricePerCharge' size={6} defaultValue={0}/>
            <div className='grid grid-cols-2'>
              <input type='button' className='btn btn-sm btn-primary rounded p-1 m-1' value='+1' />
              <input type='button' className='btn btn-sm btn-primary rounded p-1 m-1' value='+0.1' />
            </div>
          </div>
          <div className='grid'>
            <input type='text' className='bg-black place-content-center text-center' form='new' name='provider' size={8} defaultValue={'office'}/>
          </div>
          <button type='submit' className='my-8 col-span-4 justify-self-center btn btn-primary rounded' value='insert'>insert</button>
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
    <div className='container mx-auto p-4'>
      <NewChargeEntry />
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
      <>
        { chargeEvents.map(({id}) => <Form key={`form-${id}`} method='post' id={id} />)}
      </>
      <table className='table-auto border-collapse cursor-pointer touch-pinch-zoom container mx-auto box-content'>
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
        { chargeEvents.map(
          ({ id, date, kiloWattHours, pricePerCharge, provider }) => {
            return (
              <tr key={`tr-${id}`}>
                <td className='py-1 pr-2'>
                  <input type='text' className='bg-black' name='date' size={10} form={id} defaultValue={date} />
                </td>
                <td className='text-right px-2'>
                  <input type='text' className='bg-black' name='kiloWattHours' size={6} form={id} defaultValue={kiloWattHours} />
                </td>
                <td className='text-right px-2'>
                  <input type='text' className='bg-black' name='pricePerCharge' size={4} form={id} defaultValue={pricePerCharge} />
                </td> 
                <td className='text-right px-2'>
                  {_.round(pricePerCharge / kiloWattHours, 2)}
                </td> 
                <td className='pl-2'>
                  <input type='text' className='bg-black' name='provider' size={8} maxLength={20} form={id} defaultValue={provider} />
                </td>
              </tr>
            )})}
        </tbody>
      </table>
  </div>
  )
}
