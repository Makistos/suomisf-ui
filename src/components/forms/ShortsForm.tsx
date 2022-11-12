import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { useState } from 'react';
import { useForm, Controller, SubmitHandler, useFieldArray, FieldValues } from 'react-hook-form';
import type { IGenre } from '../Genre';
import { IShort, IShortType, shortIsSf } from '../Short';
import { InputText } from 'primereact/inputtext';
import type { IPerson } from '../Person';
import { classNames } from 'primereact/utils';
import { ContributorField } from './ContributorField';
import { IContribution } from '../Contribution';
import { KeyValuePair } from './forms';
import { postApiContent } from '../../services/user-service';
import { getCurrenUser } from '../../services/auth-service';

interface hasIdAndName {
    id: number,
    name: string
}
interface IShortForm {
    id: number | null,
    title: string,
    orig_title: string,
    language: string | null,
    pubyear: number | null
    authors: KeyValuePair[],
    type: number,
    genres: KeyValuePair[],
    contributors: IContribution[]
}

interface IShortFormSubmit {
    data: Object,
    changed: Object
}

const toKeyValue = <T extends hasIdAndName>(arr: T[]): KeyValuePair[] =>
    arr.map(item => ({ id: item.id, value: item.name }));

const genreToKeyValue = (arr: IGenre[]): KeyValuePair[] => {
    let retval: KeyValuePair[] = [];
    arr.map(item => retval.push({ id: item.id, value: item.name }));
    return retval;
}

interface IShortFormProps {
    short: IShort
}

export const ShortsForm = (props: IShortFormProps) => {
    const user = getCurrenUser();
    const convToForm = (short: IShort): IShortForm => ({
        id: short.id,
        title: short.title,
        orig_title: short.orig_title,
        language: short.language,
        pubyear: short.pubyear,
        authors: toKeyValue(short.authors),
        type: short.type.id,
        genres: toKeyValue(short.genres),
        contributors: short.contributors
    });

    const defaultValues: IShortForm = {
        id: null,
        title: '',
        orig_title: '',
        language: '',
        pubyear: null,
        authors: [],
        type: 0,
        genres: [],
        contributors: []
    }
    const formData = props.short !== null ? convToForm(props.short) : defaultValues;

    const { register, control, handleSubmit,
        formState: { isDirty, dirtyFields } } =
        useForm<FieldValues>({ defaultValues: formData });
    // const authorsArray = useFieldArray({
    //     control,
    //     name: "authors"
    // })
    // const genresArray = useFieldArray({
    //     control,
    //     name: "genres"
    // })
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const onSubmit: SubmitHandler<FieldValues> = (data) => {
        const retval: IShortFormSubmit = { data, changed: dirtyFields }
        setMessage("");
        setLoading(true);

        console.log(data);

        postApiContent('shorts/', retval, user);
        if (isDirty) {
            console.log(dirtyFields)
        }
        setLoading(false);
    }

    return (
        <div className="card mt-3">
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="formgrid grid">
                    <div className="field col-12">
                        <span className="p-float-label">
                            <Controller name="title" control={control}
                                render={({ field, fieldState }) => (
                                    <InputText id={field.name}
                                        {...field}
                                        autoFocus
                                        {...register("title")}
                                        className={classNames({ 'p-invalid': fieldState.error },
                                            "w-full")}
                                    />
                                )}
                            />
                            <label htmlFor="title">Nimi</label>
                        </span>
                    </div>
                    <div className="field col-12">
                        <span className="p-float-label">
                            <Controller name="orig_title" control={control}
                                render={({ field, fieldState }) => (
                                    <InputText id={field.name}
                                        {...field}
                                        {...register("orig_title")}
                                        className={classNames({ 'p-invalid': fieldState.error },
                                            "w-full")}
                                    />
                                )}
                            />
                            <label htmlFor="orig_title">Alkuperäinen nimi</label>
                        </span>
                    </div>
                    <div className="field col-12">
                        <span className="p-float-label">
                            <Controller name="pubyear" control={control}
                                render={({ field, fieldState }) => (
                                    <InputText id={field.name} {...field}
                                        {...register("pubyear")}
                                    />
                                )}
                            />
                            <label htmlFor="pubyear">Alkuperäinen julkaisuvuosi</label>
                        </span>
                    </div>
                    <div className="field col-12 py-0">
                        <ContributorField
                            id={"authors"}
                            control={control}
                            register={register}
                            values={formData.contributors}
                        />
                    </div>
                    <Button type="submit" className="w-full justify-content-center">Tallenna</Button>
                </div>
            </form>
        </div>
    )
}