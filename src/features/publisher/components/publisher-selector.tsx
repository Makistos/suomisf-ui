import { FormEventHandler, useMemo, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { AutoCompleteProps } from "primereact/autocomplete";
import { FormAutoComplete } from "../../../components/forms/field/form-auto-complete";
import { getApiContent } from "../../../services/user-service";
import { getCurrenUser } from "../../../services/auth-service";

interface PublisherSelectorProps extends AutoCompleteProps {
    name: string,
    methods: UseFormReturn<any, any>,
    labelClass?: string,
    tagFunction?: FormEventHandler
}

export const PublisherSelector = ({ name, methods, labelClass, tagFunction, ...rest }: PublisherSelectorProps) => {
    const user = useMemo(() => { return getCurrenUser() }, []);
    const [filteredPublishers, setFilteredPublishers] = useState([]);
    async function completeMethod(event: any) {
        const url = "filter/publishers/" + event.query;
        const response = await getApiContent(url, user);
        setFilteredPublishers(response.data);
    }

    return (
        <FormAutoComplete
            name={name}
            methods={methods}
            label="Kustantaja"
            labelClass={labelClass}
            tagFunction={tagFunction}
            completeMethod={completeMethod}
            suggestions={filteredPublishers}
            forceSelection={false}
            placeholder="Kustantaja"
            {...rest}
        />
    )
}