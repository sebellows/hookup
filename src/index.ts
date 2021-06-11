import { FieldAccessorType, FieldSelector } from './types'
import { get, isFieldSelector, isFunction, isPlainObject, isString, set } from './utils'
import { Validators } from './validators'

function getActionType(key: string, value: unknown): FieldAccessorType {
  if (isString(value)) return FieldAccessorType.FieldPaths
  if (isFunction(value)) return FieldAccessorType.FieldFn
  if (isFieldSelector(value)) return FieldAccessorType.FieldSelector
  if (Array.isArray(value)) return FieldAccessorType.FieldAggregator
  if (isPlainObject(value)) return FieldAccessorType.FieldEntry
  throw new Error(`The value type specified for ${key} is not supported.`)
}

function resolveSchema<Schema extends object = object, Source extends object = object>(
  schema: Schema,
  source: Source
) {
  return Object.entries(schema).reduce((obj, [k, v]) => {
    let value: any
    const actionType = getActionType(k, v)
    // let hasValidationErrors = false

    switch (actionType) {
      case FieldAccessorType.FieldFn:
        value = (v as Function)(source, obj)
        break

      case FieldAccessorType.FieldAggregator:
        value = (v as string[]).reduce((agg, path) => {
          const valueObj = set(agg, path, get(source, path))

          Object.assign(agg, valueObj)
          return agg
        }, {})
        break

      case FieldAccessorType.FieldSelector:
        const fieldSelector: FieldSelector = v as FieldSelector
        let inputValue = get(source, fieldSelector.path as string)

        if ('transform' in fieldSelector) {
          // ex: (x) => x.toUpperCase()
          inputValue = fieldSelector.transform(inputValue)
        }
        if ('validators' in fieldSelector) {
          const validators = Array.isArray(fieldSelector.validators)
            ? fieldSelector.validators
            : [fieldSelector.validators]
          // ex: (x) => x.length <= 10 //=> null if passes, else object containing info about validation failure
          const validatorFn = Validators.mergeValidators(...validators)
          const validation = validatorFn(inputValue)
          if (validation) {
            value = validation
            break
          }
        }

        value = inputValue
        break

      case FieldAccessorType.FieldEntry:
        value = resolveSchema(v, source)
        break

      case FieldAccessorType.FieldPaths:
      default:
        value = get(source, v)
        break
    }

    obj[k] = value

    return obj
  }, {})
}

export function hookup<Schema extends object = object, Source extends object = object | object[]>(
  schema: Schema,
  source: Source
) {
  if (Array.isArray(source)) {
    return source.map((o) => resolveSchema(schema, o))
  }
  return resolveSchema(schema, source)
}
