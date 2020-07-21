$(function () {
    // Local storage key
    const LOCAL_KEY = "juneSettings";
    const DEFAULT_STATE = {
        "mp4": false,
        "gif": false,
        "png": false,
        "webp": false
    }
    // Listening to content scripts
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
        if (request.request === "getState") {
            console.log("getting the state for the content script");
            loadState(state => {
                console.log("state being sent to the content script:")
                console.log(state);
                sendResponse(state);
            });
        }
    });
    /**
     * Update the checkbox states to the given state object
     * @param {Object} state - The state of the checkboxes
     */
    function updateCheckboxes(state) {
        if (state) {
            console.log(state);
            Object.keys(state).forEach(key => {
                $(`#${key}`).prop("checked", state[key]);
            });
        } else {
            console.log("state is null!");
        }
    }
    /**
     * Send data to a content script tab
     * @param {Object} data - A data object
     */
    function sendToTab(data) {
        // find active tab
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            // send data to the content script on the tab
            chrome.tabs.sendMessage(tabs[0].id, data);
        });
    }
    function loadState(cb) {
        // load settings from local storage
        chrome.storage.sync.get([LOCAL_KEY], (localState) => {
            let state = {};
            if (localState.hasOwnProperty(LOCAL_KEY)) {
                // send state to content script on tab
                state = localState[LOCAL_KEY];
            } else {
                console.log("setting default state:");
                state = DEFAULT_STATE;
            }
            cb(state);
        });
    }
    function start() {
        loadState(state => {
            // sendToTab(state);
            updateCheckboxes(state);
        });
    }
    start();
    // when checkbox toggled
    $(':checkbox').change(function () {
        // extract checkbox state
        const fileType = this.id;
        loadState(currState => {
            console.log("currState:");
            console.log(currState);
            const state = {
                [LOCAL_KEY]: Object.assign(currState, {
                    [fileType]: this.checked
                })
            };
            // set the setting in local storage
            chrome.storage.sync.set(state, () => {
                const setting = state[LOCAL_KEY];
                // sendToTab(setting); // send just the changes
                sendToTab({ message: "refreshState" }); // send just the changes
            });
        })
    });
});