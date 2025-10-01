import { getOwnership } from "@api/edition/get-ownership";
import { User } from "@features/user";
import { getCurrenUser } from "@services/auth-service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog } from "primereact/dialog";
import { Rating, RatingChangeEvent } from "primereact/rating";
import { useMemo, useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { Edition, EditionCondition, EditionOwnershipStatus } from "../types";
import { saveOwnership } from "@api/edition/save-ownership";
import { HttpStatusResponse } from "@services/user-service";
import { FormInputText } from "@components/forms/field/form-input-text";
import { Button } from "primereact/button";
import { ProgressBar } from "primereact/progressbar";
import { cond } from "lodash";
import { deleteOwnership } from "@api/edition/delete-ownership";

interface EditionOwnershipProps {
    editionId: number,
}

interface ConditionDialogProps {
    editionId: number,
    condition: EditionOwnershipStatus,
    user: User,
    save: any
}

interface OwnershipFormData {
    description: string,
    condition: number,
    editionId: number,
    userId: number
}

const defaultValues: OwnershipFormData = {
    description: "",
    condition: 0,
    editionId: 0,
    userId: 0
}

const convToFormData = (data: EditionOwnershipStatus, edition_id: number, user_id: number): OwnershipFormData => {
    return {
        description: data.description ? data.description : "",
        condition: data.condition ? data.condition.value : 0,
        editionId: data.edition_id ? data.edition_id : edition_id,
        userId: data.user_id ? data.user_id : user_id
    }
}

const EditionConditionDialog = ({ editionId, condition, user, save }: ConditionDialogProps) => {
    const formData = condition ? convToFormData(condition, editionId, user.id) : defaultValues;
    return (
        <>
            <FormObject onSubmit={save}
                data={formData}
            />
        </>
    )
}

interface FormObjectProps {
    onSubmit: any,
    data: OwnershipFormData
}

const FormObject = ({ onSubmit, data }: FormObjectProps) => {
    const methods = useForm<OwnershipFormData>({ defaultValues: data });
    return (
        <div className='card mt-3'>
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <div className="field">
                        <FormInputText
                            name="description"
                            label="Lisätietoja"
                            methods={methods}
                            autoFocus
                        />
                    </div>
                    <div style={{ display: 'none' }}>
                        <div className="field">
                            <FormInputText
                                name="condition"
                                methods={methods}
                                label=""
                            />
                            <FormInputText
                                name="edition_id"
                                methods={methods}
                                label=""
                            />
                            <FormInputText
                                name="user_id"
                                methods={methods}
                                label=""
                            />
                        </div>
                    </div>
                    <Button type="submit" className="w-full justify-content-center">Tallenna</Button>
                </form>
            </FormProvider>
        </div>
    )

}

const emptyCondition: EditionOwnershipStatus = {
    condition: null,
    description: "",
    edition_id: 0,
    user_id: null
}

export const EditionOwnership = ({ editionId }: EditionOwnershipProps) => {
    const user = useMemo(() => { return getCurrenUser() }, []);
    const [showInfoDialog, setShowInfoDialog] = useState(false);
    const [queryEnabled, setQueryEnabled] = useState(true);
    const [condition, setCondition] = useState<EditionOwnershipStatus>(
        emptyCondition
    );
    const [value, setValue] = useState(0);

    const queryClient = useQueryClient();

    if (!user) {
        return <></>
    }

    const updateStatus = (data: OwnershipFormData) => {
        const saveData: EditionOwnershipStatus = {
            condition: { value: data.condition, id: 1, name: "" },
            description: data.description,
            edition_id: editionId,
            user_id: user ? user.id : null
        }
        return saveOwnership(saveData, user);
    }

    const { mutate } = useMutation({
        mutationFn: (values: OwnershipFormData) => updateStatus(values),
        onSuccess: (data: HttpStatusResponse, variables) => {

            if (data.status === 200 || data.status === 201) {
                queryClient.invalidateQueries({ queryKey: ['edition', 'owner', editionId] });
                queryClient.invalidateQueries({ queryKey: ['edition', editionId] });
            } else {
                if (JSON.parse(data.response).data["msg"] !== undefined) {
                    const errMsg = JSON.parse(data.response).data["msg"];
                    console.log(errMsg);
                } else {
                }
            }
            onHide();
        },
        onError: (error: any) => {
            console.log(error.message);
        }

    })
    const fetchOwnership = async (id: number, user: User | null): Promise<EditionOwnershipStatus | null> => {
        if (!user) return null;
        return getOwnership(id, user);
    }

    const { isLoading, data } = useQuery({
        queryKey: ["edition", "owner", editionId],
        queryFn: () => fetchOwnership(editionId, user),
        enabled: queryEnabled
    })

    const conditionChange = (newCondition: number | null | undefined) => {
        if (newCondition) {
            setCondition({
                condition: { value: newCondition },
                description: condition.description,
                edition_id: editionId,
                user_id: user ? user.id : null
            } as EditionOwnershipStatus);
        } else {
            setCondition({
                condition: null,
                description: '',
                edition_id: editionId,
                user_id: user ? user.id : null
            });
        }
        setValue(newCondition ? newCondition : 0);
        if (!newCondition) {
            setCondition(emptyCondition);
            mutate({
                description: '',
                condition: 0,
                editionId: editionId,
                userId: user ? user.id : 0
            })

        } else {
            setShowInfoDialog(true);
        }

    }

    const showInfoDialogCb = () => {
        setShowInfoDialog(false);
    }

    const onShow = () => {
        setQueryEnabled(false);
    }

    const onHide = () => {
        setShowInfoDialog(false);
        setQueryEnabled(true);
    }

    if (isLoading || data === null || data == undefined) {
        return (
            <div>
                <Rating stars={5} />
            </div>
        )
    }
    const ratingValue = (condition: EditionCondition | null | undefined) => {
        if (condition) { return condition.value; }
        return undefined;
    }

    if (!isLoading && data && condition.condition === null) {
        setCondition(data);
    }

    return (
        <>
            <Dialog blockScroll
                visible={showInfoDialog}
                onShow={() => onShow()}
                onHide={() => onHide()}
            >
                <EditionConditionDialog editionId={editionId} condition={condition} user={user}
                    save={mutate}
                />
            </Dialog>
            <Rating value={ratingValue(data.condition)}
                title="Lisää omistettuihin kirjoihin&#013;*****: Uusi&#013;****: Erinomainen&#013;***: Hyvä&#013;**: Tyydyttävä&#013;*Kehno"
                stars={5}
                onChange={(e: RatingChangeEvent) => conditionChange(e.value)}
                style={{ display: 'inline-block', marginLeft: '0.5rem' }}
            />
        </>
    )
}
