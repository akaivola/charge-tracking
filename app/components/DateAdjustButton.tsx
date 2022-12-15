import type { SyntheticEvent } from 'react'
import { formatDay, parse } from '../utils'

export default function DateAdjustButton(props: {
  value: number
  getter: string
  setter: (newValue: string | undefined) => unknown
}) {
  const oldDate = parse(props.getter)
  const newDate = oldDate?.add(props.value, 'day')
  const onClick = (_e: SyntheticEvent) => props.setter(formatDay(newDate))
  return (
    <input
      type="button"
      onClick={onClick}
      className="btn btn-primary btn-sm m-1 rounded p-1"
      value={props.value}
    />
  )
}
