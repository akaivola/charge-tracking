import { Form } from '@remix-run/react'
import type { LoaderArgs } from '@remix-run/server-runtime'
import { typedjson, useTypedLoaderData } from 'remix-typedjson'
import { getProviderCounts, addProvider } from '../../models/providers.server'
import { requireUserId } from '../../session.server'

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request)
  const providers = await getProviderCounts(userId)

  return typedjson({ providers })
}

export async function action({ request }: LoaderArgs) {
  const userId = await requireUserId(request)
  const form = await request.formData()
  const { provider } = Object.fromEntries(form)

  if (!provider) {
    return { status: 400, body: 'Missing provider' }
  }

  await addProvider(provider.toString(), userId)

  return typedjson({ providers: await getProviderCounts(userId) })
}

export default function Settings() {
  const { providers } = useTypedLoaderData<typeof loader>()

  return (
    <section>
      <section>
        <Form>
          <h1 className='text-xl my-4'>Providers</h1>
          {providers.map((p) => (
            <div key={p.name}>
              <span>{p.name}</span>
              <span>{p.count}</span>
            </div>
          ))}
          <input type='text' name='provider' />
        </Form>
      </section>
    </section>
  )
}
