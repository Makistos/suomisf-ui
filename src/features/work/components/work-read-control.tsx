import { useState } from "react";
import { SelectButton, SelectButtonChangeEvent } from "primereact/selectbutton";
import { Tooltip } from "primereact/tooltip";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
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

// Same limit as the userwork.description column.
const NOTE_MAX = 500;

/**
 * Work-level "read" control for the logged-in user. A three-way selector
 * (didn't like / it was ok / liked) that doubles as the read flag: any
 * selection marks the work read, deselecting unmarks it. Like the condition
 * of an owned edition, choosing an opinion opens a dialog for a note
 * ("Lisätietoja"); the comment button next to the thumbs edits it later.
 */
export const WorkReadControl = ({ workId }: WorkReadControlProps) => {
    const { isRead, opinionOf, descriptionOf, setRead, unsetRead } = useReadWorks();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [draft, setDraft] = useState("");

    const read = isRead(workId);
    const value = read ? opinionOf(workId) : null;
    const note = read ? descriptionOf(workId) : null;

    const openDialog = () => {
        setDraft(descriptionOf(workId) ?? "");
        setDialogOpen(true);
    };

    const onChange = (e: SelectButtonChangeEvent) => {
        if (e.value === null || e.value === undefined) {
            unsetRead(workId);
        } else {
            // The opinion is saved at once; the dialog only adds the note.
            setRead(workId, e.value);
            openDialog();
        }
        // Drop focus from the clicked thumb so the theme's focus/active
        // background doesn't linger and keep it looking selected.
        const target = e.originalEvent?.currentTarget as HTMLElement | undefined;
        target?.blur?.();
    };

    const saveNote = (e: React.FormEvent) => {
        e.preventDefault();
        setRead(workId, opinionOf(workId), draft);
        setDialogOpen(false);
    };

    const itemTemplate = (option: ReadOption) => (
        <span className="work-read-opt" data-pr-tooltip={option.tooltip}>
            <i className={option.icon} />
        </span>
    );

    return (
        <div className="flex flex-column gap-2 pt-3">
            <Tooltip target=".work-read-opt, .work-read-note" position="top" />
            <div className="flex align-items-center gap-1">
                <SelectButton
                    value={value}
                    options={readOptions}
                    onChange={onChange}
                    itemTemplate={itemTemplate}
                    optionValue="value"
                    // Names each button for screen readers (the template shows only an icon).
                    optionLabel="tooltip"
                    allowEmpty
                    className="work-read-select"
                    aria-label="Merkitse teos luetuksi ja arvioi se"
                />
                {read && (
                    <Button
                        type="button"
                        icon={note ? "pi pi-comment" : "pi pi-pencil"}
                        text rounded size="small"
                        className="work-read-note"
                        data-pr-tooltip={note ?? "Lisää lisätietoja"}
                        aria-label={note ? `Lisätietoja: ${note}` : "Lisää lisätietoja"}
                        onClick={openDialog}
                    />
                )}
            </div>
            <Dialog blockScroll
                visible={dialogOpen}
                onHide={() => setDialogOpen(false)}
                header="Luettu"
                style={{ width: "min(30rem, 95vw)" }}
            >
                <form onSubmit={saveNote} className="mt-1">
                    <div className="field">
                        <label htmlFor={`read-note-${workId}`}>Lisätietoja</label>
                        <InputTextarea
                            id={`read-note-${workId}`}
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            maxLength={NOTE_MAX}
                            rows={3}
                            autoResize
                            autoFocus
                            className="w-full"
                        />
                    </div>
                    <Button type="submit" className="w-full justify-content-center">Tallenna</Button>
                </form>
            </Dialog>
        </div>
    );
};
