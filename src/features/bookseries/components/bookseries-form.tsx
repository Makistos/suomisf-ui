import { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { FieldValues, FormProvider, useForm, SubmitHandler, Controller } from 'react-hook-form'
import { classNames } from 'primereact/utils'
import { Checkbox } from 'primereact/checkbox'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { useQueryClient, useMutation } from "@tanstack/react-query"

import { FormProperties } from "../../../types/form-properties"
import { Bookseries, BookseriesFormData } from "../types"
import { getCurrenUser } from "../../../services/auth-service"
import { postApiContent, putApiContent } from "../../../services/user-service"
import { HttpStatusResponse } from "../../../services/user-service"
import { isDisabled } from "../../../components/forms/forms"
import { User } from "../../user"
import { ProgressBar } from "primereact/progressbar"
import { formErrorMessage } from '../../../components/forms/form-error-message';
import { FormInputText } from '../../../components/forms/field/form-input-text';
import { FormCheckbox } from '../../../components/forms/field/form-checkbox';

export interface FormObjectProps {
  onSubmit: any;
  methods: any;
  disabled: boolean;
}

export const BookseriesForm = (props: FormProperties<Bookseries>) => {
  const user = useMemo(() => { return getCurrenUser() }, [])
  const [loading, setLoading] = useState(false)
  const toastRef = useRef<Toast>(null);
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
    onSuccess: (data) => {
      props.onSubmitCallback();
      if (data.status === 201) {
        navigate('/bookseries/' + data.response, { replace: false })
      } else if (data.status === 200) {
        toastRef.current?.show([{
          severity: 'success',
          summary: 'Tallentaminen onnistui',
          detail: 'Tietojen päivitys onnistui'
        }]);
      } else {
        let errMsg = '';
        console.log(data.response);
        if (data.response && JSON.parse(data.response).data["msg"] !== undefined) {
          errMsg = JSON.parse(data.response).data["msg"];
          console.log(errMsg);
        } else {
          errMsg = 'Tuntematon virhe'
        }
        toastRef.current?.show({
          severity: 'error',
          summary: 'Tietojen tallentaminen epäonnistui',
          detail: errMsg
        })
      }
    },
    onError: (error: any) => {
      const errMsg = JSON.parse(error.response).data["msg"];
      toastRef.current?.show({
        severity: 'error',
        summary: 'Tietojen tallentaminen ei onnistunut',
        detail: errMsg
      });
      console.log(error.message);
    }
  })

  return (
    <>
      <Toast ref={toastRef} />
      {data ? (
        <FormObject
          onSubmit={mutate}
          methods={methods}
          disabled={isDisabled(user, loading)} />
      )
        :
        <ProgressBar />
      }
    </>
  )
}

const FormObject = ({ onSubmit, methods, disabled }: FormObjectProps) => {
  const errors = methods.formState.errors;
  const rules = { required: true };

  return (
    <div className="card mt-3">
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <div className="formgrid grid">
            <div className="field col-12 lg:col-6">
              <FormInputText
                name="name"
                methods={methods}
                rules={rules}
                label="Nimi"
                autoFocus={true}
                disabled={disabled}
              />
            </div>
            <div className="field col-12 lg:col-6">
              <FormInputText
                name="orig_name"
                methods={methods}
                label="Alkukielinen nimi"
                disabled={disabled}
              />
            </div>
            <div className="field col-12">
              <FormCheckbox
                name="important"
                methods={methods}
                label="Tärkeä"
                disabled={disabled}
                checked={false}
              />
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