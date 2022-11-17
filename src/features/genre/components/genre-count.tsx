import React from "react";

import { Chip } from 'primereact/chip';
import { Badge } from 'primereact/badge';

import { GenreProps } from "../types";
import { getGenreIcon } from "../utils";


export const GenreCount = ({ genre, count }: GenreProps) => {
    const headerText = (name: string, count: number | null) => {
        if (count !== null) {
            return name + " x " + count;
        } else {
            return name;
        }
    };

    return (
        <Chip icon={getGenreIcon(genre)} label={headerText(genre, count)} className="p-overlay-badge">
            <Badge value="{count}">
            </Badge>
        </Chip>
    );
};
