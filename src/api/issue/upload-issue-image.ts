import authHeader from "@services/auth-header";
import axios from "axios";

export const uploadIssueImage = async (issueId: number | string, file: Blob, fileName: string) => {
    const form = new FormData();
    form.append('file', file, fileName);
    const headers = authHeader();
    const response = await axios.post(
        import.meta.env.VITE_API_URL + `issues/${issueId}/images`,
        form,
        { headers }
    );
    return response;
}
