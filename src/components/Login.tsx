import React, { useState } from "react";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "primereact/button";
import { login } from "../services/auth-service";
import { InputText } from "primereact/inputtext";

export const Login = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string>("");

    const initialValues: {
        username: string,
        password: string;
    } = {
        username: "",
        password: "",
    };

    const validationSchema = Yup.object().shape({
        username: Yup.string().required("Käyttäjätunnus puuttuu!"),
        password: Yup.string().required("Salasana puuttuu!"),
    });

    const handleLogin = (formValue: { username: string; password: string }) => {
        const { username, password } = formValue;

        setMessage("");
        setLoading(true);

        login(username, password).then(
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
                <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={handleLogin}
                >
                    <Form>
                        <div className="flex align-items-center justify-content-center mb-5">
                            <div className="surface-card">
                                <div className="text-center mb-5">
                                    <div className="text-900 text-3x1 font-medium mb-3">Tervetuloa</div>
                                    <span className="text-600 font-medium line-height-3">Ei tunnusta?</span>
                                    <a className="font-medium no-underline ml-2 text-blue-500 cursor-pointer">Luo tunnus!</a>
                                </div>
                                <div>
                                    <label htmlFor="username" className="block text-900 font-medium mb-3">Käyttäjätunnus</label>
                                    <InputText id="username" name="username" type="text" className="w-full mb-3" />
                                    <ErrorMessage
                                        name="username"
                                        component="div"
                                        className="alert alert-danger"
                                    />

                                    <label htmlFor="password" className="block text-900 font-medium mb-2">Salasana</label>
                                    <InputText id="password" name="password" type="password" className="w-full mb-3" />
                                    <ErrorMessage
                                        name="password"
                                        component="div"
                                        className="alert alert-danger"
                                    />
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
                    </Form>
                </Formik>
            </div>
        </div>
    );
};

export default Login;