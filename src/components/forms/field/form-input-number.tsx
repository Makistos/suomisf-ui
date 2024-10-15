import { Controller, RegisterOptions, UseFormReturn } from "react-hook-form"
import { InputNumber, InputNumberProps } from "primereact/inputnumber"
import { classNames } from 'primereact/utils'
import { formErrorMessage } from "../form-error-message"

interface FormInputNumberProps extends InputNumberProps {
  name: string,
  methods: UseFormReturn<any, any>,
  rules?: RegisterOptions,
  label?: string,
  labelClass?: string
}

export const FormInputNumber = ({ name, methods, rules, label, labelClass, ...rest }: FormInputNumberProps) => {
  return (
    <span className="p-float-label">
      <Controller
        name={name}
        control={methods.control}
        rules={rules}
        render={({ field, fieldState }) => (
          <>
            <InputNumber
              id={field.name}
              inputRef={field.ref}
              value={field.value}
              useGrouping={rest.useGrouping ? rest.useGrouping : false}
              onBlur={field.onBlur}
              onValueChange={(e) => field.onChange(e.value)}
              className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
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