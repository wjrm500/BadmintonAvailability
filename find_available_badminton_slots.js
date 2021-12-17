/*

Instructions:

1. Open Mozilla Firefox (this won't work in Google Chrome due to "insufficient resources" error)
2. Go to https://members.myactivesg.com/facilities/result
3. Log into account (click "Book" in top right corner)
4. Go back to https://members.myactivesg.com/facilities/result
5. Open browser Dev Tools
6. Copy and paste this script in

*/

HTMLCollection.prototype.forEach = Array.prototype.forEach;
HTMLCollection.prototype.map = Array.prototype.map;
NodeList.prototype.filter = Array.prototype.filter;
NodeList.prototype.map = Array.prototype.map;

const baseUrl = 'https://members.myactivesg.com/facilities/result';
let venueSelectId = 'venue_filter';
const venueIds = document.getElementById(venueSelectId)
    .children
    .map((x) => parseInt(x.value))
    .filter((x) => !isNaN(x))
    .sort();
let venues = {};
document.getElementById(venueSelectId).children.forEach(function(x) {
    let venueId = parseInt(x.value);
    if (isNaN(venueId)) {
        return;
    }
    let venueName = x.innerHTML;
    venues[venueId] = venueName;
});

const badmintonActivityId = 18;
let urlParams = {
    activity_filter: badmintonActivityId,
    venue_filter: 0
};
const startDate = new Date();
let dates = [startDate];
for (let i = 1; i < 16; i++) {
    let newDate = new Date();
    newDate.setDate(startDate.getDate() + i);
    dates.push(newDate);
}
const dateFilters = dates.map(createDateFilter);
const dateStrings = dates.map(createDateString);

let results = {};
for (let venueId of Object.keys(venues)) {
    results[venueId] = {};
    urlParams.venue_filter = venueId;
    let urlParamString = (new URLSearchParams(urlParams)).toString();
    for (let i = 0; i < dates.length; i++) {
        let dateString = dateStrings[i];
        let dateFilter = dateFilters[i];
        let urlParamStringWithDateFilter = `${urlParamString}&date_filter=${dateFilter}&search=Search`;
        let requestUrl = `${baseUrl}?${urlParamStringWithDateFilter}`;
        let xhr = new XMLHttpRequest();
        xhr.open("GET", requestUrl);
        xhr.send();
        xhr.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                let html = xhr.responseText;
                if (html.length === 0) {
                    return;
                }
                let el = document.createElement('html');
                el.innerHTML = html;
                let noResultContainer = el.querySelector('.no-result-container');
                let noAvailability = false;
                if (noResultContainer != null && noResultContainer.innerHTML === '\n                There is no result based on your specified criteria.\n            ') {
                    noAvailability = true;
                }
                let timeslotContainer = el.querySelector('.timeslot-container');
                let availableSlots;
                if (timeslotContainer != null) {
                    let em = timeslotContainer.querySelector('em');
                    if (em != null && em.innerHTML === '* There are no available slots for your preferred date.') {
                        noAvailability = true;
                    }
                    availableSlots = timeslotContainer.querySelectorAll('input[type=checkbox]').filter((x) => !x.disabled);
                    if (availableSlots.length === 0) {
                        noAvailability = true;
                    }
                }
                if (noAvailability) {
                    // console.log('No availability');
                    return;
                }
                const uniqueAvailableTimesString = availableSlots
                    .map((x) => x.value.split(';')[3].slice(0, 5)) // Get start time and format correctly
                    .filter((item, i, ar) => ar.indexOf(item) === i) // Unique times only
                    .sort()
                    .join('\n');
                console.log('Venue: ' + venues[venueId] + '\nDate: ' + dateString + '\nNum. slots available: ' + availableSlots.length + '\nAvailable times:\n' + uniqueAvailableTimesString + '\nRequest URL: ' + requestUrl);
            }
        }
    }
}

function getCreateDateItems(x) {
    let dayShortName = x.toLocaleDateString('en-GB', {weekday: 'short'});
    dayShortName = dayShortName.charAt(0).toUpperCase() + dayShortName.slice(1);
    let dayOfMonth = x.getDate();
    let monthShortName = x.toLocaleDateString('en-GB', {month: 'long'}).slice(0, 3);
    monthShortName = monthShortName.charAt(0).toUpperCase() + monthShortName.slice(1);
    let year = x.getFullYear();
    return [dayShortName, dayOfMonth, monthShortName, year];
}

function createDateString(x) {
    let dayShortName, dayOfMonth, monthShortName, year;
    [dayShortName, dayOfMonth, monthShortName, year] = getCreateDateItems(x);
    return `${dayShortName} ${dayOfMonth} ${monthShortName} ${year}`;
}

function createDateFilter(x) {
    let dayShortName, dayOfMonth, monthShortName, year;
    [dayShortName, dayOfMonth, monthShortName, year] = getCreateDateItems(x);
    return `${dayShortName}%2C+${dayOfMonth}+${monthShortName}+${year}`;
}