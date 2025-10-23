/**
 * Control that allows user to pick works for an omnibus.
 *
 * Contains a control for picking author and when selected, fills another
 * with works written by that author.
 *
 * Main control shows the works for the selected omnibus. This list
 * can be edited by adding or removing items and by reordering them.
 */
import { useEffect, useMemo, useState } from "react";

import { AutoComplete } from "primereact/autocomplete";
import { OrderList } from "primereact/orderlist";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useQueryClient } from "@tanstack/react-query";

import { getCurrenUser } from "@services/auth-service";
import { Person } from "@features/person";
import { Work, OmnibusItem } from "../types";
import { useFilterPeople } from "@hooks/use-people-filter";
import { getApiContent } from "@services/user-service";
import { getWorksByAuthor } from "@api/work/get-works-by-author";
import { saveOmnibusWorks, OmnibusData, OmnibusWorkData } from "@api/work/save-omnibus-works";

type PickerProps = {
    id: string;
    onClose: () => void;
};

interface OmnibusWork {
    id: number;
    author_str: string;
    title: string;
    orig_title: string;
    pubyear: number;
    explanation?: string;
}

export const WorkOmnibusPicker = ({ id, onClose }: PickerProps) => {
    const user = useMemo(() => getCurrenUser(), []);
    const [works, setWorks] = useState<OmnibusWork[]>([]);
    const queryClient = useQueryClient();

    useEffect(() => {
        const getOmnibusWorks = async () => {
            try {
                const response = await getApiContent(`works/${id}/omnibus`, user);
                // Handle the new backend structure - list of omnibus items
                let omnibusWorks: OmnibusWork[] = [];

                omnibusWorks = response.data.map((item: OmnibusItem) => ({
                    id: item.work.id,
                    author_str: item.work.author_str,
                    title: item.work.title,
                    orig_title: item.work.orig_title,
                    pubyear: item.work.pubyear,
                    explanation: item.explanation || "",
                }));
                setWorks(omnibusWorks);
            } catch (error) {
                console.error("Error fetching omnibus works:", error);
                setWorks([]);
            }
        };
        if (id) {
            getOmnibusWorks();
        }
    }, [id, user]);

    const saveWorksToOmnibus = async (works: OmnibusWork[]): Promise<number> => {
        try {
            const worksData: OmnibusWorkData[] = works.map((work) => ({
                id: work.id,
                explanation: work.explanation || undefined
            }));
            const data: OmnibusData = { omnibus: parseInt(id), works: worksData };
            const response = await saveOmnibusWorks(data);
            onClose();
            queryClient.invalidateQueries({ queryKey: ["work", id] });
            return response.status || 200;
        } catch (error) {
            console.error("Error saving omnibus works:", error);
            return 500;
        }
    };

    return (
        <>
            <OmnibusPicker source={works} saveCallback={saveWorksToOmnibus} />
        </>
    );
};

interface OmnibusPickerProps {
    source: OmnibusWork[];
    saveCallback: (works: OmnibusWork[]) => Promise<number>;
}

const OmnibusPicker = ({ source, saveCallback }: OmnibusPickerProps) => {
    const user = getCurrenUser();
    // Person selected in the dropdown
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    // Works written by selected person
    const [personWorks, setPersonWorks] = useState<Work[]>([]);
    // Works that have been selected for this omnibus
    const [selectedOmnibusWorks, setSelectedOmnibusWorks] = useState<OmnibusWork[]>([]);
    // Work selected in the dropdown
    const [selectedWork, setSelectedWork] = useState<Work | null>(null);
    // People matching search query
    const [filteredPeople, setFilteredPeople] = useState<any>([]);

    const [hasChanged, setHasChanged] = useState(false);

    useEffect(() => {
        const getWorks = async () => {
            if (selectedPerson !== null && selectedPerson !== undefined) {
                try {
                    const works = await getWorksByAuthor(selectedPerson.id);
                    setPersonWorks(works);
                } catch (error) {
                    console.error("Error fetching works by author:", error);
                    setPersonWorks([]);
                }
            }
        };
        getWorks();
    }, [selectedPerson]);

    useEffect(() => {
        // Sort the source works by ID when setting them
        const sortedSource = source;
        setSelectedOmnibusWorks(sortedSource);
    }, [source]);

    async function filterPeople(event: any) {
        const url = "filter/people/" + event.query;
        try {
            const response = await getApiContent(url, user);
            const p = response.data;
            setFilteredPeople(p);
            return p;
        } catch (error) {
            console.error("Error filtering people:", error);
            setFilteredPeople([]);
            return [];
        }
    }

    const addToSelected = () => {
        if (selectedWork === null) {
            return;
        }

        // Check if work is already in the list
        if (selectedOmnibusWorks.some(work => work.id === selectedWork.id)) {
            return;
        }

        const omnibusWork: OmnibusWork = {
            id: selectedWork.id,
            author_str: selectedWork.author_str,
            title: selectedWork.title,
            orig_title: selectedWork.orig_title,
            pubyear: selectedWork.pubyear,
            explanation: "",
        };

        const newWorks = [...selectedOmnibusWorks, omnibusWork];
        setSelectedOmnibusWorks(newWorks);
        setHasChanged(true);
    };

    const removeFromSelected = (id: number) => {
        const newWorks = selectedOmnibusWorks.filter((work) => work.id !== id);
        setSelectedOmnibusWorks(newWorks);
        setHasChanged(true);
    };

    const updateExplanation = (workId: number, explanation: string) => {
        const updatedWorks = selectedOmnibusWorks.map((work) =>
            work.id === workId ? { ...work, explanation } : work
        );
        setSelectedOmnibusWorks(updatedWorks);
        setHasChanged(true);
    };

    const itemTemplate = (item: OmnibusWork) => {
        return (
            <div className="flex flex-column p-2 border-1 border-200 mb-2">
                <div className="flex mb-2">
                    <div className="flex-1 flex-column mr-2">
                        <small className="text-600">Tekijä</small>
                        <div>{item.author_str}</div>
                    </div>
                    <div className="flex-1 flex-column mr-2">
                        <small className="text-600">Nimeke</small>
                        <div><b>{item.title}</b></div>
                    </div>
                    <div className="flex-1 flex-column mr-2">
                        <small className="text-600">Alkuperäinen nimeke</small>
                        <div>{item.orig_title && item.orig_title !== item.title ? item.orig_title : "-"}</div>
                    </div>
                    <div className="flex-none mr-2" style={{ width: '80px' }}>
                        <small className="text-600">Vuosi</small>
                        <div>{item.pubyear || "-"}</div>
                    </div>
                    <div className="flex-none">
                        <Button
                            type="button"
                            icon="pi pi-times"
                            severity="danger"
                            size="small"
                            tooltip="Poista"
                            onClick={() => removeFromSelected(item.id)}
                        />
                    </div>
                </div>
                <div className="flex">
                    <div className="flex-1">
                        <small className="text-600">Selitys</small>
                        <InputText
                            value={item.explanation || ""}
                            placeholder="Lisää selitys..."
                            className="w-full"
                            onChange={(e) => updateExplanation(item.id, e.target.value)}
                            onKeyDown={(e) => {
                                // Prevent OrderList from intercepting key events
                                e.stopPropagation();
                            }}
                            onKeyUp={(e) => {
                                // Prevent OrderList from intercepting key events
                                e.stopPropagation();
                            }}
                            onKeyPress={(e) => {
                                // Prevent OrderList from intercepting key events
                                e.stopPropagation();
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    };

    const dropDownWorkTemplate = (item: Work) => {
        let workTitle = item.title;
        if (item.orig_title && item.orig_title !== item.title) {
            workTitle += ` (${item.orig_title})`;
        }
        if (item.pubyear) {
            workTitle += ` (${item.pubyear})`;
        }
        return <div>{workTitle}</div>;
    };

    const clearPerson = () => {
        setSelectedPerson(null);
        setPersonWorks([]);
    };

    const personTemplate = (item: Person) => {
        return (
            <div className="flex align-items-stretch">
                <div className="flex justify-content-center">
                    <b>{item.name}</b>
                </div>
                <div className="flex justify-content-center">
                    {item.nationality && <i>{item.nationality.name}</i>}
                </div>
                <div className="flex justify-content-center">
                    ({item.dob} - {item.dod})
                </div>
            </div>
        );
    };

    const onSave = async (works: OmnibusWork[]) => {
        await saveCallback(works);
    };

    return (
        <div className="card mt-3">
            <div className="grid">
                <div className="flex flex-stretch field col-12 align-items-center justify-content-center">
                    <div className="grid col-12 align-items-center justify-content-center">
                        <span className="p-float-label mr-3">
                            <AutoComplete
                                field="name"
                                delay={500}
                                minLength={2}
                                name="people"
                                value={selectedPerson?.name}
                                suggestions={filteredPeople}
                                completeMethod={filterPeople}
                                onSelect={(e) => setSelectedPerson(e.value)}
                                onClear={() => clearPerson()}
                                itemTemplate={personTemplate}
                            />
                            <label htmlFor="people">Henkilö</label>
                        </span>
                        <span className="p-float-label mr-3">
                            <Dropdown
                                name="works"
                                options={personWorks}
                                value={selectedWork}
                                onChange={(e) => setSelectedWork(e.value)}
                                optionLabel="title"
                                itemTemplate={dropDownWorkTemplate}
                                filter
                                className="w-20rem"
                            />
                            <label htmlFor="works">Teokset</label>
                        </span>
                        <span>
                            <Button onClick={addToSelected} disabled={selectedWork === null}>
                                Lisää
                            </Button>
                        </span>
                    </div>
                </div>
                <div className="field col-12">
                    <h4 className="mb-2">Valitut teokset</h4>
                    <small className="text-600 mb-2 block">
                        Voit järjestellä teoksia vetämällä ja pudottamalla. Lisää selitykseen tietoa siitä, miten teos esiintyy kokoomateoksessa.
                    </small>
                    {selectedOmnibusWorks && (
                        <OrderList
                            dataKey="id"
                            value={selectedOmnibusWorks}
                            onChange={(e) => setSelectedOmnibusWorks(e.value)}
                            itemTemplate={itemTemplate}
                            dragdrop
                        />
                    )}
                </div>
                <div className="field col-12">
                    <Button
                        className="w-full justify-content-center"
                        onClick={() => onSave(selectedOmnibusWorks)}
                    >
                        Tallenna
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default OmnibusPicker;