import { useForm } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { ProgressSpinner } from 'primereact/progressspinner';
import { Award, AwardCategory, Awarded, AwardedFormData, AwardedRowData } from '../types';
import { getApiContent, postApiContent } from '@services/user-service';
import { useEffect, useMemo, useState } from 'react';
import { User } from '@features/user';
import { getCurrenUser } from '@services/auth-service';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { AutoComplete } from 'primereact/autocomplete';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { FormInputNumber } from '@components/forms/field/form-input-number';

interface AwardFormProps {
    workId?: string,
    personId?: string,
    shortId?: string
    onClose: () => void
}

const fetchWorkAwarded = async (id: string | null, user: User): Promise<Awarded[]> => {
    if (id === null) {
        return [];
    }
    const response = await getApiContent('works/' + id + '/awarded', user)
        .then(response => response.data)
        .catch((error) =>
            console.error(error));
    return response;
}

const fetchPersonAwarded = async (id: string | null, user: User): Promise<Awarded[]> => {
    if (id === null) {
        return [];
    }
    const response = await getApiContent('people/' + id + '/awarded', user)
        .then(response => response.data)
        .catch((error) =>
            console.error(error));
    return response;
}

const fetchShortAwarded = async (id: string | null, user: User): Promise<Awarded[]> => {
    if (id === null) {
        return [];
    }
    const response = await getApiContent('shorts/' + id + '/awarded', user)
        .then(response => response.data)
        .catch((error) =>
            console.error(error));
    return response;
}

export const AwardedForm = ({ workId, personId, shortId: storyId, onClose }: AwardFormProps) => {
    const user = useMemo(() => getCurrenUser(), []);
    const itemType = workId ? "work" : personId ? "person" : "story";
    const typeId = workId ? 1 : personId ? 0 : 2;
    const thisId = itemType == "work" ? workId : itemType == "person" ? personId : storyId;
    const [filteredAwards, setFilteredAwards] = useState([]);
    const [categories, setCategories] = useState<AwardCategory[]>([]);

    if (!thisId || user === null) {
        return <div>Invalid ID</div>
    }

    const defaultValues = {
        id: 0,
        award: { id: 0, name: "" },
        year: 0,
        category: { id: 0, name: "", type: 0 },
        person: { id: itemType === "person" ? thisId : 0, name: "" },
        work: { id: itemType === "work" ? thisId : 0, title: "" },
        story: { id: itemType === "story" ? thisId : 0, title: "" }
    } as AwardedRowData;

    useEffect(() => {
        const getCategories = async (user: User) => {
            const response = await getApiContent('awards/categories/' + itemType, user)
                .then(response => response.data)
                .catch((error) =>
                    console.error(error));
            setCategories(response);
        }
        if (user)
            getCategories(user);
    }, [user])

    // const categories = useQuery({
    //     queryKey: ['categories'],
    //     queryFn: () => getCategories(user)
    // });

    const { data, isLoading } = useQuery({
        queryKey: ['awarded', thisId],
        queryFn: async () => {
            return itemType == "work" ? (await fetchWorkAwarded(thisId, user)).filter((awarded: Awarded) => awarded.category.type === typeId) :
                itemType == "person" ? (await fetchPersonAwarded(thisId, user)).filter((awarded: Awarded) => awarded.category.type === typeId) :
                    itemType == "story" ? (await fetchShortAwarded(thisId, user)).filter((awarded: Awarded) => awarded.category.type === typeId) : [];
        }
    })

    const findCatIndex = (id: number) => {
        const index = categories?.findIndex((cat) => cat.id === id);
        if (index === undefined || index === -1) {
            return { id: 0, name: "" };
        }
        return index;
    }

    const form = useForm({
        defaultValues: {
            id: data ? thisId : 0,
            type: typeId,
            awards:
                data?.map((awarded: Awarded) => ({
                    id: Number(awarded.id || 1),
                    year: Number(awarded.year || 0),
                    award: awarded.award,
                    category: awarded.category,
                    person: awarded.person || { id: thisId, name: "" },
                    work: awarded.work,
                    story: awarded.story
                })) as AwardedRowData[]
                ??
                [{
                    id: 0,
                    year: 1,
                    award: { id: 0, name: "", description: "", domestic: false, categories: [] } as Pick<Award, 'id' | 'name' | 'description' | 'domestic'>,
                    category: { id: 0, name: '', type: 0 } as Pick<AwardCategory, 'id' | 'name' | 'type'>,
                    person: { id: itemType === "person" ? thisId : 0, name: "" },
                    work: { id: itemType === "work" ? thisId : 0, title: "" },
                    story: { id: itemType === "story" ? thisId : 0, title: "" }
                }] as AwardedRowData[],
        },
        onSubmit: async ({ value }) => {
            const response = await postApiContent('awarded', value, user);
            console.log(value);
            onClose();
        }
    })

    const filterAwards = async (event: any) => {
        const url = "awards/filter/" + event.query;
        const response = await getApiContent(url, user);
        const awards = response.data;
        setFilteredAwards(awards);
    }


    if (!data || isLoading) {
        return <ProgressSpinner />
    }
    console.log(data);
    return (
        <div className="card mt-3">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
            >
                <form.Field
                    name="id"
                    children={(field) => {
                        return (
                            <InputText
                                value={thisId}
                                name="id"
                                type="hidden"
                            />
                        )
                    }}
                />
                <form.Field
                    name="type"
                    children={(field) => {
                        return (
                            <InputText
                                value={typeId.toString()}
                                name="id"
                                type="hidden"
                            />
                        )
                    }}
                />
                <form.Field name="awards" mode="array">
                    {(field) => {
                        return (
                            <div className="mb-2">
                                {field.state.value?.map((_: any, i: number) => (
                                    <div key={`award-row-${i}`} className='grid gap-1'>
                                        <div className='col'>
                                            <form.Field key={`awardyear-${i}`} name={`awards[${i}].year`}>
                                                {(subField) => {
                                                    return (
                                                        <span className="p-float-label">
                                                            <InputNumber
                                                                value={subField.state.value}
                                                                onChange={(e) =>
                                                                    subField.handleChange(e.value ?? 0)
                                                                }
                                                                useGrouping={false}
                                                                name="year"
                                                            />
                                                            <label htmlFor="year">Vuosi</label>
                                                        </span>
                                                    )
                                                }}
                                            </form.Field>
                                        </div>
                                        <div className='col'>
                                            <form.Field
                                                key={`award-${i}`}
                                                name={`awards[${i}].award`}>
                                                {(subField) => {
                                                    return (
                                                        <span className="p-float-label">
                                                            <AutoComplete
                                                                value={subField.state.value}
                                                                id={subField.state.value.id?.toString()}
                                                                field="name"
                                                                completeMethod={filterAwards}
                                                                suggestions={filteredAwards}
                                                                onSelect={(e) => { subField.handleChange(e.value) }}
                                                                onChange={(e) => {
                                                                    subField.handleChange(e.value);
                                                                }}
                                                                minLength={3}
                                                                placeholder="Palkinto"
                                                                tooltip="Palkinto"
                                                                delay={300}
                                                                // onChange={(e) => subField.setValue(e.value.id)}
                                                                className='w-full'
                                                            />
                                                            <label htmlFor="award">Palkinto</label>
                                                        </span>
                                                    )
                                                }}
                                            </form.Field>
                                        </div>
                                        <div className='col'>
                                            <form.Field
                                                key={`category-${i}`}
                                                name={`awards[${i}].category`}>
                                                {(subField) => {
                                                    return (
                                                        <span className='p-float-label'>
                                                            <Dropdown
                                                                options={categories}
                                                                placeholder='Kategoria'
                                                                // id={subField.state.value.id.toString()}
                                                                id={subField.name}
                                                                value={subField.state.value}
                                                                optionLabel="name"
                                                                // optionValue="id"
                                                                // name="category"
                                                                className='w-full'
                                                                onChange={(e) => subField.handleChange(e.value)}
                                                                onBlur={subField.handleBlur}
                                                            />
                                                            <label htmlFor="category">Kategoria</label>
                                                        </span>
                                                    )
                                                }}
                                            </form.Field>
                                        </div>
                                        <Button
                                            onClick={() => field.removeValue(i)} type="button"
                                            icon="pi pi-trash"
                                            className='align-items-center mt-2 mb-2 h-3rem'
                                        />
                                    </div>
                                ))}
                                <Button
                                    onClick={() => field.pushValue(defaultValues)}
                                    type="button"
                                >
                                    Lisää palkinto
                                </Button>
                            </div>
                        )
                    }}
                </form.Field>
                <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                    children={([canSubmit, isSubmitting]) => (
                        <Button type="submit"
                            disabled={!canSubmit}
                            className='w-full justify-content-center'>
                            {isSubmitting ? '...' : 'Tallenna'}
                        </Button>
                    )}
                />
            </form>
        </div>
    )
}