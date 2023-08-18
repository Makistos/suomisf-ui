import { Controller, RegisterOptions, UseFormReturn } from "react-hook-form"
import { InputText, InputTextProps } from "primereact/inputtext"
import { classNames } from 'primereact/utils'

import { formErrorMessage } from "../form-error-message"

interface FormInputTextProps extends InputTextProps {
  name: string,
  methods: UseFormReturn,
  rules?: RegisterOptions,
  label: string,
}

export const FormInputText = ({ name, methods, rules, label, ...rest }: FormInputTextProps) => {
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
              value={field.value ? field.value : ''}
              className={classNames({ "p-invalid": fieldState.error }, "w-full")}
              {...rest}
            />
            {formErrorMessage(field.name, methods.formState.errors)}
          </>
        )}
      />
      <label htmlFor={name}>{label}</label>
    </span>
  )
}