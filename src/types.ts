export type Constructor<T = any> = new () => T

export type Collection<T extends object = object> = T[]
export type CollectionItem = Record<string, any>

export type Schema<
  Target extends CollectionItem = CollectionItem,
  Source extends CollectionItem = CollectionItem
> = {
  [destinationProperty in keyof Target]?:
    | FieldPath<Source>
    | {
        (
          iteratee: Source,
          source: Source[],
          target: Target[destinationProperty]
        ): Target[destinationProperty]
      }
    | FieldAggregator<Source>
    | FieldSelector<Source>
    | Schema<Target[destinationProperty], Source>
}
// export type Source<T extends object = object> = T | Collection<T>

export type FieldValue<T = any> = T | { value: T }

export enum FieldStatus {
  VALID = 'VALID',
  INVALID = 'INVALID',
  PENDING = 'PENDING',
}

export enum FieldAccessorType {
  FieldEntry = 'FieldEntry',
  FieldPaths = 'FieldPaths',
  FieldFn = 'FieldFn',
  FieldSelector = 'FieldSelector',
  FieldAggregator = 'FieldAggregator',
}

export type FieldPath<Source> = string | keyof Source

export type FieldFn<D = any, S = any, R = any> = (iteratee: S, source: S[], target: D) => R

export type FieldAggregator<T extends unknown = unknown> = T extends object
  ? (keyof T)[] | string[]
  : string[]

export interface FieldSelector<Source extends CollectionItem = CollectionItem> {
  path: FieldPath<Source> | FieldAggregator<Source>
  validators?: ValidatorFn | ValidatorFn[]
  transform?: (value: any, source?: Source) => any
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

export type GenericValidatorFn = (input: FieldValue) => any

/**
 * @description
 * A function that receives an input and returns a Promise that emits
 * validation errors if present, otherwise null.
 */
export interface AsyncValidatorFn<V = any> {
  (input: FieldValue<V>): Promise<ValidationErrors | null>
}
