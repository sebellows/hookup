import { AsyncValidatorFn, FieldValue, ValidationErrors, ValidatorFn } from './types'
import { getFieldValue, isEmpty, isNumber } from './utils'

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
