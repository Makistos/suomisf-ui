// @vitest-environment jsdom
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { byText, cleanup, click, render, waitFor } from "../../../test-utils/render";

type AuthCall = (...args: any[]) => Promise<any>;
const auth = vi.hoisted(() => ({
    register: vi.fn<AuthCall>(),
    resetPassword: vi.fn<AuthCall>(),
}));
vi.mock("@services/auth-service", () => auth);
vi.mock("react-router-dom", async (importOriginal) => ({
    ...(await importOriginal<typeof import("react-router-dom")>()),
    useSearchParams: () => [new URLSearchParams("token=t")],
}));

import { RegisterView } from "./register-view";
import { ResetPasswordView } from "./reset-password-view";

const type = (id: string, text: string) => {
    act(() => {
        const input = document.getElementById(id) as HTMLInputElement;
        const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
        setValue.call(input, text);
        input.dispatchEvent(new Event("input", { bubbles: true }));
    });
};

const submit = () => click(document.querySelector("button[type=submit]"));

// Never settles: a successful register would reload the page.
const pending = () => new Promise(() => undefined);

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("RegisterView password rule", () => {
    const fill = (password: string) => {
        render(<RegisterView />);
        type("username", "uusi");
        type("password", password);
        type("password2", password);
        submit();
    };

    it("shows the minimum and does not send 7 characters", async () => {
        fill("pw12345");
        await waitFor(() => expect(byText("Vähintään 8 merkkiä")).toHaveLength(1));
        expect(auth.register).not.toHaveBeenCalled();
    });

    it("shows the maximum and does not send 129 characters", async () => {
        fill("a".repeat(129));
        await waitFor(() => expect(byText("Enintään 128 merkkiä")).toHaveLength(1));
        expect(auth.register).not.toHaveBeenCalled();
    });

    it("sends 8 characters", async () => {
        auth.register.mockReturnValue(pending());
        fill("pw123456");
        await waitFor(() => expect(auth.register).toHaveBeenCalledWith("uusi", "pw123456", ""));
    });

    it("tells when the passwords differ", async () => {
        render(<RegisterView />);
        type("username", "uusi");
        type("password", "pw123456");
        type("password2", "pw654321");
        submit();
        await waitFor(() => expect(byText("Salasanat eivät täsmää")).toHaveLength(1));
        expect(auth.register).not.toHaveBeenCalled();
    });
});

describe("ResetPasswordView password rule", () => {
    const fill = (password: string) => {
        render(<ResetPasswordView />);
        type("password", password);
        type("password2", password);
        submit();
    };

    it("shows the minimum and does not send 7 characters", async () => {
        fill("pw12345");
        await waitFor(() => expect(byText("Vähintään 8 merkkiä")).toHaveLength(1));
        expect(auth.resetPassword).not.toHaveBeenCalled();
    });

    it("sends 8 characters", async () => {
        auth.resetPassword.mockReturnValue(pending());
        fill("pw123456");
        await waitFor(() => expect(auth.resetPassword).toHaveBeenCalledWith("t", "pw123456"));
    });
});
