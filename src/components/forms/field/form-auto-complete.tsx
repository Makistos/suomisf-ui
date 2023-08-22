import { Controller, UseFormReturn } from "react-hook-form"
import { AutoComplete, AutoCompleteProps } from "primereact/autocomplete"
import { classNames } from 'primereact/utils'
import { formErrorMessage } from "../form-error-message"

interface FormAutoCompleteProps extends AutoCompleteProps {
  name: string,
  methods: UseFormReturn<any, any>,
  label: string,
  labelClass?: string
}

export const FormAutoComplete = ({ name, methods, label, labelClass, ...rest }: FormAutoCompleteProps) => {

  return (
    <span className="p-float-label">
      <Controller
        name={name}
        control={methods.control}
        render={({ field, fieldState }) => (
          <>
            <AutoComplete
              {...field}
              field={rest.field ? rest.field : "name"}
              delay={rest.delay ? rest.delay : 300}
              minLength={rest.minLength ? rest.minLength : 2}
              removeIcon
              className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
              inputClassName="w-full"
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