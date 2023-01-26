import React, { useState, useEffect, useMemo } from "react";
import { Controller, useFieldArray, Control, UseFormRegister, FieldArrayWithId } from 'react-hook-form';

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
import { ShortForm } from '../../features/short/types';

interface ContributorFieldProps {
    id: string,
    control: Control<ShortForm>,
    register: UseFormRegister<ShortForm>
    defValues?: ContributionSimple[],
    disabled: boolean
}


type ContributorFieldPair = Pick<Contributor, "id" | "name">;

export const ContributorField = ({ control, defValues, register, disabled }: ContributorFieldProps) => {
    const user = useMemo(() => { return getCurrenUser() }, []);
    const [filteredPeople, setFilteredPeople] = useState<any>(null);
    const [filteredAliases, setFilteredAliases] = useState<any>(null);
    const [roleList, setRoleList]: [ContributorFieldPair[],
        (roleList: ContributorFieldPair[]) => void]
        = useState<ContributorFieldPair[]>([]);
    const emptyContributor: ContributionSimple = {
        person: {
            name: '',
            id: 0,
            alt_name: '',
            fullname: '',
            other_names: '',
            image_src: ''
        },
        /*role: { name: '', id: 0 },
        description: "",
        real_person: {
            name: '',
            id: 0,
            alt_name: '',
            fullname: '',
            other_names: '',
            image_src: ''
        },*/
    }

    const { fields, append, remove } = useFieldArray({
        control,
        name: "contributors"
    })

    const peopleToContribution = (people: Person[]) => {
        let retval: Contribution[] = [];
        retval = people.map((person) => {
            const r: Contribution = pickProperties(person, "id", "name");
            return r;
        });
        return retval;
    };

    useEffect(() => {
        async function getRoles() {
            const url = "roles";
            const response = await getApiContent(url, user);
            setRoleList(response.data);
        }
        getRoles();
    }, [user])

    async function filterPeople(event: any) {
        const url =
            "filter/people/" + event.query;
        const response = await getApiContent(url, user);
        const p = response.data;
        //console.log(p);
        setFilteredPeople(p);
        return p;
    }

    async function filterAliases(event: any) {
        return null;
    }
    // const contributionSort = (a: Contribution, b: Contribution) => {
    //     if (a.role.id !== b.role.id) {
    //         if (a.role.id < b.role.id) return -1;
    //         return 1;
    //     }
    //     return -1;
    // }

    const addEmptyContributor = () => {
        console.log("Adding");
        fields.map(field => console.log(field.id))
        console.log(fields.length);
        console.log("Added");
        //append(emptyContributor);
        fields.map(field => console.log(field.id))
        console.log(fields.length)
    }

    const removeContributor = (index: number) => {
        console.log("Removing")
        remove(index)
        console.log("Removed")
        console.log(fields.length)
    }

    const ContributorRow = (item: ContributionSimple, index: number) => {
        //const fieldName = `contributors.${index}.person`;
        //const fieldRole = `contributors.${index}.role`;
        //const fieldDescription = `contributors.${index}.description`;
        //const fieldAlias = `contributors.${index}.alias`;
        const keyValue = item.person.id || '0';
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
                {/*
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
                                value=""
                                className={classNames(
                                    { "p-invalid": fieldState.error },
                                    "w-full"
                                )}
                                disabled={disabled}
                            />
                        )}
                    />
                </div>
                                */}
                {/* <div className="field sm:col-12 lg:col-3">
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
                </div> */}

                <div className="field sm:col-12 lg:col-1">
                    <Button type="button"
                        className="p-button-rounded p-button-text"
                        onClick={() => removeContributor(index)}
                        icon="pi pi-minus"
                        disabled={index === 0 || disabled}
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
                <div id="contributors" className="py-0">
                    {/*{values &&
                        values.sort(contributionSort).map((item: Contribution, index: number) =>
                            Contributor(item, index))
                    } */}
                    {defValues && defValues.map((item, index) => ContributorRow(item, index))}

                    {fields && fields.map((item: FieldArrayWithId<ShortForm, "contributors", "id">, index: number) =>
                        ContributorRow(item, index))
                    }

                </div>
            </span>
        </>
    )
}

