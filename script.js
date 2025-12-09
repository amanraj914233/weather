const options = {
method: 'GET',
headers: {
'x-rapidapi-key': '4377402d18mshf879da01808f6f6p1dd960jsn16a03a13d8cd',
'x-rapidapi-host': 'weather-by-api-ninjas.p.rapidapi.com'
}
};
const airQualityOptions = {
method: 'GET',
headers: {
'x-rapidapi-key': '4377402d18mshf879da01808f6f6p1dd960jsn16a03a13d8cd',
'x-rapidapi-host': 'air-quality-by-api-ninjas.p.rapidapi.com'
}
};

let currentCity = 'Seattle';
let currentLat = 47.6062;
let currentLon = -122.3321;
let sunrise = 1765208704;
let sunset = 1765239483;
let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
let temperatureHistory = [];
let chart = null;

// Function to estimate weather code from available data
function estimateWeatherCode(cloudPct, temp) {
if (cloudPct < 11) return 800; // Clear
if (cloudPct < 25) return 801; // Few clouds
if (cloudPct < 50) return 802; // Scattered clouds
if (cloudPct < 84) return 803; // Broken clouds
return 804; // Overcast
}

// OpenWeatherMap icon mapping
function getOpenWeatherIcon(code, isDaytime = true) {
const timeCode = isDaytime ? 'd' : 'n';
const iconMap = {
  // Clear
  800: `01${timeCode}`,
  // Clouds
  801: `02${timeCode}`,
  802: `03${timeCode}`,
  803: `04${timeCode}`,
  804: `04${timeCode}`,
  // Drizzle
  300: `09${timeCode}`,
  301: `09${timeCode}`,
  302: `09${timeCode}`,
  310: `09${timeCode}`,
  311: `09${timeCode}`,
  312: `09${timeCode}`,
  313: `09${timeCode}`,
  314: `09${timeCode}`,
  321: `09${timeCode}`,
  // Rain
  500: `10${timeCode}`,
  501: `10${timeCode}`,
  502: `10${timeCode}`,
  503: `10${timeCode}`,
  504: `10${timeCode}`,
  511: `13${timeCode}`,
  520: `09${timeCode}`,
  521: `09${timeCode}`,
  522: `09${timeCode}`,
  531: `09${timeCode}`,
  // Snow
  600: `13${timeCode}`,
  601: `13${timeCode}`,
  602: `13${timeCode}`,
  611: `13${timeCode}`,
  612: `13${timeCode}`,
  613: `13${timeCode}`,
  615: `13${timeCode}`,
  616: `13${timeCode}`,
  620: `13${timeCode}`,
  621: `13${timeCode}`,
  622: `13${timeCode}`,
  // Thunderstorm
  200: `11${timeCode}`,
  201: `11${timeCode}`,
  202: `11${timeCode}`,
  210: `11${timeCode}`,
  211: `11${timeCode}`,
  212: `11${timeCode}`,
  221: `11${timeCode}`,
  230: `11${timeCode}`,
  231: `11${timeCode}`,
  232: `11${timeCode}`,
  // Atmosphere
  701: `50${timeCode}`,
  711: `50${timeCode}`,
  721: `50${timeCode}`,
  731: `50${timeCode}`,
  741: `50${timeCode}`,
  751: `50${timeCode}`,
  761: `50${timeCode}`,
  762: `50${timeCode}`,
  771: `50${timeCode}`,
  781: `50${timeCode}`
};

const iconCode = iconMap[code] || `01${timeCode}`;
return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

function updateDateTime() {
const now = new Date();
const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

// Check if it's day or night using sunrise/sunset from API (Unix timestamps in seconds)
const currentTimeUnix = Math.floor(now.getTime() / 1000); // Convert to seconds
const isDaytime = currentTimeUnix > sunrise && currentTimeUnix < sunset;

const icon = isDaytime ? '☀️' : '🌙';
document.getElementById('dateTime').textContent = `${icon} ${dateStr} ${timeStr}`;
}

// Update date/time every second
setInterval(updateDateTime, 1000);
updateDateTime();

function getWeatherIcon(weatherCode, isDaytime = true) {
return getOpenWeatherIcon(weatherCode, isDaytime);
}

async function getAirQuality(city = currentCity) {
try {
const airQualityUrl = `https://air-quality-by-api-ninjas.p.rapidapi.com/v1/airquality?city=${city}`;
const response = await fetch(airQualityUrl, airQualityOptions);
const result = await response.json();
console.log('Air Quality:', result);

document.getElementById('airQuality').textContent = result.overall_aqi || 'N/A';
document.getElementById('pm25').textContent = (result['PM2.5']?.concentration || 'N/A').toFixed(2);
document.getElementById('no2').textContent = (result['NO2']?.concentration || 'N/A').toFixed(2);
document.getElementById('o3').textContent = (result['O3']?.concentration || 'N/A').toFixed(2);

} catch (error) {
console.error('Air Quality Error:', error);
}
}

async function getWeather(lat = currentLat, lon = currentLon) {
try {
const weatherUrl = `https://weather-by-api-ninjas.p.rapidapi.com/v1/weather?lat=${lat}&lon=${lon}`;
const response = await fetch(weatherUrl, options);
const result = await response.json();
console.log(result);

document.getElementById('loading').style.display = 'none';
document.getElementById('weatherContent').style.display = 'block';

document.getElementById('temp').textContent = Math.round(result.temp) + '°C';
document.getElementById('condition').textContent = result.cloud_pct > 50 ? 'Cloudy' : 'Clear';
document.getElementById('feelsLike').textContent = Math.round(result.feels_like) + '°C';
document.getElementById('humidity').textContent = result.humidity + '%';
document.getElementById('windSpeed').textContent = result.wind_speed.toFixed(2) + ' m/s';
document.getElementById('cloudCover').textContent = result.cloud_pct + '%';

// Update sunrise/sunset first
sunrise = result.sunrise;
sunset = result.sunset;

const currentTimeUnix = Math.floor(new Date().getTime() / 1000);
const isDaytime = currentTimeUnix > sunrise && currentTimeUnix < sunset;
const weatherCode = estimateWeatherCode(result.cloud_pct, result.temp);
document.getElementById('weatherIcon').innerHTML = `<img src="${getWeatherIcon(weatherCode, isDaytime)}" alt="Weather">`;

const now = new Date().toLocaleTimeString();
temperatureHistory.push({time: now, temp: Math.round(result.temp)});
if (temperatureHistory.length > 10) temperatureHistory.shift();

generateForecast(result.temp, result.cloud_pct);
updateChart();

} catch (error) {
console.error(error);
document.getElementById('loading').style.display = 'none';
document.getElementById('errorContent').style.display = 'block';
document.getElementById('errorMessage').textContent = error.message || 'Failed to fetch weather data';
}
}

function generateForecast(currentTemp, cloudPct) {
const container = document.getElementById('forecastContainer');
container.innerHTML = '';

for (let i = 1; i <= 5; i++) {
const time = new Date(Date.now() + i * 3 * 60 * 60 * 1000);
const timeStr = time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

const forecastTemp = currentTemp + Math.random() * 4 - 2;
const forecastCloudPct = Math.max(0, Math.min(100, cloudPct + Math.random() * 30 - 15));
const forecastTimeUnix = Math.floor(time.getTime() / 1000);
const isDaytime = forecastTimeUnix > sunrise && forecastTimeUnix < sunset;
const weatherCode = estimateWeatherCode(forecastCloudPct, forecastTemp);

const card = document.createElement('div');
card.className = 'forecast-card';
card.innerHTML = `
<div class="forecast-time">${timeStr}</div>
<div class="forecast-icon"><img src="${getWeatherIcon(weatherCode, isDaytime)}" alt="Forecast"></div>
<div class="forecast-temp">${Math.round(forecastTemp)}°C</div>
`;
container.appendChild(card);
}
}

function addToHistory(city, temp) {
const now = new Date().toLocaleString();
const historyEntry = {
city: city,
temp: temp,
time: now
};

searchHistory.unshift(historyEntry);
if (searchHistory.length > 10) searchHistory.pop();

localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
updateHistoryDisplay();
}

function updateHistoryDisplay() {
const historyList = document.getElementById('historyList');

if (searchHistory.length === 0) {
historyList.innerHTML = '<p style="color: #999; text-align: center;">No history yet</p>';
return;
}

historyList.innerHTML = searchHistory.map(entry => `
<div class="history-item">
<div>
<div class="history-item-city">${entry.city}</div>
<div style="font-size: 0.85rem; color: #999;">${entry.time}</div>
</div>
<div class="history-item-temp">${entry.temp}°C</div>
</div>
`).join('');
}

function updateChart() {
const ctx = document.getElementById('tempChart');
if (!ctx) return;

const labels = temperatureHistory.map(h => h.time);
const data = temperatureHistory.map(h => h.temp);

if (chart) {
chart.data.labels = labels;
chart.data.datasets[0].data = data;
chart.update();
} else {
chart = new Chart(ctx, {
type: 'line',
data: {
labels: labels,
datasets: [{
label: 'Temperature (°C)',
data: data,
borderColor: '#667eea',
backgroundColor: 'rgba(102, 126, 234, 0.1)',
borderWidth: 2,
fill: true,
tension: 0.4,
pointRadius: 5,
pointBackgroundColor: '#667eea'
}]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: {
legend: {
display: true,
labels: {
color: '#333',
font: {
size: 12,
weight: 'bold'
}
}
}
},
scales: {
y: {
beginAtZero: false,
ticks: { color: '#666' },
grid: { color: '#e0e0e0' }
},
x: {
ticks: { color: '#666' },
grid: { color: '#e0e0e0' }
}
}
}
});
}
}

function switchTab(tabName) {
document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
document.getElementById(tabName).classList.add('active');
event.target.classList.add('active');

if (tabName === 'chart') {
setTimeout(() => {
if (chart) chart.resize();
}, 100);
}
}

async function getWeatherByCity(city) {
try {
const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`;
const geoResponse = await fetch(geoUrl);
const geoData = await geoResponse.json();

if (!geoData.results || geoData.results.length === 0) {
throw new Error('City not found. Please try another city.');
}

const location = geoData.results[0];
currentLat = location.latitude;
currentLon = location.longitude;

const weatherUrl = `https://weather-by-api-ninjas.p.rapidapi.com/v1/weather?lat=${currentLat}&lon=${currentLon}`;
const response = await fetch(weatherUrl, options);
const result = await response.json();

if (result.error) {
throw new Error(result.error);
}

console.log(result);

document.getElementById('loading').style.display = 'none';
document.getElementById('weatherContent').style.display = 'block';
document.getElementById('errorContent').style.display = 'none';

const temp = Math.round(result.temp);
document.getElementById('temp').textContent = temp + '°C';
document.getElementById('condition').textContent = result.cloud_pct > 50 ? 'Cloudy' : 'Clear';
document.getElementById('feelsLike').textContent = Math.round(result.feels_like) + '°C';
document.getElementById('humidity').textContent = result.humidity + '%';
document.getElementById('windSpeed').textContent = result.wind_speed.toFixed(2) + ' m/s';
document.getElementById('cloudCover').textContent = result.cloud_pct + '%';

// Update sunrise/sunset first
sunrise = result.sunrise;
sunset = result.sunset;

const currentTimeUnix = Math.floor(new Date().getTime() / 1000);
const isDaytime = currentTimeUnix > sunrise && currentTimeUnix < sunset;
const weatherCode = estimateWeatherCode(result.cloud_pct, result.temp);
document.getElementById('weatherIcon').innerHTML = `<img src="${getWeatherIcon(weatherCode, isDaytime)}" alt="Weather">`;

addToHistory(city, temp);

const now = new Date().toLocaleTimeString();
temperatureHistory.push({time: now, temp: temp});
if (temperatureHistory.length > 10) temperatureHistory.shift();

generateForecast(result.temp, result.cloud_pct);
updateChart();

await getAirQuality(city);

} catch (error) {
console.error(error);
document.getElementById('loading').style.display = 'none';
document.getElementById('errorContent').style.display = 'block';
document.getElementById('errorMessage').textContent = error.message || 'Failed to fetch weather data for this city';
}
}

function searchWeather() {
const searchInput = document.getElementById('searchInput').value.trim();
if (!searchInput) {
alert('Please enter a city name');
return;
}

currentCity = searchInput;
document.getElementById('locationText').textContent = currentCity;
document.getElementById('loading').style.display = 'block';
document.getElementById('weatherContent').style.display = 'none';
document.getElementById('errorContent').style.display = 'none';

getWeatherByCity(currentCity);
}

document.addEventListener('DOMContentLoaded', function() {
document.getElementById('searchInput').addEventListener('keypress', function(e) {
if (e.key === 'Enter') {
searchWeather();
}
});

updateHistoryDisplay();
});

async function initializeApp() {
await getWeather();
await getAirQuality();
}

initializeApp();
