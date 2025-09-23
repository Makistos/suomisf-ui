import { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { FieldValues, FormProvider, useForm, SubmitHandler, Controller } from 'react-hook-form'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { useQueryClient, useMutation } from "@tanstack/react-query"

import { FormProperties } from "../../../types/form-properties"
import { Bookseries, BookseriesFormData } from "../types"
import { getCurrenUser } from "../../../services/auth-service"
import { getApiContent, postApiContent, putApiContent } from "../../../services/user-service"
import { HttpStatusResponse } from "../../../services/user-service"
import { isDisabled } from "../../../components/forms/forms"
import { ProgressBar } from "primereact/progressbar"
import { FormInputText } from '../../../components/forms/field/form-input-text';
import { FormCheckbox } from '../../../components/forms/field/form-checkbox';
import { LinkType } from '../../../types/link';
import { LinksField } from '@components/forms/links-field';
import { FormEditor } from '@components/forms/field/form-editor';
import { FormAutoComplete } from '@components/forms/field/form-auto-complete';

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
    description: bookseries.description,
    important: bookseries.important,
    links: (bookseries.links && bookseries.links.length > 0) ? bookseries.links : [{ link: '', description: '' }],
    partof: bookseries.partof,
  })

  const defaultValues: BookseriesFormData = {
    id: null,
    name: '',
    orig_name: '',
    description: '',
    important: false,
    links: [{ link: '', description: '' }],
    partof: null,
  }

  const data = props.data ? convToForm(props.data) : defaultValues;
  const queryClient = useQueryClient();
  const methods = useForm<BookseriesFormData>({ defaultValues: data });

  console.log(data);
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
  const user = useMemo(() => { return getCurrenUser() }, []);
  const errors = methods.formState.errors;
  const rules = { required: true };
  const [filteredBookseries, setFilteredBookseries] = useState([]);

  const editor_style: React.CSSProperties = { height: '320px' };

  async function filterBookseries(event: any) {
    const url = "filter/bookseries/" + event.query;
    const response = await getApiContent(url, user);
    setFilteredBookseries(response.data);
  }

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
            <div className="field col-6">
              <FormAutoComplete
                name="partof"
                methods={methods}
                label="Kuuluu sarjaan"
                completeMethod={filterBookseries}
                suggestions={filteredBookseries}
                forceSelection={false}
                placeholder='Kuuluu sarjaan'
              //disabled={disabled}
              />
            </div>
            <div className="field col-12">
              <LinksField
                id={"links"}
                disabled={disabled}
              />
            </div>
            <div className="field col-12">
              <b>Kuvaus</b>
              <FormEditor
                name="description"
                methods={methods}
                style={editor_style}
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