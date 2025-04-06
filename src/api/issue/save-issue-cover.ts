import { User } from "@features/user";
import authHeader from "@services/auth-header";
import { putApiContent } from "@services/user-service"
import axios from "axios";

export const saveIssueCover = async (issueId: number | string, file: Blob, fileName: string, user: User | null) => {
    const form = new FormData();
    form.append('file', file, fileName);
    const headers = authHeader();
    const response = await axios.post(import.meta.env.VITE_API_URL + `issues/${issueId}/covers`,
        form,
        { headers: headers })
    //const data = { file: file, filename: filename }
    //const response = await putApiContent('issues/${issueId}/covers', data, user)
    return response;
}