var GENDER = undefined;
var COUNTRY = undefined;
var EventHub = {
    topics: {},

    subscribe: function (topic, handler) {
        if (!this.topics[topic]) {
            this.topics[topic] = [];
        }

        this.topics[topic].push(handler);
    },

    publish: function (topic, data) {

        if (!this.topics[topic] || this.topics[topic].length < 1)
            return;

        this.topics[topic].forEach(function (listener) {
            listener(data || {});
        });
    }
};
$(document).ready(function () {
    // SDK Needs to create video and canvas nodes in the DOM in order to function
    // Here we are adding those nodes a predefined div.
    var divRoot = $("#facevideo-node")[0];
    var width = 640;
    var height = 480;
    var faceMode = affdex.FaceDetectorMode.LARGE_FACES;
    //Construct a CameraDetector and specify the image width / height and face detector mode.
    var detector = new affdex.CameraDetector(divRoot, width, height, faceMode);

    // detector.detectAppearance.gender = true;
    //Enable detection of all Expressions, Emotions and Emojis classifiers.
    // detector.detectAllEmotions();
    // detector.detectAllExpressions();
    // detector.detectAllEmojis();
    detector.detectAllAppearance();
    var API_KEY = "AIzaSyCdQbLORhF7PGVJ7DG1tkoVJGgDYwA_o0M";
    //Add a callback to notify when the detector is initialized and ready for runing.
    detector.addEventListener("onInitializeSuccess", function () {
        log('#logs', "The detector reports initialized");
        //Display canvas instead of video feed because we want to draw the feature points on it
        $("#face_video_canvas").css("display", "block");
        $("#face_video").css("display", "none");
    });

    function log(node_name, msg) {
        $(node_name).append("<span>" + msg + "</span><br />");
    }
    setTimeout(() => {
        if (detector && !detector.isRunning) {
            $("#logs").html("");
            detector.start();
        }
        //get country
        $.get("https://ipinfo.io", function (response) {
            console.log(response.city, response.country,response);
            COUNTRY = response.country;
            alert(COUNTRY);
        }, "jsonp");
    }, 500);

    //function executes when Start button is pushed.
    function onStart() {
        alert("ok")
        if (detector && !detector.isRunning) {
            $("#logs").html("");
            detector.start();
        }
        log('#logs', "Clicked the start button");
    }

    //function executes when the Stop button is pushed.
    function onStop() {
        log('#logs', "Clicked the stop button");
        if (detector && detector.isRunning) {
            detector.stop();
            detector.removeEventListener();


        }
    };

    //function executes when the Reset button is pushed.
    function onReset() {
        log('#logs', "Clicked the reset button");
        if (detector && detector.isRunning) {
            detector.reset();
            $('#results').html("");
        }
    };

    //Add a callback to notify when camera access is allowed
    detector.addEventListener("onWebcamConnectSuccess", function () {
        log('#logs', "Webcam access allowed");
    });

    //Add a callback to notify when camera access is denied
    detector.addEventListener("onWebcamConnectFailure", function () {
        log('#logs', "webcam denied");
        console.log("Webcam access denied");
    });

    //Add a callback to notify when detector is stopped
    detector.addEventListener("onStopSuccess", function () {
        log('#logs', "The detector reports stopped");
        $("#results").html("");
    });

    //Add a callback to receive the results from processing an image.
    //The faces object contains the list of the faces detected in an image.
    //Faces object contains probabilities for all the different expressions, emotions and appearance metrics
    var flag = false;
    detector.addEventListener("onImageResultsSuccess", function (faces, image, timestamp) {
        $('#results').html("");
 
        log('#results', "Timestamp: " + timestamp.toFixed(2));
        log('#results', "Number of faces found: " + faces.length);
        if (faces.length > 0) {
        
            log('#results', "Emotions: " + JSON.stringify(faces[0].emotions, function (key, val) {
                return val.toFixed ? Number(val.toFixed(0)) : val;
            }));
            log('#results', "Expressions: " + JSON.stringify(faces[0].expressions, function (key, val) {
                return val.toFixed ? Number(val.toFixed(0)) : val;
            }));
            log('#results', "Emoji: " + faces[0].emojis.dominantEmoji);

            if (faces[0].appearance.gender != "Unknown") {

                onStop();
                if (flag) {
                    //latest lender
                    GENDER = faces[0].appearance.gender;
                    console.log(GENDER)
                    alert(JSON.stringify(faces[0].appearance.gender));
                    $('#logs').html("");
                    log('#logs', 'gender: ' + GENDER);
                    log('#logs', 'country: ' + COUNTRY);
                    EventHub.publish('Detected', { gender: GENDER, country: COUNTRY });

                }
                flag = true;

            } else
                drawFeaturePoints(image, faces[0].featurePoints);
        }
    });

    //Draw the detected facial feature points on the image
    function drawFeaturePoints(img, featurePoints) {
        var contxt = $('#face_video_canvas')[0].getContext('2d');

        var hRatio = contxt.canvas.width / img.width;
        var vRatio = contxt.canvas.height / img.height;
        var ratio = Math.min(hRatio, vRatio);

        contxt.strokeStyle = "#FFFFFF";
        for (var id in featurePoints) {
            contxt.beginPath();
            contxt.arc(featurePoints[id].x, featurePoints[id].y, 2, 0, 2 * Math.PI);
            contxt.stroke();
        }
    }

    var stockData = [
        {
            Symbol: "AAPL",
            Company: "Apple Inc.",
            Price: "132.54"
        },
        {
            Symbol: "INTC",
            Company: "Intel Corporation",
            Price: "33.45"
        },
        {
            Symbol: "GOOG",
            Company: "Google Inc",
            Price: "554.52"
        },
    ];

    function convertArrayOfObjectsToCSV(args) {
        var result, ctr, keys, columnDelimiter, lineDelimiter, data;

        data = args.data || null;
        if (data == null || !data.length) {
            return null;
        }

        columnDelimiter = args.columnDelimiter || ',';
        lineDelimiter = args.lineDelimiter || '\n';

        keys = Object.keys(data[0]);

        result = '';
        result += keys.join(columnDelimiter);
        result += lineDelimiter;

        data.forEach(function (item) {
            ctr = 0;
            keys.forEach(function (key) {
                if (ctr > 0) result += columnDelimiter;
                result += item[key];
                ctr++;
            });
            result += lineDelimiter;
        });

        return result;
    }

    function convertToCSV(objArray) {
        var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
        var str = '';

        for (var i = 0; i < array.length; i++) {
            var line = '';
            for (var index in array[i]) {
                if (line != '') line += ',';
                line += array[i][index];
            }
            str += line + '\r\n';
        }

        return str;
    }

    function exportCSVFile(headers, items, fileTitle) {
        if (headers) {
            items.unshift(headers);
        }

        // Convert Object to JSON
        var jsonObject = JSON.stringify(items);

        var csv = this.convertToCSV(jsonObject);

        var exportedFilenmae = fileTitle + '.csv' || 'export.csv';

        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, exportedFilenmae);
        } else {
            var link = document.createElement("a");
            if (link.download !== undefined) { // feature detection
                // Browsers that support HTML5 download attribute
                var url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", exportedFilenmae);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    }

    function download() {
        var headers = {
            model: 'Phone Model'.replace(/,/g, ''), // remove commas to avoid errors
            chargers: "Chargers",
            cases: "Cases",
            earphones: "Earphones"
        };

        itemsNotFormatted = [
            {
                model: 'Samsung S7',
                chargers: '55',
                cases: '56',
                earphones: '57',
                scratched: '2'
            },
            {
                model: 'Pixel XL',
                chargers: '77',
                cases: '78',
                earphones: '79',
                scratched: '4'
            },
            {
                model: 'iPhone 7',
                chargers: '88',
                cases: '89',
                earphones: '90',
                scratched: '6'
            }
        ];

        var itemsFormatted = [];

        // format the data
        itemsNotFormatted.forEach((item) => {
            itemsFormatted.push({
                model: item.model.replace(/,/g, ''), // remove commas to avoid errors,
                chargers: item.chargers,
                cases: item.cases,
                earphones: item.earphones
            });
        });

        var fileTitle = 'orders'; // or 'my-unique-title'

        exportCSVFile(headers, itemsFormatted, fileTitle); // call the exportCSVFile() function to process the JSON and trigger the download
    }
});

