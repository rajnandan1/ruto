

export interface WindowMQOptions {
    timeout: number;
}
export interface WindowClient {
    node: Window | HTMLIFrameElement | null;
    nodeTypeTo: string;
    nodeTypeFrom: string;
    toOrigin: string;
    fromOrigin: string;
    subpath: string;
}

export interface Payload {
    message: string | null;
    subpath: string;
    id: string;
    fromOrigin: string;
    toOrigin: string;
    nodeTypeTo: string;
    nodeTypeFrom: string;
}
