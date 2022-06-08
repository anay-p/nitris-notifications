browser.runtime.sendMessage({title: "check tab id"}).then((response) => {
    if (response.current) {
        alert("Please log in to your NITRIS portal and then turn the extension on. You can close this tab afterwards if you want. Note that you will only need to log in again if you turn the extension off for a long period of time.");
    }
});
