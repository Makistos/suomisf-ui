import { getCurrenUser } from "@services/auth-service";
import { Edition, EditionProps, EditionWishlistStatus } from "../types";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HttpStatusResponse } from "@services/user-service";
import { User } from "@features/user";
import { saveToWishlist } from "@api/edition/save-to-wishlist";
import { getWishlistStatus } from "@api/edition/get-wishlist-status";
import { remove, set } from "lodash";
import { removeFromWishlist } from "@api/edition/remove-from-wishlist";

interface EditionWishlistProps {
    editionId: number,
    initial: boolean
}

export const EditionWishlist = ({ editionId, initial }: EditionWishlistProps) => {
    const user = useMemo(() => { return getCurrenUser() }, []);
    const queryClient = useQueryClient();
    if (!user) return <></>;

    const updateStatus = (value: boolean) => {
        let retval: Promise<HttpStatusResponse>;
        console.log(value)
        if (value === false) {
            retval = removeFromWishlist(editionId, user);
        } else {
            retval = saveToWishlist(editionId, user);
        }
        return retval;
    }

    const { mutate } = useMutation({
        mutationFn: (values: boolean) => updateStatus(values),
        onSuccess: (data: HttpStatusResponse, variables) => {
            if (data.status === 200 || data.status === 201) {
                queryClient.invalidateQueries({ queryKey: ['edition', editionId] });
            } else {
                if (JSON.parse(data.response).data["msg"] !== undefined) {
                    const errMsg = JSON.parse(data.response).data["msg"];
                    console.log(errMsg);
                } else {
                }
            }
        },
        onError: (error: any) => {
            console.log(error.message);
        }

    })

    const fetchWishlistStatus = async (id: number, user: User | null): Promise<any | null> => {
        if (!user) return null;
        return getWishlistStatus(id, user);

    }

    const { isLoading, data } = useQuery({
        queryKey: ['edition', editionId, 'wishlist'],
        queryFn: () => fetchWishlistStatus(editionId, user),
    })

    if (isLoading)
        return <></>;

    const changeStatus = (value: boolean) => {
        // setWishlisted(value);
        mutate(value);
    };

    console.log(data)
    return (
        <>
            <i onClick={() => changeStatus(!data.wishlisted)}
                className={data.wishlisted ? 'pi pi-bookmark-fill' : 'pi pi-bookmark'}
                title={data.wishlisted ? 'Poista muistilistalta' : 'Lisää muistilistalle'}
                style={{ cursor: 'pointer' }}></i>
        </>
    )
}
