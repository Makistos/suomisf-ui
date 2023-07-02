import React, { useEffect, useMemo, useState } from 'react';

import { useForm, Controller, SubmitHandler, FieldValues, FormProvider } from 'react-hook-form';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { classNames } from 'primereact/utils';
import { InputText } from 'primereact/inputtext';
import { AutoComplete } from 'primereact/autocomplete';
import { TriStateCheckbox } from 'primereact/tristatecheckbox';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';

import { getCurrenUser } from '../../../services/auth-service';
import { Edition } from '../types';
import { ContributorField } from '../../../components/forms/contributor-field';
import { EditionFormData } from '../types';
import { putApiContent, postApiContent, getApiContent } from '../../../services/user-service';
import { isDisabled, FormSubmitObject } from '../../../components/forms/forms';
import { Binding } from '../../../types/binding';
import { Work } from '../../work/types';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';

interface EditionFormProps {
  edition: Edition | null;
  work: Work;
  onSubmitCallback: () => void;
}

export const EditionForm = (props: EditionFormProps) => {
  const user = useMemo(() => { return getCurrenUser() }, []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [filteredPublishers, setFilteredPublishers] = useState<any>([]);
  const [filteredPubseries, setFilteredPubseries] = useState<any>([]);
  const [bindings, setBindings] = useState<Binding[]>([]);

  console.log("EditionForm: ", props.edition);

  useEffect(() => {
    async function fetchBindings() {
      const bindings = await getApiContent('bindings', user);
      setBindings(bindings.data);
    }
    fetchBindings();
  }, [user]);

  const queryClient = useQueryClient()

  const convToFormData = (data: Edition): EditionFormData => {
    return {
      id: data.id,
      title: data.title,
      subtitle: data.subtitle,
      editionnum: data.editionnum,
      version: data.version,
      pubyear: data.pubyear,
      pages: data.pages,
      size: data.size,
      misc: data.misc,
      imported_string: data.imported_string,
      isbn: data.isbn,
      printedin: data.printedin,
      coll_info: data.coll_info,
      dustcover: data.dustcover === null || data.dustcover === 1 ? null : data.dustcover === 2 ? false : true,
      publisher: data.publisher,
      pubseries: data.pubseries,
      pubseriesnum: data.pubseriesnum,
      contributors: data.contributions,
      format: data.format,
      binding: data.binding,
      coverimage: data.coverimage === null || data.coverimage === 1 ? null : data.coverimage === 2 ? false : true,
    }
  }

  const defaultValues: EditionFormData = {
    id: null,
    title: props.work.title,
    subtitle: props.work.subtitle,
    editionnum: null,
    version: null,
    pubyear: props.work.pubyear,
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
    contributors: [],
    format: null,
    binding: bindings[0],
    coverimage: null,
  }

  const formData = props.edition ? convToFormData(props.edition) : defaultValues;
  console.log("formData: ", formData);
  const methods = useForm<EditionFormData>({ defaultValues: formData });
  const register = methods.register;
  const control = methods.control;
  const errors = methods.formState.errors;

  const onSubmit: SubmitHandler<FieldValues> = data => {
    // Convert values back to API format
    let updatedData: FieldValues = JSON.parse(JSON.stringify(data));
    updatedData.dustcover = data.dustcover === null ? 1 : data.dustcover === false ? 2 : 3;
    updatedData.coverimage = data.coverimage === null ? 1 : data.coverimage === false ? 2 : 3;
    const retval: FormSubmitObject = { data: updatedData, changed: methods.formState.dirtyFields }
    setMessage("");
    setLoading(true);
    if (data.id != null) {
      putApiContent('editions', retval, user)
    } else {
      postApiContent('editions', retval, user)
    }
    setLoading(false);
    // queryClient.invalidateQueries({ queryKey: ["work", props.work.id] });
    props.onSubmitCallback();
  };

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

  const getFormErrorMessage = (name: string) => {
    const message = errors[name];
    const error = message?.message;
    let errorStr = "";
    if (name === "publisher") {
      console.log("publisher error: ", error);
    }
    if (error !== undefined) {
      errorStr = error.toString();
    }
    return error ? <small className="p-error">{errorStr}</small> :
      <small className="p-error">&nbsp;</small>;
  };

  return (
    <div className='card mt-3'>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <div className="formgrid grid">
            <div className="field col-12">
              <span className="p-float-label">
                <Controller
                  name="title"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <>
                      <InputText id="title"
                        {...field}
                        {...methods.register("title", { required: true })}
                        value={field.value ? field.value : ""}
                        autoFocus
                        className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                        disabled={isDisabled(user, loading)}
                      />
                      {getFormErrorMessage(field.name)}
                    </>
                  )}
                />
                <label htmlFor="title" className="required-field">Nimi</label>
              </span>
            </div>
            <div className="field col-12">
              <span className="p-float-label">
                <Controller
                  name="subtitle"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <>
                      <InputText id="subtitle"
                        {...field}
                        {...methods.register("subtitle")}
                        value={field.value ? field.value : ""}
                        className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                        disabled={isDisabled(user, loading)}
                      />
                      {getFormErrorMessage(field.name)}
                    </>
                  )}
                />
                <label htmlFor="subtitle">Alaotsikko</label>
              </span>
            </div>
            <div className="grid col-12 mt-2">
              <div className="field col-3">
                <span className="p-float-label">
                  <Controller
                    name="publisher"
                    control={methods.control}
                    rules={{ required: 'Kustantaja on pakollinen' }}
                    render={({ field, fieldState }) => (
                      <>
                        <AutoComplete
                          {...field}
                          field="name"
                          completeMethod={filterPublishers}
                          suggestions={filteredPublishers}
                          placeholder="Kustantaja"
                          delay={300}
                          minLength={2}
                          removeIcon
                          className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                          inputClassName="w-full"
                          disabled={isDisabled(user, loading)}
                        />
                        {getFormErrorMessage(field.name)}
                      </>
                    )}
                  />
                  <label htmlFor="publisher" className="required-field">Kustantaja</label>
                </span>
              </div>

              <div className="field col-2">
                <span className="p-float-label">
                  <Controller
                    name="pubyear"
                    control={methods.control}
                    rules={{ required: 'Vuosi on pakollinen' }}
                    render={({ field, fieldState }) => (
                      <>
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
                        {getFormErrorMessage(field.name)}
                      </>
                    )}
                  />
                  <label htmlFor="pubyear" className="required-field">Vuosi</label>
                </span>
              </div>
              <div className="field col-2">
                <span className="p-float-label">
                  <Controller
                    name="editionnum"
                    control={methods.control}
                    rules={{
                      required: 'Painos on pakollinen',
                    }}
                    render={({ field, fieldState }) => (
                      <>
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
                        {getFormErrorMessage(field.name)}
                      </>
                    )}
                  />
                  <label htmlFor="editionnum" className="required-field">Painos</label>
                </span>
              </div>
              <div className="field col-2">
                <span className="p-float-label">
                  <Controller
                    name="version"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <>
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
                        {getFormErrorMessage(field.name)}
                      </>
                    )}
                  />
                  <label htmlFor="version">Laitos</label>
                </span>
              </div>
              <div className="field col-3">
                <span className="p-float-label">
                  <Controller
                    name="printedin"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <>
                        <InputText id="printedin"
                          {...field}
                          value={field.value ? field.value : ""}
                          {...methods.register("printedin")}
                          className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                          disabled={isDisabled(user, loading)}
                        />
                        {getFormErrorMessage(field.name)}
                      </>
                    )}
                  />
                  <label htmlFor="printedin">Painopaikka</label>
                </span>
              </div>
            </div>
            <div className="field col-5">
              <span className="p-float-label">
                <Controller
                  name="pubseries"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <>
                      <AutoComplete
                        {...field}
                        field="name"
                        completeMethod={filterPubseries}
                        suggestions={filteredPubseries}
                        placeholder="Kustantajan sarja"
                        delay={300}
                        minLength={2}
                        removeIcon
                        className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                        inputClassName="w-full"
                        disabled={isDisabled(user, loading)}
                      />
                      {getFormErrorMessage(field.name)}
                    </>
                  )}
                />
                <label htmlFor="pubseries" className="">Kustantajan sarja</label>
              </span>
            </div>
            <div className="field col-2">
              <span className="p-float-label">
                <Controller
                  name="pubseriesnum"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <>
                      <InputNumber
                        id={field.name}
                        inputRef={field.ref}
                        useGrouping={false}
                        value={field.value}
                        onBlur={field.onBlur}
                        onValueChange={(e) => field.onChange(e.value)}
                        className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                        disabled={isDisabled(user, loading)}
                      />
                      {getFormErrorMessage(field.name)}
                    </>
                  )}
                />
                <label htmlFor="pubseriesnum">Numero</label>
              </span>
            </div>
            <div className="grid col-12 mt-2">
              <div className="field col-4">
                <span className="p-float-label">
                  <Controller
                    name="isbn"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <>
                        <InputText id="isbn"
                          {...field}
                          {...methods.register("isbn")}
                          value={field.value ? field.value : ""}
                          className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                          disabled={isDisabled(user, loading)}
                        />
                        {getFormErrorMessage(field.name)}
                      </>
                    )}
                  />
                  <label htmlFor="isbn">ISBN</label>
                </span>
              </div>
            </div>
            <div className="field col-12">
              <ContributorField
                id={"contributors"}
                disabled={isDisabled(user, loading)}
                defValues={formData.contributions}
              />
            </div>

            <div className="grid col-12 mt-3">
              <div className="field col-2">
                <span className="p-float-label">
                  <Controller
                    name="pages"
                    control={methods.control}
                    rules={{ min: 0 }}
                    render={({ field, fieldState }) => (
                      <>
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
                        {getFormErrorMessage(field.name)}
                      </>
                    )}
                  />
                  <label htmlFor="pages">Sivuja</label>
                </span>
              </div>
              <div className="field col-2">
                <span className="p-float-label">
                  <Controller
                    name="size"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <>
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
                        {getFormErrorMessage(field.name)}
                      </>
                    )}
                  />
                  <label htmlFor="size">Korkeus cm</label>
                </span>
              </div>
              <div className="field col-3">
                <span className="p-float-label">
                  <div key="binding" className="flex align-items-center">
                    <Controller
                      name={"binding"}
                      control={methods.control}
                      render={({ field, fieldState }) => (
                        <>
                          <Dropdown
                            {...field}
                            optionLabel="name"
                            options={bindings}
                            className={classNames(
                              { "p-invalid": fieldState.error }, "w-full"
                            )}
                            placeholder="Sidonta"
                            tooltip="Sidonta"
                            disabled={isDisabled(user, loading)}
                          />
                          {getFormErrorMessage(field.name)}
                        </>
                      )}
                    />
                    <label htmlFor="binding">Sidonta</label>
                  </div>
                </span>
              </div>
              <div className='field col-2'>
                <Controller
                  name="dustcover"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <>
                      <TriStateCheckbox
                        {...field}
                        id={field.name}
                        value={field.value}
                        tooltip="Kansipaperi"
                        onChange={field.onChange}
                        className={classNames({ 'p-invalid': fieldState.error })}
                        disabled={isDisabled(user, loading)}
                      />
                      {getFormErrorMessage(field.name)}
                    </>
                  )}
                />
                <label htmlFor="binding">Kansipaperi</label>
              </div>
              <div className='field col-2'>
                <Controller
                  name="coverimage"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <>
                      <TriStateCheckbox
                        {...field}
                        id={field.name}
                        value={field.value}
                        tooltip="Ylivetokannet"
                        onChange={field.onChange}
                        className={classNames({ 'p-invalid': fieldState.error })}
                        disabled={isDisabled(user, loading)}
                      />
                      {getFormErrorMessage(field.name)}
                    </>
                  )}
                />
                <label htmlFor="binding">Ylivetokannet</label>
              </div>

            </div>
            <div className="field col-12">
              <span className="p-float-label">
                <Controller
                  name="misc"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <>
                      <InputText id="misc"
                        {...field}
                        {...methods.register("misc")}
                        value={field.value ? field.value : ""}
                        className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                        disabled={isDisabled(user, loading)}
                      />
                      {getFormErrorMessage(field.name)}
                    </>
                  )}
                />
                <label htmlFor="misc">Muuta</label>
              </span>
            </div>
            <div className="field col-12">
              <span className="p-float-label">
                <Controller
                  name="imported_string"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <>
                      <InputText id="imported_string"
                        {...field}
                        {...methods.register("imported_string")}
                        value={field.value ? field.value : ""}
                        className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                        disabled={isDisabled(user, loading)}
                      />
                    </>
                  )}
                />
                <label htmlFor="imported_string">Lähde</label>
              </span>
            </div>
            <Button type="submit" className="w-full justify-content-center">Tallenna</Button>
          </div>
        </form>
      </FormProvider>

    </div>
  )
}