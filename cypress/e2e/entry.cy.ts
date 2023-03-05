import { faker } from '@faker-js/faker'
import dayjs from 'dayjs'
import { format } from '../../app/utils'

describe('charge entries', () => {
  beforeEach(() => {
    cy.login()
  })
  afterEach(() => {
    cy.cleanupUser()
  })
  it('should allow you to create a charge entry', () => {
    cy.visitAndCheck('/')
    const dateinput = () => cy.get('input[name="date"]');
    // default date is today
    dateinput().should('have.value', format(new Date()))
    const minusDate = cy.findAllByTestId('date-adjust-button').last()
    const plusDate = cy.findAllByTestId('date-adjust-button').first()
    minusDate.click()
    dateinput().should('have.value', format(dayjs().subtract(1, 'day')))
    plusDate.click().click()
    dateinput().should('have.value', format(dayjs().add(1, 'day')))
  })
})