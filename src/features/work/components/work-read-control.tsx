import { SelectButton, SelectButtonChangeEvent } from "primereact/selectbutton";
import { Tooltip } from "primereact/tooltip";
import { Button } from "primereact/button";

import { useReadWorks } from "../utils/use-read-works";

interface WorkReadControlProps {
    workId: number;
}

interface ReadOption {
    value: number;
    icon: string;
    tooltip: string;
}

// Left = didn't like, middle = neutral, right = liked. Selecting any option
// marks the work read; clicking the selected one again clears it (not read).
const readOptions: ReadOption[] = [
    { value: -1, icon: "pi pi-thumbs-down", tooltip: "En pitänyt" },
    { value: 0, icon: "pi pi-minus-circle", tooltip: "Ihan ok" },
    { value: 1, icon: "pi pi-thumbs-up", tooltip: "Pidin" },
];

/**
 * Work-level "read" control for the logged-in user. A three-way selector
 * (didn't like / it was ok / liked) that doubles as the read flag: any
 * selection marks the work read, deselecting unmarks it.
 */
export const WorkReadControl = ({ workId }: WorkReadControlProps) => {
    const { isRead, opinionOf, setRead, unsetRead } = useReadWorks();

    const read = isRead(workId);
    const value = read ? opinionOf(workId) : null;

    const onChange = (e: SelectButtonChangeEvent) => {
        if (e.value === null || e.value === undefined) {
            unsetRead(workId);
        } else {
            setRead(workId, e.value);
        }
    };

    const itemTemplate = (option: ReadOption) => (
        <span className="work-read-opt" data-pr-tooltip={option.tooltip}>
            <i className={option.icon} />
        </span>
    );

    return (
        <div className="flex flex-column gap-2 pt-3">
            <Tooltip target=".work-read-opt" position="top" />
            <SelectButton
                value={value}
                options={readOptions}
                onChange={onChange}
                itemTemplate={itemTemplate}
                optionValue="value"
                allowEmpty
                className="work-read-select"
                aria-label="Merkitse teos luetuksi ja arvioi se"
            />
            {read ? (
                <Button
                    label="Poista lukumerkintä"
                    icon="pi pi-times"
                    text
                    className="p-0 text-500 justify-content-start"
                    onClick={() => unsetRead(workId)}
                />
            ) : (
                <small className="text-500">
                    Merkitse luetuksi valitsemalla arvio
                </small>
            )}
        </div>
    );
};
