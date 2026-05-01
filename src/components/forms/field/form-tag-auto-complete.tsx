import { Controller, UseFormReturn, useFieldArray, useFormContext } from "react-hook-form"
import { AutoComplete, AutoCompleteProps } from "primereact/autocomplete"
import { classNames } from 'primereact/utils'
import { Button } from 'primereact/button'
import { formErrorMessage } from "../form-error-message"
import { Dialog } from "primereact/dialog"
import { FormEventHandler, useState } from "react"
import { InputText } from "primereact/inputtext"
import { FloatLabel } from "primereact/floatlabel"

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
  const [currentQuery, setCurrentQuery] = useState("");

  const { control } = useFormContext();

  const { append } = useFieldArray({
    control,
    name: name
  })

  const onNewItemHide = (tag: string) => {
    if (tag != "") {
      append({ id: 0, name: tag });
      setAddNewItemVisible(false);
      setTagName("");
    }
    setAddNewItemVisible(false);
  }

  const wrappedCompleteMethod = (e: any) => {
    if (tagFunction) setCurrentQuery(e.query);
    rest.completeMethod?.(e);
  };

  const enrichedSuggestions = (() => {
    const base = rest.suggestions ?? [];
    if (!tagFunction || !currentQuery.trim()) return base;
    const exactMatch = base.some((s: any) =>
      s.name?.toLowerCase() === currentQuery.trim().toLowerCase()
    );
    if (exactMatch) return base;
    return [{ id: 0, name: currentQuery.trim(), _isCreate: true }, ...base];
  })();

  const itemTemplate = (item: any) => {
    if (item._isCreate) {
      return <><i className="pi pi-plus-circle mr-2" />Lisää uusi: "{item.name}"</>;
    }
    if (rest.itemTemplate) {
      return (rest.itemTemplate as Function)(item);
    }
    return item[typeof rest.field === 'string' ? rest.field : 'name'];
  };

  const NewItem = () => {
    const [tag, setTag] = useState("");
    return (
      <div className="card grid mt-3 mb-0">
        <div className="col-12 mb-0">
          <FloatLabel>
            <InputText
              autoFocus
              value={tag} id="item"
              className="min-w-full"
              onChange={(e) => setTag(e.target.value)}></InputText>
            <label htmlFor="item">Uusi asiasana</label>
          </FloatLabel>
        </div>
        <div className="col-12 mt-0 mb-0">
          <Button type="button"
            icon="pi pi-save"
            size="large"
            className="min-w-full"
            onClick={() => onNewItemHide(tag)} label="Tallenna"></Button>
        </div>
        <div className="col-12 mt-0 pt-0" >
          <Button type="button"
            icon="pi pi-times"
            size="large"
            className="min-w-full"
            onClick={() => onNewItemHide("")} label="Peruuta"></Button>
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
            modal
            closable={false}
            // onShow={() => onNewItemShow}
            onHide={() => onNewItemHide}>
            <NewItem />
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
                onChange={(e) => {
                  if (Array.isArray(e.value)) {
                    field.onChange({ ...e, value: e.value.map(({ _isCreate, ...item }: any) => item) });
                  } else {
                    field.onChange(e);
                  }
                }}
                completeMethod={wrappedCompleteMethod}
                suggestions={enrichedSuggestions}
                itemTemplate={itemTemplate}
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
