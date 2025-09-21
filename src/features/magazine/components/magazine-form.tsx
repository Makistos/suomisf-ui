import { getCurrenUser } from "@services/auth-service";
import { useEffect, useMemo, useState } from "react"
import { Magazine, MagazineFormData } from "../types";
import { FormProvider, RegisterOptions, useForm } from "react-hook-form";
import { FormInputText } from "@components/forms/field/form-input-text";
import { PublisherSelector } from "@features/publisher/components/publisher-selector";
import { FormEditor } from "@components/forms/field/form-editor";
import { FormDropdown } from "@components/forms/field/form-dropdown";
import { getMagazine } from "@api/magazine/get-magazine";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ProgressSpinner } from "primereact/progressspinner";
import { getApiContent, HttpStatusResponse, postApiContent, putApiContent } from "@services/user-service";
import { Button } from "primereact/button";
import { replyMessage } from "@components/forms/reply-message";
import { useNavigate } from 'react-router-dom';

interface MagazineFormProps {
    id: string | null,
    onSubmitCallback: ((status: boolean, message: string) => void)
}

interface FormObjectProps {
    onSubmit: any,
    data: MagazineFormData,
    types: any
}

const convToForm = (magazine: Magazine | null): MagazineFormData => ({
    id: magazine?.id ?? null,
    name: magazine?.name ?? "",
    publisher: magazine?.publisher ?? null,
    description: magazine?.description ?? "",
    link: magazine?.link ?? "",
    issn: magazine?.issn ?? "",
    type: magazine?.type ?? { id: 1, name: "Fanzine" },
    tags: [],
})

export const MagazineForm = ({ id, onSubmitCallback }: MagazineFormProps) => {
    const user = useMemo(() => getCurrenUser(), []);
    const [typeList, setTypeList] = useState<any[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const getTypes = async () => {
            const url = "magazinetypes";
            const response = await getApiContent(url, user);
            setTypeList(response.data);
        }
        getTypes();
    }, [id])

    const defaultValues: MagazineFormData = {
        id: null,
        name: '',
        publisher: null,
        description: '',
        link: '',
        issn: '',
        type: { id: 1, name: "Fanzine" },
        tags: [],
    }

    const updateMagazine = (data: MagazineFormData) => {
        let reval = null;
        const saveData = { data: data };
        if (data.id !== null) {
            reval = putApiContent("magazines", saveData, user);
        } else {
            reval = postApiContent("magazines", saveData, user);
        }
        return reval;
    }

    const { mutate, error } = useMutation({
        mutationFn: (data: MagazineFormData) => updateMagazine(data),
        onSuccess: (data: HttpStatusResponse, variables) => {
            onSubmitCallback(true, "");
            if (variables.id === null) {
                navigate("/magazines/" + data.response, { replace: false });
            } else if (data.status === 200) {

            } else {
                if (JSON.parse(data.response).data["msg"] !== undefined) {
                    const errMsg = JSON.parse(data.response).data["msg"];
                    console.log(errMsg);
                } else {

                }
            }
        },
        onError: (error: any) => {
            const errMsg = replyMessage(error);
            onSubmitCallback(false, errMsg);
        }
    })
    const fetchMagazine = async (magazineId: string | null) => {
        if (!magazineId) { return defaultValues; }
        const magazine = await getMagazine(magazineId.toString(), user);
        return convToForm(magazine);
    }

    const { isLoading, data } = useQuery({
        queryKey: ['magazine', id],
        queryFn: () => fetchMagazine(id),

    })

    return (
        <>
            {(!data || data === undefined || isLoading) ?
                <ProgressSpinner />
                :
                <FormObject
                    onSubmit={mutate}
                    data={data}
                    types={typeList}
                />
            }
        </>
    )
}

const FormObject = ({ onSubmit, data, types }: FormObjectProps) => {
    const user = useMemo(() => getCurrenUser(), []);
    const editor_style: React.CSSProperties = { height: '320px' };
    const methods = useForm<MagazineFormData>({ defaultValues: data });
    const required_rule: RegisterOptions = { required: "Pakollinen kenttä" };
    const [filteredTags, setFilteredTags] = useState([]);

    async function filterTags(event: any) {
        const url = "filter/tags/" + event.query;
        const response = await getApiContent(url, user);
        setFilteredTags(response.data);
    }

    // const addNewTag = (data: any) => {
    //     console.log(data);
    // }

    // const typeTemplate = (option: any) => {
    //     if (option) {
    //         return (
    //             <div className="flex align-items-center">
    //                 <div>{types[option.value].name}</div>
    //             </div>
    //         )
    //     }
    // }
    return (
        <div className="card mt-3">
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <div className="formgrid grid">
                        <div className="field col-12">
                            <FormInputText
                                name="name"
                                label="Nimi"
                                methods={methods}
                                autoFocus
                                rules={required_rule}
                                labelClass='required-field'
                            />
                        </div>
                        <div className="field col-12">
                            <PublisherSelector
                                name="publisher"
                                methods={methods}
                            />
                        </div>
                        <div className="field col-12">
                            <FormDropdown
                                name="type"
                                // itemTemplate={typeTemplate}
                                methods={methods}
                                options={types}
                                label="Tyyppi"
                                rules={required_rule}
                                labelClass='required-field'
                                disabled={false}
                                checked={true}
                            />
                        </div>
                        <div className="field col-12">
                            <FormInputText
                                name="link"
                                label="Linkki"
                                methods={methods}
                            />
                        </div>
                        <div className="field col-12">
                            <FormInputText
                                name="issn"
                                label="ISSN"
                                methods={methods}
                            />
                        </div>
                        <div className="field col-12">
                            <FormEditor
                                name="description"
                                methods={methods}
                                disabled={false}
                                style={editor_style}
                            />
                        </div>
                        {/* <div className="field col-12">
                            <FormTagAutoComplete
                                name="tags"
                                methods={methods}
                                label="Asiasanat"
                                completeMethod={filterTags}
                                suggestions={filteredTags}
                                forceSelection={false}
                                tagFunction={addNewTag}
                                multiple
                                placeholder="Asiasanat"
                                disabled={false}
                            />
                        </div> */}
                        <Button type="submit" disabled={false} className="w-full justify-content-center">Tallenna</Button>
                    </div>
                </form>
            </FormProvider>
        </div>
    )
}