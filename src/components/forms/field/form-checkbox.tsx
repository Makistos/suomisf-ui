import { Controller, RegisterOptions, UseFormReturn } from "react-hook-form"
import { Checkbox, CheckboxProps } from "primereact/checkbox"
import { classNames } from 'primereact/utils'

import { formErrorMessage } from "../form-error-message"

interface FormCheckboxProps extends CheckboxProps {
  name: string,
  methods: UseFormReturn<any, any>,
  rules?: RegisterOptions,
  label: string,
  labelClass?: string
}

export const FormCheckbox = ({ name, methods, label, labelClass, ...rest }: FormCheckboxProps) => {
  /**
   *
   * Note: checked needs to be defined in FormCheckbox as it's a required field
   * for Checkbox. It can be anything because value will be overwritten by field
   * value.
   */
  return (
    // A plain row, not p-float-label: a float label is laid over its control,
    // which put the text on top of the box.
    <div className="flex align-items-center gap-2">
      <Controller
        name={name}
        control={methods.control}
        render={({ field, fieldState }) => (
          <>
            <Checkbox
              {...field}
              inputId={field.name}
              inputRef={field.ref}
              onChange={(e) => field.onChange(e.checked)}
              tooltip={label}
              className={classNames({ 'p-invalid': fieldState.error })}
              {...rest}
              checked={field.value}
            />
            {formErrorMessage(field.name, methods.formState.errors)}
          </>
        )}
      />
      {label && <label htmlFor={name} className={labelClass ? labelClass : ""}>{label}</label>}
    </div>

  )
}