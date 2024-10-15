import { getIssue } from "@api/issue/get-issue"
import { saveIssue } from "@api/issue/save-issue"
import { replyMessage } from "@components/forms/reply-message"
import { getCurrenUser } from "@services/auth-service"
import { HttpStatusResponse, putApiContent } from "@services/user-service"
import { useMutation, useQuery } from "@tanstack/react-query"
import { ProgressSpinner } from "primereact/progressspinner"
import { RefObject, useEffect, useMemo, useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { Issue, IssueFormData } from "../types"
import { FormInputNumber } from "@components/forms/field/form-input-number"
import { FormMultiSelect } from "@components/forms/field/form-multi-select"
import { FormInputText } from "@components/forms/field/form-input-text"
import { FormEditor } from "@components/forms/field/form-editor"
import { FormDropdown } from "@components/forms/field/form-dropdown"
import { FormAutoComplete } from "@components/forms/field/form-auto-complete"
import { ProgressBar } from "primereact/progressbar"
import { Button } from "primereact/button"
import { getPublicationSizes } from "@api/issue/get-publication-sizes"
import { PublicationSize } from "@features/issue"
import { filterPeople } from "@api/people/filter-people"
import { Toast } from "primereact/toast"

interface IssueFormProps {
    issueid: number | null,
    magazineid: number,
    onSubmitCallback: ((status: boolean, message: string) => void)
}

interface FormObjectProps {
    onSubmit: any,
    sizes: PublicationSize[],
    data: IssueFormData
}

const convToForm = (issue: Issue): IssueFormData => ({
    id: issue.id,
    type: issue.type,
    number: issue.number,
    number_extra: issue.number_extra,
    count: issue.count,
    year: issue.year,
    cover_number: issue.cover_number,
    publisher_id: issue.publisher_id,
    pages: issue.pages,
    size: issue.size,
    link: issue.link,
    notes: issue.notes,
    title: issue.title,
    editors: issue.editors,
    magazine_id: issue.magazine_id
})

export const IssueForm = (props: IssueFormProps) => {
    const user = useMemo(() => getCurrenUser(), []);
    const [queryEnabled, setQueryEnabled] = useState(true);
    const [sizes, setSizes] = useState<PublicationSize[]>([]);

    const defaultValues: IssueFormData = {
        id: null,
        type: 1,
        number: 0,
        number_extra: "",
        count: 0,
        year: 0,
        cover_number: "",
        publisher_id: 0,
        pages: 0,
        size: null,
        link: '',
        notes: '',
        title: '',
        editors: [],
        magazine_id: props.magazineid
    }

    useEffect(() => {
        async function getSizes() {
            const response = await getPublicationSizes(user);
            setSizes(response);
        }
        getSizes();
    }, [])

    const fetchIssue = async (id: number | null) => {
        if (id === null) {
            return defaultValues;
        }
        const issue = await getIssue(id, user);
        return convToForm(issue);
    }

    const { isLoading, data } = useQuery({
        queryKey: ['magazine', props.issueid, "form"],
        queryFn: () => fetchIssue(props.issueid),
        enabled: queryEnabled
    })

    const { mutate } = useMutation({
        mutationFn: (values: IssueFormData) => saveIssue(values, user),
        onSuccess: (retval: HttpStatusResponse, variables) => {
            props.onSubmitCallback(true, "");
            if (variables.id === null) {
            } else if (retval.status === 200 || retval.status === 201) {
                props.onSubmitCallback(true, "");
            } else {
                console.log(retval.response);
                if (JSON.parse(retval.response).data["msg"] !== undefined) {
                    const errMsg = JSON.parse(retval.response).data["msg"];
                    console.log(errMsg);
                } else {
                    console.log("Failed to save issue data")
                }
                props.onSubmitCallback(false, replyMessage(data));
            }
        },
        onError: (error: any) => {
            const errMsg = replyMessage(error);
            props.onSubmitCallback(false, errMsg);
        }
    })

    return (
        <>
            {(!data || data === undefined || isLoading) ?
                <ProgressSpinner />
                :
                <FormObject
                    onSubmit={mutate}
                    sizes={sizes}
                    data={data}
                />
            }
        </>
    )
}

const FormObject = ({ onSubmit, data, sizes }: FormObjectProps) => {
    const user = useMemo(() => getCurrenUser(), []);
    const [filteredPeople, setFilteredPeople] = useState<any[]>([]);
    const editor_style: React.CSSProperties = { height: '320px' };

    const methods = useForm<IssueFormData>({ defaultValues: data });

    const filter = async (event: any) => {
        const response = await filterPeople(event.query, user);
        setFilteredPeople(response);
    }

    return (
        <div className="card mt-3">
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <div className="formgrid grid">
                        <div className="field col-12">
                            <FormInputText
                                name="title"
                                methods={methods}
                                label="Otsikko"
                            />
                        </div>
                        <div className="field col-6 lg:col-2">
                            <FormInputNumber
                                name="number"
                                methods={methods}
                                label="Numero"
                                autoFocus
                            />
                        </div>
                        <div className="field col-6 lg:col-2">
                            <FormInputText
                                name="number_extra"
                                methods={methods}
                                label="Numeron tarkenne"
                            />
                        </div>
                        <div className="field col-6 lg:col-3">
                            <FormInputText
                                name="cover_number"
                                methods={methods}
                                label="Numero kannessa"
                            />
                        </div>
                        <div className="field col-6 lg:col-2">
                            <FormInputNumber
                                name="count"
                                methods={methods}
                                label="Juokseva numero"
                            />
                        </div>
                        <div className="field col-6 lg:col-3">
                            <FormInputNumber
                                name="year"
                                methods={methods}
                                label="Vuosi"
                            />
                        </div>
                        <div className="field col-12">
                            <FormAutoComplete
                                name="editors"
                                methods={methods}
                                multiple
                                completeMethod={filter}
                                suggestions={filteredPeople}
                                label="Päätoimittajat"
                            />
                        </div>
                        <div className="field col-6">
                            <FormInputNumber
                                name="pages"
                                methods={methods}
                                label="Sivuja"
                            />
                        </div>
                        <div className="field col-6">
                            <FormDropdown
                                name="size"
                                methods={methods}
                                label="Koko"
                                options={sizes}
                            />
                        </div>
                        <div className="field col-12">
                            <FormInputText
                                name="link"
                                methods={methods}
                                label="Linkki"
                            />
                        </div>
                        <div className="field col-12">
                            <b>Kommentit</b>
                            <FormEditor
                                name="notes"
                                methods={methods}
                                style={editor_style}
                                disabled={false}
                            />
                        </div>
                        <FormInputNumber
                            type="hidden"
                            name="magazine_id"
                            methods={methods}
                        />
                        <Button type="submit" className="w-full justify-content-center">
                            Tallenna
                        </Button>
                    </div>
                </form>
            </FormProvider>
        </div >
    )
}
