import { Controller, RegisterOptions, UseFormReturn } from "react-hook-form"
import { Checkbox, CheckboxProps } from "primereact/checkbox"
import { classNames } from 'primereact/utils'

import { formErrorMessage } from "../form-error-message"

interface FormCheckboxProps extends CheckboxProps {
  name: string,
  methods: UseFormReturn,
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
    <span className="p-float-label">
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
              className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
              {...rest}
              checked={field.value}
            />
            {formErrorMessage(field.name, methods.formState.errors)}
          </>
        )}
      />
      <label htmlFor={name} className={labelClass ? labelClass : ""}>{label}</label>
    </span>

  )
}