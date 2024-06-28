<img src="ruto.png" height="149" style="display:block;margin:0 auto">

# Ruto

Ruto is a lightweight(4KB), fast and easy-to-use JS library that streamlines the communication between parent and child window(iframe/popup).

It uses client-server design pattern to communicate between parent and child window. Any window can become the client or the server depending on who wants to send. It abstracts out the complications of postMessage API and provides a simple API to send and receive messages.

## Scenarios where it can be used

1. Parent window wants to send a message to child window and wants to wait for the response from the child window.
2. Parent window wants to send a message to child window and expects a reply within x seconds.

## Demo

-   [Parent to Iframe](https://rajnandan1.github.io/ruto/index.html)
-   [Parent to Popup](https://rajnandan1.github.io/ruto/index2.html)

## Table of Contents

-   [Installation](#installation)
-   [API](#api)
    -   [send](#send)
    -   [receive](#receive)
-   [Usage](#usage)
    -   [Parent to Iframe Example](#parent-to-iframe-example)
        -   [Parent Window](#parent-window)
        -   [Child Window](#child-window)
    -   [Parent to Popup Example](#parent-to-popup-example)
        -   [Parent Window](#parent-window-1)
        -   [Popup Window](#popup-window)
    -   [Iframe to Parent Example](#iframe-to-parent-example)
        -   [Iframe Window](#iframe-window)
        -   [Parent Window](#parent-window-2)
    -   [Popup to Parent Example](#popup-to-parent-example)
        -   [Popup Window](#popup-window-1)
        -   [Parent Window](#parent-window-3)

## Installation

### CDN

```html
<script src="https://cdn.jsdelivr.net/gh/rajnandan1/ruto/dist/ruto.min.js"></script>
```

### ES6

```bash
npm i @rajnandan1/ruto
```

## API

The library exposes two methods `send` and `receive`.

### send

The send method is used to send a message from parent window to child window or vice versa. It returns a promise which resolves with the response from the child window.

```javascript
send(route: string, node: Window | HTMLIFrameElement, message: string, options: WindowMQOptions): Promise<string>
```

### route

The route is a unique identifier for the message. It has three parts

-   origin: The origin of the child window. Example if iframe or popup is located at http://example.com/iframe.html, then the origin will be http://example.com
-   type: The type of the window communication
    -   parent-to-iframe: When you want to send a message from parent to iframe
    -   parent-to-window: When you want to send a message from parent to popup
    -   iframe-to-parent: When you want to send a message from iframe to parent
    -   window-to-parent: When you want to send a message from popup to parent
-   topic: The topic of the message. Can be any string

Example: http://example.com/parent-to-iframe/sometopic

### node

The node is the child window to which the message is to be sent. It can be either a window object or an iframe element.
Example: `document.getElementById('iframe') or window.open('popup.html', 'popup', 'width=600,height=400)`

### message

The message is the data that is to be sent to the child window. It has to be a `string`. If you want to send JSON, you have to stringify it before sending.

### options

The options is an object that can have the following properties. It is optional

-   timeout: The time in milliseconds to wait for the response from the child window. If the response is not received within the timeout, the promise will be rejected with a timeout error.
    Example: `{timeout: 5000}`

### receive

The receive method is used to receive a message from a window. It is used by the child window to receive messages from the parent window. It can also be used by parent to receive message from child window. It is a callback function that is called when a message is received.

```javascript
receive(subpath: string, node: Window | HTMLIFrameElement, callback: (res: Response, message: string) => void)
```

### subpath

The subpath is a unique identifier for the message. It has two parts

-   type: The type of the window communication
    -   parent-to-iframe: When you want to send a message from parent to iframe
    -   parent-to-window: When you want to send a message from parent to popup
    -   iframe-to-parent: When you want to send a message from iframe to parent
    -   window-to-parent: When you want to send a message from popup to parent
-   topic: The topic of the message. Can be any string

> [!IMPORTANT]  
> The subpath should be the same as the route of the sender. If the subpath is different, the message will not be received. It does not need the origin part of the route.

Example: parent-to-iframe/sometopic

### node

The node is the window from which the message is to be received. It can be

-   iframe element
-   popup window reference
-   window.parent
-   window.opener

Example: `document.getElementById('iframe') or window.parent`

### callback

The callback is a function that is called when a message is received. It has two parameters

-   response: The response object that is used to send a response back to the sender using `response.send`
-   message: The message that is sent by the sender. It is a `string`.

Example:

```javascript
ruto.receive('http://localhost:3000/parent-to-iframe/sometopic', window.parent, (response, message) => {
    const newMessage = message + ' edited by child';
    return response.send(newMessage);
});
```

## Usage

### ⭐ Parent to Iframe Example

#### Parent Window

```javascript
//<iframe id="http://localhost:3000/somePath/someiframe.html" src="iframe.html" width="100%" height="800" frameborder="0"></iframe>

const options = {
    timeout: 5000,
};
ruto.send('http://localhost:3000/parent-to-iframe/sometopic', document.getElementById('iframe'), 'Your message', options)
    .then((response) => {
        console.log(response); //Your message edited by iframe
    })
    .catch((error) => {
        console.log(error);
    });
```

#### Child Window

```javascript
ruto.receive('/parent-to-iframe/sometopic', window.parent, (response, message) => {
    const newMessage = message + ' edited by iframe';
    return response.send(newMessage);
});
```

### ⭐ Parent to Popup Example

#### Parent Window

```javascript
//const popup = window.open('popup.html', 'popup', 'width=600,height=400');

const options = {
    timeout: 5000,
};
ruto.send('http://localhost:3000/parent-to-window/sometopic', popup, 'Your message', options)
    .then((response) => {
        console.log(response); //Your message edited by popup
    })
    .catch((error) => {
        console.log(error);
    });
```

#### Popup Window

```javascript
ruto.receive('/parent-to-window/sometopic', window.opener, (response, message) => {
    const newMessage = message + ' edited by popup';
    return response.send(newMessage);
});
```

### ⭐ Iframe to Parent Example

#### Iframe Window

```javascript
const options = {
    timeout: 5000,
};
ruto.send('http://localhost:3000/iframe-to-parent/sometopic', window.parent, 'Your message', options)
    .then((response) => {
        console.log(response); //Your message edited by parent
    })
    .catch((error) => {
        console.log(error);
    });
```

#### Parent Window

```javascript
ruto.receive('/iframe-to-parent/sometopic', window.parent, (response, message) => {
    const newMessage = message + ' edited by parent';
    return response.send(newMessage);
});
```

### ⭐ Popup to Parent Example

#### Popup Window

```javascript
const options = {
    timeout: 5000,
};
ruto.send('http://localhost:3000/window-to-parent/sometopic', window.opener, 'Your message', options)
    .then((response) => {
        console.log(response); //Your message edited by parent
    })
    .catch((error) => {
        console.log(error);
    });
```

#### Parent Window

```javascript
ruto.receive('/window-to-parent/sometopic', window.opener, (response, message) => {
    const newMessage = message + ' edited by parent';
    return response.send(newMessage);
});
```
