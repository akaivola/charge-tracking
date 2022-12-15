import type { SyntheticEvent } from "react"

export default function AdjustButton(props: {
  value: number
  getter: number
  setter: (newValue: number) => void 
}) {
  const onClick = (_e: SyntheticEvent) =>
    props.setter(Math.max(0, _.round(props.getter + props.value, 2)))
  return (
    <input
      type="button"
      onClick={onClick}
      className="btn btn-primary btn-sm m-1 rounded p-1"
      value={props.value}
    />
  )
}