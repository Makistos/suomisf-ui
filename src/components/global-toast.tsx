import { createContext, ReactNode, useCallback, useContext, useRef } from "react";
import { Toast, ToastMessage } from "primereact/toast";

type ShowToast = (message: ToastMessage | ToastMessage[]) => void;

const GlobalToastContext = createContext<ShowToast>(() => { });

/**
 * App-level toast that survives route changes. Use it for messages shown
 * right before navigating away (e.g. "deleted" after navigate(-1)): a
 * page's own Toast is unmounted by the navigation and the message may
 * never appear.
 */
export const GlobalToastProvider = ({ children }: { children: ReactNode }) => {
    const toastRef = useRef<Toast>(null);
    const show = useCallback<ShowToast>(message => toastRef.current?.show(message), []);
    return (
        <GlobalToastContext.Provider value={show}>
            <Toast ref={toastRef} />
            {children}
        </GlobalToastContext.Provider>
    );
};

export const useGlobalToast = () => useContext(GlobalToastContext);
