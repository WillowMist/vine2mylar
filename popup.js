let config = {}


chrome.storage.sync.get({mylar_url: '', mylar_apikey: ''}, function(items) {
    config['mylarURL'] = items.mylar_url;
    config['mylarAPI'] = items.mylar_apikey;
    if (config['mylarURL']) console.info("Loaded: " + config['mylarURL'])
});

function getMylarResponse (command, data) {
    if (command === 'series') {
        var searchUrl = config['mylarURL'] + '/api?apikey=' + config['mylarAPI'] + '&cmd=addComic&id=' + encodeURIComponent(data);
    } else if (command === 'arc') {
        var searchUrl = config['mylarURL'] + '/api?apikey=' + config['mylarAPI'] + '&cmd=getStoryArc&customOnly=1';
    } else if (command === 'addArc') {
        var searchUrl = data;
    } else if (command === 'none') {
    } else if (command === 'badurl') {

    }
    var headers = new Headers();
    headers.append('Accept', 'text/json');
    var init = {
        method: 'GET',
        headers: headers,
    }
    return new Promise((resolve, reject) => fetch(searchUrl, init).then(data => resolve(data.json())));
}

function getCurrentTabUrl(callback, errorCallback, storyCallback) {
	var queryInfo = {
		active: true,
		currentWindow: true
	};
	chrome.tabs.query(queryInfo, function(tabs) {
		var tab = tabs[0];
		var errorMsg = '';
		console.assert(typeof tab.url == 'string', 'tab.url should be a string');

		var url = tab.url;
		var bits = url.split('/');
		if (bits[2] != 'comicvine.gamespot.com') {
			callback("badurl", + bits[2]);
		}
		else {
            console.log("ID: " + bits[4]);
            var series = bits[4].split('-');
            if (series[0] == '4050') {
                callback("series", series[1]);
            } else if (series[0] == '4000') {
                callback("arc", series[1])
            } else {
                callback("none", series[0]);

            }
        }
	});
}

function getMylarArcs(callback, errorCallback) {
    chrome.storage.sync.get({mylar_url: '', mylar_apikey: ''}, function(items) {
        mylarURL = items.mylar_url;
        mylarAPI = items.mylar_apikey;
        if (mylarURL == '') {
            errorCallback('No Mylar URL set.' + mylarURL + ' Check extension options.');
            return;
        }
        var searchUrl = mylarURL + '/api?apikey=' + mylarAPI + '&cmd=getStoryArc&customOnly=1';
        //errorCallback(searchUrl);
        //return;
        var x = new XMLHttpRequest();
        x.open('GET', searchUrl);
        x.responseType = 'text';
        x.onload = function() {
            var response = x.response;
            if (!response) {
                errorCallback('No response from Mylar!');
                return;
            }
            callback(response);
        };
        x.onerror = function() {
            errorCallback('Network error.');
        };
        x.send();
    });

}

function renderStatus(statusText, titleText="") {
	document.getElementById('status').textContent = statusText;
    document.getElementById('statustitle').textContent = titleText;
}

function showArcMenu(arclist, issueid) {

    renderStatus("", titleText="Add To Story Arc");
    document.getElementById('arcmenu').style.display = 'block';
    var arcs = arclist;
    console.log(arcs);
    var select = document.getElementById('id');
    for(arc in arcs) {
        var option = document.createElement("option");
        option.text = arcs[arc].StoryArc;
        option.value = arcs[arc].StoryArcID;
        select.appendChild(option);
    }
    var option = document.createElement("option");
    option.text = "Add New Story Arc";
    option.value = "None";
    select.appendChild(option);
    var issues = document.getElementById('issues');
    issues.value = issueid;
    var form = document.getElementById('addissueform');
    form.action = config['mylarURL'] + '/api?cmd=addStoryArc';
    var apikey = document.getElementById('apikey');
    apikey.value = config['mylarAPI'];
    var finishedbutton = document.getElementById('finished');
    finishedbutton.addEventListener('click', function() { checkBeforeSubmit(); });
}

function checkBeforeSubmit() {
    var form = document.getElementById('addissueform');
    id = document.getElementById("id");
    storyarcname = document.getElementById("storyarcname");
    issues = document.getElementById("issues");
    apikey = document.getElementById("apikey");
    let url = '';
    if (id.value === "None") {
        if (storyarcname.value === "") {
            renderStatus("Either choose a Story Arc or enter a new name", titleText="Add To Story Arc");
        }
        else {
            renderStatus("Creating New Story Arc");
            let url = form.action + "&apikey=" + apikey.value + "&storyarcname=" + storyarcname.value + "&issues=" + issues.value;
            getMylarResponse('addArc', url).then((data) => renderStatus(data.data, titleText="Add To Story Arc"));
        }
    }
    else {
        if (storyarcname.value === "") {
            renderStatus("Adding issue to " + id.value, titleText='Adding to Story Arc');
            let url = form.action + "&apikey=" + apikey.value + "&id=" + id.value + "&issues=" + issues.value;
            getMylarResponse('addArc', url).then((data) => renderStatus(data.data, titleText="Add To Story Arc"));
        }
        else {
            renderStatus("Creating New Story Arc", titleText='New Arc');
            let url = form.action + "&apikey=" + apikey.value + "&storyarcname=" + storyarcname.value + "&issues=" + issues.value;
            getMylarResponse('addArc', url).then((data) => renderStatus(data.data,titleText="Add To Story Arc"));
        }
    }
}

document.getElementById('status').style.display = 'block';
document.getElementById('arcmenu').style.display = 'none';
getCurrentTabUrl(function(command,data) {
    if (command === "series") {
        renderStatus('Importing ' + data + ' into Mylar', titletext='Series Import');
        getMylarResponse(command, data).then((data) => {
            renderStatus(data.data, titletext='Series Import');
        });
    } else if (command === "arc") {
        getMylarResponse(command, data).then((arclist) => {
            showArcMenu(arclist, data);
        });
    } else if (command === "none") {
        renderStatus("Not a series or issue: " + data, titletext='Series Import')
    } else if (command === "badurl") {
        renderStatus("Not a ComicVine URL: " + data, titletext='Series Import')
    }
/*		getMylarUrl(url, function(response) {
        renderStatus('Mylar response: ' + response);
    },
    function(errorMessage) {
        renderStatus(errorMessage);
    });
    */
},function(errorMessage) {renderStatus('Error: ' + errorMessage);}, function(issueid) {
    renderStatus('Getting Mylar Arcs');
/*	    getMylarArcs(
        function(response) {
            showArcMenu(response, issueid)
        },
        function(errorMessage) {
            renderStatus(errorMessage);
        }
    )
    */
});
