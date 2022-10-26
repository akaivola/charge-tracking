import type { LoaderArgs } from '@remix-run/server-runtime';
import { redirect } from '@remix-run/server-runtime';
import { getUserId } from '~/session.server';
import { logger } from '../logger.server';

export async function loader({ request }: LoaderArgs) {
  const userId = await getUserId(request)
  logger.info(`user id at index is ${userId}`)
  if (userId) 
    return redirect('/chargetracker')
  else return redirect('/login')
}

export default function IndexPage() {
  return <div>hello</div>
}