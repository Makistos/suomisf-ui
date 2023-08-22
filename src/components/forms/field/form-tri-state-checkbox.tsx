import { Controller, UseFormReturn } from "react-hook-form"
import { TriStateCheckbox, TriStateCheckboxProps } from "primereact/tristatecheckbox"
import { classNames } from "primereact/utils"
import { formErrorMessage } from "../form-error-message"

interface FormTristateCheckboxProps extends TriStateCheckboxProps {
  name: string,
  methods: UseFormReturn<any, any>,
  label: string,
  labelClass?: string,
}

export const FormTriStateCheckbox = ({ name, methods, label, labelClass, disabled, ...rest }: FormTristateCheckboxProps) => {

  return (
    <span className="p-float-label">
      <Controller
        name={name}
        control={methods.control}
        render={({ field, fieldState }) => (
          <>
            <TriStateCheckbox
              {...field}
              id={field.name}
              value={field.value}
              tooltip={label}
              onChange={field.onChange}
              className={classNames({ 'p-invalid': fieldState.error })}
              disabled={disabled}
            />
            {formErrorMessage(field.name, methods.formState.errors)}
          </>
        )}
      />
      <label htmlFor={name} className={labelClass ? labelClass : ""}>{label}</label>
    </span>
  )
}