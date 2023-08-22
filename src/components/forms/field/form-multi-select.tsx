import { Controller, UseFormReturn } from "react-hook-form"
import { MultiSelect, MultiSelectProps } from "primereact/multiselect"
import { classNames } from 'primereact/utils'
import { SelectItemOptionsType } from "primereact/selectitem"
import { formErrorMessage } from "../form-error-message"

interface FormMultiSelectProps extends MultiSelectProps {
  name: string,
  methods: UseFormReturn<any, any>,
  label: string,
  labelClass?: string,
}

export const FormMultiSelect = ({ name, methods, label, labelClass, ...rest }: FormMultiSelectProps) => {
  return (
    <span className="p-float-label">
      <Controller
        name={name}
        control={methods.control}
        render={({ field, fieldState }) => (
          <>
            <MultiSelect
              {...field}
              optionLabel={rest.optionLabel ? rest.optionLabel : "name"}
              display={rest.display ? rest.display : 'chip'}
              scrollHeight={rest.scrollHeight ? rest.scrollHeight : "400px"}
              className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
              showClear
              showSelectAll={rest.showSelectAll ? rest.showSelectAll : false}
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