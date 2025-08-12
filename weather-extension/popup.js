// Weather Extension Popup JavaScript

// API Configuration
const API_KEY = 'your-openweathermap-api-key'; // Replace with actual API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// DOM Elements
const locationInput = document.getElementById('locationInput');
const searchBtn = document.getElementById('searchBtn');
const currentLocationBtn = document.getElementById('currentLocationBtn');
const weatherInfo = document.getElementById('weatherInfo');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const cityName = document.getElementById('cityName');
const temperature = document.getElementById('temperature');
const condition = document.getElementById('condition');
const humidity = document.getElementById('humidity');
const wind = document.getElementById('wind');

// Event Listeners
searchBtn.addEventListener('click', () => {
    const location = locationInput.value.trim();
    if (location) {
        fetchWeatherByCity(location);
    }
});

currentLocationBtn.addEventListener('click', () => {
    getCurrentLocation();
});

locationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const location = locationInput.value.trim();
        if (location) {
            fetchWeatherByCity(location);
        }
    }
});

// Functions
function showLoading() {
    loading.classList.remove('hidden');
    weatherInfo.classList.add('hidden');
    error.classList.add('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function showError(message) {
    error.textContent = message;
    error.classList.remove('hidden');
    weatherInfo.classList.add('hidden');
    hideLoading();
}

function showWeather(data) {
    cityName.textContent = `${data.name}, ${data.sys.country}`;
    temperature.textContent = `${Math.round(data.main.temp)}°C`;
    condition.textContent = data.weather[0].description;
    humidity.textContent = `${data.main.humidity}%`;
    wind.textContent = `${data.wind.speed} m/s`;
    
    weatherInfo.classList.remove('hidden');
    error.classList.add('hidden');
    hideLoading();
}

async function fetchWeatherByCity(city) {
    showLoading();
    
    try {
        const response = await fetch(`${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`);
        
        if (!response.ok) {
            throw new Error('City not found');
        }
        
        const data = await response.json();
        showWeather(data);
        
        // Save last searched city
        chrome.storage.local.set({ lastCity: city });
        
    } catch (err) {
        showError('Error fetching weather data. Please try again.');
    }
}

async function fetchWeatherByCoords(lat, lon) {
    showLoading();
    
    try {
        const response = await fetch(`${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        
        if (!response.ok) {
            throw new Error('Location not found');
        }
        
        const data = await response.json();
        showWeather(data);
        
    } catch (err) {
        showError('Error fetching weather data. Please try again.');
    }
}

function getCurrentLocation() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by this browser.');
        return;
    }
    
    showLoading();
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            fetchWeatherByCoords(latitude, longitude);
        },
        (err) => {
            showError('Unable to retrieve your location. Please enter a city name.');
        },
        {
            timeout: 10000,
            enableHighAccuracy: true
        }
    );
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load last searched city if available
    chrome.storage.local.get(['lastCity'], (result) => {
        if (result.lastCity) {
            locationInput.value = result.lastCity;
        }
    });
    
    // Focus on input field
    locationInput.focus();
});
