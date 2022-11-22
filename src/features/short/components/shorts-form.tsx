import React, { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler, FieldValues } from 'react-hook-form';

import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from "primereact/multiselect";
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { AutoComplete } from 'primereact/autocomplete';

import { Short } from "../types";
import { ContributorField } from '../../../components/forms/contributor-field';
import { Contribution } from '../../../types/contribution';
import { KeyValuePair } from '../../../components/forms/forms';
import { getApiContent, postApiContent } from '../../../services/user-service';
import { getCurrenUser } from '../../../services/auth-service';
import { TagType } from "../../tag";
import { isAdmin } from '../../user';

interface hasIdAndName {
    id: number,
    name: string
}
interface ShortForm {
    id: number | null,
    title: string,
    orig_title: string,
    language: string | null,
    pubyear: number | null
    authors: KeyValuePair[],
    type: number,
    genres: KeyValuePair[],
    contributors: Contribution[],
    tags: TagType[]
}

interface ShortFormSubmit {
    data: Object,
    changed: Object
}

const toKeyValue = <T extends hasIdAndName>(arr: T[]): KeyValuePair[] =>
    arr.map(item => ({ id: item.id, value: item.name }));

interface ShortFormProps {
    short: Short
}

export const ShortsForm = (props: ShortFormProps) => {
    const user = getCurrenUser();
    const convToForm = (short: Short): ShortForm => ({
        id: short.id,
        title: short.title,
        orig_title: short.orig_title,
        language: short.language,
        pubyear: short.pubyear,
        authors: toKeyValue(short.authors),
        type: short.type.id,
        genres: toKeyValue(short.genres),
        contributors: short.contributors,
        tags: short.tags
    });

    const defaultValues: ShortForm = {
        id: null,
        title: '',
        orig_title: '',
        language: '',
        pubyear: null,
        authors: [],
        type: 1,
        genres: [],
        contributors: [],
        tags: []
    }
    const formData = props.short !== null ? convToForm(props.short) : defaultValues;

    const { register, control, handleSubmit,
        formState: { isDirty, dirtyFields } } =
        useForm<FieldValues>({ defaultValues: formData });
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
        getTypes();
        getGenres();
    }, [])
    const onSubmit: SubmitHandler<FieldValues> = (data) => {
        const retval: ShortFormSubmit = { data, changed: dirtyFields }
        setMessage("");
        setLoading(true);

        console.log(data);

        postApiContent('shorts/', retval, user);
        if (isDirty) {
            console.log(dirtyFields)
        }
        setLoading(false);
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

    return (
        <div className="card mt-3">
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="formgrid grid">
                    <div className="field col-12">
                        <span className="p-float-label">
                            <Controller name="title" control={control}
                                render={({ field, fieldState }) => (
                                    <InputText id={field.name}
                                        {...field}
                                        autoFocus
                                        {...register("title")}
                                        className={classNames({ 'p-invalid': fieldState.error },
                                            "w-full")}
                                        disabled={!isAdmin(user)}
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
                                    <InputText id={field.name}
                                        {...field}
                                        {...register("orig_title")}
                                        className={classNames({ 'p-invalid': fieldState.error },
                                            "w-full")}
                                        disabled={!isAdmin(user)}
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
                                    <InputText id={field.name} {...field}
                                        {...register("pubyear")}
                                        keyfilter="pint"
                                        disabled={!isAdmin(user)}
                                    />
                                )}
                            />
                            <label htmlFor="pubyear">Alkuperäinen julkaisuvuosi</label>
                        </span>
                    </div>
                    <div className="field col-6">
                        <span className="p-float-label">
                            <Controller name="type" control={control}
                                render={({ field, fieldState }) => (
                                    <Dropdown
                                        {...field}
                                        optionLabel="name"
                                        optionValue="id"
                                        options={typeList}
                                        className={classNames(
                                            { "p-invalid": fieldState.error }, "w-full"
                                        )}
                                        tooltip="Tyyppi"
                                        disabled={!isAdmin(user)}
                                    />
                                )}
                            />
                            <label htmlFor="type">Tyyppi</label>
                        </span>
                    </div>
                    <div className="field col-6">
                        <span className="p-float-label">
                            <Controller name="language" control={control}
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
                                        disabled={!isAdmin(user)}
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
                                        optionValue="id"
                                        display="chip"
                                        scrollHeight="400px"
                                        className={classNames(
                                            { "p-invalid": fieldState.error },
                                            "w-full"
                                        )}
                                        showClear
                                        showSelectAll={false}
                                        disabled={!isAdmin(user)}
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
                                        disabled={!isAdmin(user)}
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
                            values={formData.contributors}
                        />
                    </div>
                    <Button type="submit" className="w-full justify-content-center">Tallenna</Button>
                </div>
            </form>
        </div>
    )
}