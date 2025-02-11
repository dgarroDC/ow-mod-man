import Icon from "@components/common/Icon";
import NavButton from "./NavButton";
import { BsArrowRepeat } from "react-icons/bs";
import { useGetTranslation } from "@hooks";
import { useCallback, useEffect, useRef, useState } from "react";
import { commands, hooks } from "@commands";
import { watchImmediate } from "tauri-plugin-fs-watch-api";
import { listen } from "@tauri-apps/api/event";
import { IconContext } from "react-icons";

const checkPaths = (paths: string[]) => {
    for (const path of paths) {
        if (
            path.endsWith("config.json") ||
            path.endsWith("manifest.json") ||
            path.endsWith(".dll") ||
            path.endsWith("OWML.Config.json") ||
            path.endsWith("settings.json") ||
            path.endsWith("gui_settings.json")
        ) {
            return true;
        }
    }
    return false;
};

const NavRefreshButton = () => {
    const [isRefreshing, setRefreshing] = useState(false);
    const [watchingFileSystem, setWatchFS] = useState(false);
    const [status, config, err] = hooks.getConfig("CONFIG_RELOAD");
    const guiConfig = hooks.getGuiConfig("GUI_CONFIG_RELOAD")[1];
    const getTranslation = useGetTranslation();
    const currentTimeout = useRef<number | null>(null);

    const onRefresh = useCallback(() => {
        const task = async () => {
            setRefreshing(true);
            setWatchFS(false);
            await commands.refreshLocalDb();
            await commands.refreshRemoteDb();
            await commands.initialSetup();
            setWatchFS(true);
            setRefreshing(false);
        };
        task();
    }, []);

    useEffect(() => {
        let cancel = false;
        listen("TOGGLE_FS_WATCH", (e) => {
            if (cancel) return;
            const enabled = e.payload as boolean;
            if (!enabled && currentTimeout.current) {
                clearTimeout(currentTimeout.current);
                currentTimeout.current = null;
            }
            setWatchFS(e.payload as boolean);
        });
        return () => {
            cancel = true;
        };
    }, []);

    useEffect(() => {
        let cancel = false;
        if (status === "Done" && (guiConfig?.watchFs ?? false)) {
            commands.getWatcherPaths().then((paths) => {
                watchImmediate(
                    paths,
                    (e) => {
                        if (cancel || !watchingFileSystem || !checkPaths(e.paths)) return;
                        if (currentTimeout.current) {
                            clearTimeout(currentTimeout.current);
                            currentTimeout.current = null;
                        }
                        currentTimeout.current = setTimeout(onRefresh, 500);
                    },
                    { recursive: true }
                );
            });
        } else if (status === "Error") {
            console.error(err);
        }
        return () => {
            cancel = true;
        };
    }, [onRefresh, err, watchingFileSystem, status, config, guiConfig?.watchFs]);

    return (
        <NavButton
            disabled={isRefreshing}
            onClick={onRefresh}
            labelPlacement="bottom"
            ariaLabel={getTranslation("REFRESH")}
        >
            {/* react-icon's IconContext overrides props sent to the component directly, */}
            {/* and since we use that context higher up in the tree we can't pass props, so we need to do this */}
            <IconContext.Provider
                value={{ className: isRefreshing ? "nav-icon refresh-icon-loading" : "nav-icon" }}
            >
                <Icon
                    iconClassName={isRefreshing ? "refresh-icon-loading" : ""}
                    iconType={BsArrowRepeat}
                />
            </IconContext.Provider>
        </NavButton>
    );
};

export default NavRefreshButton;
