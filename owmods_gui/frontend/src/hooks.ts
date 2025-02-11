import { listen } from "@tauri-apps/api/event";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
    TranslationContext,
    TranslationMap,
    type TranslationKey
} from "@components/common/TranslationContext";
import ThemeMap from "./theme";
import { Theme } from "@types";
import rainbowTheme from "@styles/rainbow.scss?inline";

export type LoadState = "Loading" | "Done" | "Error";

/**
 * Use @commands:hooks if possible
 */
export const useTauri = <T>(
    eventName: string | string[],
    commandFn: () => Promise<T>,
    payload: unknown
): [LoadState, T | null, string | null] => {
    const [status, setStatus] = useState<LoadState>("Loading");
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const events = useMemo(() => (Array.isArray(eventName) ? eventName : [eventName]), [eventName]);

    useEffect(() => {
        if (status !== "Loading") {
            for (const eventToSubscribe of events) {
                listen(eventToSubscribe, () => setStatus("Loading")).catch((e) => {
                    setStatus("Error");
                    setError(e);
                });
            }
        } else {
            commandFn()
                .then((data) => {
                    setData(data as T);
                    setStatus("Done");
                })
                .catch((e) => {
                    setError(e as string);
                    setStatus("Error");
                });
        }
    }, [commandFn, events, status]);

    useEffect(() => {
        if (status === "Done") {
            setStatus("Loading");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...Object.values(payload ?? [])]);

    return [status, data, error];
};

export const useGetTranslation = () => {
    const context = useContext(TranslationContext);
    return useCallback(
        (key: TranslationKey, variables?: Record<string, string>) => {
            const activeTable = TranslationMap[context];
            let translated = activeTable[key];
            if (translated === undefined) {
                translated = activeTable["_"];
                const fallback = TranslationMap["English"][key] ?? "INVALID KEY: $key$";
                translated = translated.replaceAll(`$fallback$`, fallback);
                translated = translated.replaceAll(`$key$`, key);
            } else {
                for (const k in variables) {
                    translated = translated.replaceAll(`$${k}$`, variables[k]);
                }
            }
            return translated;
        },
        [context]
    );
};

export const useTheme = (theme: Theme, rainbow: boolean) => {
    useEffect(() => {
        let newTheme = ThemeMap[theme ?? "White"];
        if (rainbow) {
            newTheme += rainbowTheme;
        }
        document.getElementById("currentTheme")!.textContent = newTheme;
    }, [theme, rainbow]);
};
