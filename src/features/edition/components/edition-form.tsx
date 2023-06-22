import React, { useEffect, useMemo, useState } from 'react';

import { useForm, Controller, SubmitHandler, FieldValues, FormProvider } from 'react-hook-form';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { classNames } from 'primereact/utils';
import { InputText } from 'primereact/inputtext';
import { AutoComplete } from 'primereact/autocomplete';
import { TriStateCheckbox } from 'primereact/tristatecheckbox';
import { RadioButton, RadioButtonChangeEvent, RadioButtonProps } from 'primereact/radiobutton';
import { Button } from 'primereact/button';

import { getCurrenUser } from '../../../services/auth-service';
import { Edition } from '../types';
import { ContributorField } from '../../../components/forms/contributor-field';
import { Contribution } from '../../../types/contribution';
import { EditionFormData } from '../types';
import { putApiContent, postApiContent, getApiContent } from '../../../services/user-service';
import { isDisabled, FormSubmitObject } from '../../../components/forms/forms';
import { Binding } from '../../../types/binding';

interface EditionFormProps {
  edition: Edition | null;
  work?: number;
  onSubmitCallback: () => void;
}

export const EditionForm = (props: EditionFormProps) => {
  const user = useMemo(() => { return getCurrenUser() }, []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [filteredPublishers, setFilteredPublishers] = useState<any>([]);
  const [filteredPubseries, setFilteredPubseries] = useState<any>([]);
  const bindingTypes: Binding[] = [{ id: '1', name: 'Ei tietoa' }, { id: '2', name: 'Nidottu' }, { id: '3', name: 'Sidottu' }];
  const [binding, setBinding] = useState<Binding>(bindingTypes[0]);

  console.log("EditionForm: ", props.edition);

  useEffect(() => {
  }, [user]);

  const queryClient = useQueryClient()

  const convToFormData = (data: Edition): EditionFormData => {
    return {
      id: data.id,
      title: data.title,
      subtitle: data.subtitle,
      editionnum: data.editionnum ? data.editionnum.toString() : '',
      pubyear: data.pubyear ? data.pubyear.toString() : '',
      pages: data.pages ? data.pages.toString() : '',
      size: data.size,
      misc: data.misc,
      imported_string: data.imported_string,
      isbn: data.isbn,
      printedin: data.printedin,
      coll_info: data.coll_info,
      dustcover: data.dustcover === null || data.dustcover === 1 ? null : data.dustcover === 2 ? false : true,
      publisher: data.publisher,
      pubseries: data.pubseries,
      pubseriesnum: data.pubseriesnum?.toString(),
      contributors: data.contributions,
      format: data.format,
      binding: data.binding,
      coverimage: data.coverimage === null || data.coverimage === 1 ? null : data.coverimage === 2 ? false : true,
    }
  }

  const defaultValues: EditionFormData = {
    id: null,
    title: "",
    subtitle: "",
    editionnum: '',
    pubyear: '',
    pages: '',
    size: "",
    misc: "",
    imported_string: "",
    isbn: "",
    printedin: "",
    coll_info: "",
    dustcover: null,
    publisher: null,
    pubseries: null,
    pubseriesnum: '',
    contributors: [],
    format: null,
    binding: bindingTypes[0],
    coverimage: null,
  }

  const formData = props.edition ? convToFormData(props.edition) : defaultValues;
  const methods = useForm<EditionFormData>({ defaultValues: formData });
  const register = methods.register;
  const control = methods.control;

  const onSubmit: SubmitHandler<FieldValues> = data => {
    // Convert values back to API format
    let updatedData: FieldValues = JSON.parse(JSON.stringify(data));
    updatedData.dustcover = data.dustcover === null ? 1 : data.dustcover === false ? 2 : 3;
    updatedData.coverimage = data.coverimage === null ? 1 : data.coverimage === false ? 2 : 3;
    updatedData.binding = binding;
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
    const url = "filter/languages/" + event.query;
    const response = await getApiContent(url, user);
    setFilteredPublishers(response.data);
  }

  async function filterPubseries(event: any) {
    const url = "filter/pubseries/" + event.query;
    const response = await getApiContent(url, user);
    setFilteredPubseries(response.data);
  }

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
                    <InputText id="title"
                      {...field}
                      {...methods.register("title", { required: true })}
                      value={field.value ? field.value : ""}
                      autoFocus
                      className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                      disabled={isDisabled(user, loading)}
                    />
                  )}
                />
                <label htmlFor="title">Nimi</label>
              </span>
            </div>
            <div className="field col-12">
              <span className="p-float-label">
                <Controller
                  name="subtitle"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <InputText id="subtitle"
                      {...field}
                      {...methods.register("subtitle")}
                      value={field.value ? field.value : ""}
                      className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                      disabled={isDisabled(user, loading)}
                    />
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
                    render={({ field, fieldState }) => (
                      <AutoComplete
                        {...field}
                        field="name"
                        completeMethod={filterPublishers}
                        suggestions={filteredPublishers}
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
                  <label htmlFor="publisher">Kustantaja</label>
                </span>
              </div>

              <div className="field col-1">
                <span className="p-float-label">
                  <Controller
                    name="pubyear"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputText id="pubyear"
                        {...field}
                        {...methods.register("pubyear")}
                        className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                        disabled={isDisabled(user, loading)}
                      />
                    )}
                  />
                  <label htmlFor="pubyear">Julkaisuvuosi</label>
                </span>
              </div>
              <div className="field col-1">
                <span className="p-float-label">
                  <Controller
                    name="editionnum"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputText id="editionnum"
                        {...field}
                        {...methods.register("editionnum")}
                        className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                        disabled={isDisabled(user, loading)}
                      />
                    )}
                  />
                  <label htmlFor="editionnum">Painosnumero</label>
                </span>
              </div>
              <div className="field col-1">
                <span className="p-float-label">
                  <Controller
                    name="version"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputText id="version"
                        {...field}
                        value={field.value ? field.value : ""}
                        {...methods.register("version")}
                        className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                        disabled={isDisabled(user, loading)}
                      />
                    )}
                  />
                  <label htmlFor="version">Laitos</label>
                </span>
              </div>
              <div className="field col-4">
                <span className="p-float-label">
                  <Controller
                    name="printedin"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputText id="printedin"
                        {...field}
                        value={field.value ? field.value : ""}
                        {...methods.register("printedin")}
                        className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                        disabled={isDisabled(user, loading)}
                      />
                    )}
                  />
                  <label htmlFor="printedin">Painopaikka</label>
                </span>
              </div>
            </div>
            <div className="field col-3">
              <span className="p-float-label">
                <Controller
                  name="pubseries"
                  control={methods.control}
                  render={({ field, fieldState }) => (
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
                  )}
                />
                <label htmlFor="pubseries">Kustantajan sarja</label>
              </span>
            </div>
            <div className="field col-1">
              <span className="p-float-label">
                <Controller
                  name="pubseriesnum"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <InputText id="pubseriesnum"
                      {...field}
                      {...methods.register("pubseriesnum")}
                      value={field.value ? field.value : ""}
                      className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                      disabled={isDisabled(user, loading)}
                    />
                  )}
                />
                <label htmlFor="pubseriesnum">Numero</label>
              </span>
            </div>
            <div className="grid col-12 mt-2">
              <div className="field col-2">
                <span className="p-float-label">
                  <Controller
                    name="isbn"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputText id="isbn"
                        {...field}
                        {...methods.register("isbn")}
                        value={field.value ? field.value : ""}
                        className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                        disabled={isDisabled(user, loading)}
                      />
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
              <div className="field col-1">
                <span className="p-float-label">
                  <Controller
                    name="pages"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputText id="pages"
                        {...field}
                        {...methods.register("pages")}
                        value={field.value ? field.value : ""}
                        className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                        disabled={isDisabled(user, loading)}
                      />
                    )}
                  />
                  <label htmlFor="pages">Sivumäärä</label>
                </span>
              </div>
              <div className="field col-1">
                <span className="p-float-label">
                  <Controller
                    name="size"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputText id="size"
                        {...field}
                        {...methods.register("size")}
                        value={field.value ? field.value : ""}
                        className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                        disabled={isDisabled(user, loading)}
                      />
                    )}
                  />
                  <label htmlFor="size">Koko (korkeus cm)</label>
                </span>
              </div>
              <div className="field col-2">
                {bindingTypes.map((item) => {
                  return (
                    <div key={"binding" + item.id} className="flex align-items-center">
                      <Controller
                        name={"binding" + item.id}
                        control={methods.control}
                        render={({ field, fieldState }) => (
                          <RadioButton
                            inputId={item.id}
                            name="binding"
                            value={item}
                            onChange={(e: RadioButtonChangeEvent) => setBinding(e.value)}
                            checked={binding.id === item.id}
                          />
                        )}
                      />
                      <label htmlFor={"binding" + item.id}>{item.name}</label>
                    </div>
                  );
                })}
              </div>
              {/*
              <div className='field col-2'>
                <div className="flex align-items-center">
                  <Controller
                    name="binding"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <RadioButton inputId="Ei tiedossa"
                        {...field}
                        inputRef={field.ref}
                        name="binding"
                        checked={field.value && field.value.id === 1}
                      />
                    )}
                  />
                  <label htmlFor="Ei tiedossa">Ei tiedossa</label>
                  <Controller
                    name="binding"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <RadioButton inputId="Nidottu"
                        {...field}
                        inputRef={field.ref}
                        name="binding"
                        checked={field.value && field.value.id === 2}
                      />
                    )}
                  />
                  <label htmlFor="Nidottu">Nidottu</label>
                  <Controller
                    name="binding"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <RadioButton inputId="Sidottu"
                        {...field}
                        inputRef={field.ref}
                        name="binding"
                        checked={field.value && field.value.id === 3}
                      />
                    )}
                  />
                  <label htmlFor="Sidottu">Sidottu</label>
                </div>
              </div>
                    */}
              <div className='field col-1'>
                <Controller
                  name="dustcover"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <TriStateCheckbox
                      {...field}
                      id={field.name}
                      value={field.value}
                      tooltip="Kansipaperi"
                      onChange={field.onChange}
                      className={classNames({ 'p-invalid': fieldState.error })}
                      disabled={isDisabled(user, loading)}
                    />
                  )}
                />
                <label htmlFor="binding">Kansipaperi</label>
              </div>
              <div className='field col-1'>
                <Controller
                  name="coverimage"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <TriStateCheckbox
                      {...field}
                      id={field.name}
                      value={field.value}
                      tooltip="Ylivetokannet"
                      onChange={field.onChange}
                      className={classNames({ 'p-invalid': fieldState.error })}
                      disabled={isDisabled(user, loading)}
                    />
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
                    <InputText id="misc"
                      {...field}
                      {...methods.register("misc")}
                      value={field.value ? field.value : ""}
                      className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                      disabled={isDisabled(user, loading)}
                    />
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
                    <InputText id="imported_string"
                      {...field}
                      {...methods.register("imported_string")}
                      value={field.value ? field.value : ""}
                      className={classNames({ 'p-invalid': fieldState.error }, "w-full")}
                      disabled={isDisabled(user, loading)}
                    />
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