import { useMemo, useRef } from 'react';
import { useForm, FormProvider, RegisterOptions } from 'react-hook-form';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Award, AwardFormData } from '../types';
import { getCurrenUser } from '../../../services/auth-service';
import { putApiContent, HttpStatusResponse } from '../../../services/user-service';
import { isDisabled } from '../../../components/forms/forms';
import { FormInputText } from '../../../components/forms/field/form-input-text';
import { FormEditor } from '../../../components/forms/field/form-editor';
import { FormCheckbox } from '../../../components/forms/field/form-checkbox';
import { LinksField } from '../../../components/forms/links-field';

interface AwardFormProps {
    award: Award;
    onClose: () => void;
}

export const AwardForm = ({ award, onClose }: AwardFormProps) => {
    const user = useMemo(() => getCurrenUser(), []);
    const toast = useRef<Toast>(null);
    const queryClient = useQueryClient();
    const required_rule: RegisterOptions = { required: "Pakollinen kenttä" };

    const convToForm = (a: Award): AwardFormData => ({
        id: a.id,
        name: a.name,
        description: a.description ?? '',
        domestic: a.domestic,
        links: a.links && a.links.length > 0 ? a.links : [{ link: '', description: '' }],
    });

    const methods = useForm<AwardFormData>({ defaultValues: convToForm(award) });
    const disabled = isDisabled(user, methods.formState.isSubmitting);

    const { mutate } = useMutation({
        mutationFn: (data: AwardFormData) => putApiContent('awards', { data }, user),
        onSuccess: (response: HttpStatusResponse) => {
            if (response.status === 200) {
                queryClient.invalidateQueries({ queryKey: ['award', award.id.toString()] });
                toast.current?.show({ severity: 'success', summary: 'Tallennettu' });
                onClose();
            } else {
                toast.current?.show({ severity: 'error', summary: 'Tallennus epäonnistui', detail: response.response, sticky: true });
            }
        },
        onError: (error: any) => {
            toast.current?.show({ severity: 'error', summary: 'Tallennus epäonnistui', detail: error.message, sticky: true });
        }
    });

    return (
        <div className="card mt-3">
            <Toast ref={toast} />
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit((data) => mutate(data))}>
                    <div className="formgrid grid">
                        <div className="field col-12">
                            <FormInputText
                                name="name"
                                methods={methods}
                                label="Nimi"
                                rules={required_rule}
                                labelClass="required-field"
                                disabled={disabled}
                                autoFocus
                            />
                        </div>
                        <div className="field col-12">
                            <b>Kuvaus</b>
                            <FormEditor
                                name="description"
                                methods={methods}
                                style={{ height: '150px' }}
                                disabled={disabled}
                            />
                        </div>
                        <div className="field col-12 flex align-items-center gap-2">
                            <FormCheckbox
                                name="domestic"
                                methods={methods}
                                label="Kotimainen"
                                disabled={disabled}
                                checked={false}
                            />
                        </div>
                        <div className="field col-12">
                            <LinksField id="links" disabled={disabled} />
                        </div>
                        <div className="field col-12">
                            <Button type="submit" label="Tallenna" className="w-full justify-content-center" />
                        </div>
                    </div>
                </form>
            </FormProvider>
        </div>
    );
};
