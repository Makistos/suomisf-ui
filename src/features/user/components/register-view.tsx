import { register } from '@services/auth-service';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import React, { useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

type FormData = {
    username: string,
    password: string,
    password2: string
}
const defaultValues: FormData = {
    username: "",
    password: "",
    password2: ""
};

export const RegisterView = () => {
    const form = useForm<FormData>({ defaultValues: defaultValues });
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string>("");

    const onSubmit: SubmitHandler<FormData> = (data) => {
        console.log(data);
        setLoading(true);
        register(data.username, data.password).then(
            () => {
                window.location.reload();
            }
        ).catch((error) => {
            const resMessage = error.response.data.msg;
            setLoading(false);
            setMessage(resMessage);
        }
        );
    };

    return (
        <div className="col-md-12">
            <div className="card card-container">
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="flex align-items-center justify-content-center mb-5">
                        <div className="surface-card">
                            <div className="text-center mb-5">
                                <div className="text-900 text-3x1 font-medium mb-3">Rekisteröidy</div>
                            </div>
                            <div>
                                <div className="field">
                                    <span>
                                        <label htmlFor="username">Käyttäjätunnus</label>
                                        <Controller name="username" control={form.control}
                                            render={({ field, fieldState }) => (
                                                <InputText
                                                    id={field.name} {...field} autoFocus
                                                    {...form.register("username", { required: true })}
                                                    className={classNames({ 'p-invalid': fieldState.error },
                                                        "w-full mb-3")}
                                                />
                                            )} />
                                    </span>
                                </div>
                                <div className="field">
                                    <span>
                                        <label htmlFor="password">Salasana</label>
                                        <Controller name="password" control={form.control}
                                            rules={{ required: "Salasana on pakollinen" }}
                                            render={({ field, fieldState }) => (
                                                <InputText
                                                    id={field.name} {...field}
                                                    {...form.register("password", { required: true })}
                                                    type="password"
                                                    className={classNames({ 'p-invalid': fieldState.error },
                                                        "w-full mb-3")}
                                                />
                                            )} />
                                    </span>
                                </div>
                                <div className="field">
                                    <span>
                                        <label htmlFor="password2">Salasana uudestaan</label>
                                        <Controller name="password2" control={form.control}
                                            rules={{
                                                required: "Salasana on pakollinen",
                                                validate: (value) => value === form.getValues('password')
                                            }}
                                            render={({ field, fieldState }) => (
                                                <InputText
                                                    id={field.name} {...field}
                                                    {...form.register("password2", { required: true })}
                                                    type="password"
                                                    className={classNames({ 'p-invalid': fieldState.error },
                                                        "w-full mb-3")}
                                                />
                                            )} />
                                    </span>
                                </div>
                                <Button type="submit" icon="pi pi-user" className="w-full" disabled={loading}>
                                    {loading && (
                                        <span className="spinner-border spinner-border-sm"></span>
                                    )}
                                    <span>Luo tunnus</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                    {message && (
                        <div className="form-group">
                            <div className="alert alert-danger" role="alert">
                                {message}
                            </div>
                        </div>
                    )}
                </form>
            </div>

        </div>
    );
}
