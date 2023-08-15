import { Controller, RegisterOptions, UseFormReturn } from "react-hook-form"
import { Checkbox } from "primereact/checkbox"
import { classNames } from 'primereact/utils'

import { formErrorMessage } from "../form-error-message"

interface FormCheckboxProps {
  name: string,
  methods: UseFormReturn,
  rules?: RegisterOptions,
  label: string,
  autoFocus?: boolean,
  disabled: boolean
}

export const FormCheckbox = ({ name, methods, label, disabled }: FormCheckboxProps) => {
  return (
    <span className="p-float-label">
      <Controller
        name={name}
        control={methods.control}
        render={({ field, fieldState }) => (
          <Checkbox
            {...field}
            inputId={field.name}
            inputRef={field.ref}
            onChange={(e) => field.onChange(e.checked)}
            tooltip="Tärkeä"
            className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
            disabled={disabled}
            checked={field.value}
          />
        )}
      />
      <label htmlFor={name}>{label}</label>
    </span>

  )
}