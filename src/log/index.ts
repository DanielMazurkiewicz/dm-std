import { DateTime } from "../types/date_time";


export namespace Log {

    export const ERROR = 0
    export const WARN = 1
    export const INFO = 2
    export const DEBUG = 3
    export const TRACE = 4

    export type Level = typeof ERROR | typeof WARN | typeof INFO | typeof DEBUG | typeof TRACE;



    export type Entry = [DateTime, DateTime | null, Level, string | string[], any]

    const EntryStart = 0
    const EntryEnd = 1
    const EntryLevel = 2
    const EntryMessage = 3
    const EntryData = 4

    export interface Group {
        id: Group.ID
        name: string
        description?: string
        entries: Entry[]
    }


    let GroupIDNext = 0
    const GroupIDsAvailable = new Set<Group.ID>()
    const groups: Record<Group.ID, Group> = {}


    export namespace Group {
        export type ID = number
        export function create(name: string, description?: string) {
            let GroupID: Group.ID;

            if (GroupIDsAvailable.size) {
                GroupID = GroupIDsAvailable.values().next().value as Group.ID
                GroupIDsAvailable.delete(GroupID)
            } else {
                GroupIDsAvailable.add(GroupIDNext);
                GroupID = GroupIDNext++
            }

            const group: Group = {
                id: GroupID,
                name,
                description,
                entries: [],
            }
            groups[GroupID] = group
            return GroupID
        }

        export function clear(GroupID: ID = preferred) {
            groups[GroupID].entries.filter(entry => entry[EntryEnd] === null)
        }

        export function forEach(GroupID: ID = preferred, callback: (entry: Entry) => void) {
            for (const entry of groups[GroupID].entries) {
                callback(entry)
            }
        }

        export function toConsole(GroupID: Group.ID = Group.preferred, clearLogs = true) {
            const group = groups[GroupID]
            for (const entry of group.entries) {
                if (entry[EntryEnd] === null) {
                    continue
                }
                switch (entry[EntryLevel]) {
                    case ERROR:
                        console.error(entry[EntryMessage])
                        break;
                    case WARN:
                        console.warn(entry[EntryMessage])
                        break;
                    case INFO:
                        console.info(entry[EntryMessage])
                        break;
                    case DEBUG:
                        console.debug(entry[EntryMessage])
                        break;
                    case TRACE:
                        console.trace(entry[EntryMessage])
                        break;
                }
            }
            if (clearLogs) {
                clear(GroupID)
            }
        }

        export function remove(GroupID: Group.ID) {
            delete groups[GroupID]
            GroupIDsAvailable.add(GroupID)
        }

        export const preferred = create('default')
    }




    export function push(message: string, level: Level = INFO, data: any = null, GroupID: Group.ID = Group.preferred) {
        const now = DateTime.now()
        const entry: Entry = [now, now, level, message, data];
        groups[GroupID].entries.push(entry)
    }

    export function streamStart(level: Level = INFO, GroupID: Group.ID = Group.preferred) {
        const now = DateTime.now()
        const entry: Entry = [now, null, level, [], null];
        groups[GroupID].entries.push(entry)
        return entry
    }

    export function stream(entry: Entry, message: string) {
        // @ts-ignore
        entry[EntryMessage].push(message)
    }

    export function streamEnd(entry: Entry) {
        entry[EntryEnd] = DateTime.now()
    }



    export function clear() {
        for (const GroupID in groups) {
            Group.clear(parseInt(GroupID))
        }
    }

    export function forEach(callback: (entry: Entry) => void) {
        for (const GroupID in groups) {
            Group.forEach(parseInt(GroupID), callback)
        }
    }


    export function toConsole(clearLogs = true) {
        for (const groupID in groups) {
            Group.toConsole(parseInt(groupID), clearLogs)
        }
    }

}