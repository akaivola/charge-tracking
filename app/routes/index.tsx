import { Link } from "@remix-run/react"

import { useOptionalUser } from "~/utils"
import ChargeTrackerIndexPage from "./chargetracker"



export default function Index() {
  const user = useOptionalUser()
  return (
    <main className="min-h-screen bg-white sm:flex sm:items-center sm:justify-center">
      <div className="relative sm:pb-16 sm:pt-8">
        {user && <ChargeTrackerIndexPage user={user} />}
        {!user && <div>no user </div>}
      </div>
    </main>
  )
}
