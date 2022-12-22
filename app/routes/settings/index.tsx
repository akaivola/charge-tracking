import type { LoaderArgs } from '@remix-run/server-runtime'
import { typedjson, useTypedLoaderData } from 'remix-typedjson'
import { getProviderCounts } from '../../models/providers.server'
import { requireUserId } from '../../session.server'

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request)
  const providers = await getProviderCounts(userId)

  return typedjson({ providers })
}

export default function Settings() {
  const { providers } = useTypedLoaderData<typeof loader>()

  return (
    <section>
      <section>
        <h1>Providers</h1>
        {providers.map((p) => (
          <div key={p.name}>{p.name}</div>
        ))}
      </section>
    </section>
  )
}
