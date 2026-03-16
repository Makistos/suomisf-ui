import { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Slider } from 'primereact/slider';

import { Person } from '../types';
import { WikiImageInfo, fetchPersonImagesFromApi } from './find-person-images';
import { postApiContent } from '../../../services/user-service';
import { getCurrenUser } from '../../../services/auth-service';

interface PersonImagePickerDialogProps {
    person: Person;
    visible: boolean;
    onHide: () => void;
    onSave?: () => void;
}

export const PersonImagePickerDialog = ({ person, visible, onHide, onSave }: PersonImagePickerDialogProps) => {
    const user = getCurrenUser();
    const [images, setImages] = useState<WikiImageInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<WikiImageInfo | null>(null);
    const [src, setSrc] = useState('');
    const [attr, setAttr] = useState('');
    const [license, setLicense] = useState('');
    const [saving, setSaving] = useState(false);
    const [limit, setLimit] = useState(10);
    const [noPicture, setNoPicture] = useState(false);

    const runSearch = (lim: number) => {
        setImages([]);
        setSelected(null);
        setSrc('');
        setAttr('');
        setLicense('');
        setNoPicture(false);
        setLoading(true);
        fetchPersonImagesFromApi(person.id, lim)
            .then((imgs: WikiImageInfo[]) => setImages(imgs))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (!visible) return;
        runSearch(limit);
    }, [visible, person.id]);

    const stripHtml = (html: string) => html.replace(/<[^>]+>/g, '').trim();

    const handleSelectNoPicture = () => {
        setSelected(null);
        setSrc('');
        setAttr('');
        setLicense('');
        setNoPicture(true);
    };

    const handleSelect = (img: WikiImageInfo) => {
        setNoPicture(false);
        setSelected(img);
        setSrc(img.url);
        setAttr(stripHtml(img.credit || ''));
        setLicense(img.license || '');
    };

    const handleSubmit = async () => {
        if (!src && !noPicture) return;
        setSaving(true);
        try {
            const saves: Promise<unknown>[] = [
                postApiContent(`person/${person.id}/images`, { src, attr, license }, user),
            ];
            if (selected?.descriptionUrl) {
                saves.push(postApiContent(`person/${person.id}/links`, {
                    link: selected.descriptionUrl,
                    description: 'Wikimedia Commons'
                }, user));
            }
            await Promise.all(saves);
            onSave?.();
            onHide();
        } finally {
            setSaving(false);
        }
    };

    const footer = (
        <div className="flex gap-2 justify-content-end">
            <Button label="Peruuta" icon="pi pi-times" className="p-button-text" onClick={onHide} disabled={saving} />
            <Button label="Tallenna" icon="pi pi-check" onClick={handleSubmit} disabled={!src && !noPicture || saving} loading={saving} />
        </div>
    );

    return (
        <Dialog
            header="Valitse kuva"
            visible={visible}
            onHide={onHide}
            className="w-full lg:w-8"
            footer={footer}
            blockScroll
            maximizable
        >
            {loading ? (
                <div className="flex justify-content-center p-4">
                    <ProgressSpinner />
                </div>
            ) : (
                <div className="flex flex-column gap-4">
                    <div className="flex flex-wrap gap-3">
                        <div
                            className={`cursor-pointer border-2 border-round p-1 flex align-items-center justify-content-center ${noPicture ? 'border-primary' : 'border-transparent surface-hover'}`}
                            style={{ width: 128, height: 160 }}
                            onClick={handleSelectNoPicture}
                            title="Ei kuvaa"
                        >
                            <div className="flex flex-column align-items-center gap-2 text-500">
                                <i className="pi pi-ban" style={{ fontSize: '2rem' }} />
                                <span className="text-sm">Ei kuvaa</span>
                            </div>
                        </div>
                    </div>
                    {person.images && person.images.length > 0 && (
                        <div>
                            <p className="text-600 mb-2">Tallennetut kuvat:</p>
                            <div className="flex flex-wrap gap-3">
                                {person.images.map((img) => (
                                    <div
                                        key={img.id}
                                        className={`cursor-pointer border-2 border-round p-1 ${src === img.src ? 'border-primary' : 'border-transparent surface-hover'}`}
                                        onClick={() => { setSrc(img.src); setAttr(img.attr); setLicense(img.license); setSelected(null); }}
                                        title={`${img.attr} — ${img.license}`}
                                    >
                                        <img
                                            src={img.src}
                                            alt={img.attr}
                                            style={{ width: 120, height: 160, objectFit: 'cover', display: 'block' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex align-items-center gap-3">
                        <span className="text-600 white-space-nowrap">Kuvia: {limit}</span>
                        <Slider
                            value={limit}
                            min={1}
                            max={100}
                            className="flex-1"
                            onChange={e => setLimit(e.value as number)}
                            onSlideEnd={e => runSearch(e.value as number)}
                        />
                    </div>
                    {images.length > 0 ? (
                        <div>
                            <p className="text-600 mb-2">Wikimedia-kuvat:</p>
                            <div className="flex flex-wrap gap-3">
                                {images.map((img, i) => (
                                    <div
                                        key={i}
                                        className={`cursor-pointer border-2 border-round p-1 ${selected?.url === img.url ? 'border-primary' : 'border-transparent surface-hover'}`}
                                        onClick={() => handleSelect(img)}
                                        title={`${img.credit} — ${img.license}`}
                                        style={{ width: 128 }}
                                    >
                                        <img
                                            src={img.url}
                                            alt={img.credit ?? ''}
                                            style={{ width: 120, height: 160, objectFit: 'cover', display: 'block' }}
                                        />
                                        <div className="text-xs text-500 mt-1">
                                            <div className="text-center">score: {img._score ?? 0}</div>
                                            {img.dimensions && (
                                                <div className="text-center">{img.dimensions.width}×{img.dimensions.height}</div>
                                            )}
                                            {img.scoring && Object.entries(img.scoring).map(([k, v]) => (
                                                <div key={k}>{k}: {v}</div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-600">Automaattisia kuvia ei löytynyt. Voit syöttää kuvan URL-osoitteen alla.</p>
                    )}

                    <div className="flex flex-column gap-3">
                        <div className="flex flex-column gap-1">
                            <label className="font-semibold">Kuvan URL *</label>
                            <InputText value={src} onChange={e => setSrc(e.target.value)} placeholder="https://..." className="w-full" />
                        </div>
                        <div className="flex flex-column gap-1">
                            <label className="font-semibold">Tekijätiedot</label>
                            <InputText value={attr} onChange={e => setAttr(e.target.value)} placeholder="Tekijä / Attribution" className="w-full" />
                        </div>
                        <div className="flex flex-column gap-1">
                            <label className="font-semibold">Lisenssi</label>
                            <InputText value={license} onChange={e => setLicense(e.target.value)} placeholder="esim. CC BY-SA 4.0" className="w-full" />
                        </div>
                    </div>

                    {src && (
                        <div>
                            <p className="font-semibold mb-2">Esikatselu:</p>
                            <img src={src} alt="Esikatselu" style={{ maxHeight: 200, objectFit: 'contain' }} className="border-round" />
                        </div>
                    )}
                </div>
            )}
        </Dialog>
    );
};
