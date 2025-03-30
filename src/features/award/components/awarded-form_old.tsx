import React, { useMemo, useRef, useState } from "react";
import { OverlayPanel } from "primereact/overlaypanel";
import { Button } from "primereact/button";
import { AwardedProps, AwardList } from "./award-list";
import { AutoComplete } from "primereact/autocomplete";
import { classNames } from "primereact/utils";
import { Controller, FormProvider, useFieldArray, useForm, useFormContext, UseFormReturn } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { getApiContent } from "@services/user-service";
import { getCurrenUser } from "@services/auth-service";
import { Award, AwardedFormData } from "../types";
import { set } from "lodash";
import { useQuery } from "@tanstack/react-query";

interface AwardFormProps {
    workId?: string,
    personId?: string
}

const emptyAward = {
    id: 0,
    award: { id: 0, name: '' },
    year: 0,
    category: { id: 0, name: '' },
}

interface AwardRowProps {
    index: number,
    methods: UseFormReturn<any, any>,
}

const AwardRow = ({ index }: AwardRowProps) => {
    return <>

    </>
}
//     const [filteredAwards, setFilteredAwards] = useState([]);
//     const [selectedAward, setSelectedAward] = useState<Award | null>(null);
//     const [filteredCategories, setFilteredCategories] = useState([]);

//     const filterAwards = async (event: any) => {
//         const url = "filter/award/" + event.query;
//         const response = await getApiContent(url, user);
//         const awards = response.data;
//         setFilteredAwards(awards);
//     }

//     const filterCategories = async (event: any) => {
//         if (selectedAward !== null) {
//             const url = "filter/category/" + selectedAward.id;
//             const response = await getApiContent(url, user);
//             const categories = response.data;
//             setFilteredCategories(categories);
//         }
//     }

//     const addEmptyAward = () => {
//         append(emptyAward);
//     }

//     const removeAward = (index: number) => {
//         remove(index);
//     }

//     return (
//         <div className="grid">
//             <div className="field col-12 lg:col-3 p-2">
//                 <Controller
//                     name={`${id}.${index}.year` as const}
//                     control={control}
//                     render={({ field, fieldState }) => (
//                         <InputText
//                             {...field}
//                             type="number"
//                             placeholder="Vuosi"
//                             tooltip="Vuosi"
//                             className={classNames(
//                                 { "p-invalid": fieldState.error },
//                                 "w-full"
//                             )}
//                         />
//                     )}
//                 />
//             </div>
//             <div className="field col-12 lg:col-3 p-2">
//                 <Controller
//                     name={`${id}.${index}.award` as const}
//                     control={control}
//                     render={({ field, fieldState }) => (
//                         <AutoComplete
//                             {...field}
//                             field="name"
//                             completeMethod={filterAwards}
//                             suggestions={filteredAwards}
//                             onSelect={(e) => { setSelectedAward(e.value) }}
//                             minLength={3}
//                             placeholder="Palkinto"
//                             tooltip="Palkinto"
//                             forceSelection={false}
//                             delay={300}
//                             className={classNames(
//                                 { "p-invalid": fieldState.error },
//                                 "w-full"
//                             )}
//                             inputClassName="w-full"
//                             inputRef={field.ref}
//                         />
//                     )}
//                 />
//             </div>
//             <div className="field col-12 lg:col-3 p-2">
//                 <Controller
//                     name={`${id}.${index}.category` as const}
//                     control={control}
//                     render={({ field, fieldState }) => (
//                         <AutoComplete
//                             {...field}
//                             field="name"
//                             completeMethod={filterCategories}
//                             suggestions={filteredCategories}
//                             minLength={3}
//                             placeholder="Kategoria"
//                             tooltip="Kategoria"
//                             forceSelection={false}
//                             delay={300}
//                             className={classNames(
//                                 { "p-invalid": fieldState.error },
//                                 "w-full"
//                             )}
//                             inputClassName="w-full"
//                             inputRef={field.ref}
//                         />
//                     )}
//                 />
//             </div>
//             <div className="flex align-content-center flex-wrap col-12 lg:col-2">
//                 <Button type="button"
//                     className="p-button-rounded p-button-text"
//                     onClick={() => removeAward(index)}
//                     icon="pi pi-minus"
//                 />
//                 {index === fields.length - 1 && (
//                     <Button type="button" className="p-button-rounded p-button-text"
//                         icon="pi pi-plus"
//                         onClick={() => addEmptyAward()}
//                     />
//                 )}
//             </div>
//         </div>
//     )
// }

export const AwardedForm = ({ workId, personId }: AwardFormProps) => {
    let awardType = "";
    if (workId) {
        awardType = "work";
    }
    else {
        awardType = "person";
    }
    const id = awardType === "work" ? workId : personId;

    if (!id) {
        return null;
    }

    const fetchData = async () => {
        let url = "";
        if (awardType === "work") {
            url = "works/" + id + "/awards";
        }
        else {
            url = "people/" + id + "/awards";
        }
        const response = await getApiContent(url, getCurrenUser());
        return response.data;
    }

    const { isLoading, data } = useQuery({
        queryKey: ["awards", id],
        queryFn: async () => fetchData(),
        enabled: !!id
    })

    const user = useMemo(() => { return getCurrenUser() }, []);

    const methods = useForm<AwardedFormData>({ defaultValues: data });

    const { control } = useFormContext();

    const { fields, append, remove } = useFieldArray({
        control,
        name: id
    })

    return (
        <span>
            <FormProvider {...methods}>
                <label htmlFor="awards" className="form-field-header">Palkinnot</label>
                <form onSubmit={methods.handleSubmit(() => { })}>
                    {/* <div id={id} className="py-0" key={id}>
                        {fields && fields.map((item, index) => (
                            <AwardRow
                                key={index} index={index} methods={methods}
                            />
                        ))
                        }
                    </div> */}
                    <Button type="submit" className="w-full justify-content-center">Tallenna</Button>
                </form>
            </FormProvider>
        </span>
    )
};
