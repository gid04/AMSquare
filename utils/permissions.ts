import { View } from '../types';

export type AccessLevel = 'Admin' | 'Manager' | 'Editor' | 'Viewer' | 'Investor' | 'Main';

// Permission matrix for each access level
const PERMISSIONS: Record<AccessLevel, {
    views: View[];
    canFile: boolean;
    canAccessOutbox: boolean;
    canCreateChatRooms: boolean;
    canAccessCards: boolean;
    canGenerateReports: boolean;
    canAccessFullSettings: boolean;
    canDeleteMainUser: boolean;
}> = {
    Viewer: {
        views: [View.DASHBOARD, View.REGULATIONS, View.NOTIFICATIONS, View.TRANSACTIONS, View.REPORTS, View.SETTINGS, View.HELP_CENTER],
        canFile: false,
        canAccessOutbox: false,
        canCreateChatRooms: false,
        canAccessCards: false,
        canGenerateReports: false,
        canAccessFullSettings: false,
        canDeleteMainUser: false,
    },
    Editor: {
        views: [View.DASHBOARD, View.REGULATIONS, View.NOTIFICATIONS, View.BUSINESS, View.TRANSACTIONS, View.REPORTS, View.SETTINGS, View.HELP_CENTER],
        canFile: false,
        canAccessOutbox: false,
        canCreateChatRooms: false,
        canAccessCards: false,
        canGenerateReports: false,
        canAccessFullSettings: false,
        canDeleteMainUser: false,
    },
    Manager: {
        views: [View.DASHBOARD, View.REGULATIONS, View.NOTIFICATIONS, View.ANALYST, View.BUSINESS, View.TRANSACTIONS, View.REPORTS, View.AUTOMATIONS, View.SETTINGS, View.HELP_CENTER],
        canFile: false,
        canAccessOutbox: false,
        canCreateChatRooms: false, // Has separate chat, can't create rooms
        canAccessCards: true,
        canGenerateReports: true,
        canAccessFullSettings: false,
        canDeleteMainUser: false,
    },
    Admin: {
        views: [View.DASHBOARD, View.ANALYST, View.REPORTS, View.TEAM, View.REGULATIONS, View.AUTOMATIONS, View.SETTINGS, View.TRANSACTIONS, View.HELP_CENTER, View.BUSINESS, View.NOTIFICATIONS],
        canFile: true,
        canAccessOutbox: true,
        canCreateChatRooms: true,
        canAccessCards: true,
        canGenerateReports: true,
        canAccessFullSettings: true,
        canDeleteMainUser: false,
    },
    Investor: {
        views: [View.DASHBOARD, View.REPORTS, View.HELP_CENTER],
        canFile: false,
        canAccessOutbox: false,
        canCreateChatRooms: false,
        canAccessCards: false,
        canGenerateReports: false,
        canAccessFullSettings: false,
        canDeleteMainUser: false,
    },
    Main: {
        views: [View.DASHBOARD, View.ANALYST, View.REPORTS, View.TEAM, View.REGULATIONS, View.AUTOMATIONS, View.SETTINGS, View.TRANSACTIONS, View.HELP_CENTER, View.BUSINESS, View.NOTIFICATIONS],
        canFile: true,
        canAccessOutbox: true,
        canCreateChatRooms: true,
        canAccessCards: true,
        canGenerateReports: true,
        canAccessFullSettings: true,
        canDeleteMainUser: true,
    },
};

export function canAccessView(accessLevel: AccessLevel, view: View): boolean {
    return PERMISSIONS[accessLevel].views.includes(view);
}

export function canFile(accessLevel: AccessLevel): boolean {
    return PERMISSIONS[accessLevel].canFile;
}

export function canAccessOutbox(accessLevel: AccessLevel): boolean {
    return PERMISSIONS[accessLevel].canAccessOutbox;
}

export function canCreateChatRooms(accessLevel: AccessLevel): boolean {
    return PERMISSIONS[accessLevel].canCreateChatRooms;
}

export function canAccessCards(accessLevel: AccessLevel): boolean {
    return PERMISSIONS[accessLevel].canAccessCards;
}

export function canGenerateReports(accessLevel: AccessLevel): boolean {
    return PERMISSIONS[accessLevel].canGenerateReports;
}

export function canAccessFullSettings(accessLevel: AccessLevel): boolean {
    return PERMISSIONS[accessLevel].canAccessFullSettings;
}

export function canDeleteMainUser(accessLevel: AccessLevel): boolean {
    return PERMISSIONS[accessLevel].canDeleteMainUser;
}

export function getAccessibleViews(accessLevel: AccessLevel): View[] {
    return PERMISSIONS[accessLevel].views;
}
