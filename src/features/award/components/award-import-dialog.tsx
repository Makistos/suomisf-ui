import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";

import { getCurrenUser } from "../../../services/auth-service";
import {
    getApiContent,
    postApiContent,
    HttpStatusResponse,
} from "../../../services/user-service";
import { AwardImportEntry, AwardImportPreview } from "../types";

interface AwardImportDialogProps {
    awardId: number;
    awardName: string;
    visible: boolean;
    onHide: () => void;
    onSaved: () => void;
}

type Row = AwardImportEntry & { _key: number };

const statusMeta: Record<
    AwardImportEntry["status"],
    { label: string; severity: "success" | "info" | "warning" | "danger" }
> = {
    new: { label: "Uusi", severity: "success" },
    awarded: { label: "Jo tietokannassa", severity: "info" },
    not_found: { label: "Ei löydy", severity: "warning" },
    ambiguous: { label: "Monta osumaa", severity: "danger" },
};

export const AwardImportDialog = ({
    awardId,
    awardName,
    visible,
    onHide,
    onSaved,
}: AwardImportDialogProps) => {
    const user = useMemo(() => getCurrenUser(), []);
    const toast = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<AwardImportPreview | null>(null);
    const [rows, setRows] = useState<Row[]>([]);
    const [selected, setSelected] = useState<Row[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!visible) return;
        let active = true;
        setLoading(true);
        setPreview(null);
        setRows([]);
        setSelected([]);
        getApiContent(`awards/${awardId}/import/preview`, user)
            .then((res) => {
                if (!active) return;
                const data: AwardImportPreview = res.data;
                const withKeys: Row[] = data.entries.map((e, i) => ({
                    ...e,
                    _key: i,
                }));
                setPreview(data);
                setRows(withKeys);
                // Pre-select all savable (new) entries.
                setSelected(withKeys.filter((e) => e.status === "new"));
            })
            .catch((err) => {
                if (!active) return;
                toast.current?.show({
                    severity: "error",
                    summary: "Esikatselu epäonnistui",
                    detail: err?.response ?? String(err),
                    sticky: true,
                });
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [visible, awardId, user]);

    const onSave = async () => {
        setSaving(true);
        const winners = selected.map((e) => ({
            match_type: e.match_type,
            target_id: e.target_id,
            category_id: e.category_id,
            year: e.year,
        }));
        try {
            const res: HttpStatusResponse = await postApiContent(
                `awards/${awardId}/import`,
                { data: { winners } },
                user
            );
            if (res.status === 200 || res.status === 201) {
                const raw: any = res.response;
                const payload = raw?.response ?? raw;
                const created = payload?.created ?? winners.length;
                toast.current?.show({
                    severity: "success",
                    summary: "Tallennettu",
                    detail: `Lisätty ${created} voittajaa`,
                });
                onSaved();
                onHide();
            } else {
                toast.current?.show({
                    severity: "error",
                    summary: "Tallennus epäonnistui",
                    detail: res.response,
                    sticky: true,
                });
            }
        } catch (err: any) {
            toast.current?.show({
                severity: "error",
                summary: "Tallennus epäonnistui",
                detail: err?.response ?? String(err),
                sticky: true,
            });
        } finally {
            setSaving(false);
        }
    };

    const statusBody = (row: Row) => {
        const m = statusMeta[row.status];
        return <Tag value={m.label} severity={m.severity} />;
    };

    const matchBody = (row: Row) => row.target_title ?? "—";

    const counts = preview?.counts ?? {};
    const footer = (
        <div className="flex justify-content-between align-items-center">
            <span className="text-sm text-color-secondary">
                Uusia {counts.new ?? 0}, jo tietokannassa {counts.awarded ?? 0},
                ei löydy {counts.not_found ?? 0}, monta osumaa{" "}
                {counts.ambiguous ?? 0}
            </span>
            <div className="flex gap-2">
                <Button
                    label="Peruuta"
                    icon="pi pi-times"
                    className="p-button-text"
                    onClick={onHide}
                    disabled={saving}
                />
                <Button
                    label={`Tallenna valitut (${selected.length})`}
                    icon="pi pi-save"
                    onClick={onSave}
                    disabled={saving || selected.length === 0}
                    loading={saving}
                />
            </div>
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                header={`Tuo voittajat ISFDB:stä – ${awardName}`}
                visible={visible}
                onHide={onHide}
                maximizable
                blockScroll
                style={{ width: "80vw" }}
                footer={loading ? undefined : footer}
            >
                {loading ? (
                    <div className="flex flex-column align-items-center gap-3 p-5">
                        <ProgressSpinner />
                        <span>Haetaan tietoja ISFDB:stä…</span>
                    </div>
                ) : preview ? (
                    <>
                        {preview.errors.length > 0 && (
                            <Message
                                severity="warn"
                                className="mb-3 w-full justify-content-start"
                                text={`Osa lähteistä epäonnistui: ${preview.errors.join(
                                    "; "
                                )}`}
                            />
                        )}
                        <p className="mt-0 text-sm text-color-secondary">
                            Vain uudet osumat voidaan valita. Jo tietokannassa
                            olevia ei muuteta.
                        </p>
                        <DataTable
                            value={rows}
                            dataKey="_key"
                            selectionMode="multiple"
                            selection={selected}
                            onSelectionChange={(e) =>
                                setSelected(e.value as Row[])
                            }
                            isDataSelectable={(o: any) =>
                                (o?.data ?? o)?.status === "new"
                            }
                            scrollable
                            scrollHeight="60vh"
                            size="small"
                            removableSort
                        >
                            <Column
                                selectionMode="multiple"
                                headerStyle={{ width: "3rem" }}
                            />
                            <Column header="Tila" body={statusBody} />
                            <Column field="year" header="Vuosi" sortable />
                            <Column
                                field="title"
                                header="Nimi (ISFDB)"
                                sortable
                            />
                            <Column header="Vastaavuus" body={matchBody} />
                            <Column
                                field="our_category"
                                header="Kategoria"
                                sortable
                            />
                            <Column field="author" header="Tekijä" sortable />
                        </DataTable>
                    </>
                ) : null}
            </Dialog>
        </>
    );
};
