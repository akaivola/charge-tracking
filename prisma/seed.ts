import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import fs from 'fs'

const prisma = new PrismaClient()

const providers = [
  'abc',
  'virta',
  'recharge',
  'office',
  'k-lataus',
  ,
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

  var stream = require('fs').createReadStream('FILE.CSV')
  var reader = require('readline').createInterface({ input: stream })
  var arr = []
  reader.on('line', (row) => {
    arr.push(row.split(','))
  })
  await prisma.chargeEvent.create({
    data: {
      kiloWattHours: 5.0,
      provider: 'office',
      date: new Date('2022-10-11'),
      userId: user.id,
      pricePerKiloWattHour: 0.0,
    },
  })

  console.log(`Database has been seeded. 🌱`)
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
