import { IShort } from "./components/Short";
import { useEffect, useState, useRef } from "react";
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Button } from 'primereact/button';
import { getCurrenUser } from "./services/auth-service";
import { postApiContent } from "./services/user-service";
import { ProgressSpinner } from "primereact/progressspinner";
import { ShortsControl } from "./components/ShortsControl";
import { ShortsList } from './components/ShortsList';
import axios from "axios";
import { API_URL } from "./systemProps";
import _ from "lodash";
import { Toast } from 'primereact/toast';

type IFormData = {
    [index: string]: any,
    author?: string,
    title?: string,
    orig_name?: string,
    pubyear_first?: number,
    pubyear_last?: number
};

export const ShortSearch = () => {
    const user = getCurrenUser();
    const { control, handleSubmit, formState: { errors } } = useForm<IFormData>();
    const [loading, setLoading] = useState(false);
    //const [shorts, setShorts]: [IShort[], (shorts: IShort[]) => void] = useState<IShort[]>([]);
    const [shorts, setShorts]: [any, (shorts: any[]) => void] = useState<any>(null);
    // const toast: Toast | null = useRef<Toast | null>(null);

    const onSubmit: SubmitHandler<IFormData> = data => {
        function search() {
            // Make sure at least one parameter is given.
            if (Object.keys(data).length == 0 &&
                _.pickBy(data, function (param) { return data[param].length > 0 }).length == 0) {
                // if (toast !== null) {
                //     toast.show({ severity: 'warn', life: 3000 });
                //     return;
                // }
            }
            try {
                axios.post(API_URL + 'searchshorts', data)
                    .then(response => setShorts(response.data));
                // const response = postApiContent('searchshorts', data, user);
                // if (response !== undefined) {
                //     setShorts(response);
                // }
                setLoading(false);
            } catch (e) {
                console.error(e);
            }
        }
        setLoading(true);
        console.log(data);
        search();
        setLoading(false);
    }



    return (
        <main className="all-content">
            {/* <Toast ref={toast} /> */}
            {loading ?
                <div className="progressbar">
                    <ProgressSpinner />
                </div>
                : (<>
                    <div className="grid mb-4 mt-5 justify-content-center">
                        <h1 className="text-center">Novellien haku</h1>
                    </div>
                    <div className="flex justify-content-center mt-5 mb-5">
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="field">
                                <span className="p-float-label">
                                    <Controller name="author" control={control}
                                        render={({ field, fieldState }) => (
                                            <InputText id={field.name} {...field} autoFocus
                                                className={classNames({ 'p-invalid': fieldState.error })} />
                                        )} />
                                    <label htmlFor="author" className={classNames({ 'p-error': errors })}>Kirjoittaja</label>
                                </span>
                            </div>
                            <div className="field">
                                <span className="p-float-label">
                                    <Controller name="title" control={control}
                                        render={({ field, fieldState }) => (
                                            <InputText id={field.name} {...field}
                                                className={classNames({ 'p-invalid': fieldState })} />
                                        )} />
                                    <label htmlFor="title" className={classNames({ 'p-error': errors })}>Nimi</label>
                                </span>
                            </div>
                            <div className="field">
                                <span className="p-float-label">
                                    <Controller name="orig_name" control={control}
                                        render={({ field, fieldState }) => (
                                            <InputText id={field.name} {...field}
                                                className={classNames({ 'p-invalid': fieldState })} />
                                        )} />
                                    <label htmlFor="title" className={classNames({ 'p-error': errors })}>Alkukielinen nimi</label>
                                </span>
                            </div>
                            <div className="field">
                                <span className="p-float-label">
                                    <Controller name="pubyear_first" control={control}
                                        render={({ field, fieldState }) => (
                                            <InputText id={field.name} {...field}
                                                className={classNames({ 'p-invalid': fieldState })} />
                                        )} />
                                    <label htmlFor="title" className={classNames({ 'p-error': errors })}>Julkaistu aikaisintaan</label>
                                </span>
                            </div>
                            <div className="field">
                                <span className="p-float-label">
                                    <Controller name="pubyear_last" control={control}
                                        render={({ field, fieldState }) => (
                                            <InputText id={field.name} {...field}
                                                className={classNames({ 'p-invalid': fieldState })} />
                                        )} />
                                    <label htmlFor="title" className={classNames({ 'p-error': errors })}>Julkaistu viimeistään</label>
                                </span>
                            </div>
                            <Button type="submit" className="w-full justify-content-center"
                                disabled={loading}
                            >
                                Hae
                            </Button>
                        </form>
                    </div>
                    <div className="w-full">
                        {shorts && <ShortsList shorts={shorts} listPublications groupAuthors anthology />}
                    </div>
                </>)}
        </main>
    )
}
