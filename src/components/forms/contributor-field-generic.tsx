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

export const ContributorField = ({ id, defValues, disabled }: ContributorFieldProps) => {
    //const { register, control } = useFormContext();
    const user = useMemo(() => { return getCurrenUser() }, []);
    const peopleToContribution = (people: Person[]) => {
        let retval: Contribution[] = [];
        retval = people.map((person) => {
            const r: Contribution = pickProperties(person, "id", "name");
            return r;
        });
        return retval;
    };

    const { control, register } = useFormContext();

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
        const user = useMemo(() => { return getCurrenUser() }, []);
        const keyValue = index;
        const [filteredPeople, setFilteredPeople] = useState<any>(null);
        const [filteredAliases, setFilteredAliases] = useState<any>(null);
        const [roleList, setRoleList]: [ContributorFieldPair[],
            (roleList: ContributorFieldPair[]) => void]
            = useState<ContributorFieldPair[]>([]);

        const emptyContributor: Contribution = {
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

        useEffect(() => {
            async function getRoles() {
                const url = "roles/";
                const response = await getApiContent(url, user);
                setRoleList(response.data);
            }
            getRoles();
            async function getPeople() {
                const url = "people/";
                const response = await getApiContent(url, user);
                setFilteredPeople(response.data);
            }
            getPeople();
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
            console.log(control._fields)
            append(emptyContributor);
        }

        const removeContributor = (index: number) => {
            console.log("Removing")
            remove(index)
            console.log("Removed")
            console.log(fields.length)
        }


        return (
            <div key={keyValue}
                className="grid gap-1">

                <div className="field sm:col-12 lg:col-3">
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
                            />
                        )}
                    />
                </div>
                <div className="field sm:col-12 lg:col-2">
                    <Controller
                        name={`contributors.${index}.role` as const}
                        control={control}
                        render={({ field, fieldState }) => (
                            <Dropdown
                                {...field}
                                optionLabel="name"
                                options={roleList}
                                className={classNames(
                                    { "p-invalid": fieldState.error }, "w-full"
                                )}
                                placeholder="Rooli"
                                tooltip="Rooli"
                                disabled={disabled}
                            />
                        )}
                    />
                </div>
                <div className="field sm:col-12 lg:col-3">
                    <Controller
                        name={`contributors.${index}.description` as const}
                        control={control}
                        render={({ field, fieldState }) => (
                            <InputText
                                {...field}
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
                <div className="field sm:col-12 lg:col-1">
                    <Button type="button"
                        className="p-button-rounded p-button-text"
                        onClick={() => removeContributor(index)}
                        icon="pi pi-minus"
                        disabled={fields.length < 2 || disabled}
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
                    {fields && fields.map((_, index: number) =>
                        <ContributorRow index={index} key={index} />
                    )}
                </div>
            </span>
        </>
    )
}

