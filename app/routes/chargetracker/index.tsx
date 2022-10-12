import { json } from "@remix-run/node";
import type { LoaderArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react"
import type { ChargeEvent} from "~/models/chargeevents.server";
import { getChargeEvents } from "~/models/chargeevents.server"
import type { User } from "~/models/user.server"
import { requireUserId } from "~/session.server"

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request)
  const chargeEvents = await getChargeEvents({ userId })
  return json({ chargeEvents })
}

interface ChargeTrackerIndexPageProps {
  user: User
}

export default function ChargeTrackerIndexPage({ user }: ChargeTrackerIndexPageProps) {
  const { chargeEvents } = useLoaderData<typeof loader>()

  {chargeEvents.map(({ date, kiloWattHours, pricePerKiloWattHour, provider }) => (
    <div>
      <div>{date}</div>
      <div>{kiloWattHours}</div>
      <div>{pricePerKiloWattHour}</div>
      <div>{provider}</div>
    </div>
  ))}
}