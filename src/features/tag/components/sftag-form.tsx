import { Button } from 'primereact/button';
import { FormProvider, useForm } from "react-hook-form";
import { TagFormData, TagType } from '../types';
import { useEffect, useMemo, useState } from 'react';
import { getCurrenUser } from '@services/auth-service';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ProgressSpinner } from 'primereact/progressspinner';
import { ProgressBar } from 'primereact/progressbar';
import { HttpStatusResponse } from '@services/user-service';
import { getTagTypes } from '@api/tag/get-tag-types';
import { getTagFormData } from '@api/tag/get-tag-form-data';
import { updateTag } from '@api/tag/update-tag';
import { FormInputText } from '@components/forms/field/form-input-text';
import { FormDropdown } from '@components/forms/field/form-dropdown';
import { replyMessage } from '@components/forms/reply-message';

interface FormProps {
    tagId: number | null,
    onSubmitCallback: ((status: boolean, message: string) => void)
}

interface FormObjectProps {
    onSubmit: any
    data: TagFormData,
    types: TagType[]
}

export const SfTagForm = (props: FormProps) => {
    const user = useMemo(() => getCurrenUser(), []);
    const [types, setTypes] = useState<TagType[]>([]);

    useEffect(() => {
        async function getTypes() {
            const response = await getTagTypes(user);
            setTypes(response);
        }
        getTypes();
    }, [])

    const { isLoading, data } = useQuery({
        queryKey: ['tags', props.tagId],
        queryFn: () => getTagFormData(props.tagId, user)
    })


    const { mutate, error } = useMutation({
        mutationKey: ['tag', props.tagId],
        mutationFn: (data: any) => updateTag(data, user),
        onSuccess: (data: HttpStatusResponse, variables) => {
            props.onSubmitCallback(true, "");
        },
        onError: (error: any) => {
            const errMsg = replyMessage(error);
            props.onSubmitCallback(false, errMsg);
        }
    })

    if (isLoading) {
        return (
            <ProgressSpinner />
        )
    }

    return (
        <>
            {data ? (
                <FormObject
                    onSubmit={mutate}
                    data={data}
                    types={types}
                />
            )
                :
                <ProgressBar />
            }
        </>
    )
}

const FormObject = ({ onSubmit, data, types }: FormObjectProps) => {


    const methods = useForm<TagFormData>({ defaultValues: data });
    return (
        <div className="card mt-3">
            <FormProvider {...methods}>
                <form onSubmit={
                    methods.handleSubmit(
                        (values) => onSubmit(values, { onSuccess: () => methods.reset() }))}>
                    <div className="grid mt-3 col">
                        <FormInputText
                            name="name"
                            methods={methods}
                            label="Nimi"
                            autoFocus
                        />
                    </div>
                    <div className="grid mt-3 col">
                        <FormDropdown
                            name="type"
                            methods={methods}
                            label="Tyyppi"
                            options={types}
                        />
                    </div>
                    <div className="grid col">
                        <Button type="submit" className="w-full justify-content-center">
                            Vaihda
                        </Button>
                    </div>

                </form>
            </FormProvider>
        </div >
    )
}
