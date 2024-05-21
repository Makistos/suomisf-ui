import { Controller, UseFormReturn } from "react-hook-form"
import { AutoComplete, AutoCompleteProps } from "primereact/autocomplete"
import { classNames } from 'primereact/utils'
import { formErrorMessage } from "../form-error-message"
import { FormEventHandler, useMemo, useState } from "react"
import { getCurrenUser } from "@services/auth-service"

interface FormAutoCompleteProps extends AutoCompleteProps {
  name: string,
  methods: UseFormReturn<any, any>,
  label: string,
  labelClass?: string,
  tagFunction?: FormEventHandler
}

interface NewItemProps {
  submitFunction: FormEventHandler
}

export const FormAutoComplete = ({ name, methods, label, labelClass, ...rest }: FormAutoCompleteProps) => {
  return (
    <div className="flex">
      <div className="p-float-label">
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
                className={classNames({ 'p-invalid': fieldState.error },)}
                {...rest}
              />
              {formErrorMessage(field.name, methods.formState.errors)}
            </>
          )}
        />
        <label htmlFor={name} className={labelClass ? labelClass : ""}>{label}</label>
      </div>
    </div>
  )
}