import { useEffect, useState, useMemo, useRef } from 'react';

import { useForm, RegisterOptions, FormProvider } from 'react-hook-form';
import { Button } from 'primereact/button';
import { confirmPopup, ConfirmPopup } from 'primereact/confirmpopup';
import { Toast } from 'primereact/toast';
import { ProgressBar } from 'primereact/progressbar';
import { useQueryClient, useMutation } from '@tanstack/react-query';

import { Short } from "../types";
import { HttpStatusResponse, getApiContent, postApiContent, putApiContent } from '../../../services/user-service';
import { getCurrenUser } from '../../../services/auth-service';
import { ShortForm } from '../types';
import { isDisabled } from '../../../components/forms/forms';
import { makeBriefContributor } from '../../../components/forms/makeBriefContributor';
import { FormInputNumber } from '../../../components/forms/field/form-input-number';
import { FormInputText } from '../../../components/forms/field/form-input-text';
import { FormDropdown } from '../../../components/forms/field/form-dropdown';
import { FormAutoComplete } from '../../../components/forms/field/form-auto-complete';
import { FormMultiSelect } from '../../../components/forms/field/form-multi-select';
import { ContributorField } from '../../../components/forms/contributor-field';
import { deleteApiContent } from '../../../services/user-service';
import { Contribution } from '../../../types/contribution';
import { emptyContributor } from '../../../components/forms/contributor-field';
import { removeDuplicateContributions } from '../../../utils';
import { useNavigate } from 'react-router-dom';

// import { shortIsSf } from '../utils';

// type ShortFormType = Pick<Short, "id">

interface ShortFormProps {
    short: Short | null,
    onSubmitCallback: ((id: string, state: boolean) => void),
    onClose: () => void,
    onDelete: () => void
}

type FormObjectProps = {
    onSubmit: any;
    onClose: any;
    onDelete: any;
    methods: any;
    id: number | null | undefined;
}

export const ShortsForm = (props: ShortFormProps) => {
    const user = useMemo(() => { return getCurrenUser() }, []);
    let contributors: Contribution[] = [];

    if (props.short) {
        contributors = removeDuplicateContributions(props.short.contributors);
    }
    if (contributors.length === 0) {
        contributors = [emptyContributor];
    }
    const convToForm = (short: Short): ShortForm => ({
        id: short.id,
        title: short.title,
        orig_title: short.orig_title,
        lang: short.lang,
        pubyear: short.pubyear,
        type: short.type,
        genres: short.genres,
        contributors: makeBriefContributor(contributors),
        tags: short.tags
    });

    const defaultValues: ShortForm = {
        id: null,
        title: '',
        orig_title: '',
        lang: null,
        pubyear: "",
        type: null,
        genres: [],
        contributors: contributors,
        tags: []
    }
    const formData = props.short ? convToForm(props.short) : defaultValues;

    const methods = useForm<ShortForm>({ defaultValues: formData });

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
            const id = data.response;
            props.onSubmitCallback(id, false);

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
                    onClose={props.onClose}
                    onDelete={props.onDelete}
                    methods={methods}
                    id={props.short?.id}
                />
            ) : <ProgressBar />
            }
        </>
    )
}

const FormObject = ({ onSubmit, onClose, onDelete, methods, id }: FormObjectProps) => {
    const user = useMemo(() => { return getCurrenUser() }, []);
    const [typeList, setTypeList] = useState([]);
    const [genres, setGenres] = useState([]);
    const [filteredLanguages, setFilteredLanguages] = useState([]);
    const [filteredTags, setFilteredTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const required_rule: RegisterOptions = { required: "Pakollinen kenttä" };
    const toast = useRef<Toast>(null);
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

    const deleteShort = async (id: number) => {
        setLoading(true);
        if (id !== null) {
            await deleteApiContent("shorts/" + id).then(
                response => {
                    if (response.status === 200) {
                        toast.current?.show(
                            {
                                severity: 'success',
                                summary: 'Novelli poistettu'
                            });
                    } else {
                        toast.current?.show(
                            {
                                severity: 'error',
                                summary: 'Novellia ei poistettu',
                                detail: response.response,
                                sticky: true
                            });
                    }
                });
        }
    }

    const confirmShortDelete = (event: any) => {
        confirmPopup({
            target: event.currentTarget,
            message: "Haluatko varmasti poistaa novellin?",
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: () => {
                if (id) {
                    deleteShort(id);
                    setLoading(false);
                    onDelete();
                }
            },
            reject: () => {
                toast.current?.show({
                    severity: 'info',
                    summary: 'Novellia ei poistettu'
                });
            }
        })
    }

    return (
        <div className="card mt-3">
            {loading ?
                <ProgressBar />
                :
                <FormProvider {...methods}>
                    <form onSubmit={methods.handleSubmit(onSubmit)}>
                        <Toast ref={toast} />
                        <ConfirmPopup />
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
                                    // forceSelection={false}
                                    placeholder='Kieli'
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
                                    multiple={true}
                                    placeholder='Asiasanat'
                                    disabled={disabled}
                                />
                            </div>
                            <div className="field col-12 py-0">
                                <ContributorField
                                    id={"contributors"}
                                    disabled={disabled}
                                    contributionTarget="short"
                                />
                            </div>
                            <div className="field col-10">
                                <Button type="submit" className="w-full justify-content-center">Tallenna</Button>
                            </div>
                            <div className="field col-2">
                                <Button
                                    type="button"
                                    label="Poista"
                                    icon="pi pi-trash"
                                    severity="danger"
                                    className="w-full justify-content-center"
                                    onClick={confirmShortDelete}
                                    disabled={disabled || !id}
                                />
                            </div>
                        </div>
                    </form>
                    {/* <DevTool control={methods.control} /> */}
                </FormProvider>
            }
        </div>
    )
}