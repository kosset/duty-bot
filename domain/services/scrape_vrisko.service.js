const request = require("request");
const $ = require('cheerio');
const CronJob = require('cron').CronJob;
const logger = require("../../loggers").appLogger;
const PharmacyModel = require("../models/pharmacy.model");
const {timeout} = require("../../utils/misc");


module.exports = class VriskoScraperService {

  constructor() {
    this.startPage = "https://www.vrisko.gr/efimeries-farmakeion/";
    this.pharmaciesLocation = [];
    const that = this;
    new CronJob('0 0 0 * * *', function() {
      return that.updatePharmacies().catch(e => {
        throw e;
      });
    }, null, true, 'Europe/Athens', null, true);
  }

  async getNearestPharmacies() {

  }

  async updatePharmacies(){
    const that = this;

    let today = new Date();
    today = new Date(today.getFullYear(), today.getMonth(), today.getUTCDate() );

    const pharmaciesHaveBeenUpdated = await PharmacyModel.pharmaciesForDateExist(today);
    const shouldUpdate = !pharmaciesHaveBeenUpdated;
    if (shouldUpdate) {

      try {
        logger.debug("Updating the list of pharmacies...");
        const pharmacies = await that.getAllPharmacies();
        await that.setPharmaciesLocation();
        const numOfPharmacies = pharmacies.length;
        let i, pharmacy;
        for (i = 0; i < numOfPharmacies; i++) {
          pharmacy = new PharmacyModel({
            name: pharmacies[i].name,
            address: pharmacies[i].address,
            phone: pharmacies[i].telephone,
            createdAt: new Date(pharmacies[i].date),
            workingHours: pharmacies[i].workingHours,
            startAt1: new Date(pharmacies[i].startDate1),
            endAt1: new Date(pharmacies[i].endDate1),
            startAt2: new Date(pharmacies[i].startDate2),
            endAt2: new Date(pharmacies[i].endDate2),
            location: {
              type: 'Point',
              coordinates: [
                1, // Longitude
                2 // Latitude
              ]
            }
          });
          await pharmacy.save();
        }
        logger.verbose("List of pharmacies has been updated.");
      } catch (e) {
        throw e;
      }
    }
  }

  async setPharmaciesLocation() {
    const that = this;
    if (!that.pharmaciesLocation.length) {
      const options = {
        url: 'https://www.vrisko.gr/MvcMap/Handler/pois.ashx?cat=4',
        method: 'GET',
        headers: {
          'cache-control': 'no-cache',
          Connection: 'keep-alive',
          'accept-encoding': 'gzip, deflate',
          Host: 'www.vrisko.gr',
          Accept: '*/*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36' },
        json: true
      };

      try {
        await timeout(5000);
        const response = await that.makeAPIRequest(options);
        that.pharmaciesLocation = JSON.parse(response.split(',"","",]').join(']'));
        logger.debug(`Found ${that.pharmaciesLocation.length} locations of Pharmacies`)
      } catch (e) {
        throw e;
      }
    }
  }

  async getAllPharmacies() {
    const that = this;
    const options = {
      url: that.startPage,
      method: 'GET',
      headers: {
        'cache-control': 'no-cache',
        Connection: 'keep-alive',
        'accept-encoding': 'gzip, deflate',
        Host: 'www.vrisko.gr',
        Accept: '*/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36'
      }
    };

    let responseHTML;

    try {
      responseHTML = await that.makeAPIRequest(options);
      logger.debug(responseHTML);

      let i, j, detailLinks = [], moreLinks = [], link;

      const aTags = $('ul.blockPrefecture > li > a', responseHTML);
      const numOfLinks = aTags.length;

      for (i=0; i<numOfLinks; i++) {
        link = aTags[i].attribs.href;
        if (link.includes('SelectedPrefecture=')) {
          await timeout(1000);
          responseHTML = await that.makeAPIRequest({
            url: link,
            method: 'GET',
            headers: {
              'cache-control': 'no-cache',
              Connection: 'keep-alive',
              'accept-encoding': 'gzip, deflate',
              Host: 'www.vrisko.gr',
              Accept: '*/*',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36'
            }
          });
          moreLinks = $('td.RegionDescription > a', responseHTML);
          const numOfMoreLinks = moreLinks.length;
          for(j = 0; j<numOfMoreLinks; j++) {
            detailLinks.push(moreLinks[j].attribs.href);
          }
        } else {
          detailLinks.push(link);
        }
      }

      logger.debug(`Found ${detailLinks.length} links with pharmacies`);

      let pharmaciesPerPage = [], allPharmacies = [];
      const numOfDetailLinks = detailLinks.length;
      for (i = 0; i< numOfDetailLinks; i++) {
        await timeout(1000);
        pharmaciesPerPage = await that.scrapeDetailsPage(detailLinks[i]);
        for (j=0; j<pharmaciesPerPage.length; j++) {
          allPharmacies.push(pharmaciesPerPage[j]);
        }
      }
      return allPharmacies;
    } catch (e) {
      logger.error(e);
      throw e;
    }

  }

  async scrapeDetailsPage(url) {
    const  that = this;
    logger.verbose(`Scraping ${url}`);

    const responseHTML = await that.makeAPIRequest({
      url,
      method: 'GET',
      headers: {
        'cache-control': 'no-cache',
        Connection: 'keep-alive',
        'accept-encoding': 'gzip, deflate',
        Host: 'www.vrisko.gr',
        Accept: '*/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36'
      }
    });
    const $pharmacies = $('section.DutiesResult', responseHTML);

    let i, details = [], arr = [], workingHours, firstDuty, secondDuty, nextTimeOnly, startDate1, endDate1, startDate2, endDate2, date;
    const numOfPharms = $pharmacies.length;
    for (i=0; i<numOfPharms; i++) {
      date = $pharmacies[i]('div.ResultRight > div.DutyDay > span').text().trim().split(' ')[1];
      firstDuty = $pharmacies[i]('div.ResultRight > div.DutyTimes > span.firstTime').text().trim();
      secondDuty = $pharmacies[i]('div.DutyTimes > span.normTime') ? $pharmacies[i]('div.DutyTimes > span.normTime').text().trim() : null;
      nextTimeOnly = $pharmacies[i]('div.DutyTimes > span.nextTimeOnly') ? $pharmacies[i]('div.DutyTimes > span.nextTimeOnly').text().trim() : null;
      arr = date.split('/');
      startDate1 = `${arr[2]}-${arr[1]}-${arr[0]}T${firstDuty.split('-')[0]}:00`;
      endDate1 = '';
      startDate2 = '';
      endDate2 = '';
      if (nextTimeOnly) {
        let tempDate = new Date(Date.UTC(arr[2], arr[1]-1, arr[0]) + (24*60*60*1000));
        let month = tempDate.getUTCMonth() + 1; //months from 1-12
        let day = tempDate.getUTCDate();
        let year = tempDate.getUTCFullYear();
        endDate1 = `${year}-${month}-${day}T${firstDuty.split('-')[1]}:00`;
      } else {
        endDate1 = `${arr[2]}-${arr[1]}-${arr[0]}T${firstDuty.split('-')[1]}:00`;
        if (secondDuty) {
          startDate2 = `${arr[2]}-${arr[1]}-${arr[0]}T${secondDuty.split('-')[0]}:00`;
          endDate2 = `${arr[2]}-${arr[1]}-${arr[0]}T${secondDuty.split('-')[1]}:00`;
        }
      }
      workingHours = firstDuty + ( nextTimeOnly? (' ' + nextTimeOnly) : secondDuty ? (' & ' + secondDuty) : '' );
      details[i] = {
        name: $pharmacies[i]('h2 > a').text().trim(),
        address: $pharmacies[i]('div.ResultLeft > div.ResultAddr > span').text().trim(),
        telephone: $pharmacies[i]('span.spPhone').text().trim(),
        date,
        workingHours,
        startDate1,
        endDate1,
        startDate2,
        endDate2
      }
    }
    return details;
  }

  makeAPIRequest(options) {
    return new Promise((resolve, reject) => {
      request(options, function(error, response, body) {

        if (error) return reject(error); // This might be an exception

        if (response.statusCode > 399) return reject(body);

        return resolve(body);
      });
    });
  }

}