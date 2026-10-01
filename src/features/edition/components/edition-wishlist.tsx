import { getCurrenUser } from "@services/auth-service";
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HttpStatusResponse } from "@services/user-service";
import { User } from "@features/user";
import { saveToWishlist } from "@api/edition/save-to-wishlist";
import { getWishlistStatus } from "@api/edition/get-wishlist-status";
import { removeFromWishlist } from "@api/edition/remove-from-wishlist";

interface EditionWishlistProps {
    editionId: number,
    initial: boolean,
    workId?: number,
}

export const EditionWishlist = (props: EditionWishlistProps) => {
    const user = useMemo(() => { return getCurrenUser() }, []);
    if (!user) return <></>;
    return <EditionWishlistContent {...props} user={user} />;
}

// Split from EditionWishlist so the logged-out early return above doesn't
// come before hooks (hooks must run unconditionally, in the same order).
const EditionWishlistContent = ({ editionId, workId, user }: EditionWishlistProps & { user: User }) => {
    const queryClient = useQueryClient();

    const updateStatus = (value: boolean) => {
        let retval: Promise<HttpStatusResponse>;
        if (value === false) {
            retval = removeFromWishlist(editionId, user);
        } else {
            retval = saveToWishlist(editionId, user);
        }
        return retval;
    }

    const { mutate } = useMutation({
        mutationFn: (values: boolean) => updateStatus(values),
        onSuccess: (data: HttpStatusResponse) => {
            if (data.status === 200 || data.status === 201) {
                queryClient.invalidateQueries({ queryKey: ['edition', editionId] });
                if (workId) {
                    queryClient.invalidateQueries({ queryKey: ['work', workId] });
                }
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

    return (
        <>
            <i onClick={() => changeStatus(!data.wishlisted)}
                className={data.wishlisted ? 'pi pi-bookmark-fill' : 'pi pi-bookmark'}
                title={data.wishlisted ? 'Poista muistilistalta' : 'Lisää muistilistalle'}
                style={{ cursor: 'pointer' }}></i>
        </>
    )
}
