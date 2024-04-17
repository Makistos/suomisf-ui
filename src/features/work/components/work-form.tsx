import React, { useMemo, useState, useEffect, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { useForm, FormProvider, RegisterOptions } from 'react-hook-form';
import { DevTool } from '@hookform/devtools';
import { Button } from 'primereact/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProgressBar } from 'primereact/progressbar';

import { Work } from '../types';
import { getApiContent, postApiContent, putApiContent } from '../../../services/user-service';
import { getCurrenUser } from '../../../services/auth-service';
import { WorkFormData, WorkType } from '../types';
import { isDisabled } from '../../../components/forms/forms';
import { ContributorField, emptyContributor } from '../../../components/forms/contributor-field';
import { Contribution } from '../../../types/contribution';
import { LinksField } from '../../../components/forms/links-field';
import { HttpStatusResponse } from "../../../services/user-service"
import { FormInputText } from '../../../components/forms/field/form-input-text';
import { FormInputNumber } from '../../../components/forms/field/form-input-number';
import { FormMultiSelect } from '../../../components/forms/field/form-multi-select';
import { FormDropdown } from '../../../components/forms/field/form-dropdown';
import { FormAutoComplete } from '../../../components/forms/field/form-auto-complete';
import { FormEditor } from '../../../components/forms/field/form-editor';

interface FormProps<T> {
  data: T | null,
  onSubmitCallback: ((status: boolean, message: string) => void)
}
type FormObjectProps = {
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
      props.onSubmitCallback(true, "");
      if (variables.id === null) {
        navigate('/works/' + data.response, { replace: false })
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
      props.onSubmitCallback(false, error.message);
    }
  })

  if (formData === null) {
    return <div>loading...</div>
  }

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
  const disabled = isDisabled(user, loading);

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
    console.log(response.data);
  }

  async function filterTags(event: any) {
    const url = "filter/tags/" + event.query;
    const response = await getApiContent(url, user);
    setFilteredTags(response.data);
  }

  const tagKeyPress = (e: KeyboardEvent) => {
    console.log(e.code);
    if (e.code == "Comma") {

    }
  }

  async function filterBookseries(event: any) {
    const url = "filter/bookseries/" + event.query;
    const response = await getApiContent(url, user);
    setFilteredBookseries(response.data);
  }

  const required_rule: RegisterOptions = { required: "Pakollinen kenttä" };
  const editor_style: React.CSSProperties = { height: '320px' };

  const addNewTag = (data: any) => {
    console.log(data);
  }

  return (
    <div className="card mt-3">
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <div className="formgrid grid">
            <div className="field col-12">
              <FormInputText
                name="title"
                methods={methods}
                label="Nimeke"
                rules={required_rule}
                autoFocus
                disabled={disabled}
              />
            </div>
            <div className="field col-12">
              <FormInputText
                name="subtitle"
                methods={methods}
                label="Alaotsikko"
                disabled={disabled}
              />
            </div>
            <div className="field col-12">
              <FormInputText
                name="orig_title"
                methods={methods}
                label="Alkuperäinen nimeke"
                disabled={disabled}
              />
            </div>
            <div className="field col-4">
              <FormInputNumber
                name="pubyear"
                methods={methods}
                label="Julkaisuvuosi"
                rules={required_rule}
                disabled={disabled}
                labelClass='required-field'
              />
            </div>
            <div className="field col-8">
              <FormAutoComplete
                name="language"
                methods={methods}
                label="Kieli"
                completeMethod={filterLanguages}
                suggestions={filteredLanguages}
                // forceSelection={false}
                placeholder='Kieli'
              />
            </div>
            <div className="field col-6">
              <FormAutoComplete
                name="bookseries"
                methods={methods}
                label="Kirjasarja"
                completeMethod={filterBookseries}
                suggestions={filteredBookseries}
                forceSelection={false}
                placeholder='Kirjasarja'
              //disabled={disabled}
              />
            </div>
            <div className="field col-3">
              <FormInputText
                name="bookseriesnum"
                methods={methods}
                label="Kirjasarjan numero"
                disabled={disabled}
              />
            </div>
            <div className="field col-3">
              <FormInputNumber
                name="bookseriesorder"
                methods={methods}
                label="Kirjasarjan järjestys"
                disabled={disabled}
              />
            </div>
            <div className="field col-12">
              <FormDropdown
                name="work_type"
                methods={methods}
                options={types}
                label="Tyyppi"
                rules={required_rule}
                labelClass='required-field'
                disabled={disabled}
                checked={false}
              />
            </div>
            <div className="field col-12">
              <ContributorField
                id={"contributions"}
                disabled={disabled}
                contributionTarget='work'
              />
            </div>
            <div className="field col-12">
              <FormMultiSelect
                name="genres"
                methods={methods}
                label="Genret"
                options={genres}
                disabled={disabled}
              />
            </div>
            <div className="field col-12">
              <FormAutoComplete
                name="tags"
                methods={methods}
                label="Asiassanat"
                completeMethod={filterTags}
                suggestions={filteredTags}
                forceSelection={false}
                tagFunction={addNewTag}
                multiple
                placeholder='Asiasanat'
                disabled={disabled}
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
              <FormInputText
                name="descr_attrs"
                methods={methods}
                label="Kuvauksen lähde"
                disabled={disabled}
              />
            </div>
            <div className="field col-12">
              <FormInputText
                name="misc"
                methods={methods}
                label="Muuta"
                disabled={disabled}
              />
            </div>
            <Button type="submit" disabled={disabled} className="w-full justify-content-center">Tallenna</Button>
          </div>
        </form>
        <DevTool control={methods.control} />
      </FormProvider>
    </div>
  )
}