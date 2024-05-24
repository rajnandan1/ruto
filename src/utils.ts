//create a function that takes any url and returns the origin
export function GetOrigin(url: string): string {
    if (url.startsWith('*')) {
        return '*';
    }
    if (url.startsWith('/')) {
        return '';
    }
    const a = document.createElement('a');
    a.href = url;
    return a.origin;
}

export function GetFromType(url: string): string {
    const origin = GetOrigin(url);
    const cleanedUrl = url.replace(origin, '');
    const splittedUrl = cleanedUrl.split('/');
    const toDestination = splittedUrl[1];

    if (toDestination.startsWith('parent')) {
        return 'parent';
    } else if (toDestination.startsWith('iframe')) {
        return 'iframe';
    } else if (toDestination.startsWith('window')) {
        return 'window';
    }
    return 'parent';
}

export function GetToType(url: string): string {
    const origin = GetOrigin(url);
    const cleanedUrl = url.replace(origin, '');
    const splittedUrl = cleanedUrl.split('/');
    const toDestination = splittedUrl[1];

    if (toDestination.endsWith('parent')) {
        return 'parent';
    } else if (toDestination.endsWith('iframe')) {
        return 'iframe';
    } else if (toDestination.endsWith('window')) {
        return 'window';
    }
    return 'iframe';
}

export function GetUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
            v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export function ValidatePath(url: string): boolean {
    const origin = GetOrigin(url);
    const cleanedUrl = url.replace(origin, '');

    if (!cleanedUrl.startsWith('/')) {
        return false;
    }
    const splittedUrl = cleanedUrl.split('/');
    if (splittedUrl.length != 3) {
        return false;
    }
    const toDestination = splittedUrl[1];

    if (!toDestination.startsWith('parent') && !toDestination.startsWith('iframe') && !toDestination.startsWith('window')) {
        return false;
    }
    if (toDestination.startsWith('parent')) {
        if (!toDestination.endsWith('iframe') && !toDestination.endsWith('window')) {
            return false;
        }
    }
    if (toDestination.startsWith('iframe') || toDestination.startsWith('window')) {
        if (!toDestination.endsWith('parent')) {
            return false;
        }
    }

    return true;
}
