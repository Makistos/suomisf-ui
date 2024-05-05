import React, { useMemo, useState, useEffect, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { useForm, FormProvider, RegisterOptions } from 'react-hook-form';
import { DevTool } from '@hookform/devtools';
import { Button } from 'primereact/button';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { getWorkFormData } from '@api/work/get-workform-data';

interface FormProps {
  workId: string | null,
  onSubmitCallback: ((status: boolean, message: string) => void)
}
type FormObjectProps = {
  onSubmit: any;
  data: WorkFormData;
  types: WorkType[];
}


export const WorkForm = (props: FormProps) => {
  const user = useMemo(() => { return getCurrenUser() }, []);
  const [message, setMessage] = useState("");
  const [types, setTypes] = useState<WorkType[]>([]);

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

  // const formData = props.data ? convToForm(props.data) : defaultValues;

  const { isLoading, data } = useQuery({
    queryKey: ['works', props.workId, "form"],
    queryFn: () => getWorkFormData(props.workId, user)
  })

  if (data && data.types === null && types) {
    data.types = types;
  }

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
        }
      }
    },
    onError: (error: any) => {
      console.log(error.message);
      props.onSubmitCallback(false, error.message);
    }
  })

  if (isLoading || (data?.id === null && props.workId !== null)) {
    return <div>loading...</div>
  }
  console.log(data);

  return (
    <>
      {data ? (
        <FormObject
          onSubmit={mutate}
          data={data}
          types={types}
        />
      )
        :
        <ProgressBar />
      }
    </>
  )
}

const FormObject = ({ onSubmit, data, types }: FormObjectProps) => {
  const user = useMemo(() => { return getCurrenUser() }, []);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filteredLanguages, setFilteredLanguages] = useState([]);
  const [filteredTags, setFilteredTags] = useState([]);
  const [filteredBookseries, setFilteredBookseries] = useState([]);
  const disabled = isDisabled(user, loading);

  const methods = useForm<WorkFormData>({ defaultValues: data });
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
        {/* <DevTool control={methods.control} /> */}
      </FormProvider>
    </div>
  )
}