import React, { useMemo, useState } from "react"

import { Controller, useFieldArray } from "react-hook-form"
import { Button } from "primereact/button";
import { AutoComplete } from "primereact/autocomplete";
import { InputText } from "primereact/inputtext"
import { classNames } from "primereact/utils"

import { getCurrenUser } from "../../services/auth-service"
import { useFormContext } from "react-hook-form"
import { LinkType } from "../../types/link"
import { getApiContent } from "../../services/user-service";

interface LinksFieldProps {
  id: string,
  disabled: boolean
}

export const LinksField = ({ id, disabled }: LinksFieldProps) => {
  const user = useMemo(() => { return getCurrenUser() }, [])
  // const [filteredLinkNames, setFilteredLinkNames] = useState<any>([]);
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'links',
  });

  // async function filterLinkNames(event: any) {
  //   const url = "filter/linknames/" + event.query;
  //   const response = await getApiContent(url, user);
  //   const ln = response.data;
  //   setFilteredLinkNames(ln);
  //   return ln;
  // }

  const LinksRow = ({ index }: { index: number }) => {
    const keyName = `{links-field.${index}}`;
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
        <div className="field sm:col-12 lg:col-3" key={`${keyName}.link`}>
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
        <div className="field sm:col-12 lg:col-3" key={`${keyName}.description`}>
          <Controller
            name={`links.${index}.description` as const}
            control={control}
            render={({ field, fieldState }) => (
              // <AutoComplete
              //   {...field}
              //   field="description"
              //   completeMethod={filterLinkNames}
              //   suggestions={filteredLinkNames}
              //   placeholder="Kuvaus"
              //   tooltip="Kuvaus"
              //   forceSelection={false}
              //   delay={300}
              //   className={classNames(
              //     { "p-invalid": fieldState.error },
              //     "w-full"
              //   )}
              //   inputClassName="w-full"
              //   disabled={disabled}
              //   inputRef={field.ref}
              // />
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
        <label htmlFor={id} className="form-field-header font-bold">Linkit</label>
        <div id={id} className="py-0" key={`$(id)-form`}>
          {fields && fields.map((_, index) =>
            <LinksRow index={index} key={`$(id)-form-${index}`} />
          )}
        </div>
      </span>
    </>

  )
}