import {
  AsyncValidatorFn,
  FieldValue,
  GenericValidatorFn,
  ValidationErrors,
  ValidatorFn,
} from './types'
import { coerceToPromise, getFieldValue, isEmpty, isNumber, isPresent } from './utils'

/**
 * Validator & Validators are adapted from Angular's Forms package.
 *
 * @license MIT {@link https://angular.io/license}
 * @copyright Google LLC All Rights Reserved.
 * @see {@link https://github.com/angular/angular}
 */

export interface Validator {
  /**
   * Method that performs synchronous validation against the provided control.
   */
  validate(input: FieldValue): ValidationErrors | null

  /**
   * Registers a callback function to call when the validator inputs change.
   */
  registerOnValidatorChange?(fn: () => void): void
}

export interface AsyncValidator extends Validator {
  /**
   * Method that performs async validation against the provided control.
   */
  validate(control: FieldValue): Promise<ValidationErrors | null> | Promise<ValidationErrors | null>
}

export class Validators {
  static async: Record<string, AsyncValidatorFn | Promise<ValidationErrors | null>> = {
    min: async (min: number) => Promise.resolve(minValidator(min)),
    max: async (max: number) => Promise.resolve(maxValidator(max)),
    minLength: async (minLength: number) => Promise.resolve(minLengthValidator(minLength)),
    maxLength: async (maxLength: number) => Promise.resolve(maxLengthValidator(maxLength)),
    required: async (required: boolean) => Promise.resolve(requiredValidator(required)),
    requiredTrue: async (required: boolean) => Promise.resolve(requiredTrueValidator(required)),
  }

  static min(min: number): ValidatorFn {
    return minValidator(min)
  }

  static max(max: number): ValidatorFn {
    return maxValidator(max)
  }

  static minLength(minLength: number): ValidatorFn {
    return minLengthValidator(minLength)
  }

  static maxLength(maxLength: number): ValidatorFn {
    return maxLengthValidator(maxLength)
  }

  static required(required: boolean): ValidationErrors | null {
    return requiredValidator(required)
  }

  static requiredTrue(required: number): ValidationErrors | null {
    return requiredTrueValidator(required)
  }

  static null(_input: any): ValidationErrors | null {
    return nullValidator(_input)
  }

  static mergeErrors(arrayOfErrors: (ValidationErrors | null)[]): ValidationErrors | null {
    let res: { [key: string]: any } = {}

    // Not using Array.reduce here due to a Chrome 80 bug
    // https://bugs.chromium.org/p/chromium/issues/detail?id=1049982
    arrayOfErrors.forEach((errors: ValidationErrors | null) => {
      res = errors != null ? { ...res!, ...errors } : res!
    })

    return Object.keys(res).length === 0 ? null : res
  }

  /**
   * Accepts a list of async validators of different possible shapes (`AsyncValidator` and
   * `AsyncValidatorFn`), normalizes the list (converts everything to `AsyncValidatorFn`) and merges
   * them into a single validator function.
   */
  static composeAsyncValidators(
    validators: Array<AsyncValidator | AsyncValidatorFn>
  ): AsyncValidatorFn | null {
    return validators != null
      ? Validators.composeAsync(Validators.normalizeValidators<AsyncValidatorFn>(validators))
      : null
  }

  static mergeValidators(
    ...validators: ValidatorFn[]
  ): (value: FieldValue) => ValidationErrors[] | null {
    const validatorArr = validators.filter((v) => v !== null) as ValidatorFn[]

    if (!validatorArr.length) return null

    return (value: FieldValue) =>
      validatorArr.reduce((errors, validator: ValidatorFn) => {
        errors.push(validator(value))
        return errors
      }, [] as ValidationErrors[])
  }

  static executeValidators<V extends GenericValidatorFn>(
    input: FieldValue,
    validators: V[]
  ): ReturnType<V>[] {
    return validators.map((validator) => validator(input))
  }

  static isValidatorFn<V>(validator: V | Validator | AsyncValidator): validator is V {
    return !(validator as Validator).validate
  }

  /**
   * Given the list of validators that may contain both functions as well as classes, return the list
   * of validator functions (convert validator classes into validator functions). This is needed to
   * have consistent structure in validators list before composing them.
   *
   * @param validators The set of validators that may contain validators both in plain function form
   *     as well as represented as a validator class.
   */
  static normalizeValidators<V>(validators: (V | Validator | AsyncValidator)[]): V[] {
    return validators.map((validator) => {
      return Validators.isValidatorFn<V>(validator)
        ? validator
        : (((input: FieldValue) => validator.validate(input)) as unknown as V)
    })
  }

  /**
   * Merges synchronous validators into a single validator function.
   */
  static compose(validators: (ValidatorFn | null | undefined)[] | null): ValidatorFn | null {
    if (!validators) return null
    const presentValidators: ValidatorFn[] = validators.filter(isPresent) as any
    if (presentValidators.length == 0) return null

    return function (input: FieldValue) {
      return Validators.mergeErrors(
        Validators.executeValidators<ValidatorFn>(input, presentValidators)
      )
    }
  }

  /**
   * Accepts a list of validators of different possible shapes (`Validator` and `ValidatorFn`),
   * normalizes the list (converts everything to `ValidatorFn`) and merges them into a single
   * validator function.
   */
  static composeValidators(validators: Array<Validator | ValidatorFn>): ValidatorFn | null {
    return validators != null
      ? Validators.compose(Validators.normalizeValidators<ValidatorFn>(validators))
      : null
  }

  /**
   * Merges asynchronous validators into a single validator function.
   */
  static composeAsync = (validators: (AsyncValidatorFn | null)[]): AsyncValidatorFn | null => {
    if (!validators) return null
    const presentValidators: AsyncValidatorFn[] = validators.filter(isPresent) as any
    if (presentValidators.length == 0) return null

    return async function (input: FieldValue) {
      const observables = Validators.executeValidators<AsyncValidatorFn>(
        input,
        presentValidators
      ).map(coerceToPromise)
      return Promise.all(observables).then(Validators.mergeErrors)
    }
  }
}

/**
 * Validator that requires the input's value to be more than or equal to the provided number.
 */
export function minValidator(min: number): ValidatorFn {
  return (input: FieldValue) => {
    const inputValue = getFieldValue(input)
    if (isEmpty(inputValue) || isEmpty(min)) {
      return null // don't validate empty values to allow optional controls
    }
    const value = isNumber(inputValue)
      ? parseFloat(String(inputValue))
      : (inputValue as string).length
    // Controls with NaN values after parsing should be treated as not having a
    // minimum, per the HTML forms spec: https://www.w3.org/TR/html5/forms.html#attr-input-min
    return !isNaN(value) && value < min ? { min: { min: min, actual: inputValue } } : null
  }
}

/**
 * Validator that requires the input's value to be less than or equal to the provided number.
 */
export function maxValidator(max: number): ValidatorFn {
  return (input: FieldValue): ValidationErrors | null => {
    const inputValue = getFieldValue(input)
    if (isEmpty(inputValue) || isEmpty(max)) {
      return null // don't validate empty values to allow optional controls
    }
    const value = parseFloat(inputValue)
    // Controls with NaN values after parsing should be treated as not having a
    // maximum, per the HTML forms spec: https://www.w3.org/TR/html5/forms.html#attr-input-max
    return !isNaN(value) && value > max ? { max: { max: max, actual: inputValue } } : null
  }
}

/**
 * Validator that requires the input have a non-empty value.
 */
export function requiredValidator(input: FieldValue): ValidationErrors | null {
  return isEmpty(getFieldValue(input)) ? { required: true } : null
}

/**
 * Validator that requires the input's value be true. This validator is commonly
 * used for required checkboxes.
 */
export function requiredTrueValidator(input: FieldValue): ValidationErrors | null {
  return getFieldValue(input) === true ? null : { required: true }
}

/**
 * Validator that requires the length of the input's value to be greater than or equal
 * to the provided minimum length. See `Validators.minLength` for additional information.
 */
export function minLengthValidator(minLength: number): ValidatorFn {
  return (input: FieldValue): ValidationErrors | null => {
    const inputValue = getFieldValue(input)
    if (isEmpty(inputValue)) {
      return null
    }

    return inputValue.length < minLength
      ? { minlength: { minLength: minLength, actual: inputValue.length } }
      : null
  }
}

/**
 * Validator that requires the length of the input's value to be less than or equal
 * to the provided maximum length. See `Validators.maxLength` for additional information.
 */
export function maxLengthValidator(maxLength: number): ValidatorFn {
  return (input: FieldValue): ValidationErrors | null => {
    const inputValue = getFieldValue(input)
    return !isEmpty(inputValue) && inputValue.length > maxLength
      ? { maxlength: { maxLength: maxLength, actual: inputValue.length } }
      : null
  }
}

/**
 * Function that has `ValidatorFn` shape, but performs no operation.
 */
export function nullValidator(_input: FieldValue): ValidationErrors | null {
  return null
}

/**
 * Validator that requires the input's value to match a regex pattern.
 */
export function patternValidator(pattern: string | RegExp): ValidatorFn {
  if (!pattern) return nullValidator
  let regex: RegExp
  let regexStr: string
  if (typeof pattern === 'string') {
    regexStr = ''

    if (pattern.charAt(0) !== '^') regexStr += '^'

    regexStr += pattern

    if (pattern.charAt(pattern.length - 1) !== '$') regexStr += '$'

    regex = new RegExp(regexStr)
  } else {
    regexStr = pattern.toString()
    regex = pattern
  }
  return (input: FieldValue): ValidationErrors | null => {
    const inputValue = getFieldValue(input)
    if (isEmpty(inputValue)) {
      return null // don't validate empty values to allow optional controls
    }
    const value: string = inputValue
    return regex.test(value) ? null : { pattern: { pattern: regexStr, actual: value } }
  }
}
