import React, { useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";

import { useQuery } from "@tanstack/react-query";
import { ProgressSpinner } from "primereact/progressspinner";
import { InputText } from "primereact/inputtext";
import { classNames } from "primereact/utils";
import { Button } from 'primereact/button';
import { Fieldset } from 'primereact/fieldset';
import { Dropdown } from "primereact/dropdown";
import { Divider } from 'primereact/divider';
import _ from "lodash";
import axios from "axios";

import { getCurrenUser } from "../../../services/auth-service";
import { getGenreIcon } from "../../genre/utils/genre-icons";
import { Genre } from "../../genre";
import { getApiContent } from "../../../services/user-service";
import { Country } from "../../../types/country";
import { BookType } from "../../../types/book-type";
//import { API_URL } from "../../../systemProps";
import { WorkList } from "../components/work-list";
import { User } from "../../user";
import { useDocumentTitle } from "../../../components/document-title";

type FormData = {
    [index: string]: any,
    author?: string,
    title?: string,
    orig_title?: string,
    pubyear_first?: string,
    pubyear_last?: string,
    printyear_first?: string,
    printyear_last?: string,
    genre?: number,
    nationality?: number,
    type?: number
};

export const WorkSearchPage = () => {
    const user = getCurrenUser();
    const { control, handleSubmit, formState: { errors } } = useForm<FormData>();
    const [loading, setLoading] = useState(false);
    const [works, setWorks]: [any, (books: any[]) => void] = useState<any>(null);
    //const [genres, setGenres]: [Genre[], (genres: Genre[]) => void] = useState<Genre[]>([]);
    //const [nationalities, setNationalities]: [Country[], (nationalities: Country[]) => void] = useState<Country[]>([]);
    //const [bookTypes, setBookTypes]: [BookType[], (bookTypes: BookType[]) => void] = useState<BookType[]>([]);
    //const [initials, setInitials]: [string[], (initialis: string[]) => void] = useState<string[]>([]);
    const [initial, setInitial] = useState("");

    const [documentTitle, setDocumentTitle] = useDocumentTitle("Kirjahaku");

    if (documentTitle !== undefined)
        document.title = documentTitle;

    const onSubmit: SubmitHandler<FormData> = data => {
        function search() {
            if (Object.keys(data).length === 0 &&
                _.pickBy(data, function (param) { return data[param].length > 0 }).length === 0) {
                return;
            }
            setLoading(true);
            try {
                axios.post(import.meta.env.VITE_API_URL + 'searchworks', data)
                    .then((response) => {
                        setWorks(response.data)
                        setLoading(false);
                    });
            } catch (e) {
                console.error(e);
            }
        }
        // console.log(data);
        search();
        setInitial("");
    }

    async function getOptions<T>(endpoint: string, user: User | null): Promise<T> {
        const data = await getApiContent(endpoint, user)
            .then(response => response.data)
            .catch((error) => console.log(error));
        return data;
    }

    const genres = useQuery({
        queryKey: ["genres"],
        queryFn: () => getOptions<Genre[]>('genres', user)
    })
    const nationalities = useQuery({
        queryKey: ["nationalities"],
        queryFn: () => getOptions<Country[]>('countries', user)
    });
    const worktypes = useQuery({
        queryKey: ["worktypes"],
        queryFn: () => getOptions<BookType[]>('worktypes', user)
    })

    const fetchInitials = async (user: User | null): Promise<string[]> => {
        const data = await getApiContent('firstlettervector/works', user)
            .then(response => response.data)
            .catch((error) => error.log(error));
        return Object.keys(data);
    }

    const initials = useQuery({
        queryKey: ["initials"],
        queryFn: () => fetchInitials(user)
    })

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
                console.log(e);
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
            <div className="grid mb-5 justify-content-center">{initials && initials.data && initials.data.length > 0 &&
                initials?.data?.map(letter => (
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
                                                    className={classNames('w-full')}
                                                />
                                            )} />
                                        <label htmlFor="author" className={classNames({ 'p-error': errors })}>Kirjoittaja</label>
                                    </span>
                                </div>
                                <div className="field grid md:col-4 sm:col-12">
                                    <span className="p-float-label col">
                                        <Controller name="title" control={control}
                                            render={({ field, fieldState }) => (
                                                <InputText id={field.name} {...field}
                                                    className={classNames('w-full')}
                                                />
                                            )} />
                                        <label htmlFor="title" className={classNames({ 'p-error': errors })}>Nimi</label>
                                    </span>
                                </div>
                                <div className="field grid md:col-4 sm:col-12">
                                    <span className="p-float-label col">
                                        <Controller name="orig_name" control={control}
                                            render={({ field, fieldState }) => (
                                                <InputText id={field.name} {...field}
                                                    className={classNames('w-full')}
                                                />
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
                                                    className={classNames('w-full')}
                                                />
                                            )} />
                                        <label htmlFor="title" className={classNames({ 'p-error': errors })}>Julkaistu aikaisintaan</label>
                                    </span>
                                </div>
                                <div className="field grid  md:col-6 sm:col-12">
                                    <span className="p-float-label col">
                                        <Controller name="pubyear_last" control={control}
                                            render={({ field, fieldState }) => (
                                                <InputText id={field.name} {...field}
                                                    className={classNames('w-full')}
                                                />
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
                                                    className={classNames('w-full')}
                                                />
                                            )} />
                                        <label htmlFor="title" className={classNames({ 'p-error': errors })}>Painettu aikaisintaan</label>
                                    </span>
                                </div>
                                <div className="field grid  md:col-6 sm:col-12">
                                    <span className="p-float-label col">
                                        <Controller name="printyear_last" control={control}
                                            render={({ field, fieldState }) => (
                                                <InputText id={field.name} {...field}
                                                    className={classNames('w-full')} />
                                            )} />
                                        <label htmlFor="title" className={classNames({ 'p-error': errors })}>Painettu viimeistään</label>
                                    </span>
                                </div>
                            </div>
                            <div className="grid">
                                <div className="field grid md:col-4 sm:col-12 pr-3">
                                    <Controller name="genre" control={control}
                                        render={({ field, fieldState }) => (
                                            <Dropdown options={genres.data} placeholder="Genret" className="w-full"
                                                id={field.name} {...field} value={field.value}
                                                optionLabel="name" optionValue="id" filter showClear
                                                itemTemplate={genreOptionTemplate}
                                                onChange={(e) => field.onChange(e.value)} />
                                        )} />
                                </div>
                                <div className="field grid md:col-4 sm:col-12 pr-3">
                                    <Controller name="nationality" control={control}
                                        render={({ field, fieldState }) => (
                                            <Dropdown options={nationalities.data} placeholder="Kansallisuus" className="w-full"
                                                id={field.name} {...field} value={field.value}
                                                optionLabel="name" optionValue="id" filter showClear
                                                onChange={(e) => field.onChange(e.value)} />
                                        )} />
                                </div>
                                <div className="field grid md:col-4 sm:col-12">
                                    <Controller name="type" control={control}
                                        render={({ field, fieldState }) => (
                                            <Dropdown options={worktypes.data} placeholder="Tyyppi" className="w-full"
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
                <WorkList works={works} />
            }
        </main>
    )
}