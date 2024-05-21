import { Controller, UseFormReturn, useFieldArray, useFormContext } from "react-hook-form"
import { AutoComplete, AutoCompleteProps } from "primereact/autocomplete"
import { classNames } from 'primereact/utils'
import { Button } from 'primereact/button'
import { formErrorMessage } from "../form-error-message"
import { Dialog } from "primereact/dialog"
import { FormEventHandler, useState } from "react"
import { InputText } from "primereact/inputtext"

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

export const FormTagAutoComplete = ({ name, methods, label, labelClass, tagFunction, ...rest }: FormAutoCompleteProps) => {
  const [addNewItemVisible, setAddNewItemVisible] = useState(false);
  const [tagName, setTagName] = useState("");

  const { control } = useFormContext();

  const { append } = useFieldArray({
    control,
    name: name
  })

  const onNewItemShow = () => {
    setAddNewItemVisible(true);
  }
  const onNewItemHide = () => {
    if (tagName && tagName != "") {
      append({ id: 0, name: tagName });
      setAddNewItemVisible(false);
      setTagName("");
    }
    setAddNewItemVisible(false);
  }

  const NewItem = ({ submitFunction }: NewItemProps) => {
    return (
      <div className="grid mt-3">
        <div className="grid col mr-1">
          <InputText
            value={tagName} id="item"
            onChange={(e) => setTagName(e.target.value)}></InputText>
        </div>
        <div className="grid col">
          <Button type="button"
            icon="pi pi-save"
            size="large"
            onClick={onNewItemHide} label="Tallenna"></Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex">
      <div className="p-float-label">
        {tagFunction &&
          <Dialog header="Lisää tietue"
            visible={addNewItemVisible}
            // onShow={() => onNewItemShow}
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
                className={classNames({ 'p-invalid': fieldState.error },)}
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
          <Button type="button"
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