import { useState, useMemo } from "react";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { AutoComplete } from "primereact/autocomplete";
import { Button } from "primereact/button";

import { PersonBrief } from "../../features/person";
import { getApiContent } from "../../services/user-service";
import { getCurrenUser } from "../../services/auth-service";

interface AliasesFieldProps {
    disabled?: boolean;
}

const emptyAlias: PersonBrief = {
    id: 0,
    name: "",
    alt_name: "",
    fullname: ""
};

export const AliasesField = ({ disabled }: AliasesFieldProps) => {
    const user = useMemo(() => getCurrenUser(), []);
    const { control } = useFormContext();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "aliases"
    });

    interface AliasRowProps {
        index: number;
    }

    const AliasRow = ({ index }: AliasRowProps) => {
        const [filteredPeople, setFilteredPeople] = useState<any[]>([]);

        const filterPeople = async (event: any) => {
            const url = "filter/people/" + event.query;
            const response = await getApiContent(url, user);
            setFilteredPeople(response.data);
        };

        return (
            <div className="grid">
                <div className="field col-12 lg:col-6 p-2">
                    <Controller
                        name={`aliases.${index}` as const}
                        control={control}
                        render={({ field }) => (
                            <AutoComplete
                                {...field}
                                field="name"
                                completeMethod={filterPeople}
                                suggestions={filteredPeople}
                                minLength={3}
                                placeholder="Alias"
                                tooltip="Alias"
                                forceSelection
                                delay={300}
                                className="w-full"
                                inputClassName="w-full"
                                disabled={disabled}
                                inputRef={field.ref}
                            />
                        )}
                    />
                </div>
                <div className="flex align-content-center flex-wrap col-12 lg:col-2">
                    <Button
                        type="button"
                        className="p-button-rounded p-button-text"
                        onClick={() => remove(index)}
                        icon="pi pi-minus"
                        disabled={disabled}
                    />
                    {index === fields.length - 1 && (
                        <Button
                            type="button"
                            className="p-button-rounded p-button-text"
                            icon="pi pi-plus"
                            onClick={() => append(emptyAlias)}
                            disabled={disabled}
                        />
                    )}
                </div>
            </div>
        );
    };

    return (
        <div>
            <label className="form-field-header font-bold">Aliakset</label>
            {fields.length === 0 ? (
                <div className="p-2">
                    <Button
                        type="button"
                        className="p-button-rounded p-button-text"
                        icon="pi pi-plus"
                        onClick={() => append(emptyAlias)}
                        disabled={disabled}
                        tooltip="Lisää alias"
                    />
                </div>
            ) : (
                fields.map((_, index) => <AliasRow index={index} key={index} />)
            )}
        </div>
    );
};
