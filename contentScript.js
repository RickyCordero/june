




function createToolbar() {
    const html = `
    <div id="toolbar_container">
    <ul id="toolbar_navigation">
        <a href="#" id="toolbar_title" class="toolbar_item">june</a>
        <li id="toolbar_description" class="toolbar_item"></li>
    </ul>
    </div>
    `;
    var height = "35px";
    $('html').prepend(
        $(html).hide().fadeIn("slow")
    );
    $("#toolbar_container").css("height", height);
    $("#toolbar_title").click(() => {
        run();
    });
    $('body').css({
        '-webkit-transform': 'translateY(' + height + ')'
    });
}

// Set the desired file types to scrape
const FILE_TYPES = ["mp4", "gif", "png", "jpg", "webp"]; // file types to download
// const FILE_TYPES = ["mp4"]; // file types to download
// Tag and attribute types
const TAG_TYPES = ["a", "img", "link"]; // html tags to scrape
const TAG_ATTR_MAP = { // attributes to scrape for each tag
    "a": "href",
    "img": "src",
    "link": "href"
};

// Number of files to download in parallel
const ASYNC_LIMIT = 2; // decrease to 1 if throttling suspected, increase if download is too slow

// A simple class for link processing
class Link {
    constructor(tag, attr) {
        this.tag = tag;
        this.attr = attr;
    }
}

/**
 * Determines if the html element contains a desired file type
 * @param {Link} link - The html element
 */
const isFileType = (link) => {
    // return false if there is no attribute in the Link
    if (typeof link.attr === 'undefined') { return false }
    // check if any desired file type is found in the Link's attribute
    return link.attr === "img" || FILE_TYPES.some(fileType => link.attr.includes(`.${fileType.toLowerCase()}`));
};


// /**
//  * Downloads a URL to a local file.
//  * @param {URL} url - The url of the file to be downloaded
//  * @param {String} outputFileName - The name of the output file
//  */
// const downloadFile = (url, outputFileName) => new Promise((resolve, reject) => {
//     // options for http request
//     const options = {
//         uri: url.toString(),
//         headers: {
//             'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36",
//             'Content-Type': 'application/x-www-form-urlencoded'
//         },
//         gzip: true
//     };
//     // initiate http request
//     request(options)
//         .pipe(fs.createWriteStream(outputFileName))
//         .on('finish', () => {
//             console.log(`  ✅ Successfully downloaded ${url.toString()} to ${outputFileName}` + '\n');
//             resolve();
//         })
//         .on('error', (err) => {
//             console.log(`  ❌ There was an error downloading ${url.toString()} to ${outputFileName}` + '\n');
//             reject(err);
//         });
// });


// /**
//  * Process a URL before downloading to a local file.
//  * @param {URL} url - The url to be processed
//  * @param {Function} cb - The next function
//  */
// const processThenDownload = (url, cb) => {
//     // extract name of resource
//     const urlPathName = url.pathname.split("/").pop();
//     // initiate file stream
//     downloadFile(url, urlPathName)
//         .then(() => cb())
//         .catch(err => {
//             cb({ file: url.toString(), error: err });
//         });
// };

function generateZIP(links) {
    var zip = new JSZip();
    var count = 0;
    var zipFilename = "Files.zip";

    links.forEach(function (url, i) {
        var filename = links[i];
        filename = filename.replace(/[\/\*\|\:\<\>\?\"\\]/gi, '')
        // loading a file and add it in a zip file
        JSZipUtils.getBinaryContent(url, function (err, data) {
            if (err) {
                throw err; // or handle the error
            }
            zip.file(filename, data, { binary: true });
            count++;
            if (count == links.length) {
                zip.generateAsync({ type: 'blob' }).then(function (content) {
                    saveAs(content, zipFilename);
                });
            }
        });
    });
}

/**
 * Extract and download all desired files from an html webpage
 * @param {String} html - An html webpage string
 */
const processHtml = () => {

    // map all tree nodes to Links
    const links = TAG_TYPES.reduce((acc, tag) => {
        return acc.concat(
            [...document.querySelectorAll(tag)]
                .map(node => new Link(tag, node[TAG_ATTR_MAP[tag]])));
    }, []);
    console.log(links);

    // extract the unique attribute strings from all Links
    const attributes = [...new Set(
        links
            .filter(isFileType)
            .map(link => link.attr)
    )];

    $("#toolbar_description").hide();
    $("#toolbar_description")[0].textContent = `>> found ${attributes.length} file(s) matching [${FILE_TYPES.join(", ")}]`;
    $("#toolbar_description").fadeIn("slow");

    const downloadHtml = `
    <a href="#" type="button" id="toolbar_download" class="toolbar_btn toolbar_item">
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
    // for (let i = 0; i < attributes.length; i++) {
    //     // $("#myIdForMyToolbar").append(attributes[i]);
    //     console.log(attributes[i]);
    // }
    // async.eachOfLimit(attributes, ASYNC_LIMIT, (attr, _idx, cb) => {
    //     try {
    //         // case 1: attribute is a full url
    //         // e.g. http://website.com/image.png
    //         const url = new URL(attr);
    //         processThenDownload(url, (err) => {
    //             if (err) {
    //                 cb({ file: url.toString(), error: err });
    //             } else {
    //                 cb();
    //             }
    //         });
    //     } catch (error) {
    //         // case 2: attribute is a relative path
    //         // e.g. ./image.png
    //         const url = new URL(WEBPAGE);
    //         url.pathname = attr;
    //         processThenDownload(url, (err) => {
    //             if (err) {
    //                 cb({ file: url.toString(), error: [error, err] });
    //             } else {
    //                 cb();
    //             }
    //         });
    //     }
    // }, (err) => {
    //     if (err) {
    //         console.log(">> A file failed to download:");
    //         console.log(err);
    //     } else {
    //         console.log("❤  All files downloaded successfully.");
    //     }
    // });
};

function run() {
    console.log("starting script");
    createToolbar();
    setTimeout(() => {
        processHtml();
    }, 3000);
}

run();
// $(() => {
// });