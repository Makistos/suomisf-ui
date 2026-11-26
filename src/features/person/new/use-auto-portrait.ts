import { useEffect, useEffectEvent, useRef } from "react";

import { useGlobalToast } from "@components/global-toast";
import { postApiContent } from "@services/user-service";
import type { User } from "@features/user";
import { useWikimediaImage, type WikiImageInfo } from "../hooks/use-wikimedia-image";
import type { Person } from "../types";

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, "").trim();

/**
 * The old person page's picture lookup, for the new page (person-details.tsx): when an admin opens a person with no image
 * record at all, look for a free picture (Wikimedia, through the backend), show it, save it and its Commons link, and say
 * what happened. An admin's "Ei kuvaa" choice is an image record without a picture, so it stops the lookup.
 */
export const useAutoPortrait = (loaded: Person | undefined, admin: boolean, user: User | null): WikiImageInfo | null => {
    // Called before the page knows the person; does nothing until it does.
    const person = loaded ?? ({ id: 0, images: [] } as unknown as Person);
    const hasImageRecord = (person.images?.length ?? 0) > 0;
    const { imageInfo, isLoading } = useWikimediaImage(person, !!loaded && !hasImageRecord && admin);
    const showToast = useGlobalToast();
    const wasLoading = useRef(false);
    // The person whose picture was saved: the page can move to another person without remounting.
    const savedFor = useRef<number | null>(null);

    useEffect(() => {
        if (isLoading) {
            wasLoading.current = true;
        } else if (wasLoading.current) {
            wasLoading.current = false;
            showToast(imageInfo
                ? { severity: "success", summary: "Kuva lisätty", life: 3000 }
                : { severity: "info", summary: "Kuvia ei löytynyt", life: 3000 });
        }
    }, [isLoading, imageInfo, showToast]);

    // Reads the current person when the found picture changes, so one person's picture is never saved onto the next.
    const save = useEffectEvent((info: WikiImageInfo) => {
        if (!loaded || hasImageRecord || savedFor.current === person.id || String(person.qid) === "0" || !admin) return;
        savedFor.current = person.id;
        const saves = [postApiContent(`person/${person.id}/images`,
            { src: info.url, attr: stripHtml(info.credit || ""), license: info.license || "" }, user)];
        if (info.descriptionUrl) {
            saves.push(postApiContent(`person/${person.id}/links`, { link: info.descriptionUrl, description: "Wikimedia Commons" }, user));
        }
        Promise.all(saves).catch(console.error);
    });
    useEffect(() => {
        if (imageInfo) save(imageInfo);
    }, [imageInfo]);

    return !loaded || hasImageRecord ? null : imageInfo;
};
