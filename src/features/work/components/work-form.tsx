import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useForm, Controller, SubmitHandler, FieldValues, FormProvider } from 'react-hook-form';
import { DevTool } from '@hookform/devtools';
import { classNames } from 'primereact/utils';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Editor } from 'primereact/editor';
import { MultiSelect } from "primereact/multiselect";
import { Button } from 'primereact/button';
import { AutoComplete } from 'primereact/autocomplete';
import { QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProgressBar } from 'primereact/progressbar';

import { Work } from '../types';
import { getApiContent, postApiContent, putApiContent } from '../../../services/user-service';
import { getCurrenUser } from '../../../services/auth-service';
import { WorkFormData, WorkType } from '../types';
//import { makeBriefContributor } from '../../../components/forms/makeBriefContributor';
import { isDisabled, FormSubmitObject } from '../../../components/forms/forms';
import { ContributorField, emptyContributor } from '../../../components/forms/contributor-field';
import { Contribution } from '../../../types/contribution';
//import { workCreators } from '../../../components/forms/work-creators';
import { LinksField } from '../../../components/forms/links-field';
import { Dropdown } from 'primereact/dropdown';
import { formErrorMessage } from '../../../components/forms/form-error-message';
import { User } from '../../user';
import { HttpStatusResponse } from "../../../services/user-service"

interface FormProps<T> {
  data: T | null,
  onSubmitCallback: (() => void)
}
export interface FormObjectProps {
  onSubmit: any;
  methods: any;
  data: WorkFormData;
  types: WorkType[];
}


export const WorkForm = (props: FormProps<Work>) => {
  const user = useMemo(() => { return getCurrenUser() }, []);
  const [message, setMessage] = useState("");
  const [types, setTypes] = useState<WorkType[]>([]);
  const [loading, setLoading] = useState(false)

  //console.log(props.work);

  const navigate = useNavigate();

  const queryClient = useQueryClient()

  useEffect(() => {
    async function getTypes() {
      const url = "worktypes";
      const response = await getApiContent(url, user);
      setTypes(response.data);
    }
    getTypes();
  }, [user])

  let contributors: Contribution[] = [];
  if (props.data) {
    contributors = props.data.contributions.filter((contribution: Contribution, index: number, arr: Contribution[]) => arr.indexOf(contribution) === index);
  }
  if (contributors.length === 0) {
    contributors = [emptyContributor];
  }
  const convToForm = (work: Work): WorkFormData => ({
    id: work.id,
    title: work.title,
    subtitle: work.subtitle ? work.subtitle : '',
    orig_title: work.orig_title ? work.orig_title : '',
    pubyear: work.pubyear,
    language: work.language_name,
    genres: work.genres,
    tags: work.tags,
    description: work.description ? work.description : '',
    descr_attr: work.descr_attr,
    misc: work.misc ? work.misc : '',
    bookseries: work.bookseries,
    bookseriesnum: work.bookseriesnum,
    bookseriesorder: work.bookseriesorder,
    contributions: contributors,
    work_type: work.work_type,
    links: work.links.length > 0 ? work.links : [{ link: '', description: '' }]
  });

  const defaultValues: WorkFormData = {
    id: null,
    title: '',
    subtitle: '',
    orig_title: '',
    pubyear: null,
    language: null,
    genres: [],
    tags: [],
    description: '',
    descr_attr: '',
    misc: '',
    bookseries: null,
    bookseriesnum: '',
    bookseriesorder: null,
    contributions: [emptyContributor],
    work_type: types[0],
    links: [{ link: '', description: '' }]
  }

  const formData = props.data ? convToForm(props.data) : defaultValues;
  console.log(props.data);

  // const { register, control, handleSubmit,
  //   formState: { isDirty, dirtyFields } } =
  //   useForm<WorkFormData>({ defaultValues: formData });

  const methods = useForm<WorkFormData>({ defaultValues: formData });
  const register = methods.register;
  const control = methods.control;
  const errors = methods.formState.errors;

  const updateWork = (data: WorkFormData) => {
    const saveData = { data: data };
    if (data.id != null) {
      return putApiContent('works', saveData, user);
    } else {
      return postApiContent('works', saveData, user)
    }
  }

  const { mutate, error } = useMutation({
    mutationFn: (values: WorkFormData) => updateWork(values),
    onSuccess: (data: HttpStatusResponse, variables) => {
      props.onSubmitCallback();
      if (variables.id === null) {
        navigate('/works/' + data, { replace: false })
      } else if (data.status === 200) {

      } else {
        console.log(data.response);
        if (JSON.parse(data.response).data["msg"] !== undefined) {
          const errMsg = JSON.parse(data.response).data["msg"];
          //toast('error', 'Tallentaminen epäonnistui', errMsg);
          console.log(errMsg);
        } else {
          //toast('error', 'Tallentaminen epäonnistui', "Tuntematon virhe");
        }
      }
    },
    onError: (error: any) => {
      console.log(error.message);
    }
  })

  if (formData === null) {
    return <div>loading...</div>
  }
  //console.log(formData);

  return (
    <>
      {formData ? (
        <FormObject
          onSubmit={mutate}
          methods={methods}
          data={formData}
          types={types}
        />
      )
        :
        <ProgressBar />
      }
    </>
  )
}

const FormObject = ({ onSubmit, methods, types }: FormObjectProps) => {
  const user = useMemo(() => { return getCurrenUser() }, []);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filteredLanguages, setFilteredLanguages] = useState([]);
  const [filteredTags, setFilteredTags] = useState([]);
  const [filteredBookseries, setFilteredBookseries] = useState([]);
  const errors = methods.formState.errors;

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

  return (
    <div className="card mt-3">
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <div className="formgrid grid">
            <div className="field col-12">
              <span className="p-float-label">
                <Controller
                  name="title"
                  control={methods.control}
                  rules={{ required: 'Nimeke on pakollinen' }}
                  render={({ field, fieldState }) => (
                    <>
                      <InputText
                        {...field}
                        autoFocus
                        {...methods.register("title")}
                        value={field.value ? field.value : ''}
                        className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                        disabled={isDisabled(user, loading)}
                      />
                      {formErrorMessage(field.name, errors)}
                    </>
                  )}
                />
                <label htmlFor="title" className="required-field">Nimeke</label>
              </span>
            </div>
            <div className="field col-12">
              <span className="p-float-label">
                <Controller
                  name="subtitle"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <InputText
                      {...field}
                      {...methods.register("subtitle")}
                      value={field.value ? field.value : ''}
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
                <Controller
                  name="orig_title"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <InputText
                      {...field}
                      {...methods.register("orig_title")}
                      value={field.value ? field.value : ''}
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
                <Controller
                  name="pubyear"
                  control={methods.control}
                  rules={{ required: 'Vuosi on pakollinen' }}
                  render={({ field, fieldState }) => (
                    <InputNumber
                      id={field.name}
                      inputRef={field.ref}
                      value={field.value}
                      useGrouping={false}
                      onBlur={field.onBlur}
                      onValueChange={(e) => field.onChange(e.value)}
                      className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                      disabled={isDisabled(user, loading)}
                    />
                  )}
                />
                <label htmlFor="pubyear" className="required-field">Julkaisuvuosi</label>
              </span>
            </div>
            <div className="field col-8">
              <span className='p-float-label'>
                <Controller
                  name="language"
                  control={methods.control}
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
                <Controller
                  name="bookseries"
                  control={methods.control}
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
                <Controller
                  name="bookseriesnum"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <InputText
                      {...field}
                      {...methods.register("bookseriesnum")}
                      value={field.value ? field.value : ''}
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
                <Controller
                  name="bookseriesorder"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <InputNumber
                      id={field.name}
                      inputRef={field.ref}
                      value={field.value}
                      onBlur={field.onBlur}
                      useGrouping={false}
                      inputClassName={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                      disabled={isDisabled(user, loading)}
                    />
                  )}
                />
                <label htmlFor="bookseriesorder">Kirjasarjan järjestys</label>
              </span>
            </div>
            <div className="field col-12">
              <span className='p-float-label'>
                <div key="work_type" className="flex align-items-center">
                  <Controller
                    name="work_type"
                    control={methods.control}
                    rules={{ required: 'Teoksen tyyppi on pakollinen' }}
                    render={({ field, fieldState }) => (
                      <>
                        <Dropdown
                          {...field}
                          optionLabel="name"
                          options={types}
                          className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                          tooltip='Tyyppi'
                          disabled={isDisabled(user, loading)}
                        />
                        {formErrorMessage(field.name, errors)}
                      </>
                    )}
                  />
                  <label htmlFor="work_type" className="ml-2 required-field">Tyyppi</label>
                </div>
              </span>
            </div>
            <div className="field col-12">
              <ContributorField
                id={"contributions"}
                disabled={isDisabled(user, loading)}
              //defValues={formData.contributions}
              //defValues={ }

              />
            </div>
            <div className="field col-12">
              <span className='p-float-label'>
                <Controller
                  name="genres"
                  control={methods.control}
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
                <Controller
                  name="tags"
                  control={methods.control}
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
              <LinksField
                id={"links"}
                disabled={isDisabled(user, loading)}
              />
            </div>

            <div className="field col-12">
              Kuvaus
              <Controller
                name="description"
                control={methods.control}
                render={({ field, fieldState }) => (
                  <Editor {...field}
                    style={{ height: '320px' }}
                    readOnly={isDisabled(user, loading)} />
                )}
              />
            </div>
            <div className="field col-12">
              <span className="p-float-label">
                <Controller
                  name="descr_attrs"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <InputText {...field}
                      {...methods.register("descr_attrs")}
                      value={field.value ? field.value : ''}
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
                <Controller
                  name="misc"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <InputText {...field}
                      {...methods.register("misc")}
                      value={field.value ? field.value : ''}
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
        <DevTool control={methods.control} />
      </FormProvider>
    </div>
  )
}