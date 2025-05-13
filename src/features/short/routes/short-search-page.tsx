import React, { useState, useEffect, useMemo } from "react";
import { Controller, FormProvider, SubmitHandler, useForm } from 'react-hook-form';

import axios from "axios";
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Button } from 'primereact/button';
import { ProgressSpinner } from "primereact/progressspinner";
import _, { get } from "lodash";
import { useMutation, useQuery } from "@tanstack/react-query";

import { ShortsList } from '../components/shorts-list';
//import { API_URL } from "../../../systemProps";
import { Short } from "../types";
import { useDocumentTitle } from '../../../components/document-title';
import { Checkbox } from "primereact/checkbox";
import { FormCheckbox } from "@components/forms/field/form-checkbox";
import { getApiContent } from "@services/user-service";
import { getCurrenUser } from "@services/auth-service";
import { FormDropdown } from "@components/forms/field/form-dropdown";
import { getShortTypes } from "../utils/get-short-types";
import { Dropdown } from "primereact/dropdown";

type FormData = {
    [index: string]: any,
    author?: string,
    title?: string,
    orig_name?: string,
    pubyear_first?: string,
    pubyear_last?: string,
    awarded?: boolean,
    magazine?: number,
    type?: number
};

const defaultValues: FormData = {
    author: '',
    title: '',
    orig_name: '',
    pubyear_first: '',
    pubyear_last: ''
}

export const ShortSearchPage = () => {
    const user = useMemo(() => getCurrenUser(), []);
    const methods = useForm<FormData>(
        { defaultValues: defaultValues }
    );
    const { control, handleSubmit, formState: { errors } } = methods;
    const [documentTitle, setDocumentTitle] = useDocumentTitle("");
    const [loading, setLoading] = useState(false);
    // const [shorts, setShorts]: [Short[], (shorts: Short[]) => void] = useState<Short[]>([]);
    const [searchParams, setSearchParams]: [FormData | null, (params: FormData) => void] = useState<FormData | null>(null);
    const [queryEnabled, setQueryEnabled] = useState(false);
    const [magazines, setMagazines]: [any[], (mags: any[]) => void] = useState<any[]>([]);
    const [shortTypes, setShortTypes]: [any[], (types: any[]) => void] = useState<any[]>([]);

    useEffect(() => {
        const getMagazines = async () => {
            const response = await getApiContent('magazines', user)
                .then(resp => resp.data);
            const sorted = _.sortBy(response, ['name']);
            setMagazines(sorted);
        }
        const getTypes = async () => {
            const response = await getApiContent('shorttypes', user)
                .then(resp => resp.data);
            setShortTypes(response);
        }
        getMagazines();
        getTypes();
    }, [])

    useEffect(() => {
        setDocumentTitle("Novellihaku");
    }, [])
    //const user = useMemo(() => { return getCurrenUser() }, []);

    const searchShorts = async () => {
        //let response: Short[] | null = null;
        if (searchParams === null) return null;
        if (Object.keys(searchParams).length === 0 &&
            _.pickBy(searchParams, function (param) { return searchParams[param].length > 0 }).length === 0) {
            return null;
        }
        const response = await axios.post(import.meta.env.VITE_API_URL + 'searchshorts', searchParams)
            .then(resp => resp.data);
        // console.log(response)
        return response;
    }

    const onSubmit: SubmitHandler<FormData> = data => {
        setLoading(true);
        console.log(data);
        setSearchParams(data);
        setQueryEnabled(true);
        setLoading(false);
    }

    const { status, data, fetchStatus } = useQuery({
        queryKey: ["searchShorts", { params: searchParams }],
        enabled: queryEnabled,
        queryFn: () => searchShorts()
    })

    const enableQuery = (state: boolean) => {
        setQueryEnabled(state)
    }


    return (
        <main className="all-content">
            <>
                <div className="grid mb-4 mt-5 justify-content-center">
                    <h1 className="text-center">Novellitietokanta</h1>
                </div>
                <div className="grid justify-content-center mt-5 mb-5">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="field col mb-0">
                            <span className="p-float-label">
                                <Controller name="author" control={control}
                                    render={({ field, fieldState }) => (
                                        <InputText
                                            id={field.name} {...field} autoFocus
                                            className={classNames({ 'p-invalid': fieldState.error })}
                                        />
                                    )} />
                                <label htmlFor="author" className={classNames({ 'p-error': errors })}>Henkilö</label>
                            </span>
                        </div>
                        <div className="field col mb-0">
                            <span className="p-float-label">
                                <Controller name="title" control={control}
                                    render={({ field, fieldState }) => (
                                        <InputText id={field.name} {...field}
                                        />
                                    )} />
                                <label htmlFor="title" className={classNames({ 'p-error': errors })}>Nimi</label>
                            </span>
                        </div>
                        <div className="field col mb-0">
                            <span className="p-float-label">
                                <Controller name="orig_name" control={control}
                                    render={({ field, fieldState }) => (
                                        <InputText id={field.name} {...field}
                                        />
                                    )} />
                                <label htmlFor="title" className={classNames({ 'p-error': errors })}>Alkukielinen nimi</label>
                            </span>
                        </div>
                        <div className="field col mb-0">
                            {/* <label htmlFor="title">Tyyppi</label> */}
                            <Controller name="type" control={control}
                                render={({ field, fieldState }) => (
                                    <Dropdown
                                        {...field}
                                        name="type"
                                        // methods={methods}
                                        // label="Tyyppi"
                                        options={shortTypes}
                                        optionLabel="name"
                                        optionValue="id"
                                        placeholder="Tyyppi"
                                        showClear
                                        className="w-full"
                                        tooltip="Valitse tyyppi"
                                    />
                                )} />
                        </div>
                        <div className="field col mb-0">
                            <span className="p-float-label">
                                <Controller name="pubyear_first" control={control}
                                    render={({ field, fieldState }) => (
                                        <InputText id={field.name} {...field}
                                            keyfilter="pint"
                                        />
                                    )} />
                                <label htmlFor="title" className="w-full">Julkaistu aikaisintaan</label>
                            </span>
                        </div>
                        <div className="field col mb-0">
                            <span className="p-float-label">
                                <Controller name="pubyear_last" control={control}
                                    render={({ field, fieldState }) => (
                                        <InputText id={field.name} {...field}
                                            className="w-full" />
                                    )} />
                                <label htmlFor="title" >Julkaistu viimeistään</label>
                            </span>
                        </div>
                        <div className="field col mb-0">
                            <Controller name="magazine" control={control}
                                render={({ field, fieldState }) => (
                                    <Dropdown
                                        {...field}
                                        name="magazine"
                                        // methods={methods}
                                        // label="Lehti"
                                        options={magazines}
                                        optionLabel="name"
                                        optionValue="id"
                                        tooltip="Valitse lehti"
                                        placeholder="Lehti"
                                        showClear
                                        className="w-full"
                                    />
                                )} />
                        </div>
                        <div className="field col mb-0">
                            <div className="flex align-items-center">
                                <Controller name="awarded" control={control}
                                    render={({ field, fieldState }) => (
                                        <FormCheckbox
                                            name="awarded"
                                            label=""
                                            methods={methods}
                                            disabled={false}
                                            className="align-items-center justify-content-center"
                                            checked={false} />
                                    )} />
                                <label htmlFor="title" className="ml-2">Vain palkitut</label>
                            </div>
                        </div>
                        <Button type="submit" className="w-full justify-content-center"
                            disabled={fetchStatus === 'fetching'}
                        >
                            Hae
                        </Button>
                    </form>
                </div>
                <div className="w-full">
                    {fetchStatus === 'fetching' ? (
                        <div className="progressbar">
                            <ProgressSpinner />
                        </div>
                    ) : (
                        <div>
                            {data && <ShortsList shorts={data} listPublications groupAuthors anthology
                                enableQueries={enableQuery} />}
                        </div>
                    )}
                </div>
            </>
        </main>
    )
}
