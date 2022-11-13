import { useEffect, useState } from "react";
import { getCurrenUser } from "./services/auth-service";
import { ProgressSpinner } from "primereact/progressspinner";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { classNames } from "primereact/utils";
import { Button } from 'primereact/button';
import { Fieldset } from 'primereact/fieldset';
import { Dropdown } from "primereact/dropdown";
import { IGenre, getGenreIcon } from "./components/Genre";
import { getApiContent } from "./services/user-service";
import { ICountry } from "./components/Country";
import { IBookType } from "./components/BookType";
import axios from "axios";
import { API_URL } from "./systemProps";
import { WorkList } from "./feature/Work/WorkList";
import { Divider } from 'primereact/divider';
import _ from "lodash";

type IFormData = {
    [index: string]: any,
    author?: string,
    title?: string,
    orig_title?: string,
    pubyear_first?: number,
    pubyear_last?: number,
    printyear_first?: number,
    printyear_last?: number,
    genre?: number,
    nationality?: number,
    type?: number
};

export const BookSearch = () => {
    const user = getCurrenUser();
    const { control, handleSubmit, formState: { errors } } = useForm<IFormData>();
    const [loading, setLoading] = useState(false);
    const [works, setWorks]: [any, (books: any[]) => void] = useState<any>(null);
    const [genres, setGenres]: [IGenre[], (genres: IGenre[]) => void] = useState<IGenre[]>([]);
    const [nationalities, setNationalities]: [ICountry[], (nationalities: ICountry[]) => void] = useState<ICountry[]>([]);
    const [bookTypes, setBookTypes]: [IBookType[], (bookTypes: IBookType[]) => void] = useState<IBookType[]>([]);
    const [initials, setInitials]: [string[], (initialis: string[]) => void] = useState<string[]>([]);
    const [initial, setInitial] = useState("");

    const onSubmit: SubmitHandler<IFormData> = data => {
        function search() {
            if (Object.keys(data).length === 0 &&
                _.pickBy(data, function (param) { return data[param].length > 0 }).length === 0) {
                return;
            }
            setLoading(true);
            try {
                axios.post(API_URL + 'searchworks', data)
                    .then(response => setWorks(response.data));
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        }
        console.log(data);
        search();
        setInitial("");
    }

    useEffect(() => {
        async function getGenres() {
            try {
                const response = await getApiContent('genres', user);
                setGenres(response.data);
            } catch (e) {
                console.error(e);
            }
        }
        async function getNationalities() {
            try {
                const response = await getApiContent('countries', user);
                setNationalities(response.data);
            } catch (e) {
                console.error(e);
            }
        }
        async function getBookTypes() {
            try {
                const response = await getApiContent('worktypes', user);
                setBookTypes(response.data);
            } catch (e) {
                console.error(e);
            }
        }
        async function getInitials() {
            const data: Record<string, string> = {};
            data['target'] = 'works';
            try {
                /*axios.post(API_URL + 'firstlettervector', data)
                    .then(response => setInitials(response.data.split()));*/
                const response = await getApiContent('firstlettervector/works', user);
                const data: Record<string, number> = response.data;
                if (data) {
                    setInitials(Object.keys(data));
                }
            } catch (e) {
                console.error(e);
            }
        }
        getGenres();
        getNationalities();
        getBookTypes();
        getInitials();

    }, [user])

    const genreOptionTemplate = (option: any) => {
        return (
            <div>
                <i className={getGenreIcon(option.name)}></i> {option.name}
            </div>
        )
    }

    const worksByAuthor = (letter: string) => {
        const url = 'worksbyinitial/' + letter;
        async function getWorksByAuthor() {
            setLoading(true);
            try {
                const response = await getApiContent(url, user);
                setWorks(response.data);
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        }
        getWorksByAuthor();
        setInitial(letter);
    }

    return (
        <main className="all-content">
            <div className="grid  col-12 mt-5 justify-content-center">
                <h1 className="text-center">Kirjatietokanta</h1>
            </div>
            <div className="grid mb-5 justify-content-center">{initials && initials.length > 0 &&
                initials.map(letter => (
                    <Button label={letter} key={letter} onClick={() => worksByAuthor(letter)}
                        className={letter === initial ? "m-0 p-0 initialsbutton" : "m-0 p-0 p-button-link initialsbutton"} />
                ))
            }
            </div>
            <div>
                <Fieldset legend="Hakuehdot" toggleable collapsed={true}>
                    <div className="grid col justify-content-center">
                        <form className="col-12" onSubmit={handleSubmit(onSubmit)}>
                            <div className="grid">
                                <div className="field grid md:col-4 sm:col-12">
                                    <span className="p-float-label col">
                                        <Controller name="author" control={control}
                                            render={({ field, fieldState }) => (
                                                <InputText id={field.name} {...field}
                                                    className={classNames({ 'p-invalid': fieldState.error }, 'w-full')} />
                                            )} />
                                        <label htmlFor="author" className={classNames({ 'p-error': errors })}>Kirjoittaja</label>
                                    </span>
                                </div>
                                <div className="field grid md:col-4 sm:col-12">
                                    <span className="p-float-label col">
                                        <Controller name="title" control={control}
                                            render={({ field, fieldState }) => (
                                                <InputText id={field.name} {...field}
                                                    className={classNames({ 'p-invalid': fieldState }, 'w-full')} />
                                            )} />
                                        <label htmlFor="title" className={classNames({ 'p-error': errors })}>Nimi</label>
                                    </span>
                                </div>
                                <div className="field grid md:col-4 sm:col-12">
                                    <span className="p-float-label col">
                                        <Controller name="orig_name" control={control}
                                            render={({ field, fieldState }) => (
                                                <InputText id={field.name} {...field}
                                                    className={classNames({ 'p-invalid': fieldState }, 'w-full')} />
                                            )} />
                                        <label htmlFor="title" className={classNames({ 'p-error': errors })}>Alkukielinen nimi</label>
                                    </span>
                                </div>
                            </div>
                            <div className="grid">
                                <div className="field grid md:col-6 sm:col-12">
                                    <span className="p-float-label col">
                                        <Controller name="pubyear_first" control={control}
                                            render={({ field, fieldState }) => (
                                                <InputText id={field.name} {...field}
                                                    className={classNames({ 'p-invalid': fieldState }, 'w-full')} />
                                            )} />
                                        <label htmlFor="title" className={classNames({ 'p-error': errors })}>Julkaistu aikaisintaan</label>
                                    </span>
                                </div>
                                <div className="field grid  md:col-6 sm:col-12">
                                    <span className="p-float-label col">
                                        <Controller name="pubyear_last" control={control}
                                            render={({ field, fieldState }) => (
                                                <InputText id={field.name} {...field}
                                                    className={classNames({ 'p-invalid': fieldState }, 'w-full')} />
                                            )} />
                                        <label htmlFor="title" className={classNames({ 'p-error': errors })}>Julkaistu viimeistään</label>
                                    </span>
                                </div>
                            </div>
                            <div className="grid">
                                <div className="field grid md:col-6 sm:col-12">
                                    <span className="p-float-label col">
                                        <Controller name="printyear_first" control={control}
                                            render={({ field, fieldState }) => (
                                                <InputText id={field.name} {...field}
                                                    className={classNames({ 'p-invalid': fieldState }, 'w-full')} />
                                            )} />
                                        <label htmlFor="title" className={classNames({ 'p-error': errors })}>Painettu aikaisintaan</label>
                                    </span>
                                </div>
                                <div className="field grid  md:col-6 sm:col-12">
                                    <span className="p-float-label col">
                                        <Controller name="printyear_last" control={control}
                                            render={({ field, fieldState }) => (
                                                <InputText id={field.name} {...field}
                                                    className={classNames({ 'p-invalid': fieldState }, 'w-full')} />
                                            )} />
                                        <label htmlFor="title" className={classNames({ 'p-error': errors })}>Painettu viimeistään</label>
                                    </span>
                                </div>
                            </div>
                            <div className="grid">
                                <div className="field grid md:col-4 sm:col-12 pr-3">
                                    <Controller name="genre" control={control}
                                        render={({ field, fieldState }) => (
                                            <Dropdown options={genres} placeholder="Genret" className="w-full"
                                                id={field.name} {...field} value={field.value}
                                                optionLabel="name" optionValue="id" filter showClear
                                                itemTemplate={genreOptionTemplate}
                                                onChange={(e) => field.onChange(e.value)} />
                                        )} />
                                </div>
                                <div className="field grid md:col-4 sm:col-12 pr-3">
                                    <Controller name="nationality" control={control}
                                        render={({ field, fieldState }) => (
                                            <Dropdown options={nationalities} placeholder="Kansallisuus" className="w-full"
                                                id={field.name} {...field} value={field.value}
                                                optionLabel="name" optionValue="id" filter showClear
                                                onChange={(e) => field.onChange(e.value)} />
                                        )} />
                                </div>
                                <div className="field grid md:col-4 sm:col-12">
                                    <Controller name="type" control={control}
                                        render={({ field, fieldState }) => (
                                            <Dropdown options={bookTypes} placeholder="Tyyppi" className="w-full"
                                                id={field.name} {...field} value={field.value} showClear
                                                optionLabel="name" optionValue="id"
                                                onChange={(e) => field.onChange(e.value)} />
                                        )} />
                                </div>
                            </div>
                            <Button type="submit" className="w-full justify-content-center"
                                disabled={loading}
                            >
                                Hae
                            </Button>
                        </form>
                    </div>
                </Fieldset>
                <Divider align="center">
                    Teokset
                </Divider>
            </div>
            {loading ?
                <div className="progressbar">
                    <ProgressSpinner />
                </div>
                :
                <div className="mt-5 inline-flex align-items-center">
                    <WorkList works={works} />
                </div>
            }
        </main>
    )
}