/*jshint node:true*/
"use strict";

var request = require("request");

var resultRegexp = /<a href="\/tor[^>]+>([^<]+)<\/a><\/div><a href="(magnet:[^"]+)".*?Size ([0-9.]+)&nbsp;([^,]+).*?<td align="right">(\d+)/;
var units = {
	"B": 1,
	"KiB": 1024,
	"MiB": 1024 * 1024,
	"GiB": 1024 * 1024 * 1024
};

function tpbPlugin(nestor) {
	var intents = nestor.intents;
	var config = nestor.config;
	var baseUrl = config.baseUrl || "http://thepiratebay.se";

	intents.on("nestor:startup", function() {
		intents.emit("downloads:searcher", "The Pirate Bay", function(query, callback) {
			request(
				baseUrl + "/search/" + encodeURIComponent(query) + "/0/7/0",
				function(err, response, data) {
					if (err) {
						return callback(err);
					}

					if (response.statusCode !== 200) {
						return callback(new Error("HTTP " + response.statusCode));
					}

					var results = data
						.replace(/[\n\t]/g, "")
						.split("class=\"vertTh\"")
						.reduce(function(results, result) {
							if (results === "first") {
								return [];
							} else {
								var match = result.match(resultRegexp);
								if (match) {
									results.push({
										name: match[1],
										magnet: match[2],
										size: parseFloat(match[3]) * units[match[4]],
										seeders: parseInt(match[5], 10)
									});
								}

								return results;
							}
						}, "first");

					if (results === "first") {
						results = [];
					}

					callback(null, results);
				}
			);
		});
	});
}

tpbPlugin.manifest = {
	name: "downloads-tpb",
	description: "The Pirate Bay bittorrent search",
	dependencies: ["nestor-downloads"]
};

module.exports = tpbPlugin;
