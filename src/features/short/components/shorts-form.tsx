import { useEffect, useState, useMemo } from 'react';
import { useForm, Controller, SubmitHandler, FieldValues, useFieldArray } from 'react-hook-form';

import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from "primereact/multiselect";
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { AutoComplete } from 'primereact/autocomplete';
import { useQueryClient } from '@tanstack/react-query';
import _ from "lodash";

import { Short } from "../types";
import { ContributorField } from '../../../components/forms/contributor-field';
import { Contribution, ContributionSimple } from '../../../types/contribution';
import { getApiContent, putApiContent } from '../../../services/user-service';
import { getCurrenUser } from '../../../services/auth-service';
import { ShortForm } from '../types';
import { isDisabled, FormSubmitObject } from '../../../components/forms/forms';

type ShortFormType = Pick<Short, "id">

interface ShortFormProps {
    short: Short,
    onSubmitCallback: ((state: boolean) => void)
}

const makeBriefContributor = (contributions: Contribution[]): ContributionSimple[] => {
    const simplifyContribution = (contribution: Contribution) => {
        return {
            'person': _.pick(contribution.person, ['id', 'name', 'alt_name', 'fullname']),
            'role': _.pick(contribution.role, ['id', 'name']),
            'description': contribution.description,
        }
    }
    return contributions.map(simplifyContribution);
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
        contributors: makeBriefContributor(short.contributors),
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
        const retval: FormSubmitObject = { data, changed: dirtyFields }
        setMessage("");
        setLoading(true);

        // console.log(data);

        putApiContent('shorts/', retval, user);
        // if (isDirty) {
        //     console.log(dirtyFields)
        // }
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
                                        disabled={isDisabled(user, loading)}
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
                                        disabled={isDisabled(user, loading)}
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
                                        disabled={isDisabled(user, loading)}
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
                                        disabled={isDisabled(user, loading)}
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
                                        disabled={isDisabled(user, loading)}
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
                                        disabled={isDisabled(user, loading)}
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
                                        disabled={isDisabled(user, loading)}
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
                            disabled={isDisabled(user, loading)}
                            defValues={formData.contributors}
                        />
                    </div>
                    <Button type="submit" className="w-full justify-content-center">Tallenna</Button>
                </div>
            </form>
        </div>
    )
}