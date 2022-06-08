var isEnxtensionRunning = false;
var unreadMessages = [];
var loopingTimerExists = false;
var loading = false;
var loginTabId = null;

browser.browserAction.setBadgeBackgroundColor({color: "#1167BD"});

function messageHandler(message, sender, sendResponse) {
    if (message.title == "send extension status") {
        if (isEnxtensionRunning) {
            sendResponse({title: "on"});
        } else {
            sendResponse({title: "off"});
        }
    }
    if (message.title == "extension status on") {
        isEnxtensionRunning = true;
        browser.browserAction.setIcon({path: "icons/icon-enabled.png"});
        if (!loopingTimerExists) {
            loading = true;
            createLoopingTimer();
        } else {
            browser.runtime.sendMessage({title: "unread messages", contents: unreadMessages});
        }
    }
    if (message.title == "extension status off") {
        isEnxtensionRunning = false;
        browser.browserAction.setIcon({path: "icons/icon-disabled.png"});
    }
    if (message.title == "send unread messages") {
        sendResponse({title: "unread messages", contents: unreadMessages, loading: loading});
    }
    if (message.title == "remove message") {
        unreadMessages.splice(unreadMessages.indexOf(unreadMessages.find(el => el.url == message.messageUrl)), 1);
    }
    if (message.title == "check tab id") {
        if (sender.tab.id == loginTabId) {
            sendResponse({title: "check response", current: true});
        } else {
            sendResponse({title: "check response", current: false});
        }
        loginTabId = null;
    }
}

browser.runtime.onMessage.addListener(messageHandler);

async function updateUnreadMessages() {
    console.log("Sending request for homepage");
    let fetchData = null;
    try {
        let resp = await fetch("https://eapplication.nitrkl.ac.in/nitris/Student/Home/Home.aspx", {
            "credentials": "include",
            "headers": {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:98.0) Gecko/20100101 Firefox/98.0",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.7,hi;q=0.3",
                "Upgrade-Insecure-Requests": "1",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "none",
                "Sec-Fetch-User": "?1"
            },
            "method": "GET",
            "mode": "cors"
        });
        fetchData = await resp.text();
    } catch(err) {
        console.log(`Error encountered: ${err}`);
        await browser.tabs.create({url: "error/error.htm"});
        setTimeout(() => {browser.runtime.sendMessage({title: "error", errorMsg: err.toString()});}, 100);
    }

    if (fetchData == null) {
        // 'not signed in' message is sent even though that is not the case
        // and other code from below is reused because it is convenient
        browser.browserAction.setIcon({path: "icons/icon-disabled.png"});
        browser.runtime.sendMessage({title: "not signed in"});
        browser.browserAction.setBadgeText({text: ""});
        isEnxtensionRunning = false;
    } else if (fetchData.includes("NITRIS-login")) {
        console.log("User isn't signed in");
        let createdTab = await browser.tabs.create({url: "https://eapplication.nitrkl.ac.in/nitris/Login.aspx"});
        loginTabId = createdTab.id;
        browser.browserAction.setIcon({path: "icons/icon-disabled.png"});
        browser.runtime.sendMessage({title: "not signed in"});
        browser.browserAction.setBadgeText({text: ""});
        isEnxtensionRunning = false;
    } else {
        let html = document.createElement("html");
        html.innerHTML = fetchData;

        let unreadMessage = null;
        let newUnreadMessages = [];

        for (const e of html.getElementsByClassName("message-item")) {
            if (e.getElementsByClassName("message-title")[0].style.fontWeight == "bold") {
                unreadMessage = {
                    title: e.getElementsByClassName("message-title")[0].innerHTML.trim(),
                    author: e.getElementsByClassName("mail-desc")[0].innerHTML,
                    date: e.getElementsByClassName("time")[0].innerHTML,
                    url: "https://eapplication.nitrkl.ac.in" + e.href.slice(52)
                };
                newUnreadMessages.push(unreadMessage);
            }
        }

        unreadMessages = newUnreadMessages;

        if (unreadMessages.length > 0) {
            browser.browserAction.setBadgeText({text: unreadMessages.length.toString()});
        } else {
            browser.browserAction.setBadgeText({text: ""});
        }

        browser.runtime.sendMessage({title: "unread messages", contents: unreadMessages});
    }
    loading = false;
}

async function createLoopingTimer() {
    loopingTimerExists = true;
    await updateUnreadMessages();
    let timeLeft = 300;
    let timer = setInterval(function() {
        if (!isEnxtensionRunning) {
            clearInterval(timer);
            loopingTimerExists = false;
            console.log("Timer stopped");
            return;
        }
        if (timeLeft % 60 == 0) {
            console.log(`Time left: ${timeLeft}s`);
        }
        if (timeLeft == 0) {
            clearInterval(timer);
            loopingTimerExists = false;
            createLoopingTimer();
        }
        timeLeft -= 1;
    }, 1000);
}
