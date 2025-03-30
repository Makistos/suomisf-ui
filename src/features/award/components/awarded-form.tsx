import { useForm } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { ProgressSpinner } from 'primereact/progressspinner';
import { AwardCategory, Awarded, AwardedFormData } from '../types';
import { getApiContent } from '@services/user-service';
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
    storyId?: string
}

const defaultValues = {
    id: 0,
    award: { id: 0, name: "" },
    year: 0,
    category: { id: 0, name: "" },
    work: { id: 0, title: "" },
    person: { id: 0, name: "" },
    story: { id: 0, title: "" }

} as AwardedFormData;

const fetchWorkAwarded = async (id: string | null, user: User): Promise<Awarded[]> => {
    if (id === null) {
        return [];
    }
    const response = await getApiContent('work/' + id + '/awarded', user)
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

export const AwardedForm = ({ workId, personId, storyId }: AwardFormProps) => {
    const user = useMemo(() => getCurrenUser(), []);
    const itemType = workId ? "work" : personId ? "person" : "story";
    const typeId = workId ? 1 : personId ? 0 : 2;
    const thisId = itemType == "work" ? workId : itemType == "person" ? personId : storyId;
    const [filteredAwards, setFilteredAwards] = useState([]);
    const [categories, setCategories] = useState<AwardCategory[]>([]);

    if (!thisId || user === null) {
        return <div>Invalid ID</div>
    }

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
                itemType == "person" ? (await fetchPersonAwarded(thisId, user)).filter((awarded: Awarded) => awarded.category.type === typeId) : [];
        }
    })

    const form = useForm({
        defaultValues: {
            awards:
                data?.map((awarded: Awarded) => ({
                    id: Number(awarded.id || 0),
                    year: Number(awarded.year || 0),
                    award: awarded.award,
                    person: awarded.person,
                    work: awarded.work,
                    category: awarded.category,
                    story: awarded.story
                })) ??
                [{
                    id: 0,
                    year: 0,
                    award: { id: 0, name: "", description: "", domestic: false, categories: [], winners: [] },
                    person: { id: 0, name: "" },
                    work: { id: 0, title: "" },
                    category: { id: 0, name: "" },
                    story: { id: 0, title: "" }

                }],
        },
        onSubmit: async ({ value }) => {
            console.log(value);
        },
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
    return (
        <div className="card mt-3">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
            >
                <form.Field name="awards" mode="array">
                    {(field) => {
                        return (
                            <div className="mb-2">
                                {field.state.value.map((_, i) => (
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
                                            <form.Field key={`award-${i}`} name={`awards[${i}].award`}>
                                                {(subField) => {
                                                    return (
                                                        <span className="p-float-label">
                                                            <AutoComplete
                                                                value={subField.state.value.name}
                                                                id={subField.state.value.id.toString()}
                                                                field="name"
                                                                completeMethod={filterAwards}
                                                                suggestions={filteredAwards}
                                                                onSelect={(e) => { subField.setValue(e.value) }}
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
                                            <form.Field key={`category-${i}`} name={`awards[${i}].category`}>
                                                {(subField) => {
                                                    return (
                                                        <span className='p-float-label'>
                                                            <Dropdown
                                                                options={categories ?? []}
                                                                placeholder='Kategoria'
                                                                id={subField.state.value.id.toString()}
                                                                value={subField.state.value.id}
                                                                optionLabel="name"
                                                                optionValue="id"
                                                                name="category"
                                                                className='w-full'
                                                            />
                                                            <label htmlFor="category">Kategoria</label>
                                                        </span>
                                                    )
                                                }}
                                            </form.Field>
                                        </div>
                                        <Button onClick={() => field.removeValue(i)} type="button">
                                            Poista
                                        </Button>
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
                        <Button type="submit" disabled={!canSubmit}
                            className='w-full justify-content-center'>
                            {isSubmitting ? '...' : 'Tallenna'}

                        </Button>
                    )}
                />
            </form>
        </div>
    )
}