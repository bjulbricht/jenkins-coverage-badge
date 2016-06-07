#! /usr/bin/env node

var request = require('request')
var express = require('express')
var xml2js = require('xml2js')
var coberturaPath = '/jenkins/cobertura/'
var jacocoPath = '/jenkins/jacoco/'

var app = express()
var badgeColor = function(cov) {
	if (cov < 20) {
		return 'red'
	} else if (cov < 80) {
		return 'yellow'
	} else {
		return 'brightgreen'
	}
}
var getBadgeUrl = function(req, label, color) {
	var badgeUrl = 'https://img.shields.io/badge/coverage-' + label + '-' + color + '.svg'
	var style = req.param("style")
	if (typeof style != 'undefined') {
		badgeUrl += '?style=' + style
	}
	console.log('[INFO]  Generating badge: ' + badgeUrl)
	return badgeUrl
}

app.get('/test', function(req,req) {
  console.log("testing....")
})

//cobertura
app.get(coberturaPath + '*', function(req,res) {
	var jurl = req.params[0]
        var proto = req.params.proto
	var url = proto + '://' + jurl + '/lastSuccessfulBuild/cobertura/api/json/?depth=2'
	console.log('[GET]   ' + coberturaPath + jurl)

	request(url, function(err, response, body) {
		if (!err && response.statusCode == 200) {
			var elements = JSON.parse(body)['results']['elements']
			for (var i in elements) {
				if (elements[i]['name'] == 'Lines') {
					var cov = elements[i]['ratio'].toFixed(2)
					res.redirect(getBadgeUrl(req, cov.toString() + '%', badgeColor(cov)))
				}
			}
		} else {
			console.log('[ERROR] ' + err)
			res.redirect(getBadgeUrl(req, 'none', 'lightgrey'))
		}
	})
})

//jacoco
// https://mobilefirst-2-jenkins.swg-devops.com:8443/view/bms-analytics/job/bms-analytics-server-development-branch-nightly/lastSuccessfulBuild/jacoco/api/xml
app.get(jacocoPath + '*', function(req,res) {
	var jurl = req.params[0]
console.log("jurl = " + jurl);
        var proto = 'https';
console.log("proto = " + proto);
	var url = proto + '://' + jurl + '/lastSuccessfulBuild/jacoco/api/xml'
console.log("url = " + url);
	console.log('[GET]   ' + url)

	request({ 'url': url, 'headers': { 'Authorization': 'Basic ' + new Buffer('username:password').toString('base64') } }, function(err, response, body) {
		if (!err && response.statusCode == 200) {
			var xmlParser = new xml2js.Parser();
			xmlParser.parseString(body, function (err, result) {
				var cov = parseFloat(result.coverageReport.lineCoverage[0].percentageFloat[0]).toFixed(2);
				res.redirect(getBadgeUrl(req, cov.toString() + '%', badgeColor(cov)))	
			})
		} else {
			console.log('[ERROR] ' + err)
			res.redirect(getBadgeUrl(req, 'none', 'lightgrey'))
		}
	})
})

var port = process.argv.slice(2)[0];
if (!port) port = 9913
var server = app.listen(port, function() {
  console.log('Listening on port %d...', server.address().port)
})
