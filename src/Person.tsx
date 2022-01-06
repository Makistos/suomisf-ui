import React from 'react';

export interface IPerson {
    id: number,
    name: string,
    alt_name: string,
    fullname: string,
    image_src: string,
    dob: number,
    dod: number,
    bio: string
}

export interface IPersonBrief {
    id: number,
    name: string,
    alt_name: string,
    image_src: string
}

type Props = { id: number | null };

export const Person = ({ id }: Props) => {
    return (<div></div>);
}