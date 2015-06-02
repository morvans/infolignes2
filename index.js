var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();
var Q = require('q');

app.get('/train/:trainNumber', function (req, res) {
  scrape(req.params.trainNumber, request).then(function (body) {
    res.send(body);
  },function(error){
    res.statusCode = 500;
    res.send(error);
  });
});


function scrape(trainNumber, request) {

  console.log("Scrape train " + trainNumber);

  var deferred = Q.defer();

  var j = request.jar();
  var request = request.defaults({jar: j, followAllRedirects: true});


  request('http://www.sncf.com/fr/horaires-info-trafic', function (error, response, body) {


    if(error){
      console.log("error: " + error);
      deferred.reject(error);
      return;
    }

    console.log("cookies Response:" + response.statusCode);


    request.post({
      headers: {'content-type': 'application/x-www-form-urlencoded'},
      url: 'http://www.sncf.com/fr/train',
      body: "sncfdirect=true&numeroTrain=" + trainNumber + "&date=02/06/2015"
    }, function (error, response, body) {

      if(error){
        console.log("error: " + error);
        deferred.reject(error);
        return;
      }

      console.log("Data Response:" + response.statusCode);

      var train = {};
      var $ = cheerio.load(body);


      train.trainNumber = $('#block-itineraires #description .search_summary strong').first().text();

      $('.itinerary-details').filter(function () {
        $('table.timetable', this).filter(function () {
          train.start = {
            name: $('.itinerary-start .station', this).text(),
            time: $('.itinerary-start > .time:not(.new-schedule)', this).text().trim()
          };
            train.start.newSchedule = $('.itinerary-start > .time.new-schedule', this).text().trim();

          train.stops = [];
          $('.itinerary-stop', this).each(function (index, element) {
            var station = {
              name: $('.station', element).text(),
              time: $('.time:not(.new-schedule)', element).text().trim()
            };
            station.newSchedule = $('.time.new-schedule', element).text().trim()
            train.stops.push(station);
          });
          train.end = {
            name: $('.itinerary-end .station', this).text(),
            time: $('.itinerary-end > .time:not(.new-schedule)', this).text().trim()
          };
          train.end.newSchedule = $('.itinerary-end > .time.new-schedule', this).text().trim();

        });
      });


      console.log(train);
      deferred.resolve(train);


    });
  });

  return deferred.promise;

}

app.listen('8080')

console.log('Magic happens on port 8080');

exports = module.exports = app;
