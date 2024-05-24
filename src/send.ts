import { WindowMQOptions, WindowClient, Payload } from './common';
import { GetOrigin, GetFromType, GetToType, GetUUID } from './utils';
export interface Sender {
    send: (message: string) => Promise<string>;
}

export class SenderImpl implements Sender {
    client: WindowClient;
    timeout: number;

    resolver: (value: string | PromiseLike<string>) => void;
    rejecter: (reason?: any) => void;

    constructor(route: string, node: Window | HTMLIFrameElement, options: WindowMQOptions) {
        const toOrigin = GetOrigin(route);
        this.client = {
            node: node,
            nodeTypeTo: GetToType(route),
            nodeTypeFrom: GetFromType(route),
            toOrigin: toOrigin,
            fromOrigin: GetOrigin(window.location.href),
            subpath: route.replace(toOrigin, ''),
        };
        this.timeout = options?.timeout || 3000;
        this.resolver = (value: string | PromiseLike<string>) => {};
        this.rejecter = (reason?: any) => {};
    }

    send: (message: string) => Promise<string> = (message: string) => {
        return new Promise<string>((resolve, reject) => {
            this.resolver = resolve;
            this.rejecter = reject;
            if (this.client.node == null || this.client.node == undefined) {
                return reject('Client Unhealthy');
            }
            try {
                const messageId = GetUUID();
                const payload: Payload = {
                    message: message,
                    subpath: this.client.subpath,
                    id: messageId,
                    fromOrigin: this.client.fromOrigin,
                    toOrigin: this.client.toOrigin,
                    nodeTypeTo: this.client.nodeTypeTo,
                    nodeTypeFrom: this.client.nodeTypeFrom,
                };
                if (this.client.nodeTypeTo == 'iframe') {
                    const iframe = this.client.node as HTMLIFrameElement;
                    iframe.contentWindow?.postMessage(payload, this.client.toOrigin);
                } else if (this.client.nodeTypeTo == 'parent') {
                    const win = this.client.node as Window;
                    win.postMessage(payload, this.client.toOrigin);
                } else if (this.client.nodeTypeTo == 'window') {
                    const win = this.client.node as Window;
                    win.postMessage(payload, this.client.toOrigin);
                }
                const timer = setTimeout(() => {
                    this.rejecter('Timeout');
                    window.removeEventListener('message', messageListener);
                }, this.timeout);
                const messageListener = (event: MessageEvent) => {
                    if (event.data.fromOrigin != '*' && event.origin !== event.data.fromOrigin) {
                        return;
                    }
                    if (event.data?.subpath !== this.client.subpath) {
                        return;
                    }

                    if (event.data.id !== messageId) {
                        return;
                    }
                    this.resolver(event.data.message);
                    window.removeEventListener('message', messageListener);
                    clearTimeout(timer);
                };

                window.addEventListener('message', messageListener);
            } catch (error) {
                this.rejecter(error);
            }
        });
    };
}
