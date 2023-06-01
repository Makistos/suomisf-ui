import React, { useEffect, useMemo } from 'react';

import { useForm, Controller, SubmitHandler, FieldValues, FormProvider } from 'react-hook-form';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { classNames } from 'primereact/utils';
import { InputText } from 'primereact/inputtext';

import { getCurrenUser } from '../../../services/auth-service';
import { Edition } from '../types';
import { ContributorField } from '../../../components/forms/contributor-field';
import { Contribution } from '../../../types/contribution';
import { EditionFormData } from '../types';
import { putApiContent, postApiContent } from '../../../services/user-service';
import { isDisabled, FormSubmitObject } from '../../../components/forms/forms';

interface EditionFormProps {
  edition: Edition;
  onSubmitCallback: () => void;
}

export const EditionForm = (props: EditionFormProps) => {
  const user = useMemo(() => { return getCurrenUser() }, []);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState("");

  useEffect(() => {
  }, [user]);

  const queryClient = useQueryClient()
  const formData = props.edition;

  const methods = useForm<EditionFormData>({ defaultValues: formData });
  const register = methods.register;
  const control = methods.control;

  const onSubmit: SubmitHandler<FieldValues> = data => {
    const retval: FormSubmitObject = { data, changed: methods.formState.dirtyFields }
    setMessage("");
    setLoading(true);
    if (data.id != null) {
      putApiContent('works', retval, user)
    } else {
      postApiContent('works', retval, user)
    }
    setLoading(false);
    // queryClient.invalidateQueries({ queryKey: ["work", props.work.id] });
    props.onSubmitCallback();
  };

  return (
    <div className='card mt-3'>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <div className="p-fluid p-formgrid p-grid">
            <div className="p-field p-col-12 p-md-6">
              <span className="p-float-label">
                <Controller
                  name="title"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <InputText id="title"
                      {...field}
                      {...methods.register("title", { required: true })}
                      autoFocus
                      className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                      disabled={isDisabled(user, loading)}
                    />
                  )}
                />
                <label htmlFor="title">Title</label>
              </span>

            </div>
          </div>
        </form>
      </FormProvider>

    </div>
  )
}