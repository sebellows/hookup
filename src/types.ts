export type Constructor<T = any> = new () => T

export type Collection<T extends object = object> = T[]

// export type Schema<T extends object = object> = T
// export type Source<T extends object = object> = T | Collection<T>

export type FieldValue<T = any> = T | { value: T }

export enum FieldAccessorType {
  FieldEntry = 'FieldEntry',
  FieldPaths = 'FieldPaths',
  FieldFn = 'FieldFn',
  FieldSelector = 'FieldSelector',
  FieldAggregator = 'FieldAggregator',
}

export interface FieldSelector {
  path: string
  validators?: ValidatorFn | ValidatorFn[]
  transform?: <Source extends object = object>(value: any, source?: Source) => any
}

/**
 * @description
 * Defines the map of errors returned from failed validation checks.
 */
export type ValidationErrors = {
  [key: string]: any
}

/**
 * @description
 * A function that receives an input and synchronously returns a map of
 * validation errors if present, otherwise null.
 */
export interface ValidatorFn<V = any> {
  (input: FieldValue<V>): ValidationErrors | null
}

/**
 * @description
 * A function that receives an input and returns a Promise that emits
 * validation errors if present, otherwise null.
 */
export interface AsyncValidatorFn<V = any> {
  (input: FieldValue<V>): Promise<ValidationErrors | null>
}
