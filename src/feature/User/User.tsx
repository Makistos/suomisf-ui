export interface IUser {
    id: number,
    name: string,
    role: string
}

export const isAdmin = (user: IUser | null) => {
    if (user !== null) {
        return user.role === 'admin';
    }
    return false;
}