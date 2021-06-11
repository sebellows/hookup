import { hookup } from '.'
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
  location: ['address', 'address.zipcode'],
  // FieldFn
  city: (src) => src.address.city,
  // FieldSelector w/ validator
  age: {
    path: 'Age',
    validators: Validators.min(12),
  },
  // FieldSelector w/ transform
  firstJob: {
    path: 'jobs.0.title',
    transform: (x: string) => x.toUpperCase(),
  },
}

let data: Record<keyof typeof testSchema, any>

const validationErrors = [
  {
    min: {
      actual: 10,
      min: 12,
    },
  },
]

const aggregatedLocation = {
  address: {
    zipcode: 11103,
  },
}

describe('hookup', () => {
  beforeEach(() => {
    data = hookup(testSchema, testSource) as Record<keyof typeof testSchema, any>
  })

  it('Should generate a schema from a source', () => {
    expect(data.name).toEqual('Miro')
  })

  it('Should return a ValidationErrors object', () => {
    expect(data.age).toEqual(validationErrors)
  })

  it('Should be a transformed source value', () => {
    expect(data.firstJob).toEqual('COOK')
  })

  it('Should be an aggregated object', () => {
    expect(data.location).toEqual(aggregatedLocation)
  })
})
