import React, { useState } from "react";
import { Controller, SubmitHandler, useForm } from 'react-hook-form';

import axios from "axios";
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Button } from 'primereact/button';
import { ProgressSpinner } from "primereact/progressspinner";
import _ from "lodash";

import { ShortsList } from '../components/shorts-list';
import { API_URL } from "../../../systemProps";
import { Short } from "../types";

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
    const [loading, setLoading] = useState(false);
    const [shorts, setShorts]: [Short[], (shorts: Short[]) => void] = useState<Short[]>([]);
    //const user = useMemo(() => { return getCurrenUser() }, []);

    const onSubmit: SubmitHandler<FormData> = data => {
        function search() {
            // Make sure at least one parameter is given.
            if (Object.keys(data).length === 0 &&
                _.pickBy(data, function (param) { return data[param].length > 0 }).length === 0) {
                return;
            }
            try {
                axios.post(API_URL + 'searchshorts', data)
                    .then(response => setShorts(response.data));
            } catch (e) {
                console.error(e);
            }
        }
        setLoading(true);
        console.log(data);
        search();
        setLoading(false);
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
                            disabled={loading}
                        >
                            Hae
                        </Button>
                    </form>
                </div>
                <div className="w-full">
                    {loading ? (
                        <div className="progressbar">
                            <ProgressSpinner />
                        </div>
                    ) : (
                        <div>
                            {shorts && <ShortsList shorts={shorts} listPublications groupAuthors anthology />}
                        </div>
                    )}
                </div>
            </>
        </main>
    )
}
