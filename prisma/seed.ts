import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import readline from 'readline'
import { logger } from '../app/logger'

const prisma = new PrismaClient({
  errorFormat: 'pretty',
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
})

prisma.$on('warn', (e) => {
  logger.warn(e)
})

prisma.$on('info', (e) => {
  logger.info(e)
})

prisma.$on('error', (e) => {
  logger.error(e)
})

const providers = [
  'abc',
  'virta',
  'recharge',
  'office',
  'k-lataus',
  'lidl',
  'ikea',
  'home',
  'other',
]
const email = 'dev@charge.run'

async function seed() {
  // cleanup the existing database
  await prisma.user.delete({ where: { email } }).catch(() => {
    // no worries if it doesn't exist yet
  })

  const hashedPassword = await bcrypt.hash('dev', 10)

  const user = await prisma.user.create({
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
  await prisma.provider.createMany({
    data: providers.map((p) => {
      return { name: p! }
    }),
  })

  await prisma.note.create({
    data: {
      title: 'My first note',
      body: 'Hello, world!',
      userId: user.id,
    },
  })

  await prisma.note.create({
    data: {
      title: 'My second note',
      body: 'Hello, world!',
      userId: user.id,
    },
  })

  await prisma.chargeEvent.deleteMany()
  var stream = fs.createReadStream('Charge Times - Log.csv')
  var reader = readline.createInterface({ input: stream })
  const providersMap: { [key: string]: string } = {
    abc: 'abc',
    v: 'virta',
    r: 'recharge',
    t: 'office',
    k: 'k-lataus',
    l: 'lidl',
    i: 'ikea',
    o: 'other'
  }
  reader.on('line', async (row) => {
    const [dateRaw, kiloWattHours, pricePerKiloWattHour, _, providerRaw] = row.split(',')
    logger.info(row)
    const [d, m, y] = dateRaw.split('.')
    const provider = providersMap[providerRaw] || providerRaw

    if (!provider)
      throw Error(`Unable to map ${providerRaw} from ${providersMap}`)

    await prisma.chargeEvent.create({
      data: {
        kiloWattHours: Number(kiloWattHours),
        provider,
        date: new Date(`${y}-${m}-${d}`),
        userId: user.id,
        pricePerKiloWattHour: Number(pricePerKiloWattHour),
      },
    })
  })

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
