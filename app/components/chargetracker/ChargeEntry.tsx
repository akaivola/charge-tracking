import { Form } from '@remix-run/react'
import _ from 'lodash'
import React, { useState } from 'react'
import type { ChargeEventRelation } from '../../models/chargeevents.server'
import type { Provider } from '../../models/providers.server'
import { format } from '../../utils'
import AdjustButton from '../AdjustButton'
import DateAdjustButton from '../DateAdjustButton'

export interface ChargeEntryProps {
  newEvent: () => void
  providers: Provider[]
  event?: Partial<ChargeEventRelation>
  lastDeleted: ChargeEventRelation | null
}

export default function ChargeEntry(props: ChargeEntryProps) {
  const { providers, event, lastDeleted } = props
  const mode = event?.id ? 'update' : 'insert'
  const foundProvider = React.useMemo(() => {
    return event?.providerId
      ? providers.find((p) => p.id === event.providerId)
      : _.first(providers)
  }, [event, providers])

  const [date, setDate] = useState(format(event?.date ?? new Date()))
  const [kiloWattHours, setKiloWattHours] = useState(event?.kiloWattHours ?? 0)
  const [price, setPrice] = useState(event?.pricePerCharge ?? 0)
  const [provider, setProvider] = useState(foundProvider)

  React.useEffect(() => {
    setDate(format(event?.date ?? new Date()))
    setKiloWattHours(event?.kiloWattHours ?? 0)
    setPrice(event?.pricePerCharge ?? 0)
    setProvider(event?.provider ?? foundProvider)
  }, [event])

  return (
    <Form method="post">
      {event && (
        <input type="hidden" name="id" value={event.id?.toString()} readOnly />
      )}
      <div className="grid select-none grid-cols-4">
        <div className="col-span-4 grid grid-cols-3">
          <div className="grid justify-self-center">
            <div className="grid w-full grid-cols-1">
              <DateAdjustButton
                value={1}
                getter={date}
                setter={(newDate) => setDate(newDate ?? format(new Date()))}
              />
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
              <DateAdjustButton
                value={-1}
                getter={date}
                setter={(newDate) => setDate(newDate ?? format(new Date()))}
              />
            </div>
          </div>
          <div
            className="grid justify-self-center"
            data-test-id="kiloWattHours"
          >
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
                onChange={(e) => {
                  e.preventDefault()
                  return setKiloWattHours(Number(e.target.value))
                }}
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
          <div
            className="grid justify-self-center"
            data-test-id="pricePerCharge"
          >
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
                onChange={(e) => {
                  e.preventDefault()
                  return setPrice(Number(e.target.value))
                }}
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
        <div
          className="col-span-2 col-start-2 row-start-2 my-4 grid"
          data-test-id="providers"
        >
          <div className="dropdown-down dropdown justify-self-center">
            <input
              type="hidden"
              value={provider?.id}
              name="providerId"
              readOnly
            />
            <label
              tabIndex={0}
              className="btn-secondary btn-sm btn m-1 rounded p-2"
            >
              {provider?.name || '???'}
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content menu w-52 rounded bg-base-100 p-2 shadow"
            >
              {providers.map((p) => (
                <li
                  key={p.name}
                  className="rounded"
                  onClick={(e) => {
                    ;(document.activeElement as HTMLElement)?.blur()
                  }}
                >
                  <button
                    className="touch-none"
                    onClick={(e) => {
                      e.preventDefault()
                      return setProvider(p)
                    }}
                  >
                    {p.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <input
          type="button"
          data-test-id="clearfields"
          defaultValue="Clear fields"
          onClick={(e) => {
            e.preventDefault()
            return props.newEvent()
          }}
          className="btn-accent btn col-span-2 my-2 touch-none justify-self-center rounded px-2"
        />
        <input
          type="submit"
          name="_action"
          className="btn-accent btn col-span-2 my-2 touch-none justify-self-center rounded"
          readOnly
          value={mode}
        />
        {lastDeleted && (
          <input
            type="submit"
            name="_action"
            className="btn-accent btn col-span-2 row-start-4 my-4 touch-none justify-self-center rounded"
            readOnly
            value="restore last"
          />
        )}
        {'update' === mode && (
          <input
            type="submit"
            name="_action"
            className="btn-accent btn col-span-2 col-start-3 row-start-4 my-4 touch-none justify-self-center rounded"
            readOnly
            value="delete"
          />
        )}
      </div>
    </Form>
  )
}
