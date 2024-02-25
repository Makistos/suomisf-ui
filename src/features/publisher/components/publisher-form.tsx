import { useEffect, useState, useMemo } from 'react';
import { useForm, Controller, SubmitHandler, FieldValues, RegisterOptions, FormProvider } from 'react-hook-form';

import { classNames } from 'primereact/utils';
import { InputText } from 'primereact/inputtext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from 'primereact/button';

import { HttpStatusResponse, getApiContent, postApiContent, putApiContent } from '../../../services/user-service';
import { FormSubmitObject, isDisabled } from '../../../components/forms/forms';
import { register } from '../../../services/auth-service';
import { getCurrenUser } from '../../../services/auth-service';
import { PublisherFormData } from '../types';
import { Publisher } from '../types';
import { QueryClient } from '@tanstack/react-query';
import { FormInputText } from '../../../components/forms/field/form-input-text';
import { FormEditor } from '../../../components/forms/field/form-editor';
import { method } from 'lodash';
import { ProgressBar } from 'primereact/progressbar';
import { useNavigate } from 'react-router-dom';
import { LinksField } from '../../../components/forms/links-field';

interface FormProps<T> {
  publisher: T | null,
  onSubmitCallback: ((status: boolean, message: string) => void)
}

type FormObjectProps = {
  onSubmit: any,
  methods: any
}

export const PublisherForm = (props: FormProps<Publisher>) => {
  const user = useMemo(() => { return getCurrenUser() }, []);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const convToForm = (publisher: Publisher): PublisherFormData => ({
    id: publisher.id,
    name: publisher.name,
    fullname: publisher.fullname,
    description: publisher.description,
    links: publisher.links && publisher.links.length > 0 ?
      publisher.links : [{ link: '', description: '' }]
  })

  const defaultValues: PublisherFormData = {
    id: null,
    name: '',
    fullname: '',
    description: '',
    links: [{ link: '', description: '' }]
  }

  const formData = props.publisher ? convToForm(props.publisher) : defaultValues;

  const updatePublisher = (data: PublisherFormData) => {
    const saveData = { data: data };
    if (data.id !== null) {
      return putApiContent('publishers', saveData, user);
    } else {
      return postApiContent('publishers', saveData, user);
    }
  }

  const { mutate } = useMutation({
    mutationFn: (values: PublisherFormData) => updatePublisher(values),
    onSuccess: (data: HttpStatusResponse, variables) => {
      props.onSubmitCallback(true, "");
      if (variables.id === null) {
        navigate('/publishers/' + data.response, { replace: false })
      } else if (data.status === 200) {

      } else {
        console.log(data.response);
        if (JSON.parse(data.response).data["msg"] !== undefined) {
          const errMsg = JSON.parse(data.response).data["msg"];
          console.log(errMsg);
        } else {
          //toast('error', 'Tallentaminen epäonnistui', "Tuntematon virhe");
        }
      }
    },
    onError: (error: any) => {
      console.log(error.message);
      props.onSubmitCallback(false, error.message)
    }
  })

  const methods = useForm<PublisherFormData>({ defaultValues: formData });

  // const queryClient = useQueryClient()
  // const { register, control, handleSubmit, formState: { isDirty, dirtyFields } } = useForm<PublisherFormData>({ defaultValues: formData });

  // const onSubmit: SubmitHandler<FieldValues> = (data) => {
  //   const retval: FormSubmitObject = { data, changed: dirtyFields }
  //   setLoading(true);
  //   if (data.id !== null) {
  //     putApiContent('publishers/', retval, user);
  //   } else {
  //     postApiContent('publishers/', retval, user);
  //   }
  //   setLoading(false);
  //   queryClient.invalidateQueries();
  //   props.onSubmitCallback();
  // }

  return <>
    {formData ? (
      <FormObject
        onSubmit={mutate}
        methods={methods}
      />
    ) :
      <ProgressBar />
    }
  </>
}

const FormObject = ({ onSubmit, methods }: FormObjectProps) => {
  const user = useMemo(() => { return getCurrenUser() }, []);
  const [loading, setLoading] = useState(false);
  const disabled = isDisabled(user, loading);
  const required_rule: RegisterOptions = { required: "Pakollinen kenttä" };
  const editor_style: React.CSSProperties = { height: '320px' };


  return (
    <div className="card mt-3">
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <div className="formgrid grid">
            <div className="field col-12">
              <FormInputText
                name="name"
                methods={methods}
                label="Nimi"
                autoFocus
                disabled={disabled}
                rules={required_rule}
                labelClass='required-field'
              />
            </div>
            <div className="field col-12">
              <FormInputText
                name="fullname"
                methods={methods}
                label="Koko nimi"
                disabled={disabled}
                rules={required_rule}
                labelClass='required-field'
              />
            </div>
            <div className='field col-12'>
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
          </div>
          <Button type="submit" className="w-full justify-content-center">Tallenna</Button>
        </form>
      </FormProvider>
    </div>
  )
}