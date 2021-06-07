import { Constructor, FieldValue } from './types'

type TypeCheckerFn = (obj: unknown) => boolean

export const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k)

const getTypeFn =
  (t: string): TypeCheckerFn =>
  (obj: unknown) =>
    Object.prototype.toString.call(obj).slice(8, -1).toLowerCase() === t

export const isAsyncFunction = (o: unknown) => getTypeFn('asyncfunction')(o)
export const isBoolean = (o: unknown) => getTypeFn('boolean')(o)
export const isFunction = (o: unknown) => getTypeFn('function')(o)
export const isNull = (o: unknown) => getTypeFn('null')(o)
export const isNumber = (o: unknown) => getTypeFn('number')(o)
export const isPlainObject = (o: unknown) => getTypeFn('object')(o)
export const isString = (o: unknown) => getTypeFn('string')(o)
export const isUndefined = (o: unknown) => getTypeFn('undefined')(o)

export const isObject = (o: unknown) => typeof o === 'object'
export const isNil = (o: unknown) => isNull(o) || isUndefined(o)

export const isEmptyObject = <T extends object = object>(o: T) => {
  for (const prop in o) {
    if (Object.prototype.hasOwnProperty.call(o, prop)) {
      return false
    }
  }
  return true
}

export const isEmpty = (o) =>
  isNil(o) || isEmptyObject(o) || (hasOwn(o, 'length') && o.length === 0)

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
    if (currentValue === undefined) {
      target[currentPath] = value
    }
    return currentValue
  }
  if (currentValue === undefined) {
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
