(function () {
    // Local storage key
    const LOCAL_KEY = "juneSettings";
    const DEFAULT_STATE = {
        "mp4": false,
        "gif": false,
        "png": false,
        "webp": false
    }
    // Tag and attribute types
    var TAG_TYPES = ["a", "img", "link"]; // html tags to scrape
    var TAG_ATTR_MAP = { // attributes to scrape for each tag
        "a": "href",
        "img": "src",
        "link": "href"
    };

    // Number of files to download in parallel
    var ASYNC_LIMIT = 2;

    // A simple class for link processing
    class Link {
        constructor(tag, attr) {
            this.tag = tag;
            this.attr = attr;
        }
    }

    /**
     * Initialize the toolbar
     */
    function createToolbar() {
        const toolbar_container = `
            <div id="toolbar_container">
                <ul id="toolbar_navigation">
                    <a id="toolbar_title" class="toolbar_item">june</a>
                    <div id="toolbar_description" class="toolbar_item"></div>
                </ul>
            </div>
            `;
        var height = "35px";

        // if toolbar exists, make new one
        if ($("#toolbar_container").length > 0) {
            $("#toolbar_container").remove();
        }

        // fade in the new toolbar container
        $('html').prepend(
            $(toolbar_container).hide().fadeIn("slow")
        );

        // set the height of the new toolbar container
        $("#toolbar_container").css("height", height);

        // add click listener for toolbar title
        $("#toolbar_title").click(() => {
            // hide title slowly
            $("#toolbar_title").hide().fadeOut('slow');
            run(() => {
                // show title slowly
                $("#toolbar_title").show().fadeIn('slow');
            });
        });

        // shift webpage down
        $('body').css({
            '-webkit-transform': 'translateY(' + height + ')'
        });
    }

    /**
     * Determines if the html element contains a desired file type
     * @param {Link} link - The html element
     */
    const isFileType = (link, state) => {
        // return false if there is no attribute in the Link
        if (typeof link.attr === 'undefined') { return false }
        // check if any desired file type is found in the Link's attribute
        const res = Object.keys(state)
            .filter(key => state[key])
            .some(fileType => link.attr.includes(`.${fileType.toLowerCase()}`));
        return res;
    };

    /**
     * Process a URL before downloading to a local file.
     * @param {URL} url - The url to be processed
     * @param {Function} cb - The next function
     */
    const addToZip = (url, zip, cb) => {
        // extract name of resource
        const urlPathName = url.pathname.split("/").pop();
        JSZipUtils.getBinaryContent(url.toString(), function (err, data) {
            if (err) {
                cb(err);
            } else {
                zip.file(urlPathName, data, { binary: true });
                cb();
            }
        });
    };

    function generateZIP(attributes) {
        var zip = new JSZip();
        var zipFilename = "files.zip";
        async.eachOfLimit(attributes, ASYNC_LIMIT, (attr, _idx, cb) => {
            const url = new URL(attr);
            addToZip(url, zip, (err) => {
                if (err) {
                    console.log(`❌ Got an error adding file to zip: ${url.toString()}`);
                    console.log(err);
                } else {
                    console.log(`✅ Finished adding file to zip: ${url.toString()}`);
                }
                cb();
            });
        }, (err) => {
            if (err) {
                console.log(">> A file failed to download:");
                console.log(err);
            } else {
                console.log(`Generating download file: ${zipFilename}`);
                zip.generateAsync({ type: 'blob' }).then(function (content) {
                    saveAs(content, zipFilename);
                    console.log("❤  All files downloaded successfully.");
                });
            }
        });
    }

    function loadState(cb) {
        // load settings from local storage
        chrome.storage.sync.get([LOCAL_KEY], (localState) => {
            let state = {};
            if (localState.hasOwnProperty(LOCAL_KEY)) {
                state = localState[LOCAL_KEY];
            } else {
                console.log("setting default state:");
                state = DEFAULT_STATE;
            }
            cb(state);
        });
    }

    /**
     * Extract and download all desired files from an html webpage
     * @param {String} html - An html webpage string
     */
    const processHtml = (state) => {

        // map all tree nodes to Links
        const links = TAG_TYPES.reduce((acc, tag) => {
            return acc.concat(
                [...document.querySelectorAll(tag)]
                    .map(node => new Link(tag, node[TAG_ATTR_MAP[tag]])));
        }, []);

        // extract the unique attribute strings from all Links
        let attributes = [
            ...
            new Set(
                links
                    .filter(item => isFileType(item, state))
                    .map(link => link.attr)
            )
        ];

        $("#toolbar_description").hide();
        $("#toolbar_description")[0].textContent =
            `>> found ${attributes.length} file(s) matching [${Object.keys(state)
                .filter(key => state[key]).join(", ")}]`;
        $("#toolbar_description").fadeIn("slow");

        $("#toolbar_download").hide();
        if ($("#toolbar_download").length > 0) {
            $("#toolbar_download").remove();
        }
        if (attributes.length) { // if there are files to download
            const downloadHtml = `
            <a type="button" id="toolbar_download" class="toolbar_btn toolbar_item">
                <span>
                    download
                </span>
            </a>
            `;
            $("#toolbar_navigation").append(downloadHtml);
            $("#toolbar_download").click(() => {
                // download each file in parallel
                console.log(`>> Downloading ${attributes.length} file(s)...` + '\n');
                generateZIP(attributes);
            });
            $("#toolbar_download").fadeIn("slow");
        }
    };

    function run(callback) {
        createToolbar();
        loadState(state => {
            processHtml(state);
            if (callback) {
                callback();
            }
        });
    }

    run();

    chrome.runtime.onMessage.addListener(messageListener);

    function messageListener(request, _sender, _sendResponse) {
        if (request.message == "refreshState") {
            run();
        }
    }
})();