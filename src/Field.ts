import {
  AsyncValidatorFn,
  FieldStatus,
  FieldValue,
  Schema,
  ValidationErrors,
  ValidatorFn,
} from './types'
import { coerceToPromise, getFieldValue } from './utils'
import { Validators } from './validators'

/**
 * Creates validator function by combining provided validators.
 */
function coerceToValidator(validator: ValidatorFn | ValidatorFn[] | null): ValidatorFn | null {
  return Array.isArray(validator) ? Validators.composeValidators(validator) : validator || null
}

/**
 * Creates async validator function by combining provided async validators.
 */
function coerceToAsyncValidator(
  asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null
): AsyncValidatorFn | null {
  return Array.isArray(asyncValidator)
    ? Validators.composeAsyncValidators(asyncValidator)
    : asyncValidator || null
}

export class FieldGroup {
  get schema() {
    return this._schema
  }
  private _schema: Schema

  fields: Record<string, Field>

  constructor(schema: Schema) {
    this._schema = schema

    this.fields = Object.entries(this._schema).reduce((agg, [k, v]) => {
      agg[k] = new Field(v)
      return agg
    }, {})
  }

  update(shouldUpdate?: boolean) {
    console.log('should update', shouldUpdate)
  }
}

export class Field {
  status: FieldStatus = FieldStatus.VALID

  /**
   * Contains the result of merging synchronous validators into a single validator function
   * (combined using `Validators.compose`).
   *
   * @internal
   */
  private _composedValidatorFn: ValidatorFn | null

  /**
   * Contains the result of merging asynchronous validators into a single validator function
   * (combined using `Validators.composeAsync`).
   *
   * @internal
   */
  private _composedAsyncValidatorFn: AsyncValidatorFn | null

  /**
   * Synchronous validators as they were provided:
   *  - in `AbstractControl` constructor
   *  - as an argument while calling `setValidators` function
   *  - while calling the setter on the `validator` field (e.g. `control.validator = validatorFn`)
   *
   * @internal
   */
  private _rawValidators: ValidatorFn | ValidatorFn[] | null

  /**
   * Asynchronous validators as they were provided:
   *  - in `AbstractControl` constructor
   *  - as an argument while calling `setAsyncValidators` function
   *  - while calling the setter on the `asyncValidator` field (e.g. `control.asyncValidator =
   * asyncValidatorFn`)
   *
   * @internal
   */
  private _rawAsyncValidators: AsyncValidatorFn | AsyncValidatorFn[] | null

  set value(value: any) {
    this._value = value
  }
  get value() {
    return this._value
  }
  private _value: any

  private _parent: FieldGroup

  protected _hasOwnPendingAsyncValidator = false

  readonly errors: ValidationErrors | null

  constructor(
    value: FieldValue,
    validators?: ValidatorFn | ValidatorFn[],
    asyncValidators?: AsyncValidatorFn | AsyncValidatorFn[] | null
  ) {
    this.value = getFieldValue(value)

    this._rawValidators = validators
    this._rawAsyncValidators = asyncValidators
    this._composedValidatorFn = coerceToValidator(this._rawValidators)
    this._composedAsyncValidatorFn = coerceToAsyncValidator(this._rawAsyncValidators)

    // const handler: ProxyHandler<IValidation> = {
    //   get: (object, prop: ValidatorsKeys & keyof IValidation) => {
    //     if (prop in object) {
    //       return object[prop]
    //     } else if (validators.has(prop)) {
    //       return validators.get(prop)
    //     } else {
    //       throw new Error(
    //         `The validator ${prop}() does not exist. Did you forget to call Validation.addValidator(name, validator)`
    //       )
    //     }
    //   },
    // }
  }

  // TODO: implement this
  updateValue() {
    // update the value
    // run all validators
    // emit update event using EventEmitter
  }

  /**
   * The function that is used to determine the validity of this control synchronously.
   */
  get validator(): ValidatorFn | null {
    return this._composedValidatorFn
  }
  set validator(validatorFn: ValidatorFn | null) {
    this._rawValidators = this._composedValidatorFn = validatorFn
  }

  /**
   * The function that is used to determine the validity of this control asynchronously.
   */
  get asyncValidator(): AsyncValidatorFn | null {
    return this._composedAsyncValidatorFn
  }
  set asyncValidator(asyncValidatorFn: AsyncValidatorFn | null) {
    this._rawAsyncValidators = this._composedAsyncValidatorFn = asyncValidatorFn
  }

  /**
   * Sets the synchronous validators that are active on this control.  Calling
   * this overwrites any existing sync validators.
   *
   * When you add or remove a validator at run time, you must call
   * `updateValueAndValidity()` for the new validation to take effect.
   *
   */
  setValidators(newValidator: ValidatorFn | ValidatorFn[] | null): void {
    this._rawValidators = newValidator
    this._composedValidatorFn = coerceToValidator(newValidator)
  }

  /**
   * Sets the async validators that are active on this control. Calling this
   * overwrites any existing async validators.
   *
   * When you add or remove a validator at run time, you must call
   * `updateValueAndValidity()` for the new validation to take effect.
   *
   */
  setAsyncValidators(newValidator: AsyncValidatorFn | AsyncValidatorFn[] | null): void {
    this._rawAsyncValidators = newValidator
    this._composedAsyncValidatorFn = coerceToAsyncValidator(newValidator)
  }

  /**
   * Empties out the sync validator list.
   *
   * When you add or remove a validator at run time, you must call
   * `updateValueAndValidity()` for the new validation to take effect.
   *
   */
  clearValidators(): void {
    this.validator = null
  }

  /**
   * Empties out the async validator list.
   *
   * When you add or remove a validator at run time, you must call
   * `updateValueAndValidity()` for the new validation to take effect.
   *
   */
  clearAsyncValidators(): void {
    this.asyncValidator = null
  }

  setErrors(errors: ValidationErrors | null, opts: { emitEvent?: boolean } = {}): void {
    ;(this as { errors: ValidationErrors | null }).errors = errors
    if (this._parent) {
      this._parent.update(opts.emitEvent !== false)
    }
  }

  protected _runValidator(): ValidationErrors | null {
    return this.validator ? this.validator(this) : null
  }

  protected async _runAsyncValidator(emitEvent?: boolean): Promise<void> {
    if (this.asyncValidator) {
      ;(this as { status: string }).status = FieldStatus.PENDING
      this._hasOwnPendingAsyncValidator = true
      const errors: ValidationErrors | null = await coerceToPromise(this.asyncValidator(this))

      if (errors) {
        this._hasOwnPendingAsyncValidator = false
        // This will trigger the recalculation of the validation status, which depends on
        // the state of the asynchronous validation (whether it is in progress or not). So, it is
        // necessary that we have updated the `_hasOwnPendingAsyncValidator` boolean flag first.
        this.setErrors(errors, { emitEvent })
      }
    }
  }

  /**
   * Sets the parent context of the field
   */
  setParent(parent: FieldGroup): void {
    this._parent = parent
  }
}
