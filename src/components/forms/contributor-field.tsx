import React, { useState, useEffect } from "react";
import { Controller, useFieldArray, Control } from 'react-hook-form';

import { AutoComplete } from "primereact/autocomplete";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { classNames } from "primereact/utils";
import { Dropdown } from "primereact/dropdown";

import { Person } from "../../features/person";
import { Contributor } from "../../types/contributor";
import { getApiContent } from "../../services/user-service";
import { getCurrenUser } from "../../services/auth-service";
import { pickProperties } from "./forms";
import { Contribution } from "../../types/contribution";
import { isAdmin } from '../../features/user';

interface ContributorFieldProps {
    id: string,
    control: Control
    register: Function,
    values: Contribution[]
}


type IContributorField = Pick<Contributor, "id" | "name">;

export const ContributorField = ({ id, control, values }: ContributorFieldProps) => {
    const user = getCurrenUser();
    const [filteredPeople, setFilteredPeople] = useState<any>(null);
    const [filteredAliases, setFilteredAliases] = useState<any>(null);
    const [roleList, setRoleList]: [IContributorField[],
        (roleList: IContributorField[]) => void]
        = useState<IContributorField[]>([]);
    const emptyContributor = {
        description: null,
        person: { name: '', id: 0 },
        role: { name: '', id: 0 },
        real_person: null
    }

    const fieldArray = useFieldArray({
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
    }, [])

    async function filterPeople(event: any) {
        const url =
            "filter/people/" + event.query;
        const response = await getApiContent(url, user);
        const p = peopleToContribution(response.data);
        //console.log(p);
        setFilteredPeople(p);
        return p;
    }

    async function filterAliases(event: any) {
        const url = "filter/alias/";
        return null;
    }
    const contributionSort = (a: Contribution, b: Contribution) => {
        if (a.role.id !== b.role.id) {
            if (a.role.id < b.role.id) return -1;
            return 1;
        }
        return -1;
    }

    const Contributor = (item: Contribution, index: number) => {
        const fieldName = `contributors.${index}.person`;
        const fieldRole = `contributors.${index}.role`;
        const fieldDescription = `contributors.${index}.description`;
        const fieldAlias = `contributors.${index}.alias`;
        const keyValue = item.person.id || '0';
        return (
            <div key={keyValue}
                className="grid gap-1">
                <div className="field sm:col-12 lg:col-3">
                    <Controller
                        name={fieldName}
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
                                disabled={!isAdmin(user)}
                            />
                        )}
                    />
                </div>
                <div className="field sm:col-12 lg:col-2">
                    <Controller
                        name={fieldRole}
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
                                disabled={!isAdmin(user)}
                            />
                        )}
                    />
                </div>
                <div className="field sm:col-12 lg:col-3">
                    <Controller
                        name={fieldDescription}
                        control={control}
                        render={({ field, fieldState }) => (
                            <InputText
                                id={field.name}
                                {...field}
                                tooltip="Kuvaus"
                                placeholder="Kuvaus"
                                className={classNames(
                                    { "p-invalid": fieldState.error },
                                    "w-full"
                                )}
                                disabled={!isAdmin(user)}
                            />
                        )}
                    />
                </div>
                <div className="field sm:col-12 lg:col-3">
                    <Controller
                        name={fieldAlias}
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

                <div className="field sm:col-12 lg:col-1">
                    <Button
                        className="p-button-rounded p-button-text"
                        onClick={() => fieldArray.remove(index)}
                        icon="pi pi-minus"
                        disabled={index === 0}
                    />
                    {index === fieldArray.fields.length - 1 && (
                        <Button className="p-button-rounded p-button-text"
                            icon="pi pi-plus"
                            onClick={() => fieldArray.append(emptyContributor)}
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
                    {values &&
                        values.sort(contributionSort).map((item: Contribution, index: number) =>
                            Contributor(item, index))
                    }

                </div>
            </span>
        </>
    )
}

