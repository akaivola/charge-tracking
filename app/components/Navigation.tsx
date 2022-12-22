import { Link } from '@remix-run/react'

export type Tab = 'chargetracker' | 'calculator' | 'settings'

export interface NavigationProps {
  tab: Tab
}

export default function Navigation(props: NavigationProps) {
  const isTabActive = (currentTab: Tab) => {
    return props.tab === currentTab ? 'active' : ''
  }

  return (
    <div className="btm-nav select-none">
      <Link
        className={`touch-none text-secondary ${isTabActive('chargetracker')}`}
        to={'/chargetracker'}
      >
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
      </Link>
      <Link
        className={`touch-none text-secondary ${isTabActive('calculator')}`}
        to={'/calculator'}
      >
        calculator
      </Link>
      <Link
        className={`touch-none text-secondary ${isTabActive('settings')}`}
        to={'/settings'}
      >
        settings
      </Link>
    </div>
  )
}
