import { hookup } from '.'
import { ValidationErrors } from './types'
import { Validators } from './validators'

const testSource = {
  _firstName: 'Miro',
  address: {
    street: '25-98 36th St.',
    city: 'Astoria',
    state: 'NY',
    zipcode: 11103,
  },
  Age: 10,
  jobs: [
    {
      title: 'cook',
      company: 'Macrobiotic Booger Bakery',
    },
  ],
  contactInfo: {
    cell: 5558675309,
    email: 'miro@mediumwarmmail.com',
  },
}

const testSchema = {
  name: '_firstName',
  email: 'contactInfo.email',
  // FieldAggregator
  location: ['address', 'address.street', 'address.zipcode'],
  // FieldFn
  city: (src) => src.address.city,
  // FieldSelector w/ validator
  age: {
    path: 'Age',
    validator: Validators.min(12),
  },
  // FieldSelector w/ transform
  firstJob: {
    path: 'jobs.0.title',
    transform: (x: string) => x.toUpperCase(),
  },
}

describe('hookup', () => {
  it('Should generate a schema from a source', () => {
    const data = hookup(testSchema, testSource) as Record<keyof typeof testSchema, any>

    expect(data.name).toEqual('Miro')
  })
})
