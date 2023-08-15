import { Controller, RegisterOptions, UseFormReturn } from "react-hook-form"
import { InputText } from "primereact/inputtext"
import { classNames } from 'primereact/utils'

import { formErrorMessage } from "./form-error-message"

interface FormInputTextProps {
  name: string,
  methods: UseFormReturn,
  rules: RegisterOptions,
  label: string,
  autoFocus?: boolean,
  disabled: boolean
}

export const FormInputText = ({ name, methods, rules, label, autoFocus, disabled }: FormInputTextProps) => {
  return (
    <span className="p-float-label">
      <Controller
        name={name}
        control={methods.control}
        render={({ field, fieldState }) => (
          <>
            <InputText
              {...field}
              {...methods.register(name, rules)}
              autoFocus={autoFocus !== undefined && autoFocus === true ? true : false}
              value={field.value ? field.value : ''}
              className={classNames({ "p-invalid": fieldState.error }, "w-full")}
              disabled={disabled}
            />
            {formErrorMessage(field.name, methods.formState.errors)}
          </>
        )}
      />
      <label htmlFor={name}>{label}</label>
    </span>
  )
}