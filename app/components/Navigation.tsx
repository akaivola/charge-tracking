import { NavLink } from '@remix-run/react'

export type Tab = 'chargetracker' | 'calculator' | 'settings'

export default function Navigation() {
  const active = ({ isActive }: { isActive: boolean }) =>
    `touch-none text-secondary ${isActive ? 'active' : ''}`

  return (
    <div className="btm-nav select-none">
      <NavLink className={active} to={'chargetracker'}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </NavLink>
      <NavLink className={active} to={'calculator'}>
        calculator
      </NavLink>
      <NavLink className={active} to={'settings'}>
        settings
      </NavLink>
    </div>
  )
}
