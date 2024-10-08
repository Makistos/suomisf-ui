import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useForm, SubmitHandler, FieldValues, FormProvider, UseFormReturn } from 'react-hook-form';
import { Button } from 'primereact/button';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getCurrenUser } from '../../../services/auth-service';
import { Edition } from '../types';
import { ContributorField, emptyContributor } from '../../../components/forms/contributor-field';
import { EditionFormData } from '../types';
import { putApiContent, postApiContent, getApiContent, HttpStatusResponse } from '../../../services/user-service';
import { isDisabled, FormSubmitObject } from '../../../components/forms/forms';
import { Binding } from '../../../types/binding';
import { Work } from '../../work/types';
import { Contribution } from '../../../types/contribution';
import { FormInputText } from '../../../components/forms/field/form-input-text';
import { ProgressBar } from 'primereact/progressbar';
import { FormAutoComplete } from '../../../components/forms/field/form-auto-complete';
import { FormInputNumber } from '../../../components/forms/field/form-input-number';
import { FormDropdown } from '../../../components/forms/field/form-dropdown';
import { FormTriStateCheckbox } from '../../../components/forms/field/form-tri-state-checkbox';
import { FormCheckbox } from '../../../components/forms/field/form-checkbox';
import { replyMessage } from '@components/forms/reply-message';
import { getEdition } from '@api/edition/get-edition';

interface EditionFormProps {
  //edition: Edition | null;
  editionid: number | null;
  work: Work;
  onSubmitCallback: ((status: boolean, message: string) => void);
}

interface FormObjectProps {
  onSubmit: any,
  data: Edition | null | undefined,
  work: Work,
  bindings: Binding[],
  disabled: boolean
}

export const EditionForm = (props: EditionFormProps) => {
  const user = useMemo(() => { return getCurrenUser() }, []);
  const [bindings, setBindings] = useState<Binding[]>([]);
  const [queryEnabled, setQueryEnabled] = useState(true);

  let edition: Edition | null = null;

  const navigate = useNavigate();

  const queryClient = useQueryClient()

  useEffect(() => {
    async function fetchBindings() {
      const bindings = await getApiContent('bindings', user);
      setBindings(bindings.data);
    }
    fetchBindings();
  }, []);

  const { isLoading, data } = useQuery({
    queryKey: ['work', props.editionid, "form"],
    queryFn: () => getEdition(props.editionid, user),
    enabled: queryEnabled
  })


  const updateEdition = (data: EditionFormData) => {
    let updatedData: FieldValues = JSON.parse(JSON.stringify(data));
    updatedData.dustcover = data.dustcover === null ? 1 : data.dustcover === false ? 2 : 3;
    updatedData.coverimage = data.coverimage === null ? 1 : data.coverimage === false ? 2 : 3;
    if (updatedData.work_id === undefined) {
      updatedData.work_id = props.work.id;
    }
    const saveData = { data: updatedData };
    if (data.id != null) {
      return putApiContent('editions', saveData, user);
    } else {
      return postApiContent('editions', saveData, user);
    }
  }

  const { mutate } = useMutation({
    mutationFn: (values: EditionFormData) => updateEdition(values),
    onSuccess: (data: HttpStatusResponse, variables) => {
      if (data.status === 200 || data.status === 201) {
        props.onSubmitCallback(true, "");
        queryClient.invalidateQueries({ queryKey: ['work', props.editionid, "form"] });
        queryClient.invalidateQueries({ queryKey: ['work', props.work.id, "form"] });
        //console.log(data.response);
        // if (JSON.parse(data.response).data["msg"] !== undefined) {
        //   const errMsg = JSON.parse(data.response).data["msg"];
        //   console.log(errMsg);
        // } else {
        // }
      } else {
        const errMsg = replyMessage(data);
        props.onSubmitCallback(false, errMsg);

      }
    },
    onError: (error: any) => {
      const errMsg = replyMessage(error);
      props.onSubmitCallback(false, errMsg);
    }
  })

  return (
    <>
      {(!isLoading) ?
        <FormObject onSubmit={mutate}
          data={data}
          work={props.work}
          bindings={bindings}
          disabled={isDisabled(user, isLoading)} />
        :
        <ProgressBar />
      }
    </>
  )

}

const FormObject = ({ onSubmit, data, work, disabled, bindings }: FormObjectProps) => {
  const user = useMemo(() => { return getCurrenUser() }, []);
  const [filteredPublishers, setFilteredPublishers] = useState<any>([]);
  const [filteredPubseries, setFilteredPubseries] = useState<any>([]);
  const required_rule = { required: true };
  async function filterPublishers(event: any) {

    const url = "filter/publishers/" + event.query;
    const response = await getApiContent(url, user);
    setFilteredPublishers(response.data);
  }

  async function filterPubseries(event: any) {
    const url = "filter/pubseries/" + event.query;
    const response = await getApiContent(url, user);
    setFilteredPubseries(response.data);
  }

  let contributors: Contribution[] = [];
  if (data) {
    contributors = data.contributions.filter((contribution: Contribution,
      index: number, arr: Contribution[]) => arr.indexOf(contribution) === index);
  }
  if (contributors.length === 0) {
    contributors = [emptyContributor];
  }

  const convToFormData = (data: Edition): EditionFormData => {
    return {
      id: data.id,
      title: data.title,
      subtitle: data.subtitle ? data.subtitle : "",
      editionnum: Number(data.editionnum) ? Number(data.editionnum) : null,
      version: data.version ? data.version : null,
      pubyear: Number(data.pubyear),
      pages: data.pages ? data.pages : null,
      size: data.size ? data.size : null,
      misc: data.misc ? data.misc : "",
      imported_string: data.imported_string,
      isbn: data.isbn ?
        typeof (data.isbn) === 'string' ? data.isbn :
          (data.isbn[0].isbn ? data.isbn[0].isbn : "")
        : "",  // ISBN can be null, a string or an ISBN object
      printedin: data.printedin ? data.printedin : "",
      coll_info: data.coll_info ? data.coll_info : "",
      dustcover: data.dustcover === null || data.dustcover === 1 ? null : data.dustcover === 2 ? false : true,
      publisher: data.publisher,
      pubseries: data.pubseries,
      pubseriesnum: data.pubseriesnum,
      contributors: contributors,
      format: data.format,
      binding: data.binding,
      coverimage: data.coverimage === null || data.coverimage === 1 ? null : data.coverimage === 2 ? false : true,
      verified: data.verified,
    }
  }

  const defaultValues: EditionFormData = {
    id: null,
    title: work.title,
    subtitle: work.subtitle ? work.subtitle : "",
    editionnum: null,
    version: null,
    pubyear: work.pubyear,
    pages: null,
    size: null,
    misc: "",
    imported_string: "",
    isbn: "",
    printedin: "",
    coll_info: "",
    dustcover: null,
    publisher: null,
    pubseries: null,
    pubseriesnum: null,
    contributors: [emptyContributor],
    format: null,
    binding: bindings[0],
    coverimage: null,
    verified: false,
  }

  const formData = data ? convToFormData(data) : defaultValues;
  const methods = useForm<EditionFormData>({ defaultValues: formData });
  const errors = methods.formState.errors;

  return (
    <div className='card mt-3'>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <div className="formgrid grid">
            <div className="field col-12 mb-0 pb-0">
              <FormInputText
                name="title"
                methods={methods}
                label="Nimi"
                rules={required_rule}
                autoFocus
                disabled={disabled}
                labelClass='required-field'
              />
            </div>
            <div className="field col-12 mt-0 pt-0">
              <FormInputText
                name="subtitle"
                methods={methods}
                label="Alaotsikko"
                disabled={disabled}
              />
            </div>
            <div className="grid col-12">
              <div className="field col-12 lg:col-4 md:col-6 mb-0 pb-0">
                <FormAutoComplete
                  name="publisher"
                  methods={methods}
                  label="Kustantaja"
                  completeMethod={filterPublishers}
                  suggestions={filteredPublishers}
                  placeholder="Kustantaja"
                  disabled={disabled}
                />
              </div>

              <div className="field col-4">
                <FormInputNumber
                  name="pubyear"
                  methods={methods}
                  label="Vuosi"
                  rules={required_rule}
                  disabled={disabled}
                />
              </div>
              <div className="field col-12 lg:col-4 mb-0 pb-0">
                <FormInputText
                  name="printedin"
                  methods={methods}
                  label="Painopaikka"
                  disabled={disabled}
                />
              </div>
              <div className="field col-6 mt-0 pt-0">
                <FormInputNumber
                  name="editionnum"
                  label="Painos"
                  methods={methods}
                  disabled={disabled}
                />
              </div>
              <div className="field col-6 mt-0 pt-0">
                <FormInputNumber
                  name="version"
                  label="Laitos"
                  methods={methods}
                  disabled={disabled}
                />
              </div>
            </div>
            <div className="field col-5 p-2">
              <FormAutoComplete
                name="pubseries"
                methods={methods}
                label="Kustantajan sarja"
                completeMethod={filterPubseries}
                suggestions={filteredPubseries}
                forceSelection={false}
                disabled={disabled}
              />
            </div>
            <div className="field col-2 p-2">
              <FormInputNumber
                name="pubseriesnum"
                label="Numero"
                methods={methods}
                disabled={disabled}
              />
            </div>
            <div className="grid col-12 mt-2">
              <div className="field col-4 p-2">
                <FormInputText
                  name="isbn"
                  label="ISBN"
                  methods={methods}
                  disabled={disabled}
                />
              </div>
            </div>
            <div className="field col-12 p-2">
              <ContributorField
                id={"contributors"}
                disabled={disabled}
                contributionTarget='edition'
              />
            </div>

            <div className="grid col-12 mt-3">
              <div className="field col-12 lg:col-4 p-2">
                <FormInputNumber
                  name="pages"
                  label="Sivuja"
                  methods={methods}
                  rules={{ min: 0 }}
                  disabled={disabled}
                />
              </div>
              <div className="field col-12 lg:col-4 p-2">
                <FormInputNumber
                  name="size"
                  label="Korkeus cm"
                  methods={methods}
                  rules={{ min: 0 }}
                  disabled={disabled}
                />
              </div>
              <div className="field col-12 lg:col-4 p-2">
                <FormDropdown
                  name="binding"
                  label="Sidonta"
                  options={bindings}
                  methods={methods}
                  disabled={disabled}
                />
              </div>
            </div>
            <div className="grid col-12 mt-3">
              <div className='field col-2 p-2'>
                <FormTriStateCheckbox
                  name="dustcover"
                  label="Kansipaperi"
                  methods={methods}
                  disabled={disabled}
                />
              </div>
              <div className='field col-2 p-2'>
                <FormTriStateCheckbox
                  name="coverimage"
                  label="Ylivetokannet"
                  methods={methods}
                  disabled={disabled}
                />
              </div>
            </div>
            <div className="field col-12 p-2">
              <FormInputText
                name="misc"
                label="Muuta"
                methods={methods}
                disabled={disabled}
              />
            </div>
            <div className="field col-12 p-2">
              <FormInputText
                name="imported_string"
                label="Lähde"
                methods={methods}
                disabled={disabled}
              />
            </div>
            <div className="field col-12 p-2">
              <FormCheckbox
                name="verified"
                methods={methods}
                label="Tarkastettu"
                disabled={disabled}
                checked={false}
              />
            </div>
            <Button type="submit" disabled={disabled} className="w-full justify-content-center">
              Tallenna
            </Button>
          </div>
        </form>
      </FormProvider>

    </div>

  )
}