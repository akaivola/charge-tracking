import { faker } from '@faker-js/faker'

describe('charge entries', () => {
  beforeEach(() => {
    cy.login()
  })
  afterEach(() => {
    cy.cleanupUser()
  })
  it('should allow you to create a charge entry', () => {
    cy.visitAndCheck('/')

  })
})