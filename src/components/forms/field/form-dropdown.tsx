import { Controller, RegisterOptions, UseFormReturn } from "react-hook-form"
import { Dropdown, DropdownProps } from "primereact/dropdown"
import { classNames } from 'primereact/utils'
import { formErrorMessage } from "../form-error-message"
import { SelectItemOptionsType } from "primereact/selectitem"

interface FormDropdownProps extends DropdownProps {
  name: string,
  methods: UseFormReturn,
  label: string,
  rules?: RegisterOptions,
  labelClass?: string
}

export const FormDropdown = ({ name, methods, label, rules, labelClass, ...rest }: FormDropdownProps) => {
  return (
    <span className="p-float-label">
      <Controller
        name={name}
        control={methods.control}
        rules={rules}
        render={({ field, fieldState }) => (
          <>
            <Dropdown
              {...field}
              optionLabel={rest.optionLabel ? rest.optionLabel : "name"}
              className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
              tooltip={label}
              {...rest}
            />
            {formErrorMessage(field.name, methods.formState.errors)}
          </>
        )}
      />
      <label htmlFor={name} className={labelClass}></label>
    </span>

  )
}
