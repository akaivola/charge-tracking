import { useLoaderData } from "@remix-run/react"
import { json } from "stream/consumers"
import type { User } from "~/models/user.server"
import { requireUserId } from "~/session.server"
import { useUser } from "~/utils"

type Provider = 'office' | 'lidl' | 'abc' | 'recharge' | 'other'

const getChargeEvents = (userId: number) => {

}

const loader = async ({ request }: LoaderArgs) => {
  const userId = await requireUserId(request)
  const chargeEvents = getChargeEvents({ userId })
  return json({  })
}

interface ChargeTrackerIndexPageProps {
  user: User
}

export default function ChargeTrackerIndexPage({ user }: ChargeTrackerIndexPageProps) {
  const { chargeEvents }  = useLoaderData<typeof loader>
  const user = useUser()

  return (<div>index</div>)
}