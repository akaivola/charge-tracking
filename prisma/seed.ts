import { PrismaClient, Provider } from '@prisma/client'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import _ from 'lodash'
import { keyBy } from 'lodash'
import readline from 'readline'
import { logger } from '../app/logger.server'
import { addProvider } from '../app/models/providers.server'

const prisma = new PrismaClient({
  errorFormat: 'pretty',
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
})

type ProviderWithoutUser = Omit<Provider, 'userId'>
let providerCache: {
  [userId: string]: { [name: string]: ProviderWithoutUser }
} = {}

async function fetchOrAddProvider(
  name: string,
  userId: bigint
): Promise<ProviderWithoutUser> {
  const providers = providerCache[userId.toString()]
  logger.info(JSON.stringify(providerCache))
  const provider = providers ? providers[name] : undefined

  if (provider) return provider
  else {
    const newProvider = await addProvider(name, userId)
    const newProviders = [...((providers && Object.values(providers)) ?? []), newProvider]
    logger.info(JSON.stringify(newProviders), keyBy(newProviders, 'name'))
    if (newProviders.length === 0)
      throw new Error(`Failed to add provider ${name} for user ${userId}`)
    providerCache[userId.toString()] = keyBy(newProviders, 'name')
    logger.info(JSON.stringify(providerCache))
    return newProvider
  }
}

prisma.$on('warn', (e) => {
  logger.warn(e)
})

prisma.$on('info', (e) => {
  logger.info(e)
})

prisma.$on('error', (e) => {
  logger.error(e)
})

const email = 'dev@charge.run' // dev

async function seed() {
  // cleanup the existing database
  await prisma.user.delete({ where: { email } }).catch(() => {
    // no worries if it doesn't exist yet
  })

  const hashedPassword = await bcrypt.hash('dev', 10)

  const user = await prisma.user.create({
    select: { id: true },
    data: {
      email,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  })

  await prisma.provider.deleteMany()
  await prisma.chargeEvent.deleteMany()

  var input = fs.createReadStream('ChargeEvent.csv')
  var reader = readline.createInterface({ input })

  for await (const line of reader) {
    const [
      id,
      date,
      kiloWattHours,
      pricePerCharge,
      provider,
      createdAt,
      updatedAt,
      _userId,
      deletedAt,
    ] = line.split(';')

    if (id === 'id') continue // skip header

    const [y, m, d] = date.split('-')
    const { id: providerId } = await fetchOrAddProvider(provider, user.id)

    await prisma.chargeEvent.create({
      data: {
        kiloWattHours: Number(kiloWattHours),
        providerId,
        date: new Date(`${y}-${m}-${d}`),
        userId: user.id,
        pricePerCharge: Number(pricePerCharge),
        createdAt: new Date(createdAt),
        updatedAt: new Date(updatedAt),
        deletedAt: deletedAt ? new Date(deletedAt) : null,
      },
    })
  }

  logger.info(`Database has been seeded. 🌱`)
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
