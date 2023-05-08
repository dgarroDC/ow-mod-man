import { useGetTranslation } from "@hooks";
import {
    ReactNode,
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useState
} from "react";
import { IconContext } from "react-icons";

export interface ModalProps {
    heading?: string;
    confirmText?: string;
    showCancel?: boolean;
    cancelText?: string;
    children: ReactNode;
    onCancel?: () => boolean | void;
    onConfirm?: () => boolean | void;
}

export interface ModalHandle {
    open: () => void;
    close: () => void;
}

interface OpenState {
    open: boolean;
    closing: boolean;
}

const Modal = forwardRef(function Modal(props: ModalProps, ref) {
    const [state, setState] = useState<OpenState>({ open: false, closing: false });
    const [awaitingClose, setAwaitingClose] = useState(false);
    const getTranslation = useGetTranslation();

    const onClose = useCallback(() => {
        setAwaitingClose(false);
        setState({ open: true, closing: true });
    }, []);

    useImperativeHandle(
        ref,
        () => ({
            open: () => setState({ open: true, closing: false }),
            close: onClose
        }),
        [onClose]
    );

    useEffect(() => {
        let timeout: number;
        if (state.open) {
            document.documentElement.classList.add("modal-is-opening", "modal-is-open");
            timeout = setTimeout(() => {
                document.documentElement.classList.remove("modal-is-opening");
            }, 1000);
        } else {
            document.documentElement.classList.remove("modal-is-closing");
        }
        if (state.closing) {
            document.documentElement.classList.remove("modal-is-open");
            document.documentElement.classList.add("modal-is-closing");
            timeout = setTimeout(() => {
                setState({ open: false, closing: false });
            }, 1000);
        }
        return () => {
            clearTimeout(timeout);
        };
    }, [state]);

    return (
        <dialog
            onClick={onClose}
            className={state.open ? "" : "d-none"}
            dir="ltr"
            open={state.open}
        >
            <IconContext.Provider value={{ className: "modal-icon" }}>
                <article onClick={(e) => e.stopPropagation()}>
                    <header>
                        <p>{props.heading ?? "Modal"}</p>
                    </header>
                    <div className="modal-body">{props.children}</div>
                    <footer>
                        {props.showCancel && (
                            <a
                                href="#cancel"
                                role="button"
                                className="secondary"
                                onClick={() => {
                                    if (props.onCancel?.() ?? true) {
                                        onClose();
                                    }
                                }}
                            >
                                {props.cancelText ?? getTranslation("CANCEL")}
                            </a>
                        )}
                        <a
                            href="#confirm"
                            role="button"
                            aria-busy={awaitingClose}
                            onClick={() => {
                                setAwaitingClose(true);
                                if (props.onConfirm?.() ?? true) {
                                    onClose();
                                }
                            }}
                        >
                            {!awaitingClose && (props.confirmText ?? getTranslation("OK"))}
                        </a>
                    </footer>
                </article>
            </IconContext.Provider>
        </dialog>
    );
});

export default Modal;
