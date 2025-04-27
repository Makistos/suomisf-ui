import React, { useState, useEffect } from "react";
import { Controller, SubmitHandler, useForm } from 'react-hook-form';

import axios from "axios";
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Button } from 'primereact/button';
import { ProgressSpinner } from "primereact/progressspinner";
import _ from "lodash";
import { useQuery } from "@tanstack/react-query";

import { ShortsList } from '../components/shorts-list';
//import { API_URL } from "../../../systemProps";
import { Short } from "../types";
import { useDocumentTitle } from '../../../components/document-title';

type FormData = {
    [index: string]: any,
    author?: string,
    title?: string,
    orig_name?: string,
    pubyear_first?: string,
    pubyear_last?: string
};

const defaultValues: FormData = {
    author: '',
    title: '',
    orig_name: '',
    pubyear_first: '',
    pubyear_last: ''
}

export const ShortSearchPage = () => {
    const { control, handleSubmit, formState: { errors } } = useForm<FormData>(
        { defaultValues: defaultValues }
    );
    const [documentTitle, setDocumentTitle] = useDocumentTitle("");
    const [loading, setLoading] = useState(false);
    // const [shorts, setShorts]: [Short[], (shorts: Short[]) => void] = useState<Short[]>([]);
    const [searchParams, setSearchParams]: [FormData | null, (params: FormData) => void] = useState<FormData | null>(null);
    const [queryEnabled, setQueryEnabled] = useState(false);

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
                <div className="flex justify-content-center mt-5 mb-5">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="field">
                            <span className="p-float-label">
                                <Controller name="author" control={control}
                                    render={({ field, fieldState }) => (
                                        <InputText
                                            id={field.name} {...field} autoFocus
                                            className={classNames({ 'p-invalid': fieldState.error })}
                                        />
                                    )} />
                                <label htmlFor="author" className={classNames({ 'p-error': errors })}>Kirjoittaja</label>
                            </span>
                        </div>
                        <div className="field">
                            <span className="p-float-label">
                                <Controller name="title" control={control}
                                    render={({ field, fieldState }) => (
                                        <InputText id={field.name} {...field}
                                            className={classNames({ 'p-invalid': fieldState })} />
                                    )} />
                                <label htmlFor="title" className={classNames({ 'p-error': errors })}>Nimi</label>
                            </span>
                        </div>
                        <div className="field">
                            <span className="p-float-label">
                                <Controller name="orig_name" control={control}
                                    render={({ field, fieldState }) => (
                                        <InputText id={field.name} {...field}
                                            className={classNames({ 'p-invalid': fieldState })} />
                                    )} />
                                <label htmlFor="title" className={classNames({ 'p-error': errors })}>Alkukielinen nimi</label>
                            </span>
                        </div>
                        <div className="field">
                            <span className="p-float-label">
                                <Controller name="pubyear_first" control={control}
                                    render={({ field, fieldState }) => (
                                        <InputText id={field.name} {...field}
                                            keyfilter="pint"
                                            className={classNames({ 'p-invalid': fieldState })} />
                                    )} />
                                <label htmlFor="title" className={classNames({ 'p-error': errors })}>Julkaistu aikaisintaan</label>
                            </span>
                        </div>
                        <div className="field">
                            <span className="p-float-label">
                                <Controller name="pubyear_last" control={control}
                                    render={({ field, fieldState }) => (
                                        <InputText id={field.name} {...field}
                                            className={classNames({ 'p-invalid': fieldState })} />
                                    )} />
                                <label htmlFor="title" className={classNames({ 'p-error': errors })}>Julkaistu viimeistään</label>
                            </span>
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
