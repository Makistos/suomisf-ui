import React, { useMemo, useState, useEffect } from 'react';

import { FieldValues, FormProvider, SubmitHandler, Controller, useForm } from 'react-hook-form';
import { Editor } from 'primereact/editor';
import { AutoComplete } from 'primereact/autocomplete';
import { Button } from 'primereact/button';
import { useQueryClient } from '@tanstack/react-query';

import { Person, PersonFormData } from '../types';
import { getCurrenUser } from '../../../services/auth-service';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { isDisabled } from '../../../components/forms/forms';
import { getApiContent } from '../../../services/user-service';
import { QueryClient } from '@tanstack/react-query';

interface FormProps<T> {
    data: T | null,
    onSubmitCallback: (() => void)
}

export const PersonForm = (props: FormProps<Person>) => {
    const user = useMemo(() => { return getCurrenUser() }, []);
    const [loading, setLoading] = useState(false);
    const [filteredCountries, setFilteredCountries] = useState([]);

    const convToForm = (person: Person): PersonFormData => ({
        id: person.id,
        name: person.name,
        aliases: person.aliases,
        alt_name: person.alt_name,
        fullname: person.fullname,
        other_names: person.other_names,
        dob: person.dob ? person.dob.toString() : '',
        dod: person.dod ? person.dod.toString() : '',
        bio: person.bio,
        links: person.links,
        nationality: person.nationality
    });

    const defaultValues: PersonFormData = {
        id: null,
        name: '',
        aliases: [],
        alt_name: '',
        fullname: '',
        other_names: '',
        dob: '',
        dod: '',
        bio: '',
        links: [],
        nationality: null
    }

    const formData = props.data ? convToForm(props.data) : defaultValues;
    const methods = useForm<PersonFormData>({ defaultValues: formData });
    const queryClient = useQueryClient()

    async function filterCountries(event: any) {
        const url = "filter/countries/" + event.query;
        const response = await getApiContent(url, user);
        setFilteredCountries(response.data);
    }

    const onSubmit: SubmitHandler<FieldValues> = (data) => {
        const retval = { data, changed: methods.formState.dirtyFields }
        setLoading(true);

        console.log(retval);

        setLoading(false);
        queryClient.invalidateQueries();
        props.onSubmitCallback();
    }

    return (
        <div className="card mt-3">
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <div className="formgrid grid">
                        <div className="field col-12 lg:col-6">
                            <span className="p-float-label">
                                <Controller name="name" control={methods.control}
                                    render={({ field, fieldState }) => (
                                        <InputText
                                            {...field}
                                            autoFocus
                                            {...methods.register("name")}
                                            className={classNames({ "p-invalid": fieldState.error }, "w-full")}
                                            disabled={isDisabled(user, loading)}
                                        />
                                    )}
                                />
                                <label htmlFor="name">Nimi<sup>*</sup></label>
                                <small id="name-help">Kuten esiintyy kirjoissa (sukunimi, etunimi)</small>
                            </span>
                        </div>
                        <div className="field col-12 lg:col-6">
                            <span className="p-float-label">
                                <Controller name="alt_name" control={methods.control}
                                    render={({ field, fieldState }) => (
                                        <InputText
                                            {...field}
                                            autoFocus
                                            {...methods.register("alt_name")}
                                            className={classNames({ "p-invalid": fieldState.error }, "w-full")}
                                            disabled={isDisabled(user, loading)}
                                        />
                                    )}
                                />
                                <label htmlFor="alt_name">Vaihtoehtoinen nimi</label>
                                <small id="alt_name-help">Vaihtoehtoinen muoto (etunimi sukunimi)</small>
                            </span>
                        </div>
                        <div className="field col-12 lg:col-6">
                            <span className="p-float-label">
                                <Controller name="fullname" control={methods.control}
                                    render={({ field, fieldState }) => (
                                        <InputText
                                            {...field}
                                            autoFocus
                                            {...methods.register("fullname")}
                                            className={classNames({ "p-invalid": fieldState.error }, "w-full")}
                                            disabled={isDisabled(user, loading)}
                                        />
                                    )}
                                />
                                <label htmlFor="fullname">Koko nimi</label>
                            </span>
                        </div>
                        <div className="field col-12 lg:col-6">
                            <span className="p-float-label">
                                <Controller name="other_names" control={methods.control}
                                    render={({ field, fieldState }) => (
                                        <InputText
                                            {...field}
                                            autoFocus
                                            {...methods.register("other_names")}
                                            className={classNames({ "p-invalid": fieldState.error }, "w-full")}
                                            disabled={isDisabled(user, loading)}
                                        />
                                    )}
                                />
                                <label htmlFor="name">Muita käytettyjä nimen muotoja</label>
                            </span>
                        </div>
                        <div className="field col-6 lg:col-3">
                            <span className="p-float-label">
                                <Controller name="dob" control={methods.control}
                                    render={({ field, fieldState }) => (
                                        <InputText
                                            {...field}
                                            autoFocus
                                            {...methods.register("dob")}
                                            className={classNames({ "p-invalid": fieldState.error }, "w-full")}
                                            disabled={isDisabled(user, loading)}
                                        />
                                    )}
                                />
                                <label htmlFor="name">Syntymävuosi</label>
                            </span>
                        </div>
                        <div className="field col-6 lg:col-3">
                            <span className="p-float-label">
                                <Controller name="dod" control={methods.control}
                                    render={({ field, fieldState }) => (
                                        <InputText
                                            {...field}
                                            autoFocus
                                            {...methods.register("dod")}
                                            className={classNames({ "p-invalid": fieldState.error }, "w-full")}
                                            disabled={isDisabled(user, loading)}
                                        />
                                    )}
                                />
                                <label htmlFor="name">Kuolinvuosi</label>
                            </span>
                        </div>
                        <div className="field col-12 lg:col-6">
                            <span className="p-float-label">
                                <Controller name="nationality" control={methods.control}
                                    render={({ field, fieldState }) => (
                                        <AutoComplete
                                            {...field}
                                            field="name"
                                            completeMethod={filterCountries}
                                            suggestions={filteredCountries}
                                            placeholder="Kansallisuus"
                                            emptyMessage='Ei tuloksia'
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
                                <label htmlFor="nationality">Kansallisuus</label>
                            </span>
                        </div>

                        <div className="field col-12">
                            Kuvaus
                            <Controller name="bio" control={methods.control}
                                render={({ field, fieldState }) => (
                                    <Editor {...field}
                                        style={{ 'height': '360px' }} />
                                )}
                            />
                        </div>
                        <Button type="submit" className="w-full justify-content-center">Tallenna</Button>
                    </div>
                </form>
            </FormProvider>

        </div>
    )
}