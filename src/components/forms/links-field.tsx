import React, { useMemo } from "react"

import { Controller, useFieldArray } from "react-hook-form"
import { Button } from "primereact/button";

import { getCurrenUser } from "../../services/auth-service"
import { useFormContext } from "react-hook-form"
import { LinkType } from "../../types/link"
import { InputText } from "primereact/inputtext"
import { classNames } from "primereact/utils"

interface LinksFieldProps {
  id: string,
  disabled: boolean
}

export const LinksField = ({ id, disabled }: LinksFieldProps) => {
  const user = useMemo(() => { return getCurrenUser() }, [])

  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'links',
  });

  const LinksRow = ({ index }: { index: number }) => {
    const keyName = `${id}[${index}]`;

    const emptyLink: LinkType = {
      link: "",
      description: ""
    }

    const addEmptyLink = () => {
      append(emptyLink)
    }

    const removeLink = (index: number) => {
      remove(index)
    }

    return (
      <div key={keyName} className="grid gap-1">
        <div className="field sm:col-12 lg:col-3">
          <Controller
            name={`links.${index}.link` as const}
            control={control}
            render={({ field, fieldState }) => (
              <InputText
                {...field}
                tooltip="Osoite"
                placeholder="Osoite"
                disabled={disabled}
                className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
              />
            )}
          />
        </div>
        <div className="field sm:col-12 lg:col-3">
          <Controller
            name={`links.${index}.description` as const}
            control={control}
            render={({ field, fieldState }) => (
              <InputText
                {...field}
                tooltip="Kuvaus"
                placeholder="Kuvaus"
                disabled={disabled}
                className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
              />
            )}
          />
        </div>
        <div className="field sm:col-12 lg:col-1">
          <Button type="button"
            className="p-button-rounded p-button-text"
            onClick={() => removeLink(index)}
            icon="pi pi-minus"
            disabled={fields.length < 2 || disabled}
          />
          {index === fields.length - 1 && (
            <Button type="button" className="p-button-rounded p-button-text"
              icon="pi pi-plus"
              onClick={() => addEmptyLink()}
              disabled={disabled}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <span>
        <label htmlFor={id} className="form-field-header">Linkit</label>
        <div id={id} className="py-0" key={id}>
          {fields && fields.map((_, index) =>
            <LinksRow index={index} />
          )}
        </div>
      </span>
    </>

  )
}