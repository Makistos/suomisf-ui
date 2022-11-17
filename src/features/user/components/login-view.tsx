import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Controller, SubmitHandler, useForm } from 'react-hook-form';

import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { classNames } from "primereact/utils";

import { login } from "../../../services/auth-service";

type FormData = {
    username: string,
    password: string
}

const defaultValues: FormData = {
    username: "",
    password: "",
};

export const LoginView = () => {
    //const { control, handleSubmit, formState: { errors } } = useForm<IFormData>({ defaultValues: defaultValues });
    const form = useForm<FormData>({ defaultValues: defaultValues });
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string>("");


    const onSubmit: SubmitHandler<FormData> = (data) => {

        setMessage("");
        setLoading(true);

        login(data.username, data.password).then(
            () => {
                //history.push("/profile");
                window.location.reload();
            },
            (error) => {
                const resMessage =
                    (error.response &&
                        error.response.data &&
                        error.response.data.message) ||
                    error.message ||
                    error.toString();

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
                                <div className="text-900 text-3x1 font-medium mb-3">Tervetuloa</div>
                                <span className="text-600 font-medium line-height-3">Ei tunnusta?</span>
                                <Link to={`/register`} className="font-medium no-underline ml-2 text-blue-500 cursor-pointer">Luo tunnus!</Link>
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
                                <Button type="submit" icon="pi pi-user" className="w-full" disabled={loading}>
                                    {loading && (
                                        <span className="spinner-border spinner-border-sm"></span>
                                    )}
                                    <span>Kirjaudu</span>
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
};


export default LoginView;