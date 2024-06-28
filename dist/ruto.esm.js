//create a function that takes any url and returns the origin
function GetOrigin(url) {
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
function GetFromType(url) {
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
function GetToType(url) {
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
function GetUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
            v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
function ValidatePath(url) {
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
function WaitForIframeLoad(iframe, timeout) {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            clearInterval(interval);
            reject(new Error('Timeout exceeded'));
        }, timeout);
        const interval = setInterval(() => {
            if (iframe.contentWindow) {
                clearInterval(interval);
                clearTimeout(timeoutId);
                resolve();
            }
        }, 100);
    });
}

class SenderImpl {
    constructor(route, node, options) {
        this.send = (message) => {
            return new Promise((resolve, reject) => {
                var _a;
                this.resolver = resolve;
                this.rejecter = reject;
                if (this.client.node == null || this.client.node == undefined) {
                    return reject('Client Unhealthy');
                }
                if (typeof window === 'undefined' || typeof document === 'undefined') {
                    // Resolve to null when imported server side. This makes the module
                    // safe to import in an isomorphic code base.
                    return resolve('');
                }
                try {
                    const messageId = GetUUID();
                    const payload = {
                        message: message,
                        subpath: this.client.subpath,
                        id: messageId,
                        fromOrigin: this.client.fromOrigin,
                        toOrigin: this.client.toOrigin,
                        nodeTypeTo: this.client.nodeTypeTo,
                        nodeTypeFrom: this.client.nodeTypeFrom,
                    };
                    if (this.client.nodeTypeTo == 'iframe') {
                        const iframe = this.client.node;
                        //wait for iframe to load
                        if (this.client.nodeReady) {
                            (_a = iframe.contentWindow) === null || _a === void 0 ? void 0 : _a.postMessage(payload, this.client.toOrigin);
                        } else {
                            WaitForIframeLoad(iframe, this.timeout).then(() => {
                                var _a;
                                this.client.nodeReady = true;
                                (_a = iframe.contentWindow) === null || _a === void 0 ? void 0 : _a.postMessage(payload, this.client.toOrigin);
                            });
                        }
                    } else if (this.client.nodeTypeTo == 'parent') {
                        const win = this.client.node;
                        win.postMessage(payload, this.client.toOrigin);
                    } else if (this.client.nodeTypeTo == 'window') {
                        const win = this.client.node;
                        win.postMessage(payload, this.client.toOrigin);
                    }
                    const timer = setTimeout(() => {
                        this.rejecter('Timeout');
                        window.removeEventListener('message', messageListener);
                    }, this.timeout);
                    const messageListener = (event) => {
                        var _a;
                        if (event.data.fromOrigin != '*' && event.origin !== event.data.fromOrigin) {
                            return;
                        }
                        if (((_a = event.data) === null || _a === void 0 ? void 0 : _a.subpath) !== this.client.subpath) {
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
        const toOrigin = GetOrigin(route);
        this.client = {
            node: node,
            nodeTypeTo: GetToType(route),
            nodeTypeFrom: GetFromType(route),
            toOrigin: toOrigin,
            fromOrigin: GetOrigin(window.location.href),
            subpath: route.replace(toOrigin, ''),
            nodeReady: false,
        };
        this.timeout = (options === null || options === void 0 ? void 0 : options.timeout) || 3000;
        this.resolver = (value) => {};
        this.rejecter = (reason) => {};
    }
}

class ResponseImpl {
    //add constructor
    constructor(messageId, client) {
        this.send = (message) => {
            var _a;
            const payload = {
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
                let win = this.client.node;
                win.postMessage(payload, this.client.toOrigin);
            } else if (fromType == 'parent' && toType == 'iframe') {
                let iframe = this.client.node;
                (_a = iframe.contentWindow) === null || _a === void 0 ? void 0 : _a.postMessage(payload, this.client.toOrigin);
            } else if (fromType == 'window' && toType == 'parent') {
                let win = this.client.node;
                win.postMessage(payload, this.client.toOrigin);
            } else if (fromType == 'parent' && toType == 'window') {
                let win = this.client.node;
                win.postMessage(payload, this.client.toOrigin);
            }
        };
        this.messageId = messageId;
        this.client = client;
    }
}
class ReceiverImpl {
    constructor() {
        this.receive = (subpath, node, callback) => {
            if (typeof window !== 'undefined' && typeof document !== 'undefined') {
                window.addEventListener('message', (event) => {
                    var _a;
                    if (event.origin !== event.data.fromOrigin) {
                        return;
                    }
                    if (((_a = event.data) === null || _a === void 0 ? void 0 : _a.subpath) !== subpath) {
                        return;
                    }
                    //if this message from parent to window check source also
                    if (event.data.nodeTypeFrom == 'parent' && event.data.nodeTypeTo == 'window') {
                        if (event.source != node) {
                            return;
                        }
                    }
                    const client = {
                        node: node,
                        nodeTypeTo: event.data.nodeTypeFrom,
                        nodeTypeFrom: event.data.nodeTypeTo,
                        toOrigin: event.data.fromOrigin,
                        fromOrigin: event.data.toOrigin,
                        subpath: subpath,
                        nodeReady: false,
                    };
                    const resp = new ResponseImpl(event.data.id, client);
                    callback(resp, event.data.message);
                });
            }
        };
    }
}

function send(route, node, message, options) {
    if (!ValidatePath(route)) {
        throw new Error('Invalid Path');
    }
    const pipe = new SenderImpl(route, node, options);
    return pipe.send(message);
}
function receive(subpath, node, callback) {
    if (!ValidatePath(subpath)) {
        throw new Error('Invalid Path');
    }
    const receiver = new ReceiverImpl();
    receiver.receive(subpath, node, callback);
}

export { receive, send };
//# sourceMappingURL=ruto.esm.js.map
