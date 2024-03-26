import { useMemo, useState } from "react";
import { getCurrenUser } from "../../../services/auth-service";
import { useNavigate } from "react-router-dom";
import { FormProvider, RegisterOptions, useForm } from "react-hook-form";
import { Pubseries, PubseriesFormData } from "../types";
import { HttpStatusResponse, postApiContent, putApiContent } from "../../../services/user-service";
import { useMutation } from "@tanstack/react-query";
import { ProgressSpinner } from "primereact/progressspinner";
import { FormInputText } from "../../../components/forms/field/form-input-text";
import { PublisherSelector } from "../../publisher/components/publisher-selector";
import { Button } from "primereact/button";

interface FormProps<T> {
    pubseries: T | null,
    onSubmitCallback: ((status: boolean, message: string) => void)
}

type FormObjectProps = {
    onSubmit: any,
    methods: any
}

const convToForm = (pubseries: Pubseries): PubseriesFormData => ({
    id: pubseries.id,
    name: pubseries.name,
    image_attr: pubseries.image_attr,
    image_src: pubseries.image_src,
    important: pubseries.important,
    publisher: pubseries.publisher
})

const defaultValues: PubseriesFormData = {
    id: null,
    name: '',
    image_attr: '',
    image_src: '',
    important: 0,
    publisher: null
}

export const PubseriesForm = (props: FormProps<Pubseries>) => {
    const user = useMemo(() => { return getCurrenUser() }, []);
    const formData = props.pubseries ? convToForm(props.pubseries) : defaultValues;

    const navigate = useNavigate();

    const updatePubseries = (data: PubseriesFormData) => {
        const saveData = { data: data };
        if (data.id !== null) {
            return putApiContent('pubseries', saveData, user);
        } else {
            return postApiContent('pubseries', saveData, user);
        }
    }

    const { mutate } = useMutation({
        mutationFn: (data: PubseriesFormData) => updatePubseries(data),
        onSuccess: (data: HttpStatusResponse, variables) => {
            props.onSubmitCallback(true, "");
            if (variables.id === null) {
                navigate('/pubseries/' + data.response, { replace: false })
            } else if (data.status === 200) {
            } else {
                console.log(data.response);
                if (JSON.parse(data.response).data["msg"] !== undefined) {
                    const errMsg = JSON.parse(data.response).data["msg"];
                    console.log(errMsg);
                } else {
                    console.log("Failed to save pubseries data")
                }
            }
        }
    })

    const methods = useForm<PubseriesFormData>({ defaultValues: formData });

    return <>
        {formData ? (
            <FormObject
                onSubmit={mutate}
                methods={methods}
            />
        ) :
            <ProgressSpinner />}
    </>
}

const FormObject = ({ onSubmit, methods }: FormObjectProps) => {
    const user = useMemo(() => { return getCurrenUser() }, []);

    const required_rule: RegisterOptions = { required: "Pakollinen kenttä" };
    const editor_style: React.CSSProperties = { height: '320px' };

    return (
        <div className="card mt-3">
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <div className="formgrid grid">
                        <div className="field col-12">
                            <FormInputText
                                name="name"
                                methods={methods}
                                label="Nimi"
                                autoFocus
                                rules={required_rule}
                                labelClass='required-field'
                            />
                        </div>
                        <div className="field col-12">
                            <PublisherSelector
                                name="publisher"
                                methods={methods}
                                labelClass='required-field'
                            />
                        </div>
                        <Button type="submit" className="w-full justify-content-center">Tallenna</Button>

                    </div>
                </form>
            </FormProvider>

        </div>
    )
}