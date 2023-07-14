import React, { useState, useEffect, useMemo } from "react";
import { Controller, useFieldArray, Control, UseFormRegister, FieldArrayWithId, useFormContext } from 'react-hook-form';
import { AutoComplete } from "primereact/autocomplete";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { classNames } from "primereact/utils";
import { Dropdown } from "primereact/dropdown";

import { Person } from "../../features/person";
import { Contributor } from "../../types/contributor";
import { getApiContent } from "../../services/user-service";
import { getCurrenUser, register } from "../../services/auth-service";
import { pickProperties } from "./forms";
import { Contribution, ContributionSimple } from "../../types/contribution";
import { isAdmin } from '../../features/user';
import { WorkFormData } from '../../features/work/types';
import { Contributable } from "../../types/generic";
//import { ContributorRow } from "./contributor-row";

interface ContributorFieldProps {
    id: string,
    // control: Control<T>,
    // register: UseFormRegister<T>
    defValues?: Contribution[],
    disabled: boolean
}
// interface ContributorFieldProps {
//     id: string,
//     control: Control<WorkFormData>,
//     register: UseFormRegister<WorkFormData>,
//     defValues?: Contribution[],
//     disabled: boolean
// }

type ContributorFieldPair = Pick<Contributor, "id" | "name">;

export const emptyContributor: Contribution = {
    person: {
        name: '',
        id: 0,
        alt_name: '',
        fullname: '',
    },
    role: { name: '', id: 0 },
    description: "",
    real_person: {
        name: '',
        id: 0,
        alt_name: '',
        fullname: '',
    },
}

export const ContributorField = ({ id, defValues, disabled }: ContributorFieldProps) => {
    const user = useMemo(() => { return getCurrenUser() }, []);

    const { control } = useFormContext();

    const { fields, append, remove } = useFieldArray({
        control,
        name: "contributors"
    })

    // const contributionSort = (a: Contribution, b: Contribution) => {
    //     if (a.role.id !== b.role.id) {
    //         if (a.role.id < b.role.id) return -1;
    //         return 1;
    //     }
    //     return -1;
    // }
    interface ContributorRowProps {
        index: number,
    }
    const ContributorRow = ({ index }: ContributorRowProps) => {
        //const user = useMemo(() => { return getCurrenUser() }, []);
        const keyValue = `{contributors.${index}}`;
        const [filteredPeople, setFilteredPeople] = useState<any>([]);
        const [filteredAliases, setFilteredAliases] = useState<any>(null);
        const [roleList, setRoleList]: [ContributorFieldPair[],
            (roleList: ContributorFieldPair[]) => void]
            = useState<ContributorFieldPair[]>([]);

        useEffect(() => {
            async function getRoles() {
                const url = "roles/";
                const response = await getApiContent(url, user);
                setRoleList(response.data);
            }
            getRoles();
            //     async function getPeople() {
            //         const url = "people/";
            //         const response = await getApiContent(url, user);
            //         setFilteredPeople(response.data);
            //         //console.log("People response:" + filteredPeople);
            //     }
            //     getPeople();
            getRoles();
        }, [user])

        async function filterPeople(event: any) {
            const url =
                "filter/people/" + event.query;
            console.log("Person search url:" + url);
            const response = await getApiContent(url, user);
            const p = response.data;
            //console.log(p);

            setFilteredPeople(p);
            return p;
        }

        async function filterAliases(event: any) {
            return null;
        }

        const addEmptyContributor = () => {
            append(emptyContributor);
        }

        const removeContributor = (index: number) => {
            remove(index)
        }


        return (
            <div key={keyValue}
                className="grid">

                <div className="field col-12 lg:col-3 p-2">
                    <Controller
                        name={`contributors.${index}.person` as const}
                        control={control}
                        render={({ field, fieldState }) => (
                            <AutoComplete
                                {...field}
                                field="name"
                                completeMethod={filterPeople}
                                suggestions={filteredPeople}
                                minLength={3}
                                placeholder="Henkilö"
                                tooltip="Henkilö"
                                delay={800}
                                className={classNames(
                                    { "p-invalid": fieldState.error },
                                    "w-full"
                                )}
                                inputClassName="w-full"
                                disabled={disabled}
                                inputRef={field.ref}
                            />
                        )}
                    />
                </div>
                <div className="field col-12 lg:col-3 p-2">
                    <Controller
                        name={`contributors.${index}.role` as const}
                        control={control}
                        render={({ field, fieldState }) => (
                            <Dropdown
                                {...field}
                                optionLabel="name"
                                id={field.value.id}
                                value={field.value}
                                options={roleList}
                                className={classNames(
                                    { "p-invalid": fieldState.error }, "w-full"
                                )}
                                placeholder="Rooli"
                                tooltip="Rooli"
                                disabled={disabled}
                                focusInputRef={field.ref}
                            />
                        )}
                    />
                </div>
                <div className="field col-12 lg:col-3 p-2">
                    <Controller
                        name={`contributors.${index}.description` as const}
                        control={control}
                        render={({ field, fieldState }) => (
                            <InputText
                                {...field}
                                value={field.value ? field.value : ""}
                                tooltip="Kuvaus"
                                placeholder="Kuvaus"
                                className={classNames(
                                    { "p-invalid": fieldState.error },
                                    "w-full"
                                )}
                                disabled={disabled}
                            />
                        )}
                    />
                </div>
                {/*
                <div className="field sm:col-12 lg:col-3">
                    <Controller
                        name={`contributors.${index}.person.aliases` as const}
                        control={control}
                        render={({ field, fieldState }) => (
                            <AutoComplete
                                {...field}
                                field="name"
                                completeMethod={filterAliases}
                                suggestions={filteredAliases}
                                minLength={3}
                                placeholder="Oikea nimi"
                                tooltip="Oikea nimi"
                                delay={800}
                                className={classNames(
                                    { "p-invalid": fieldState.error },
                                    "w-full"
                                )}
                                inputClassName="w-full"
                                disabled={true}
                            />
                        )}
                    />
                </div>
                                */}
                <div className="flex align-content-center flex-wrap col-12 lg:col-2">
                    <Button type="button"
                        className="p-button-rounded p-button-text"
                        onClick={() => removeContributor(index)}
                        icon="pi pi-minus"
                        disabled={disabled}
                    />
                    {index === fields.length - 1 && (
                        <Button type="button" className="p-button-rounded p-button-text"
                            icon="pi pi-plus"
                            onClick={() => addEmptyContributor()}
                            disabled={disabled}
                        />
                    )}
                </div>
            </div>
        )
    }

    return (
        <>
            <span >
                <label htmlFor="contributors" className="form-field-header">Tekijät</label>
                <div id="contributors" className="py-0" key={id}>
                    {fields && fields.map((_, index) =>
                        <ContributorRow index={index} key={index} />
                    )}
                </div>
            </span>
        </>
    )
}

