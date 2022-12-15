import { Form } from "@remix-run/react"
import _ from "lodash"
import React, { useState } from "react"
import type { Provider } from "../../models/providers.server"
import type { SerializedChargeEvent } from "../../routes/chargetracker"
import { format } from "../../utils"
import AdjustButton from "../AdjustButton"
import DateAdjustButton from "../DateAdjustButton"

export interface ChargeEntryProps {
  newEvent: () => void
  providers: Provider[]
  event?: Partial<SerializedChargeEvent>
  lastDeleted: SerializedChargeEvent | null
}

export default function ChargeEntry(props: ChargeEntryProps) {
  const { providers, event, lastDeleted } = props
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
              <DateAdjustButton value={1} getter={date} setter={(newDate) => setDate(newDate ?? format(new Date()))} />
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
              <DateAdjustButton value={-1} getter={date} setter={(newDate) => setDate(newDate ?? format(new Date()))} />
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
        {lastDeleted && (
          <input
            type="submit"
            name="_action"
            className="btn btn-accent col-span-2 row-start-4 my-4 justify-self-center rounded"
            readOnly
            value="restore last"
          />
        )}
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