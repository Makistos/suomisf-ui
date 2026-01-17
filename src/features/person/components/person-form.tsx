import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FieldValues, FormProvider, SubmitHandler, useForm,
    RegisterOptions
} from 'react-hook-form';

import { Button } from 'primereact/button';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { ProgressBar } from 'primereact/progressbar';

import { Person, PersonFormData } from '../types';
import { getCurrenUser } from '../../../services/auth-service';
import { isDisabled } from '../../../components/forms/forms';
import { HttpStatusResponse, getApiContent, postApiContent, putApiContent } from '../../../services/user-service';
import { FormProperties } from '../../../types/form-properties'
import { LinksField } from '../../../components/forms/links-field';
import { AliasesField } from '../../../components/forms/aliases-field';
import { FormInputText } from '../../../components/forms/field/form-input-text';
import { FormInputNumber } from '../../../components/forms/field/form-input-number';
import { FormAutoComplete } from '../../../components/forms/field/form-auto-complete';
import { FormEditor } from '../../../components/forms/field/form-editor';

type FormObjectProps = {
    onSubmit: any,
    methods: any,
}

export const PersonForm = (props: FormProperties<Person>) => {
    const user = useMemo(() => { return getCurrenUser() }, []);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const convToForm = (person: Person): PersonFormData => ({
        id: person.id,
        name: person.name,
        aliases: person.aliases,
        alt_name: person.alt_name,
        fullname: person.fullname,
        other_names: person.other_names,
        dob: person.dob,
        dod: person.dod,
        bio: person.bio,
        bio_src: person.bio_src,
        links: person.links.length > 0 ? person.links : [{ 'link': '', description: '' }],
        nationality: person.nationality
    });

    const defaultValues: PersonFormData = {
        id: null,
        name: '',
        aliases: [],
        alt_name: '',
        fullname: '',
        other_names: '',
        dob: null,
        dod: null,
        bio: '',
        bio_src: '',
        links: [{ link: '', description: '' }],
        nationality: null
    }

    const formData = props.data ? convToForm(props.data) : defaultValues;
    const methods = useForm<PersonFormData>({ defaultValues: formData });
    const queryClient = useQueryClient()

    const updatePerson = (data: PersonFormData) => {
        const saveData = { data: data };
        if (data.id != null) {
            return putApiContent('people', saveData, user);
        } else {
            return postApiContent('people', saveData, user);
        }
    }

    const { mutate } = useMutation({
        mutationFn: (values: PersonFormData) => updatePerson(values),
        onSuccess: (data: HttpStatusResponse, variables) => {
            props.onSubmitCallback();
            if (variables.id === null) {
                navigate('/people/' + data.response, { replace: false })
            } else if (data.status === 200) {

            } else {
                console.log(data.response);
                if (JSON.parse(data.response).data["msg"] !== undefined) {
                    const errMsg = JSON.parse(data.response).data["msg"];
                    //toast('error', 'Tallentaminen epäonnistui', errMsg);
                    console.log(errMsg);
                } else {
                    //toast('error', 'Tallentaminen epäonnistui', "Tuntematon virhe");
                }
            }
        },
        onError: (error: any) => {
            console.log(error.message);
        }
    })

    const onSubmit: SubmitHandler<FieldValues> = (data) => {
        const retval = { data, changed: methods.formState.dirtyFields }
        setLoading(true);

        setLoading(false);
        queryClient.invalidateQueries();
        props.onSubmitCallback();
    }

    return <>
        {formData ? (
            <FormObject
                onSubmit={mutate}
                methods={methods}
            />
        ) :
            <ProgressBar />
        }
    </>
}

const FormObject = ({ onSubmit, methods }: FormObjectProps) => {
    const user = useMemo(() => { return getCurrenUser() }, []);
    const [loading, setLoading] = useState(false);
    const disabled = isDisabled(user, loading);
    const [filteredCountries, setFilteredCountries] = useState([]);

    async function filterCountries(event: any) {
        const url = "filter/countries/" + event.query;
        const response = await getApiContent(url, user);
        setFilteredCountries(response.data);
    }

    const renderSourceHeader = () => {
        return (<></>)
    }
    const sourceHeader = renderSourceHeader();
    const required_rule: RegisterOptions = { required: "Pakollinen kenttä" };
    const editor_style: React.CSSProperties = { height: '320px' };
    const source_style: React.CSSProperties = { height: '100px' };

    return (
        <div className="card mt-3">
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <div className="formgrid grid">
                        <div className="field col-12 lg:col-6">
                            <FormInputText
                                name="name"
                                methods={methods}
                                label="Nimi (sukunimi, etunimi)"
                                rules={required_rule}
                                autoFocus
                                disabled={disabled}
                                labelClass='required-field'
                            />
                        </div>
                        <div className="field col-12 lg:col-6">
                            <FormInputText
                                name="alt_name"
                                methods={methods}
                                label="Vaihtoehtoinen nimi (etunimi sukunimi)"
                                rules={required_rule}
                                disabled={disabled}
                                labelClass='required-field'
                            />
                        </div>
                        <div className="field col-12 lg:col-6">
                            <FormInputText
                                name="fullname"
                                methods={methods}
                                label="Koko nimi (etunimet sukunimet)"
                                disabled={disabled}
                            />
                        </div>
                        <div className="field col-12 lg:col-6">
                            <FormInputText
                                name="other_names"
                                methods={methods}
                                label="Muita käytettyjä nimen muotoja"
                                disabled={disabled}
                            />
                        </div>
                        <div className="field col-12">
                            <AliasesField disabled={disabled} />
                        </div>
                        <div className="field col-3">
                            <FormInputNumber
                                name="dob"
                                methods={methods}
                                label="Syntymävuosi"
                                disabled={disabled}
                            />
                        </div>
                        <div className="field col-3">
                            <FormInputNumber
                                name="dod"
                                methods={methods}
                                label="Kuolinvuosi"
                                disabled={disabled}
                            />
                        </div>
                        <div className="field col-12 lg:col-6">
                            <FormAutoComplete
                                name="nationality"
                                methods={methods}
                                label="Kansallisuus"
                                completeMethod={filterCountries}
                                suggestions={filteredCountries}
                                forceSelection={false}
                                placeholder='Kansallisuus'
                                disabled={disabled}
                            />
                        </div>
                        <div className="field col-12">
                            <LinksField
                                id={"links"}
                                disabled={disabled}
                            />
                        </div>

                        <div className="field col-12">
                            <b>Kuvaus</b>
                            <FormEditor
                                name="bio"
                                methods={methods}
                                style={editor_style}
                                disabled={disabled}
                            />
                        </div>
                        <div className='field col-12'>
                            <FormInputText
                                name="bio_src"
                                methods={methods}
                                label="Lähde"
                                disabled={disabled}
                            />
                        </div>
                        <Button type="submit" className="w-full justify-content-center">Tallenna</Button>
                    </div>
                </form>
            </FormProvider>

        </div>
    )
}