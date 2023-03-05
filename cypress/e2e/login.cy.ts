import { faker } from '@faker-js/faker'

describe('sign up and login', () => {
  afterEach(() => {
    cy.cleanupUser()
  })

  const verifyStateAfterLogin = () => {
    cy.findByTestId('chargeEventsTable').should('exist')
    const providers = cy.findByTestId('providers');
    providers.should('exist')
    providers.find('button').should('have.length.gte', 10)
  }

  it('should allow to register and login', () => {
    const loginForm = {
      email: `${faker.internet.userName()}@example.com`,
      password: faker.internet.password(),
    }
    cy.then(() => ({ email: loginForm.email })).as('user')

    cy.visitAndCheck('/')
    cy.findByRole('link', { name: /sign up/i }).click()

    cy.findByRole('textbox', { name: /email/i }).type(loginForm.email)
    cy.findByLabelText(/password/i).type(loginForm.password)
    cy.findByRole('button', { name: /create account/i }).click()
    verifyStateAfterLogin()
  })

  it('should allow to login', () => {
    cy.login()
    cy.visitAndCheck('/')
    cy.findByTestId('chargeEventsTable').should('exist')
    verifyStateAfterLogin()
  })
})
