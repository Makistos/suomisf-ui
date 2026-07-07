import React, { useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';

import { resetPassword } from '@services/auth-service';

type FormData = {
    password: string,
    password2: string
};

export const ResetPasswordView = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') ?? '';
    const form = useForm<FormData>({
        defaultValues: { password: "", password2: "" }
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string>("");
    const [done, setDone] = useState<boolean>(false);

    const onSubmit: SubmitHandler<FormData> = (data) => {
        setLoading(true);
        setMessage("");
        resetPassword(token, data.password)
            .then(() => setDone(true))
            .catch((error) => {
                setMessage(error?.response?.data?.msg
                    ?? "Salasanan vaihto epäonnistui.");
            })
            .finally(() => setLoading(false));
    };

    return (
        <div className="col-md-12">
            <div className="card card-container">
                <div className="flex align-items-center justify-content-center mb-5">
                    <div className="surface-card" style={{ minWidth: "20rem" }}>
                        <div className="text-center mb-5">
                            <div className="text-900 text-3x1 font-medium mb-3">
                                Aseta uusi salasana
                            </div>
                        </div>
                        {!token ? (
                            <p className="text-700 line-height-3">
                                Palautuslinkki puuttuu tai on virheellinen.
                                Pyydä uusi linkki{' '}
                                <Link to={`/forgot-password`}
                                    className="text-blue-500 no-underline">
                                    tästä
                                </Link>.
                            </p>
                        ) : done ? (
                            <div>
                                <p className="text-700 line-height-3">
                                    Salasanasi on vaihdettu. Voit nyt kirjautua
                                    sisään uudella salasanalla.
                                </p>
                                <Link to={`/login`}
                                    className="font-medium no-underline text-blue-500">
                                    Kirjaudu sisään
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={form.handleSubmit(onSubmit)}>
                                <div className="field">
                                    <label htmlFor="password">
                                        Uusi salasana
                                    </label>
                                    <Controller name="password"
                                        control={form.control}
                                        rules={{
                                            required: "Salasana on pakollinen",
                                            minLength: {
                                                value: 6,
                                                message: "Vähintään 6 merkkiä"
                                            }
                                        }}
                                        render={({ field, fieldState }) => (
                                            <InputText id={field.name} {...field}
                                                autoFocus type="password"
                                                className={classNames(
                                                    { 'p-invalid': fieldState.error },
                                                    "w-full mb-3")} />
                                        )} />
                                </div>
                                <div className="field">
                                    <label htmlFor="password2">
                                        Salasana uudestaan
                                    </label>
                                    <Controller name="password2"
                                        control={form.control}
                                        rules={{
                                            required: "Salasana on pakollinen",
                                            validate: (value) =>
                                                value === form.getValues('password')
                                                || "Salasanat eivät täsmää"
                                        }}
                                        render={({ field, fieldState }) => (
                                            <InputText id={field.name} {...field}
                                                type="password"
                                                className={classNames(
                                                    { 'p-invalid': fieldState.error },
                                                    "w-full mb-3")} />
                                        )} />
                                </div>
                                <Button type="submit" icon="pi pi-check"
                                    className="w-full" disabled={loading}>
                                    <span>Vaihda salasana</span>
                                </Button>
                            </form>
                        )}
                        {message && (
                            <div className="alert alert-danger mt-3" role="alert">
                                {message}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordView;
