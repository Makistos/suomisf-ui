import React, { useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';

import { forgotPassword } from '@services/auth-service';

type FormData = {
    email: string
};

export const ForgotPasswordView = () => {
    const form = useForm<FormData>({ defaultValues: { email: "" } });
    const [loading, setLoading] = useState<boolean>(false);
    const [done, setDone] = useState<boolean>(false);

    const onSubmit: SubmitHandler<FormData> = (data) => {
        setLoading(true);
        // The backend always returns 200, so we show the same neutral
        // message regardless of whether the address is registered.
        forgotPassword(data.email)
            .catch(() => { /* ignore: response is intentionally opaque */ })
            .finally(() => {
                setLoading(false);
                setDone(true);
            });
    };

    return (
        <div className="col-md-12">
            <div className="card card-container">
                <div className="flex align-items-center justify-content-center mb-5">
                    <div className="surface-card" style={{ minWidth: "20rem" }}>
                        <div className="text-center mb-5">
                            <div className="text-900 text-3x1 font-medium mb-3">
                                Salasanan palautus
                            </div>
                        </div>
                        {done ? (
                            <div>
                                <p className="text-700 line-height-3">
                                    Jos antamallasi sähköpostiosoitteella on
                                    tunnus, lähetimme siihen palautuslinkin.
                                    Tarkista sähköpostisi.
                                </p>
                                <Link to={`/login`}
                                    className="font-medium no-underline text-blue-500">
                                    Takaisin kirjautumiseen
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={form.handleSubmit(onSubmit)}>
                                <p className="text-700 line-height-3 mb-3">
                                    Anna tunnuksesi sähköpostiosoite, niin
                                    lähetämme sinulle linkin salasanan
                                    vaihtamiseen.
                                </p>
                                <div className="field">
                                    <label htmlFor="email">Sähköposti</label>
                                    <Controller name="email"
                                        control={form.control}
                                        rules={{ required: true }}
                                        render={({ field, fieldState }) => (
                                            <InputText id={field.name} {...field}
                                                autoFocus type="email"
                                                className={classNames(
                                                    { 'p-invalid': fieldState.error },
                                                    "w-full mb-3")} />
                                        )} />
                                </div>
                                <Button type="submit" icon="pi pi-envelope"
                                    className="w-full" disabled={loading}>
                                    <span>Lähetä palautuslinkki</span>
                                </Button>
                                <div className="text-center mt-3">
                                    <Link to={`/login`}
                                        className="font-medium no-underline text-blue-500">
                                        Takaisin kirjautumiseen
                                    </Link>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordView;
