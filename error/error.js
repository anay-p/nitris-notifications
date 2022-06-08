function messageHandler(message) {
    if (message.title == "error") {
        document.querySelector("div").textContent = message.errorMsg;
    }
}

browser.runtime.onMessage.addListener(messageHandler);
