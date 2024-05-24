import { WindowMQOptions } from './common';
import { ValidatePath } from './utils';
import { SenderImpl } from './send';
import { ReceiverImpl, Response } from './receive';

export function send(route: string, node: Window | HTMLIFrameElement, message: string, options: WindowMQOptions): Promise<string> {
    if (!ValidatePath(route)) {
        throw new Error('Invalid Path');
    }
    const pipe = new SenderImpl(route, node, options);

    return pipe.send(message);
}

export function receive(subpath: string, node: Window | HTMLIFrameElement, callback: (res: Response, message: string) => void) {
    if (!ValidatePath(subpath)) {
        throw new Error('Invalid Path');
    }
    const receiver = new ReceiverImpl();
    receiver.receive(subpath, node, callback);
}
