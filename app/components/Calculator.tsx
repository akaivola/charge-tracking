import _ from 'lodash'
import { toNumber } from 'lodash'
import useLocalStorage from 'use-local-storage'

export default function Calculator() {
  const [batterySize, setBatterySize] = useLocalStorage("batterySize", 28)
  const [stateOfCharge, setStateOfCharge] = useLocalStorage("stateOfCharge", 50)
  const [chargeRate, setChargeRate] = useLocalStorage("chargeRate", 3.3) // 16A single phase continous current
  const [degradationPercent, setDegradationPercent] = useLocalStorage("degradationPercent", 4)
  const [consumptionWhPerKm, setConsumptionWhPerKm] = useLocalStorage("consumptionWhPerKm", 150)
  const [chargeToSoC, setChargeToSoC] = useLocalStorage("chargeToSoC", 100)

  const usedPercentage = 100 - stateOfCharge
  const availableBatteryKwh = (batterySize * (100 - degradationPercent)) / 100
  const usedKWh = (availableBatteryKwh * usedPercentage) / 100
  const availableKwh = availableBatteryKwh - usedKWh
  const range = (availableKwh / consumptionWhPerKm) * 1000
  const requiredKWhToCharge =
    ((chargeToSoC - stateOfCharge) * availableBatteryKwh) / 100

  // calculate a napkin math efficiency reduction for charge rates below 11kW (16A 3-phase). 
  // There are 32A 3-phase chargers on some EVs, so this is is a very rough estimate.
  // Further, efficiency is affected by temparature as some of the energy may be spent on battery heating or cooling.
  // It may be better to just calculate the losses and display it separately instead of hiding the calculation.
  const chargeRateByEfficiency = (chargeRate: number) => {
    const cutoff = 11
    const efficiency = 0.9
    return chargeRate <= cutoff ? chargeRate * efficiency : chargeRate
  }

  const requiredTimeToChargeHours = requiredKWhToCharge / chargeRateByEfficiency(chargeRate)
  const requiredTimeToChargeMinutes = requiredTimeToChargeHours * 60

  const rangeAfterCharge =
    ((availableKwh + requiredKWhToCharge) / consumptionWhPerKm) * 1000

  return (
    <section className="pb-20 select-none touch-none">
      <section className="grid grid-cols-2 gap-2">
        <div className="stats stats-vertical shadow">
          <div className="stat place-items-center p-0.5">
            <div className="stat-title text-secondary">Range Current</div>
            <div className="stat-value text-secondary">{_.round(range, 0)}</div>
            <div className="stat-desc text-secondary">km</div>
          </div>
          <div className="stat place-items-center p-0.5">
            <div className="stat-title text-secondary">Range Charged</div>
            <div className="stat-value text-secondary">
              {_.round(rangeAfterCharge, 0)}
            </div>
            <div className="stat-desc text-secondary">km</div>
          </div>
          <div className="stat place-items-center p-0.5">
            <div className="stat-title text-secondary">Required Time</div>
            <div className="stat-value text-secondary">
              {_.round(requiredTimeToChargeHours, 1)} h
            </div>
            <div className="stat-desc text-secondary">
              {_.round(requiredTimeToChargeMinutes, 0)} min
            </div>
          </div>
        </div>

        <div className="stats stats-vertical shadow">
          <div className="stat place-items-center p-0.5">
            <div className="stat-title text-secondary">Available</div>
            <div className="stat-value text-secondary">
              {_.round(availableKwh, 1)}
            </div>
            <div className="stat-desc text-secondary">kWh</div>
          </div>
          <div className="stat place-items-center p-0.5">
            <div className="stat-title text-secondary">Required</div>
            <div className="stat-value text-secondary">
              {_.round(requiredKWhToCharge, 1)}
            </div>
            <div className="stat-desc text-secondary">kWh</div>
          </div>
        </div>
      </section>

      <section className="divider"></section>

      <section className="md:text-md grid grid-cols-2 gap-6 md:grid-cols-3 select-none touch-none">
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
      </section>
    </section>
  )
}
