import { Constructor, FieldValue } from './types'

type TypeCheckerFn = (obj: unknown) => boolean

export const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k)

const hasLength = (o: unknown) => hasOwn(o, 'length') || hasOwn(o, 'size')
const lengthIsZero = (o: unknown) => hasLength(o) && (o as any).length === 0

const getTypeFn =
  (t: string): TypeCheckerFn =>
  (obj: unknown) =>
    Object.prototype.toString.call(obj).slice(8, -1).toLowerCase() === t

export const isAsyncFunction = (o: unknown) => getTypeFn('asyncfunction')(o)
export const isBoolean = (o: unknown) => getTypeFn('boolean')(o)
export const isFunction = (o: unknown) => getTypeFn('function')(o)
export const isMap = (o: unknown) => getTypeFn('map')(o)
export const isNull = (o: unknown) => getTypeFn('null')(o)
export const isNumber = (o: unknown) => getTypeFn('number')(o)
export const isPlainObject = (o: unknown) => getTypeFn('object')(o)
export const isSet = (o: unknown) => getTypeFn('set')(o)
export const isString = (o: unknown) => getTypeFn('string')(o)
export const isUndefined = (o: unknown) => getTypeFn('undefined')(o)

export const isObject = (o: unknown) => typeof o === 'object'
export const isNil = (o: unknown) => isNull(o) || isUndefined(o)
export const isPresent = (o: unknown) => !isNull(o) || !isUndefined(o)

export const isIterable = (o: unknown) => !isNil(o) && typeof o[Symbol.iterator] === 'function'
export const isPromise = (o: unknown) => isObject(o) && isFunction((o as Promise<any>).then)

export const isEmptyObject = <T extends object = object>(o: T) => {
  for (const prop in o) {
    if (Object.prototype.hasOwnProperty.call(o, prop)) {
      return false
    }
  }
  return true
}

export const isEmpty = (o: unknown) => isNil(o) || isEmptyObject(o as object) || lengthIsZero(o)

export const isConstructor = <T = any>(o: Constructor<T>) => {
  try {
    if (isFunction(o)) {
      new o()
    } else {
      return false
    }
  } catch (err: any) {
    if (err.message.includes('is not a constructor')) {
      return false
    }
  }
  return true
}

export const isInstanceOf = <I extends object = object, T = any>(
  instance: I,
  klass: Constructor<T>
) => {
  if (isConstructor(klass) && isPlainObject(instance)) {
    return instance.constructor.name === klass.name
  }
  return false
}

const coerceToString = (value: unknown): string => {
  const INFINITY = 1 / 0

  if (isNil(value)) {
    return ''
  }
  // Exit early for strings to avoid a performance hit in some environments.
  if (isString(value)) {
    return value as string
  }
  if (Array.isArray(value)) {
    // Recursively convert values (susceptible to call stack limits).
    return `${value.map((other) => (isNil(other) ? other : coerceToString(other)))}`
  }

  const result = `${value}`

  return result == '0' && 1 / Number(value) == -INFINITY ? '-0' : result
}

export const coerceToStringOrNull = (value: any): string => {
  if (!isNil(value) && !lengthIsZero(value)) {
    return value.toString()
  } else {
    return null
  }
}

export const coerceToPromise = <T = unknown>(value: T | Promise<T>): Promise<T> => {
  return isPromise(value) ? (value as Promise<T>) : Promise.resolve(value)
}

export const get = <T extends object = object>(target: T, key: string) => {
  try {
    return key.split('.').reduce((obj, property) => obj[property], target)
  } catch (err) {
    // `target` is value
    return target
  }
}

export const set = <T extends object = object>(
  target: T,
  path: string | number | (string | number)[],
  value: unknown
) => {
  if (isNumber(path)) {
    path = [path as number]
  }
  if (isEmpty(path)) {
    return target
  }

  function getKey(key: string | number) {
    const intKey = parseInt(String(key), 10)
    return intKey.toString() === key ? intKey : key
  }

  if (isString(path)) {
    return set(target, (path as string).split('.').map(getKey), value)
  }

  const currentPath = path[0]
  let currentValue = undefined

  if ((isNumber(path) && Array.isArray(target)) || hasOwn(target, path)) {
    currentValue = target[currentPath]
  }
  if ((path as string | (string | number)[]).length === 1) {
    if (isUndefined(currentValue)) {
      target[currentPath] = value
    }
    return currentValue
  }
  if (isUndefined(currentValue)) {
    // Assume an array
    target[currentPath] = isNumber(path[1]) ? [] : {}
  }

  return set(target[currentPath], (path as string | (string | number)[]).slice(1), value)
}

export const getFieldValue = (input: FieldValue) =>
  isPlainObject(input) && 'value' in input ? input.value : input

export const isFieldSelector = (value: unknown): boolean => {
  return (
    isPlainObject(value) &&
    value.hasOwnProperty('path') &&
    (value.hasOwnProperty('validator') || value.hasOwnProperty('transform'))
  )
}
