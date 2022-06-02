// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback, errorCallback, storyCallback) {
	var queryInfo = {
		active: true,
		currentWindow: true
	};
	chrome.tabs.query(queryInfo, function(tabs) {
		var tab = tabs[0];
		var errorMsg = '';
		console.assert(typeof url == 'string', 'tab.url should be a string');

		var url = tab.url;
		var bits = url.split('/');
		if (bits[2] != 'comicvine.gamespot.com') {
			errorCallback('Not a ComicVine URL: ' + bits[2]);
		}
		else {
			var series = bits[4].split('-');
			if (series[0] == '4050') {
                callback(series[1]);
			}
			else if (series[0] == '4000') {
				storyCallback(series[1])
			}
			else
			{
                var errSeries = series[0];
                errorCallback('Not a ComicVine Series: ' + bits[4]);
			}
		}
	});
}

/**
 * @param {string} searchTerm - Search term for Google Image search.
 * @param {function(string,number,number)} callback - Called when an image has
 *   been found. The callback gets the URL, width and height of the image.
 * @param {function(string)} errorCallback - Called when the image is not found.
 *   The callback gets a string that describes the failure reason.
 */
function getMylarUrl(searchTerm, callback, errorCallback) {
	chrome.storage.sync.get({mylar_url: '', mylar_apikey: ''}, function(items) { 
		mylarURL = items.mylar_url;
		mylarAPI = items.mylar_apikey;
		if (mylarURL == '') {
			errorCallback('No Mylar URL set.' + mylarURL + ' Check extension options.');
			return;
		}
		var searchUrl = mylarURL + '/api?apikey=' + mylarAPI + '&cmd=addComic&id=' + encodeURIComponent(searchTerm);
		//errorCallback(searchUrl);
		//return;
		var x = new XMLHttpRequest();
		x.open('GET', searchUrl);
		x.responseType = 'text';
		x.onload = function() {
			// Parse and process the response from Google Image Search.
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

function renderStatus(statusText) {
	document.getElementById('status').textContent = statusText;
}
function showArcMenu(arclist, issueid) {

    chrome.storage.sync.get({mylar_url: '', mylar_apikey: ''}, function(items) {
        mylarURL = items.mylar_url;
        mylarAPI = items.mylar_apikey;
    });
    renderStatus("");
    document.getElementById('arcmenu').style.display = 'block';
    var arcs = JSON.parse(arclist);
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
    option.value="";
    select.appendChild(option);
    var issues = document.getElementById('issues');
    issues.value = issueid;
    var form = document.getElementById('addissueform');
    form.action = mylarURL + '/api?cmd=addStoryArc';
    var apikey = document.getElementById('apikey');
    apikey.value = mylarAPI;
    var finishedbutton = document.getElementById('finished');
    finishedbutton.addEventListener('click', function() { checkBeforeSubmit(); });
}

function getMylarResponse(url) {
    document.getElementById('arcmenu').style.display = 'none';
    var x = new XMLHttpRequest();
    x.open('GET', encodeURI(url));
    x.responseType = 'text';
    x.onload = function() {
        var response = x.response;
        if (!response) {
            renderStatus('No response from Mylar!');
            return;
        }
        renderStatus(response);
    };
    x.onerror = function() {
        renderStatus('Network error.');
    };
    x.send();
}

function checkBeforeSubmit() {
    var form = document.getElementById('addissueform');
    id = document.getElementById("id");
    storyarcname = document.getElementById("storyarcname");
    issues = document.getElementById("issues");
    apikey = document.getElementById("apikey");
    if (id.value == "") {
        if (storyarcname.value == "") {
            renderStatus("Either choose a Story Arc or enter a new name");
        }
        else {
            renderStatus("Creating New Story Arc");
            getMylarResponse(form.action + "&apikey=" + apikey.value + "&storyarcname=" + storyarcname.value + "&issues=" + issues.value)
        }
    }
    else {
        if (storyarcname.value == "") {
            renderStatus("Adding issue to " + id.value);
            getMylarResponse(form.action + "&apikey=" + apikey.value + "&id=" + id.value + "&issues=" + issues.value)
        }
        else {
            renderStatus("Creating New Story Arc");
            getMylarResponse(form.action + "&apikey=" + apikey.value + "&storyarcname=" + storyarcname.value + "&issues=" + issues.value)
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('status').style.display = 'block';
    document.getElementById('arcmenu').style.display = 'none';
	getCurrentTabUrl(function(url) {
		renderStatus('Importing ' + url + ' into Mylar');
		getMylarUrl(url, function(response) {
			renderStatus('Mylar response: ' + response);
		}, 
		function(errorMessage) {
			renderStatus(errorMessage);
		});
	},function(errorMessage) {renderStatus('Error: ' + errorMessage);}, function(issueid) {
	    renderStatus('Getting Mylar Arcs');
	    getMylarArcs(
	        function(response) {
                showArcMenu(response, issueid)
            },
            function(errorMessage) {
                renderStatus(errorMessage);
            }
        )
    });
});
