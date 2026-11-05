import { SimilarReason } from "@api/tag/get-similar-tags";

/** How a similar tag was found, as shown to admins. */
export const SIMILAR_REASONS: Record<SimilarReason, string> = {
    baseform: "Sama perusmuoto",
    spelling: "Kirjoitusasu",
    place: "Paikka",
    name: "Samankaltainen nimi",
    usage: "Käytetään yhdessä",
    manual: "Lisätty käsin",
    concept: "Sama käsite",
    concept_related: "Liittyvä käsite",
};
