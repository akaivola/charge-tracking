import { faker } from '@faker-js/faker'
import dayjs, { Dayjs } from 'dayjs'
import { format } from '../../app/utils'

describe('charge entries', () => {
  type AdjustButtonValue = '-1' | '-0.1' | '0.1' | '1'

  function providersInput() {
    return cy.findByTestId('providers')
  }
  function kiloWattHoursInput() {
    return cy.findByTestId('kiloWattHours')
  }
  function pricePerChargeInput() {
    return cy.findByTestId('pricePerCharge')
  }

  function clickButton(dataTestId: string, value: AdjustButtonValue) {
    const element = () => cy.findByTestId(dataTestId)
    element()
      .findAllByTestId('adjust-button')
      .filter((_, el: HTMLInputElement) => el.value === value)
      .click()

    return element().find(`input[name="${dataTestId}"]`)
  }

  beforeEach(() => {
    cy.login()
  })
  afterEach(() => {
    cy.cleanupUser()
  })
  it('should allow you to create a charge entry', () => {
    const dateinput = () => cy.get('input[name="date"]')

    cy.visitAndCheck('/')
    // default date is today
    dateinput().should('have.value', format(new Date()))
    const minusDate = cy.findAllByTestId('date-adjust-button').last()
    const plusDate = cy.findAllByTestId('date-adjust-button').first()
    minusDate.click()
    dateinput().should('have.value', format(dayjs().subtract(1, 'day')))
    plusDate.click().click()
    dateinput().should('have.value', format(dayjs().add(1, 'day')))

    const buttonTests = (dataTestId: string) => {
      clickButton(dataTestId, '1').should('have.value', '1')
      clickButton(dataTestId, '0.1').should('have.value', '1.1')
      clickButton(dataTestId, '-1').should('have.value', '0.1')
      clickButton(dataTestId, '-0.1').should('have.value', '0')
      clickButton(dataTestId, '-0.1').should('have.value', '0')
      return clickButton(dataTestId, '-1').should('have.value', '0')
    }

    const kiloWattHoursInput = buttonTests('kiloWattHours')
    const pricePerChargeInput = buttonTests('pricePerCharge')

    kiloWattHoursInput.type('10').should('have.value', '10')
    pricePerChargeInput.type('2').should('have.value', '2')

    providersInput().click()
    providersInput().find('button').should('be.visible')
    providersInput().find('button').should('have.length.gt', 1)
    providersInput().find('button ').contains('lidl').click()
    providersInput().find('button').should('not.be.visible')

    cy.get("input[type='submit'][value='insert']").click()

    cy.findByTestId('chargeEventsTable').within(() => {
      cy.findByText('lidl').should('be.visible')
      cy.findByText('10').should('be.visible')
      cy.findByText('2').should('be.visible')
      cy.findByText('0.2').should('be.visible')
      cy.findByText(format(dayjs().add(1, 'day'))).should('be.visible')

      cy.findByText('lidl').click()
    })

    cy.findByDisplayValue('update').should('be.visible')
    cy.findByDisplayValue('delete').should('be.visible')
  })
})
