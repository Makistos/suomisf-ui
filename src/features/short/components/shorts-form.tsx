import { useEffect, useState, useMemo } from 'react';

import { useForm, Controller, SubmitHandler, FieldValues, RegisterOptions, FormProvider } from 'react-hook-form';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from "primereact/multiselect";
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { AutoComplete } from 'primereact/autocomplete';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { DevTool } from "@hookform/devtools";

import { Short } from "../types";
import { ShortContributorField } from '../../../components/forms/short-contributor-field';
import { HttpStatusResponse, getApiContent, postApiContent, putApiContent } from '../../../services/user-service';
import { getCurrenUser } from '../../../services/auth-service';
import { ShortForm } from '../types';
import { isDisabled, FormSubmitObject } from '../../../components/forms/forms';
import { makeBriefContributor } from '../../../components/forms/makeBriefContributor';
import { FormInputNumber } from '../../../components/forms/field/form-input-number';
import { FormInputText } from '../../../components/forms/field/form-input-text';
import { FormDropdown } from '../../../components/forms/field/form-dropdown';
import { FormAutoComplete } from '../../../components/forms/field/form-auto-complete';
import { FormMultiSelect } from '../../../components/forms/field/form-multi-select';
import { ContributorField } from '../../../components/forms/contributor-field';
import { ProgressBar } from 'primereact/progressbar';

// import { shortIsSf } from '../utils';

// type ShortFormType = Pick<Short, "id">

interface ShortFormProps {
    short: Short,
    onSubmitCallback: ((state: boolean) => void)
}

type FormObjectProps = {
    onSubmit: any;
    methods: any;
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

    const methods = useForm<ShortForm>({ defaultValues: formData });
    // const register = methods.register;
    //const control = methods.control;
    // const handleSubmit = methods.handleSubmit;
    // const formState = methods.formState;

    // const { register, control, handleSubmit,
    //     formState: { isDirty, dirtyFields } } =
    //     useForm<ShortForm>({ mode: "onChange", defaultValues: formData });
    const [message, setMessage] = useState("");

    // const contributorArray = useFieldArray({
    //     control,
    //     name: "contributors"
    // })

    // const onSubmit: SubmitHandler<FieldValues> = (data) => {
    //     const retval = { data, changed: methods.formState.dirtyFields }
    //     setMessage("");

    //     // console.log(data);
    //     console.log(retval)
    //     if (data.id !== null) {
    //         putApiContent('shorts/', retval, user);
    //     } else {
    //         postApiContent('shorts/', retval, user);
    //     }
    //     queryClient.invalidateQueries(
    //         //queryKey: ['searchShorts']
    //     )
    //     // Close modal
    //     props.onSubmitCallback(false);
    // }

    const updateShort = (data: ShortForm) => {
        const saveData = { data: data };
        if (data.id != null) {
            return putApiContent('shorts', saveData, user);
        } else {
            return postApiContent('shorts', saveData, user)
        }
    }

    const { mutate, error } = useMutation({
        mutationFn: (values: ShortForm) => updateShort(values),
        onSuccess: (data: HttpStatusResponse, variables) => {
            props.onSubmitCallback(false);

        },
        onError: (error: any) => {
            console.log(error.message);
        }
    })

    return (
        <>
            {formData ? (
                <FormObject
                    onSubmit={mutate}
                    methods={methods}
                />
            ) : <ProgressBar />
            }
        </>
    )
}

const FormObject = ({ onSubmit, methods }: FormObjectProps) => {
    const user = useMemo(() => { return getCurrenUser() }, []);
    const [typeList, setTypeList] = useState([]);
    const [genres, setGenres] = useState([]);
    const [filteredLanguages, setFilteredLanguages] = useState([]);
    const [filteredTags, setFilteredTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const required_rule: RegisterOptions = { required: "Pakollinen kenttä" };

    const disabled = isDisabled(user, loading);

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
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <div className="formgrid grid">
                        <div className="field col-12">
                            <FormInputText
                                name="title"
                                autoFocus
                                methods={methods}
                                label="Nimi"
                                rules={required_rule}
                                disabled={disabled}
                                labelClass='required-field'
                            />
                        </div>
                        <div className="field col-12">
                            <FormInputText
                                name="orig_title"
                                methods={methods}
                                label="Alkuperäinen nimi"
                                disabled={disabled}
                            />
                        </div>
                        <div className="field col-12">
                            <FormInputNumber
                                name="pubyear"
                                methods={methods}
                                label="Alkuperäinen julkaisuvuosi"
                                disabled={disabled}
                            />
                        </div>
                        <div className="field col-6">
                            <FormDropdown
                                name="type"
                                methods={methods}
                                options={typeList}
                                label="Tyyppi"
                                rules={required_rule}
                                labelClass='required-field'
                                disabled={disabled}
                                checked={false}
                            />
                        </div>
                        <div className="field col-6">
                            <FormAutoComplete
                                name="lang"
                                methods={methods}
                                label="Kieli"
                                completeMethod={filterLanguages}
                                suggestions={filteredLanguages}
                                forceSelection={false}
                                placeholder='Kieli'
                                disabled={disabled}
                            />
                        </div>
                        <div className="field col-12">
                            <FormMultiSelect
                                name="genres"
                                methods={methods}
                                label="Genret"
                                options={genres}
                                disabled={disabled}
                            />
                        </div>
                        <div className="field col-12">
                            <FormAutoComplete
                                name="tags"
                                methods={methods}
                                label="Asiasanat"
                                completeMethod={filterTags}
                                suggestions={filteredTags}
                                forceSelection={false}
                                multiple
                                placeholder='Asiasanat'
                                disabled={disabled}
                            />
                        </div>
                        <div className="field col-12 py-0">
                            <ContributorField
                                id={"contributors"}
                                disabled={disabled}
                            />
                        </div>
                        <Button type="submit" className="w-full justify-content-center">Tallenna</Button>
                    </div>
                </form>
                <DevTool control={methods.control} />
            </FormProvider>
        </div>
    )
}