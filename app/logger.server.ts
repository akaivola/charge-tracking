import winston from 'winston'

export const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.simple(),
  // format: winston.format.json(),
  transports: [new winston.transports.Console({})],
})

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
// if (process.env.NODE_ENV !== 'production') {
//   logger.add(new winston.transports.Console({
//     level: 'debug',
//     format: winston.format.simple(),
//   }))
// }
