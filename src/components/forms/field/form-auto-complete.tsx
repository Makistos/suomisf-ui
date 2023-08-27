import { Controller, UseFormReturn } from "react-hook-form"
import { AutoComplete, AutoCompleteProps } from "primereact/autocomplete"
import { classNames } from 'primereact/utils'
import { Button } from 'primereact/button'
import { formErrorMessage } from "../form-error-message"
import { Dialog } from "primereact/dialog"
import { FormEventHandler, useState } from "react"
import { FormInputText } from "./form-input-text"

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

const NewItem = ({ submitFunction }: NewItemProps) => {
  return (
    <>
      <form onSubmit={submitFunction}>
        <div className="formgrid">
          <div className="field">
            <input type="text" id="item"></input>
            <button type="submit">Lisää</button>
          </div>
        </div>
      </form>
    </>
  )
}

export const FormAutoComplete = ({ name, methods, label, labelClass, tagFunction, ...rest }: FormAutoCompleteProps) => {
  const [addNewItemVisible, setAddNewItemVisible] = useState(false);

  const onNewItemShow = () => {
    setAddNewItemVisible(true);
  }
  const onNewItemHide = () => {
    setAddNewItemVisible(false);
  }

  return (
    <div className="flex">
      <div className="p-float-label">
        {tagFunction &&
          <Dialog header="Lisää tietue"
            visible={addNewItemVisible}
            onShow={() => onNewItemShow}
            onHide={() => onNewItemHide}>
            <NewItem submitFunction={tagFunction} />
          </Dialog>
        }
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
                className={classNames({ 'p-invalid': fieldState.error },)}
                // inputClassName="w-full"
                {...rest}
              />
              {formErrorMessage(field.name, methods.formState.errors)}
            </>
          )}
        />
        <label htmlFor={name} className={labelClass ? labelClass : ""}>{label}</label>
      </div>
      <div>
        {tagFunction &&
          <Button
            onClick={() => setAddNewItemVisible(true)}
            className="inline-block p-1 h-full"
          >
            +
          </Button>
        }
      </div>
    </div>
  )
}