function updateNotifs(messageList) {
    let tableBody = document.querySelector("tbody");

    tableBody.innerHTML = "<tr><td class=\"infoMsg\">No new messages yet...</td></tr>";

    if (messageList.length > 0) {
        document.querySelector(".infoMsg").style.display = "none";
    } else {
        document.querySelector(".infoMsg").style.display = "inherit";
        return;
    }


    for (const message of messageList) {
        let newRow = document.createElement("tr");
        newRow.innerHTML = `<td><a href="${message.url}" target="_blank">${message.title}</a><div>${message.author}</div><div>${message.date}</div></td>`;
        tableBody.appendChild(newRow);
    }
}

function extensionStatusResponseHandler(response) {
    let toggleButton = document.querySelector("button")
    if (response.title == "on") {
        toggleButton.textContent = "ON";
        toggleButton.className = "buttonOn";
        return true;
    } else {
        toggleButton.textContent = "OFF";
        toggleButton.className = "buttonOff";
        return false;
    }
}

function getUnreadMsgsIfOn(extensionOn) {
    if (extensionOn) {
        function unreadMsgsResponseHandler(response) {
            if (!response.loading) {
                updateNotifs(response.contents);
            } else {
                document.querySelector("button").disabled = true;
                let infoMsg = document.querySelector(".infoMsg");
                infoMsg.textContent = "Loading...";
                infoMsg.style.display = "inherit";
            }
        }

        browser.runtime.sendMessage({title: "send unread messages"})
        .then(unreadMsgsResponseHandler);
    } else {
        document.querySelector(".infoMsg").style.display = "none";
    }
}

browser.runtime.sendMessage({title: "send extension status"})
.then(extensionStatusResponseHandler)
.then(getUnreadMsgsIfOn);

function messageHandler (message) {
    let button = document.querySelector("button");
    if (message.title == "unread messages") {
        updateNotifs(message.contents);
        if (button.disabled) {
            button.disabled = false;
        }
    }
    if (message.title == "not signed in") {
        button.textContent = "OFF";
        button.className = "buttonOff";
        button.disabled = false;
        document.querySelector(".infoMsg").style.display = "none";
    }
}

browser.runtime.onMessage.addListener(messageHandler);

function buttonOrLinkClicked(event) {
    if (event.target.tagName == "BUTTON") {
        if (event.target.textContent == "OFF") {
            browser.runtime.sendMessage({title: "extension status on"});
            event.target.textContent = "ON";
            event.target.className = "buttonOn";
            event.target.disabled = true;
            let infoMsg = document.querySelector(".infoMsg");
            infoMsg.textContent = "Loading...";
            infoMsg.style.display = "inherit";
        } else {
            browser.runtime.sendMessage({title: "extension status off"});
            event.target.textContent = "OFF";
            event.target.className = "buttonOff";
            updateNotifs([]);
            document.querySelector(".infoMsg").style.display = "none";
            browser.browserAction.setBadgeText({text: ""});
        }
    }
    if (event.target.tagName == "A" && event.target.className != "viewAllMsgs") {
        browser.browserAction.getBadgeText({}).then((text) => {
            const num = parseInt(text);
            if (num > 1) {
                browser.browserAction.setBadgeText({text: (num - 1).toString()});
            } else {
                browser.browserAction.setBadgeText({text: ""});
            }
        });
        browser.runtime.sendMessage({title: "remove message", messageUrl: event.target.href});
        event.target.parentNode.parentNode.remove();
        updateNotifs([]);
    }
}

document.addEventListener("click", buttonOrLinkClicked);
