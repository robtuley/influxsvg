var configElement = document.getElementById("influxsvg");
var URL = configElement.getAttribute("url");
var REQUESTS_PER_SECOND = configElement.getAttribute("requestsPerSecond");
var USERNAME = configElement.getAttribute("username");
var PASSWORD = configElement.getAttribute("password");

function doInfluxRequest(query,next) {
  var queryUrl = URL+"/series?u="+encodeURIComponent(USERNAME)+
                            "&p="+encodeURIComponent(PASSWORD)+
                            "&q="+encodeURIComponent(query);
	
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {
    xhr.open('GET', queryUrl, true);
  } else if (typeof XDomainRequest != "undefined") {
    xhr = new XDomainRequest();
    xhr.open('GET', url);
  } else {
    return next(new Error("CORS is not supported"));
  }

  xhr.onload = function() {
    next(null,JSON.parse(xhr.responseText));
  };

  xhr.onerror = next;
  xhr.send();
}

function getLatest(series,next) {
  var query = "select value from "+series+" where time > now() - 60s limit 1";
  doInfluxRequest(query,parseData);

  function parseData(err,data) {
	  if(err) return next(err);
	  next(null,data[0].points[0][2]);
	}
}

function populateLatestElementFn(el,query) {
  return function(){
    getLatest(query,function(err,data) {
	    if(err) return console.log(err);
	    el.textContent = data;
    })
  }
}

// update elements at a constant request rate
var metricElements = document.getElementsByClassName("metric");
if (metricElements.length>0) {
 
  var msUpdateFreq = Math.round(1000/(REQUESTS_PER_SECOND/metricElements.length));
  console.log("Metrics will update every "+msUpdateFreq+"ms");

  for (var i=0, el; el = metricElements[i]; i++) {
    (function(){
      var fn = populateLatestElementFn(el,el.getAttribute("series"));
      setTimeout(function(){ fn(); setInterval(fn,msUpdateFreq) },
	             Math.round(i*msUpdateFreq/metricElements.length));
    })() 
  }

}
