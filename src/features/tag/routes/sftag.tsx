import { useNavigate } from 'react-router-dom';
import React, { useState, useMemo, useRef } from 'react';
import { useParams } from "react-router-dom";
import { Controller, SubmitHandler, useForm } from "react-hook-form";

import { Button } from 'primereact/button';
import { ProgressSpinner } from "primereact/progressspinner";
import { SpeedDial } from 'primereact/speeddial';
import { Tooltip } from "primereact/tooltip";
import { Dialog } from 'primereact/dialog';
import { classNames } from "primereact/utils";
import { AutoComplete } from 'primereact/autocomplete';
import { ConfirmDialog } from 'primereact/confirmdialog';

import { getCurrenUser } from '@services/auth-service';
import { WorkList } from '@features/work';
import { Short, ShortsList, ShortType } from '@features/short';
import { ArticleList } from '@features/article';
import { SfTagProps } from '../types';
import { SfTagForm } from '../components/sftag-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Toast } from 'primereact/toast';
import { getTag } from '@api/tag/get-tag';
import { mergeTags } from '@api/tag/merge-tags';
import { Tag } from 'primereact/tag';
import { tagTypeToSeverity } from '../components/tag-type-to-severity';
import { deleteTag } from '@api/tag/delete-tag';
import { filterTags } from '@api/tag/filter-tags';
import _ from 'lodash';
import { getShortTypes } from '@features/short/utils/get-short-types';
import { TabPanel, TabView } from 'primereact/tabview';
import { Card } from 'primereact/card';
import { isAdmin } from '@features/user';


export const SFTag = ({ id }: SfTagProps) => {
    const params = useParams();
    const [displayChangeName, setDisplayChangeName] = useState(false);
    const [displayMerge, setDisplayMerge] = useState(false);
    const [displayDelete, setDisplayDelete] = useState(false);
    const [loading, setLoading] = useState(false);
    const user = useMemo(() => { return getCurrenUser() }, []);
    const navigate = useNavigate();
    const toastRef = useRef<Toast>(null);
    const [shortTypes, setShortTypes]: [ShortType[], (shortTypes: ShortType[]) => void] = useState<ShortType[]>([]);

    const dialogFuncMap: Record<string, React.Dispatch<React.SetStateAction<boolean>>> = {
        'displayChangeName': setDisplayChangeName,
        'displayMerge': setDisplayMerge,
        'displayDelete': setDisplayDelete
    }

    const queryClient = useQueryClient();

    const onSpeeddialClick = (name: string) => {
        dialogFuncMap[`${name}`](true);
    }

    const onHide = (name: string) => {
        dialogFuncMap[`${name}`](false);
    }

    const dialItems = [
        {
            label: 'Muokkaa',
            icon: 'fa-solid fa-pen-to-square',
            command: () => {
                onSpeeddialClick('displayChangeName');
            }
        },
        {
            label: 'Yhdistä',
            icon: 'fa-solid fa-object-ungroup',
            command: () => {
                onSpeeddialClick('displayMerge');
            }
        },
        {
            label: 'Poista',
            icon: 'fa-solid fa-trash-can',
            //disabled: { deleteDisabled },
            command: () => {
                onSpeeddialClick('displayDelete');
            }
        }
    ]

    const { isLoading, data } = useQuery({
        queryKey: ['tags', params.tagid],
        queryFn: () => getTag(Number(params.tagid), user)
    })

    const MergeTagsDialog = () => {
        type TagTypeInfo = {
            id: number,
            name: string
        }
        const { control, handleSubmit } = useForm<Record<string, TagTypeInfo>>();
        const [filteredTags, setFilteredTags] = useState<any>(null);
        const [selectedTag, setSelectedTag] = useState<any>(null);
        const mergeTagsSubmit: SubmitHandler<Record<string, TagTypeInfo>> = (data) => {
            const source = Number(data.name.id);
            if (source && params.tagid) {
                mergeTags(Number(params.tagid), source, user);
            }
            onHide('displayMerge');
        }

        async function getTags(query: string) {
            try {
                const response = await filterTags(query, user);
                setFilteredTags(response);
            } catch (e) {
                console.error(e);
            }
        }
        const searchTags = (event: any) => {
            getTags(event.query);
        }

        const selectTag = (tag: TagTypeInfo) => {
            setSelectedTag(null);
        }

        const searchText = (str: string) => {
            if (str.length > 300) {
                str = str.slice(0, 298);
                str = str + "...";
            }
            let tmp = document.createElement("DIV");
            tmp.innerHTML = str;
            return tmp.textContent || tmp.innerText || "";
        }

        const tagTemplate = (item: any) => {
            return (
                <div>
                    <span>{searchText(item.name)}</span>
                </div>
            )
        }
        return (
            <div className="grid col justify-content-center">
                <form onSubmit={handleSubmit(mergeTagsSubmit)}>
                    <div className="grid col mt-3">
                        <span className="grid col">
                            <label htmlFor="name" >Yhdistettävä asiasana</label>
                            <Controller name="name" control={control}
                                render={({ field, fieldState }) => (
                                    <AutoComplete
                                        id={field.name}
                                        value={field.value}
                                        field="name"
                                        onChange={(e) => field.onChange(e.target.value)}
                                        completeMethod={searchTags}
                                        suggestions={filteredTags}
                                        itemTemplate={tagTemplate}
                                        delay={800}
                                        minLength={2}
                                        scrollHeight="400px"
                                        className={classNames({ 'p-invalid': fieldState.error }, 'w-full')} />
                                )} />
                        </span>
                    </div>
                    <div className="grid col">
                        <Button type="submit" className="w-full justify-content-center">
                            Yhdistä
                        </Button>
                    </div>
                </form>
            </div>
        )
    }

    const deleteTagFunc = () => {
        if (data) {
            deleteTag(data.id);
            queryClient.invalidateQueries({ queryKey: ['tags'] });
            navigate(-1);
        }
    }

    const onTagSubmit = (status: boolean, message: string) => {
        queryClient.invalidateQueries({ queryKey: ["tags"] });
        if (status) {
            toastRef.current?.show({ severity: 'success', summary: 'Tallentaminen onnistui', detail: 'Tietojen päivitys onnistui', life: 4000 });
        } else {
            toastRef.current?.show({ severity: 'error', summary: 'Tietojen tallentaminen epäonnistui', detail: message, life: 6000 });
        }
        onHide('displayChangeName');
    }

    return (
        <main className="sftag-page">
            <Toast ref={toastRef} />

            {isAdmin(user) && (
                <SpeedDial
                    model={dialItems}
                    direction="up"
                    className="fixed-dial"
                    showIcon="pi pi-plus"
                    hideIcon="pi pi-times"
                    buttonClassName="p-button-primary"
                />
            )}

            {isLoading ? (
                <div className="flex justify-content-center">
                    <ProgressSpinner />
                </div>
            ) : (
                data && (
                    <div className="grid">
                        {/* Header Section */}
                        <div className="col-12">
                            <Card className="shadow-3">
                                <div className="grid">
                                    <div className="col-12 lg:col-9">
                                        <div className="flex-column">
                                            <h1 className="text-4xl font-bold m-0">{data.name}</h1>
                                            <Tag value={data?.type?.name}
                                                severity={data ? tagTypeToSeverity(data) : undefined}
                                            />
                                            {data.description && (
                                                <div className="mt-3 line-height-3"
                                                    dangerouslySetInnerHTML={{ __html: data.description }}>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats on right side */}
                                    <div className="col-12 lg:col-3">
                                        <div className="flex flex-column gap-4">
                                            <div className="flex flex-column gap-2">
                                                <h3 className="text-sm uppercase text-600 m-0">Teoksia</h3>
                                                <span className="text-xl">{data.works?.length}</span>
                                            </div>
                                            <div className="flex flex-column gap-2">
                                                <h3 className="text-sm uppercase text-600 m-0">Novelleja</h3>
                                                <span className="text-xl">{data.stories?.length}</span>
                                            </div>
                                            <div className="flex flex-column gap-2">
                                                <h3 className="text-sm uppercase text-600 m-0">Artikkeleita</h3>
                                                <span className="text-xl">{data.articles?.length}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Main Content */}
                        <div className="col-12">
                            <TabView className="shadow-2">
                                <TabPanel header="Teokset" leftIcon="pi pi-book">
                                    <div className="card min-w-full">
                                        {data.works &&
                                            <WorkList works={data?.works} />
                                        }
                                    </div>
                                </TabPanel>
                                <TabPanel header="Novellit" leftIcon="pi pi-file">
                                    <div className="card min-w-full">
                                        {data.stories &&
                                            <ShortsList shorts={data?.stories} />
                                        }
                                    </div>
                                </TabPanel>
                                <TabPanel header="Artikkelit" leftIcon="pi pi-file">
                                    <div className="card min-w-full">
                                        {data.articles &&
                                            <ArticleList articles={data?.articles} />
                                        }
                                    </div>
                                </TabPanel>
                            </TabView>
                        </div>

                        {/* Dialogs */}
                        <Dialog
                            header="Muokkaa" visible={displayChangeName} onHide={() => onHide('displayChangeName')}
                            className="w-full xl:w-6"
                        >
                            <SfTagForm tagId={(data && data.id) ? data.id : null}
                                onSubmitCallback={onTagSubmit} />
                        </Dialog>
                    </div>
                )
            )}
        </main>
    );
};
