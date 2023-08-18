import { Controller, UseFormReturn } from "react-hook-form"
import { AutoComplete, AutoCompleteProps } from "primereact/autocomplete"
import { classNames } from 'primereact/utils'

interface FormAutoCompleteProps extends AutoCompleteProps {
  name: string,
  methods: UseFormReturn,
  label: string,
}

export const FormAutoComplete = ({ name, methods, label, ...rest }: FormAutoCompleteProps) => {

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
          </>
        )}
      />
      <label htmlFor={name}>{label}</label>
    </span>
  )
}