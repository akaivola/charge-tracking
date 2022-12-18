import _ from 'lodash'
import type { SerializedChargeEvent } from '../../routes/chargetracker'
import { formatShort, parse } from '../../utils'

export interface StatsProps {
  chargeEvents: SerializedChargeEvent[]
}

export function Stats({ chargeEvents }: StatsProps) {
  const total = chargeEvents.reduce(
    (acc, ce) => {
      const { kWh, price, count } = acc
      return {
        ...acc,
        kWh: _.round(kWh + ce.kiloWattHours, 2),
        price: _.round(price + ce.pricePerCharge, 2),
        count: count + 1,
      }
    },
    {
      kWh: 0,
      price: 0,
      count: 0,
      first: parse(_.first(chargeEvents)?.date),
      last: parse(_.last(chargeEvents)?.date),
    }
  )

  const { count, kWh, price, first, last } = total
  return (
    <section className="grid touch-none select-none">
      <div className="stats shadow">
        <div className="stat place-items-center">
          <div className="stat-title text-secondary">Total Charges</div>
          <div className="stat-value text-secondary">{count}</div>
          <div className="stat-desc text-secondary">
            {first && last
              ? `${formatShort(last)} - ${formatShort(first)}`
              : ''}
          </div>
        </div>
        <div className="stat place-items-center">
          <div className="stat-title text-secondary">Total kWh</div>
          <div className="stat-value text-secondary">{kWh}</div>
          <div className="stat-desc text-secondary">
            {first && last
              ? `${formatShort(last)} - ${formatShort(first)}`
              : ''}
          </div>
        </div>
        <div className="stat place-items-center">
          <div className="stat-title text-secondary">Total Price</div>
          <div className="stat-value text-secondary">{price}</div>
          <div className="stat-desc text-secondary">Eur</div>
        </div>
        <div className="stat place-items-center">
          <div className="stat-title text-secondary">Price</div>
          <div className="stat-value text-secondary">
            {_.round((price / kWh) * 100, 1)}
          </div>
          <div className="stat-desc text-secondary">c/kWh</div>
        </div>
      </div>
    </section>
  )
}
