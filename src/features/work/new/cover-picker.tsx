import { useState } from "react";
import { Dialog } from "primereact/dialog";

import { putApiContent } from "@services/user-service";
import type { User } from "@features/user";
import { thumbUrl } from "@utils/cover-url";
import type { CoverItem } from "../utils/work-facts";

interface Props {
    workId: number;
    covers: CoverItem[];
    /** work.cover_image_id: null = the page picks the first printing's cover. */
    chosen: number | null;
    user: User | null;
    visible: boolean;
    onHide: () => void;
    /** After a change is saved: refetch the work. */
    onSaved: () => void;
}

/** Admins pick which cover the work page shows (PUT /api/works/:id/cover), or let the page pick it. */
export const CoverPicker = ({ workId, covers, chosen, user, visible, onHide, onSaved }: Props) => {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const save = async (imageId: number | null) => {
        setSaving(true);
        setError(null);
        try {
            await putApiContent(`works/${workId}/cover`, { image_id: imageId }, user);
            onSaved();
            onHide();
        } catch {
            setError("Pääkuvan tallentaminen ei onnistunut.");
        } finally {
            setSaving(false);
        }
    };
    return (
        <Dialog header="Teossivun pääkuva" visible={visible} onHide={onHide} className="w-full lg:w-6" blockScroll>
            <p className="wn-pick-help">Valitse kansi, joka näytetään teossivulla. Kun painos on valittu, sivu näyttää sen painoksen kannen.</p>
            <div className="wn-pick" role="group" aria-label="Pääkuva">
                <button type="button" className="wn-pick-default" aria-pressed={chosen === null} disabled={saving} onClick={() => save(null)}>
                    Oletus<small>ensimmäisen painoksen kansi</small>
                </button>
                {covers.map(c => (
                    <button key={c.image.id} type="button" aria-pressed={chosen === c.image.id} disabled={saving}
                        aria-label={`Pääkuvaksi: ${c.caption}`} onClick={() => save(c.image.id)}>
                        <img src={thumbUrl(c.image)} alt="" loading="lazy" />
                        <small>{c.caption}</small>
                    </button>
                ))}
            </div>
            {error && <p className="wn-pick-error" role="alert">{error}</p>}
        </Dialog>
    );
};
