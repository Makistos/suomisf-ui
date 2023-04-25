import { useEffect, useState, useMemo } from 'react';
import { useForm, Controller, SubmitHandler, FieldValues } from 'react-hook-form';

import { classNames } from 'primereact/utils';
import { InputText } from 'primereact/inputtext';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from 'primereact/button';

import { getApiContent, postApiContent, putApiContent } from '../../../services/user-service';
import { FormSubmitObject, isDisabled } from '../../../components/forms/forms';
import { register } from '../../../services/auth-service';
import { getCurrenUser } from '../../../services/auth-service';
import { PublisherFormData } from '../types';
import { Publisher } from '../types';
import { QueryClient } from '@tanstack/react-query';

interface PublisherFormProps {
  publisher: Publisher,
  onSubmitCallback: (() => void)
}

export const PublisherForm = (props: PublisherFormProps) => {
  const user = useMemo(() => { return getCurrenUser() }, []);
  const [loading, setLoading] = useState(false);

  const defaultValues: PublisherFormData = {
    id: null,
    name: '',
    fullname: '',
    description: ''
  }

  const formData = props.publisher ? props.publisher : defaultValues;
  const queryClient = useQueryClient()
  const { register, control, handleSubmit, formState: { isDirty, dirtyFields } } = useForm<PublisherFormData>({ defaultValues: formData });

  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    const retval: FormSubmitObject = { data, changed: dirtyFields }
    setLoading(true);
    if (data.id !== null) {
      putApiContent('publishers/', retval, user);
    } else {
      postApiContent('publishers/', retval, user);
    }
    setLoading(false);
    queryClient.invalidateQueries();
    props.onSubmitCallback();
  }

  return (
    <div className="card mt-3">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="formgrid grid">
          <div className="field col-12">
            <span className="p-float-label">
              <Controller name="name" control={control}
                render={({ field, fieldState }) => (
                  <InputText
                    {...field}
                    autoFocus
                    {...register("name")}
                    className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                    disabled={isDisabled(user, loading)}
                  />
                )}
              />
              <label htmlFor="name">Nimi</label>
            </span>
          </div>
          <div className="field col-12">
            <span className="p-float-label">
              <Controller name="fullname" control={control}
                render={({ field, fieldState }) => (
                  <InputText
                    {...field}
                    autoFocus
                    {...register("fullname")}
                    className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                    disabled={isDisabled(user, loading)}
                  />
                )}
              />
              <label htmlFor="fullname">Koko nimi</label>
            </span>
          </div>
          <div className="field col-12">
            <span className="p-float-label">
              <Controller name="description" control={control}
                render={({ field, fieldState }) => (
                  <InputText
                    {...field}
                    autoFocus
                    {...register("description")}
                    className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                    disabled={isDisabled(user, loading)}
                  />
                )}
              />
              <label htmlFor="description">Kuvaus</label>
            </span>
          </div>
        </div>
        <Button type="submit" className="w-full justify-content-center">Tallenna</Button>
      </form>
    </div>
  )
}