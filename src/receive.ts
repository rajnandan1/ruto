import { Payload, WindowClient } from './common';
import { GetOrigin } from './utils';
export interface Response {
    send: (message: string) => void;
}

export class ResponseImpl implements Response {
    messageId: string;
    client: WindowClient;
    //add constructor
    constructor(messageId: string, client: WindowClient) {
        this.messageId = messageId;
        this.client = client;
    }

    send: (message: string) => void = (message: string) => {
        const payload: Payload = {
            id: this.messageId,
            message: message,
            fromOrigin: this.client.fromOrigin,
            toOrigin: this.client.toOrigin,
            nodeTypeTo: this.client.nodeTypeTo,
            nodeTypeFrom: this.client.nodeTypeFrom,
            subpath: this.client.subpath,
        };

        let fromType = this.client.nodeTypeFrom;
        let toType = this.client.nodeTypeTo;

        if (fromType == 'iframe' && toType == 'parent') {
            let win: Window = this.client.node as Window;
            win.postMessage(payload, this.client.toOrigin);
        } else if (fromType == 'parent' && toType == 'iframe') {
            let iframe: HTMLIFrameElement = this.client.node as HTMLIFrameElement;
            iframe.contentWindow?.postMessage(payload, this.client.toOrigin);
        } else if (fromType == 'window' && toType == 'parent') {
            let win: Window = this.client.node as Window;
            win.postMessage(payload, this.client.toOrigin);
        } else if (fromType == 'parent' && toType == 'window') {
            let win: Window = this.client.node as Window;
            win.postMessage(payload, this.client.toOrigin);
        }
    };
}

export interface Receiver {
    receive: (route: string, node: Window | HTMLIFrameElement, callback: (res: Response, message: string) => void) => void;
}

export class ReceiverImpl implements Receiver {
    receive: (subpath: string, node: Window | HTMLIFrameElement, callback: (res: Response, message: string) => void) => void = (subpath: string, node: Window | HTMLIFrameElement, callback: (res: Response, message: string) => void) => {
        window.addEventListener('message', (event) => {
            if (event.origin !== event.data.fromOrigin) {
                return;
            }
            if (event.data?.subpath !== subpath) {
                return;
            }

            //if this message from parent to window check source also
            if (event.data.nodeTypeFrom == 'parent' && event.data.nodeTypeTo == 'window') {
                if (event.source != node) {
                    return;
                }
            }

            const client: WindowClient = {
                node: node,
                nodeTypeTo: event.data.nodeTypeFrom,
                nodeTypeFrom: event.data.nodeTypeTo,
                toOrigin: event.data.fromOrigin,
                fromOrigin: event.data.toOrigin,
                subpath: subpath,
            };

            const resp = new ResponseImpl(event.data.id, client);
            callback(resp, event.data.message);
        });
    };
}
