import React, { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { ProgressSpinner } from 'primereact/progressspinner';

import { Person } from '../types';
import { WikimediaImage, findWikimediaImages } from './person-image-picker';
import { postApiContent } from '../../../services/user-service';
import { getCurrenUser } from '../../../services/auth-service';

interface PersonImagePickerDialogProps {
    person: Person;
    visible: boolean;
    onHide: () => void;
}

export const PersonImagePickerDialog = ({ person, visible, onHide }: PersonImagePickerDialogProps) => {
    const user = getCurrenUser();
    const [images, setImages] = useState<WikimediaImage[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<WikimediaImage | null>(null);
    const [src, setSrc] = useState('');
    const [attr, setAttr] = useState('');
    const [license, setLicense] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!visible) return;
        setImages([]);
        setSelected(null);
        setSrc('');
        setAttr('');
        setLicense('');
        setLoading(true);
        findWikimediaImages({
            qid: person.qid || undefined,
            fullname: person.fullname || undefined,
            alt_name: person.alt_name || undefined,
            name: person.name,
        }).then(imgs => {
            setImages(imgs);
        }).finally(() => setLoading(false));
    }, [visible, person.id]);

    const handleSelect = (img: WikimediaImage) => {
        setSelected(img);
        setSrc(img.url);
        setAttr(img.author);
        setLicense(img.license);
    };

    const handleSubmit = async () => {
        if (!src) return;
        setSaving(true);
        try {
            await postApiContent(`person/${person.id}/images`, { src, attr, license }, user);
            onHide();
        } finally {
            setSaving(false);
        }
    };

    const footer = (
        <div className="flex gap-2 justify-content-end">
            <Button label="Peruuta" icon="pi pi-times" className="p-button-text" onClick={onHide} disabled={saving} />
            <Button label="Tallenna" icon="pi pi-check" onClick={handleSubmit} disabled={!src || saving} loading={saving} />
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
                    {images.length > 0 ? (
                        <div>
                            <p className="text-600 mb-2">Valitse kuva alla olevista vaihtoehdoista:</p>
                            <div className="flex flex-wrap gap-3">
                                {images.map((img, i) => (
                                    <div
                                        key={i}
                                        className={`cursor-pointer border-2 border-round p-1 ${selected?.url === img.url ? 'border-primary' : 'border-transparent surface-hover'}`}
                                        onClick={() => handleSelect(img)}
                                        title={`${img.author} — ${img.license}`}
                                    >
                                        <img
                                            src={img.url}
                                            alt={img.author}
                                            style={{ width: 120, height: 160, objectFit: 'cover', display: 'block' }}
                                        />
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
