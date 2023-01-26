import React, { useEffect, useState, useMemo } from 'react';
import { useForm, Controller, SubmitHandler, FieldValues, useFieldArray } from 'react-hook-form';

import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from "primereact/multiselect";
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { AutoComplete } from 'primereact/autocomplete';
import { useQueryClient } from '@tanstack/react-query';

import { Short, ShortType } from "../types";
import { Person } from "../../person";
import { Genre } from "../../genre";
import { ContributorField } from '../../../components/forms/contributor-field';
import { Contribution } from '../../../types/contribution';
import { KeyValuePair } from '../../../components/forms/forms';
import { getApiContent, putApiContent } from '../../../services/user-service';
import { getCurrenUser } from '../../../services/auth-service';
import { TagType } from "../../tag";
import { isAdmin } from '../../user';
import { useLocation } from 'react-router-dom';
import { Fieldset } from 'primereact/fieldset';
import { ShortForm } from '../types';

interface ShortFormSubmit {
    data: Object,
    changed: Object
}

type ShortFormType = Pick<Short, "id">

interface ShortFormProps {
    short: Short,
    onSubmitCallback: ((state: boolean) => void)
}

export const ShortsForm = (props: ShortFormProps) => {
    const user = useMemo(() => { return getCurrenUser() }, []);
    const convToForm = (short: Short): ShortForm => ({
        id: short.id,
        title: short.title,
        orig_title: short.orig_title,
        lang: short.lang,
        pubyear: short.pubyear,
        type: short.type,
        genres: short.genres,
        contributors: short.contributors,
        tags: short.tags
    });

    const defaultValues: ShortForm = {
        id: null,
        title: '',
        orig_title: '',
        lang: '',
        pubyear: "",
        type: null,
        genres: [],
        contributors: [],
        tags: []
    }
    const formData = props.short ? convToForm(props.short) : defaultValues;
    const queryClient = useQueryClient()

    const { register, control, handleSubmit,
        formState: { isDirty, dirtyFields } } =
        useForm<ShortForm>({ defaultValues: formData });
    const [typeList, setTypeList] = useState([]);
    const [genres, setGenres] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [filteredLanguages, setFilteredLanguages] = useState([]);
    const [filteredTags, setFilteredTags] = useState([]);

    useEffect(() => {
        async function getTypes() {
            const url = "shorttypes";
            const response = await getApiContent(url, user);
            setTypeList(response.data);
        }
        async function getGenres() {
            const url = "genres";
            const response = await getApiContent(url, user);
            setGenres(response.data);
        }
        setLoading(true);
        getTypes();
        getGenres();
        setLoading(false);
    }, [user])

    const contributorArray = useFieldArray({
        control,
        name: "contributors"
    })

    const onSubmit: SubmitHandler<FieldValues> = (data) => {
        const retval: ShortFormSubmit = { data, changed: dirtyFields }
        setMessage("");
        setLoading(true);

        console.log(data);

        putApiContent('shorts/', retval, user);
        if (isDirty) {
            console.log(dirtyFields)
        }
        setLoading(false);
        queryClient.invalidateQueries(
            //queryKey: ['searchShorts']
        )
        // Close modal
        props.onSubmitCallback(false);
    }
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

    const isDisabled = (): boolean => {
        return !isAdmin(user) || loading
    }

    return (
        <div className="card mt-3">
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="formgrid grid">
                    <div className="field col-12">
                        <span className="p-float-label">
                            <Controller name="title" control={control}
                                render={({ field, fieldState }) => (
                                    <InputText
                                        {...field}
                                        autoFocus
                                        {...register("title")}
                                        className={classNames({ 'p-invalid': fieldState.error },
                                            "w-full")}
                                        disabled={isDisabled()}
                                    />
                                )}
                            />
                            <label htmlFor="title">Nimi</label>
                        </span>
                    </div>
                    <div className="field col-12">
                        <span className="p-float-label">
                            <Controller name="orig_title" control={control}
                                render={({ field, fieldState }) => (
                                    <InputText
                                        {...field}
                                        {...register("orig_title")}
                                        className={classNames({ 'p-invalid': fieldState.error },
                                            "w-full")}
                                        disabled={isDisabled()}
                                    />
                                )}
                            />
                            <label htmlFor="orig_title">Alkuperäinen nimi</label>
                        </span>
                    </div>
                    <div className="field col-12">
                        <span className="p-float-label">
                            <Controller name="pubyear" control={control}
                                render={({ field, fieldState }) => (
                                    <InputText
                                        {...field}
                                        {...register("pubyear")}
                                        className={classNames(
                                            { "p-invalid": fieldState.error },
                                            "w-full"
                                        )}
                                        disabled={isDisabled()}
                                    />
                                )}
                            />
                            <label htmlFor="pubyear">Alkuperäinen julkaisuvuosi</label>
                        </span>
                    </div>
                    <div className="field col-6">
                        <span className="p-float-label">
                            <Controller
                                name="type"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <Dropdown
                                        {...field}
                                        optionLabel="name"
                                        options={typeList}
                                        className={classNames(
                                            { "p-invalid": fieldState.error }, "w-full"
                                        )}
                                        placeholder="Tyyppi"
                                        tooltip="Tyyppi"
                                        disabled={isDisabled()}
                                    />
                                )}
                            />
                            <label htmlFor="type">Tyyppi</label>
                        </span>
                    </div>
                    <div className="field col-6">
                        <span className="p-float-label">
                            <Controller name="lang" control={control}
                                render={({ field, fieldState }) => (
                                    <AutoComplete
                                        {...field}
                                        field="name"
                                        completeMethod={filterLanguages}
                                        suggestions={filteredLanguages}
                                        placeholder="Kieli"
                                        tooltip="Kieli"
                                        delay={300}
                                        minLength={2}
                                        removeIcon
                                        className={classNames(
                                            { "p-invalid": fieldState.error },
                                            "w-full"
                                        )}
                                        inputClassName="w-full"
                                        disabled={isDisabled()}
                                    />
                                )}
                            />
                            <label htmlFor="language">Kieli</label>
                        </span>
                    </div>
                    <div className="field col-12">
                        <span className="p-float-label">
                            <Controller name="genres" control={control}
                                render={({ field, fieldState }) => (
                                    <MultiSelect
                                        {...field}
                                        options={genres}
                                        optionLabel="name"
                                        display="chip"
                                        scrollHeight="400px"
                                        className={classNames(
                                            { "p-invalid": fieldState.error },
                                            "w-full"
                                        )}
                                        showClear
                                        showSelectAll={false}
                                        disabled={isDisabled()}
                                    />
                                )}
                            />
                            <label htmlFor="genres">Genret</label>
                        </span>
                    </div>
                    <div className="field col-12">
                        <span className="p-float-label">
                            <Controller name="tags" control={control}
                                render={({ field, fieldState }) => (
                                    <AutoComplete
                                        {...field}
                                        field="name"
                                        multiple
                                        completeMethod={filterTags}
                                        suggestions={filteredTags}
                                        placeholder="Asiasanat"
                                        tooltip="Asiasanat"
                                        delay={300}
                                        minLength={2}
                                        className={classNames(
                                            { "p-invalid": fieldState.error },
                                            "w-full"
                                        )}
                                        inputClassName="w-full"
                                        disabled={isDisabled()}
                                    />
                                )}
                            />
                            <label htmlFor="language">Asiasanat</label>
                        </span>
                    </div>
                    <div className="field col-12 py-0">
                        <ContributorField
                            id={"authors"}
                            control={control}
                            register={register}
                            disabled={isDisabled()}
                        />
                    </div>
                    <Button type="submit" className="w-full justify-content-center">Tallenna</Button>
                </div>
            </form>
        </div>
    )
}