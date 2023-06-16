import React, { useMemo, useState, useEffect } from 'react';

import { useForm, Controller, SubmitHandler, FieldValues, FormProvider } from 'react-hook-form';
import { classNames } from 'primereact/utils';
import { InputText } from 'primereact/inputtext';
import { Editor } from 'primereact/editor';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from "primereact/multiselect";
import { Button } from 'primereact/button';
import { AutoComplete } from 'primereact/autocomplete';
import { QueryClient, useQueryClient } from '@tanstack/react-query';

import { Work } from '../types';
import { getApiContent, postApiContent, putApiContent } from '../../../services/user-service';
import { getCurrenUser } from '../../../services/auth-service';
import { WorkFormData } from '../types';
//import { makeBriefContributor } from '../../../components/forms/makeBriefContributor';
import { isDisabled, FormSubmitObject } from '../../../components/forms/forms';
import { ContributorField } from '../../../components/forms/contributor-field';
import { Contribution } from '../../../types/contribution';
//import { workCreators } from '../../../components/forms/work-creators';

interface WorkFormProps {
  work: Work,
  onSubmitCallback: (() => void)
}

export const WorkForm = (props: WorkFormProps) => {
  const user = useMemo(() => { return getCurrenUser() }, []);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [filteredLanguages, setFilteredLanguages] = useState([]);
  const [genres, setGenres] = useState([]);
  const [filteredTags, setFilteredTags] = useState([]);
  const [filteredBookseries, setFilteredBookseries] = useState([]);

  //console.log(props.work);

  useEffect(() => {
    async function getGenres() {
      const url = "genres";
      const response = await getApiContent(url, user);
      setGenres(response.data);
    }
    setLoading(true);
    getGenres();
    setLoading(false);
  }, [user])

  const convToForm = (work: Work): WorkFormData => ({
    id: work.id,
    title: work.title,
    subtitle: work.subtitle,
    orig_title: work.orig_title,
    pubyear: work.pubyear,
    language: work.language_name,
    genres: work.genres,
    tags: work.tags,
    description: work.description,
    desc_attrs: work.desc_attrs,
    misc: work.misc,
    bookseries: work.bookseries,
    bookseries_number: work.bookseries_number,
    bookseriesorder: work.bookseriesorder,
    contributors: work.contributions.filter((contribution: Contribution, index: number, arr: Contribution[]) => arr.indexOf(contribution) === index)
  });

  const defaultValues: WorkFormData = {
    id: null,
    title: '',
    subtitle: '',
    orig_title: '',
    pubyear: 0,
    language: null,
    genres: [],
    tags: [],
    description: '',
    desc_attrs: '',
    misc: '',
    bookseries: null,
    bookseries_number: '',
    bookseriesorder: 0,
    contributors: [],
  }

  const formData = props.work ? convToForm(props.work) : defaultValues;
  //const queryClient = useQueryClient()

  // const { register, control, handleSubmit,
  //   formState: { isDirty, dirtyFields } } =
  //   useForm<WorkFormData>({ defaultValues: formData });

  const methods = useForm<WorkFormData>({ defaultValues: formData });
  const register = methods.register;
  const control = methods.control;

  async function filterLanguages(event: any) {
    const url = "filter/languages/" + event.query;
    const response = await getApiContent(url, user);
    setFilteredLanguages(response.data);
  }

  async function filterTags(event: any) {
    const url = "filter/tags/" + event.query;
    const response = await getApiContent(url, user);
    setFilteredTags(response.data);
  }

  async function filterBookseries(event: any) {
    const url = "filter/bookseries/" + event.query;
    const response = await getApiContent(url, user);
    setFilteredBookseries(response.data);
  }

  const onSubmit: SubmitHandler<FieldValues> = (data) => {
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
  }

  return (
    <div className="card mt-3">
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <div className="formgrid grid">
            <div className="field col-12">
              <span className="p-float-label">
                <Controller name="title" control={control}
                  render={({ field, fieldState }) => (
                    <InputText
                      {...field}
                      autoFocus
                      {...register("title")}
                      className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                      disabled={isDisabled(user, loading)}
                    />
                  )}
                />
                <label htmlFor="title">Nimeke</label>
              </span>
            </div>
            <div className="field col-12">
              <span className="p-float-label">
                <Controller name="subtitle" control={control}
                  render={({ field, fieldState }) => (
                    <InputText
                      {...field}
                      {...register("subtitle")}
                      className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                      disabled={isDisabled(user, loading)}
                    />
                  )}
                />
                <label htmlFor="subtitle">Alaotsikko</label>
              </span>
            </div>
            <div className="field col-12">
              <span className='p-float-label'>
                <Controller name="orig_title" control={control}
                  render={({ field, fieldState }) => (
                    <InputText
                      {...field}
                      {...register("orig_title")}
                      className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                      disabled={isDisabled(user, loading)}
                    />
                  )}
                />
                <label htmlFor="orig_title">Alkuperäinen nimeke</label>
              </span>
            </div>
            <div className="field col-4">
              <span className='p-float-label'>
                <Controller name="pubyear" control={control}
                  render={({ field, fieldState }) => (
                    <InputText
                      {...field}
                      {...register("pubyear")}
                      className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                      disabled={isDisabled(user, loading)}
                    />
                  )}
                />
                <label htmlFor="pubyear">Julkaisuvuosi</label>
              </span>
            </div>
            <div className="field col-8">
              <span className='p-float-label'>
                <Controller name="language" control={control}
                  render={({ field, fieldState }) => (
                    <AutoComplete
                      {...field}
                      field="name"
                      completeMethod={filterLanguages}
                      suggestions={filteredLanguages}
                      placeholder="Kieli"
                      delay={300}
                      minLength={2}
                      removeIcon
                      className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                      inputClassName="w-full"
                      disabled={isDisabled(user, loading)}
                    />
                  )}
                />
                <label htmlFor="language">Kieli</label>
              </span>
            </div>
            <div className="field col-6">
              <span className='p-float-label'>
                <Controller name="bookseries" control={control}
                  render={({ field, fieldState }) => (
                    <AutoComplete
                      {...field}
                      field="name"
                      completeMethod={filterBookseries}
                      suggestions={filteredBookseries}
                      placeholder="Kirjasarja"
                      delay={300}
                      minLength={2}
                      removeIcon
                      className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                      inputClassName="w-full"
                      disabled={isDisabled(user, loading)}
                    />
                  )}
                />
                <label htmlFor="bookseries">Kirjasarja</label>
              </span>
            </div>
            <div className="field col-3">
              <span className='p-float-label'>
                <Controller name="bookseries_number" control={control}
                  render={({ field, fieldState }) => (
                    <InputText
                      {...field}
                      {...register("bookseries_number")}
                      className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                      disabled={isDisabled(user, loading)}
                    />
                  )}
                />
                <label htmlFor="bookseries_number">Kirjasarjan numero</label>
              </span>
            </div>
            <div className="field col-3">
              <span className='p-float-label'>
                <Controller name="bookseriesorder" control={control}
                  render={({ field, fieldState }) => (
                    <InputText
                      {...field}
                      {...register("bookseriesorder")}
                      className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                      disabled={isDisabled(user, loading)}
                    />
                  )}
                />
                <label htmlFor="bookseriesorder">Kirjasarjan järjestys</label>
              </span>
            </div>
            <div className="field col-12">
              <span className='p-float-label'>
                <Controller name="genres" control={control}
                  render={({ field, fieldState }) => (
                    <MultiSelect
                      {...field}
                      options={genres}
                      optionLabel="name"
                      display='chip'
                      scrollHeight='400px'
                      className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                      showClear
                      showSelectAll={false}
                      disabled={isDisabled(user, loading)}
                    />
                  )}
                />
                <label htmlFor="genres">Genret</label>
              </span>
            </div>
            <div className="field col-12">
              <span className='p-float-label'>
                <Controller name="tags" control={control}
                  render={({ field, fieldState }) => (
                    <AutoComplete
                      {...field}
                      field="name"
                      multiple
                      completeMethod={filterTags}
                      suggestions={filteredTags}
                      placeholder="Asiasanat"
                      delay={300}
                      minLength={2}
                      className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                      inputClassName="w-full"
                      disabled={isDisabled(user, loading)}
                    />
                  )}
                />
                <label htmlFor="tags">Asiasanat</label>
              </span>
            </div>
            <div className="field col-12">
              <ContributorField
                id={"contributors"}
                disabled={isDisabled(user, loading)}
                defValues={formData.contributors}
              />
            </div>

            <div className="field col-12">
              <span className='p-float-label'>
                <Controller name="description" control={control}
                  render={({ field, fieldState }) => (
                    <Editor {...field} />
                  )}
                />
                <label htmlFor="description">Kuvaus</label>
              </span>
            </div>
            <div className="field col-12">
              <span className="p-float-label">
                <Controller name="desc_attrs" control={control}
                  render={({ field, fieldState }) => (
                    <InputText {...field}
                      {...register("desc_attrs")}
                      className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                      disabled={isDisabled(user, loading)}
                    />
                  )}
                />
                <label htmlFor="desc_attrs">Kuvauksen lähde</label>
              </span>
            </div>
            <div className="field col-12">
              <span className="p-float-label">
                <Controller name="misc" control={control}
                  render={({ field, fieldState }) => (
                    <InputText {...field}
                      {...register("misc")}
                      className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                      disabled={isDisabled(user, loading)}
                    />
                  )}
                />
                <label htmlFor="misc">Muuta</label>
              </span>
            </div>
            <Button type="submit" className="w-full justify-content-center">Tallenna</Button>
          </div>
        </form>
      </FormProvider>
    </div>
  )
}