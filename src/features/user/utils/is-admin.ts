import { User } from "../types";

export const isAdmin = (user: User | null) => {
    if (user !== null) {
        return user.role === 'admin';
    }
    return false;
}