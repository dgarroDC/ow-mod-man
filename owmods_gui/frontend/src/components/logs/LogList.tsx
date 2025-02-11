import { memo, useRef } from "react";
import { LogFilter } from "./LogApp";
import LogLine from "./LogLine";
import { Virtuoso } from "react-virtuoso";
import { VirtuosoHandle } from "react-virtuoso";

export interface LogListProps {
    port: number;
    logLines: [number, number][];
    activeFilter: LogFilter;
    search: string;
}

const LogList = memo(function LogList(props: LogListProps) {
    const virtuoso = useRef<VirtuosoHandle | null>(null);

    return (
        <Virtuoso
            ref={virtuoso}
            className="log-list"
            increaseViewportBy={5000}
            computeItemKey={(index) => `${index}-${props.logLines[index][0]}`}
            data={props.logLines}
            itemContent={(_, data) => (
                <LogLine virtuosoRef={virtuoso} port={props.port} line={data[0]} count={data[1]} />
            )}
            atBottomThreshold={1000}
            followOutput
            alignToBottom
        />
    );
});

export default LogList;
