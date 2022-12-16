import _ from 'lodash'
import { toNumber } from 'lodash'
import { useState } from 'react'

export default function Calculator() {
  const [batterySize, setBatterySize] = useState(28)
  const [stateOfCharge, setStateOfCharge] = useState(50)
  const [chargeRate, setChargeRate] = useState(3.7)
  const [degradationPercent, setDegradationPercent] = useState(4)
  const [consumptionWhPerKm, setConsumptionWhPerKm] = useState(150)
  const [chargeToSoC, setChargeToSoC] = useState(100)

  const usedPercentage = 100 - stateOfCharge
  const availableBatteryKwh = (batterySize * (100 - degradationPercent)) / 100
  const usedKWh = (availableBatteryKwh * usedPercentage) / 100
  const availableKwh = availableBatteryKwh - usedKWh
  const range = (availableKwh / consumptionWhPerKm) * 1000
  const requiredKWhToCharge =
    ((chargeToSoC - stateOfCharge) * availableBatteryKwh) / 100

  const requiredTimeToChargeHours = requiredKWhToCharge / chargeRate
  const requiredTimeToChargeMinutes = requiredTimeToChargeHours * 60

  return (
    <section>
      <section className="grid grid-cols-2 gap-2">
        <div className="stats shadow stats-vertical">
          <div className="stat place-items-center">
            <div className="stat-title text-secondary">Range</div>
            <div className="stat-value text-secondary">{_.round(range, 0)}</div>
            <div className="stat-desc text-secondary">km</div>
          </div>
          <div className="stat place-items-center">
            <div className="stat-title text-secondary">Required Time</div>
            <div className="stat-value text-secondary">
              {_.round(requiredTimeToChargeHours, 1)} h
            </div>
            <div className="stat-desc text-secondary">
              {_.round(requiredTimeToChargeMinutes, 0)} min
            </div>
          </div>
        </div>

        <div className="stats shadow stats-vertical">
          <div className="stat place-items-center">
            <div className="stat-title text-secondary">Available</div>
            <div className="stat-value text-secondary">
              {_.round(availableKwh, 1)}
            </div>
            <div className="stat-desc text-secondary">kWh</div>
          </div>
          <div className="stat place-items-center">
            <div className="stat-title text-secondary">Required</div>
            <div className="stat-value text-secondary">
              {_.round(requiredKWhToCharge, 1)}
            </div>
            <div className="stat-desc text-secondary">kWh</div>
          </div>
        </div>
      </section>

      <section className="divider"></section>

      <section className="md:text-md grid md:grid-cols-3 grid-cols-2 gap-6">
        <div>
          <div>Battery Size kWh</div>
          <div>
            <input
              className="input"
              type="text"
              value={batterySize}
              size={3}
              onChange={(e) => setBatterySize(toNumber(e.target.value))}
            ></input>
          </div>
        </div>
        <div>
          <div>Capacity Degradation %</div>
          <div>
            <input
              className="range range-primary"
              type="range"
              min="0"
              max="10"
              value={degradationPercent}
              onChange={(e) => setDegradationPercent(toNumber(e.target.value))}
            ></input>
          </div>
          <div>{degradationPercent}</div>
        </div>
        <div>
          <div>Consumption (Wh/km)</div>
          <div>
            <input
              className="range range-primary"
              type="range"
              min="50"
              max="300"
              value={consumptionWhPerKm}
              onChange={(e) => setConsumptionWhPerKm(toNumber(e.target.value))}
            ></input>
          </div>
          <div>{consumptionWhPerKm}</div>
        </div>
        <div>
          <div>State of Charge %</div>
          <div>
            <input
              className="range range-primary"
              type="range"
              min="0"
              max="100"
              value={stateOfCharge}
              onChange={(e) => setStateOfCharge(toNumber(e.target.value))}
            ></input>
          </div>
          <div>{stateOfCharge}</div>
        </div>
        <div>
          <div>Charge Rate (kW)</div>
          <div>
            <input
              className="range range-primary"
              type="range"
              min="0"
              max="100"
              value={chargeRate}
              onChange={(e) => setChargeRate(toNumber(e.target.value))}
            ></input>
          </div>
          <div>{chargeRate}</div>
        </div>
        <div>
          <div>Charge to SoC %</div>
          <div>
            <input
              className="range range-primary"
              type="range"
              min="0"
              max="100"
              value={chargeToSoC}
              onChange={(e) => setChargeToSoC(toNumber(e.target.value))}
            ></input>
          </div>
          <div>{chargeToSoC}</div>
        </div>
      </section>
    </section>
  )
}