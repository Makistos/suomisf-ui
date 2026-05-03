import { Controller, RegisterOptions, UseFormReturn } from "react-hook-form"
import { InputTextarea, InputTextareaProps } from "primereact/inputtextarea"
import { classNames } from 'primereact/utils'

import { formErrorMessage } from "../form-error-message"

interface FormInputTextareaProps extends InputTextareaProps {
  name: string,
  methods: UseFormReturn<any, any>,
  rules?: RegisterOptions,
  label: string,
  labelClass?: string
}

export const FormInputTextarea = ({ name, methods, rules, label, labelClass, ...rest }: FormInputTextareaProps) => {
  return (
    <span className="p-float-label">
      <Controller
        name={name}
        control={methods.control}
        rules={rules}
        render={({ field, fieldState }) => (
          <>
            <InputTextarea
              {...field}
              value={field.value ? field.value : ''}
              className={classNames({ "p-invalid": fieldState.error }, "w-full")}
              {...rest}
            />
            {formErrorMessage(field.name, methods.formState.errors)}
          </>
        )}
      />
      <label htmlFor={name} className={labelClass ? labelClass : ""}>{label}</label>
    </span>
  )
}
