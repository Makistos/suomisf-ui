import React, { useMemo, useState } from "react"
import { useNavigate } from 'react-router-dom';

import { FieldValues, FormProvider, useForm, SubmitHandler, Controller } from 'react-hook-form'
import { classNames } from 'primereact/utils'
import { Checkbox } from 'primereact/checkbox'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { useQueryClient, useMutation } from "@tanstack/react-query"

import { FormProperties } from "../../../types/form-properties"
import { Bookseries, BookseriesFormData } from "../types"
import { getCurrenUser } from "../../../services/auth-service"
import { postApiContent, putApiContent } from "../../../services/user-service"
import { HttpStatusResponse } from "../../../services/user-service"
import { isDisabled } from "../../../components/forms/forms"
import { User } from "../../user"
import { ProgressBar } from "primereact/progressbar"

export const BookseriesForm = (props: FormProperties<Bookseries>) => {
  const user = useMemo(() => { return getCurrenUser() }, [])
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate();

  const convToForm = (bookseries: Bookseries): BookseriesFormData => ({
    id: bookseries.id,
    name: bookseries.name,
    orig_name: bookseries.orig_name,
    important: bookseries.important
  })

  const defaultValues: BookseriesFormData = {
    id: null,
    name: '',
    orig_name: '',
    important: false
  }

  const data = props.data ? convToForm(props.data) : defaultValues;
  const queryClient = useQueryClient();
  const methods = useForm<BookseriesFormData>({ defaultValues: data });

  const updateBookseries = (data: BookseriesFormData) => {
    let retval: Promise<HttpStatusResponse>;
    if (typeof data.important === 'number') {
      data.important = (data.important === 0 ? false : true)
    }
    const saveData = { data: data };
    setLoading(true)
    if (data.id != null) {
      retval = putApiContent('bookseries', saveData, user);
    } else {
      retval = postApiContent('bookseries', saveData, user);
    }
    setLoading(false);
    return retval
  }

  const { mutate } = useMutation({
    mutationFn: (values: BookseriesFormData) => updateBookseries(values),
    onSuccess: (data, variables) => {
      props.onSubmitCallback();
      if (variables.id === null) {
        navigate('/bookseries/' + data, { replace: false })
      }
    }
  })

  return (
    <div>
      {data ? (
        <FormObject
          onSubmit={mutate}
          methods={methods}
          disabled={isDisabled(user, loading)} />
      )
        :
        (<ProgressBar />)
      }
    </div>
  )
}

interface FormObjectProps {
  onSubmit: any,
  methods: any,
  disabled: boolean
}

const FormObject = ({ onSubmit, methods, disabled }: FormObjectProps) => {
  const errors = methods.formState.errors;

  const getFormErrorMessage = (name: string) => {
    const message = errors[name];
    const error = message?.message;
    return error ? <small className="p-error">{error.toString()}</small> :
      <small className="p-error">&nbsp;</small>
  }

  return (
    <div className="card mt-3">
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <div className="formgrid grid">
            <div className="field col-12 lg:col-6">
              <span className="p-float-label">
                <Controller
                  name="name"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <>
                      <InputText
                        {...field}
                        autoFocus
                        {...methods.register("name", { required: true })}
                        value={field.value ? field.value : ""}
                        className={classNames({ "p-invalid": fieldState.error }, "w-full")}
                        disabled={disabled}
                      />
                      {getFormErrorMessage(field.name)}
                    </>
                  )}
                />
                <label htmlFor="name">Nimi<sup>*</sup></label>
              </span>
            </div>
            <div className="field col-12 lg:col-6">
              <span className="p-float-label">
                <Controller
                  name="orig_name"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <InputText
                      {...field}
                      {...methods.register("orig_name")}
                      value={field.value ? field.value : ""}
                      className={classNames({ "p-invalis": fieldState.error }, "w-full")}
                      disabled={disabled}
                    />
                  )}
                />
                <label htmlFor="orig_name">Alkukielinen nimi</label>
                <small id="name-help">Alkukielinen sarjan nimi</small>
              </span>
            </div>
            <div className="field col-12">
              <span className="p-float-label">
                <Controller
                  name="important"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <Checkbox
                      {...field}
                      inputId={field.name}
                      inputRef={field.ref}
                      onChange={(e) => field.onChange(e.checked)}
                      tooltip="Tärkeä"
                      className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                      disabled={disabled}
                      checked={field.value}
                    />
                  )}
                />
                <label htmlFor="important">Tärkeä</label>
              </span>
            </div>
            <Button type="submit" className="w-full justify-content-center">
              Tallenna
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  )
}