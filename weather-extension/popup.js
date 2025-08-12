// Weather Extension Popup JavaScript

// API Configuration
const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY'; // Replace with actual API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
const ICON_URL = 'https://openweathermap.org/img/wn/';

// Global state
let currentUnits = 'metric'; // 'metric' or 'imperial'
let lastWeatherData = null;

// DOM Elements
const locationInput = document.getElementById('locationInput');
const searchBtn = document.getElementById('searchBtn');
const currentLocationBtn = document.getElementById('currentLocationBtn');
const unitsToggle = document.getElementById('unitsToggle');
const weatherInfo = document.getElementById('weatherInfo');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const cityName = document.getElementById('cityName');
const temperature = document.getElementById('temperature');
const condition = document.getElementById('condition');
const weatherIcon = document.getElementById('weatherIcon');
const humidity = document.getElementById('humidity');
const wind = document.getElementById('wind');

// Event Listeners
searchBtn?.addEventListener('click', handleSearch);
currentLocationBtn?.addEventListener('click', handleCurrentLocation);
unitsToggle?.addEventListener('click', handleUnitsToggle);
locationInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

// Functions
function showLoading() {
    loading?.classList.remove('hidden');
    weatherInfo?.classList.add('hidden');
    error?.classList.add('hidden');
}

function hideLoading() {
    loading?.classList.add('hidden');
}

function showError(message) {
    if (error) {
        error.textContent = message;
        error.classList.remove('hidden');
    }
    weatherInfo?.classList.add('hidden');
    hideLoading();
}

function showWeather(data) {
    if (!data) return;
    
    const tempUnit = currentUnits === 'metric' ? '°C' : '°F';
    const windUnit = currentUnits === 'metric' ? 'm/s' : 'mph';
    
    if (cityName) cityName.textContent = `${data.name}, ${data.sys.country}`;
    if (temperature) temperature.textContent = `${Math.round(data.main.temp)}${tempUnit}`;
    if (condition) condition.textContent = data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1);
    if (humidity) humidity.textContent = `${data.main.humidity}%`;
    if (wind) wind.textContent = `${Math.round(data.wind.speed * 10) / 10} ${windUnit}`;
    
    // Set weather icon
    if (weatherIcon && data.weather[0].icon) {
        weatherIcon.src = `${ICON_URL}${data.weather[0].icon}@2x.png`;
        weatherIcon.alt = data.weather[0].description;
        weatherIcon.style.display = 'block';
    }
    
    weatherInfo?.classList.remove('hidden');
    error?.classList.add('hidden');
    hideLoading();
    
    // Save to localStorage
    saveWeatherData(data);
}

function saveWeatherData(data) {
    try {
        const weatherData = {
            ...data,
            timestamp: Date.now(),
            units: currentUnits
        };
        localStorage.setItem('lastWeatherData', JSON.stringify(weatherData));
        localStorage.setItem('weatherUnits', currentUnits);
    } catch (err) {
        console.warn('Failed to save weather data to localStorage:', err);
    }
}

function loadSavedWeatherData() {
    try {
        const savedData = localStorage.getItem('lastWeatherData');
        const savedUnits = localStorage.getItem('weatherUnits');
        
        if (savedUnits) {
            currentUnits = savedUnits;
            updateUnitsToggle();
        }
        
        if (savedData) {
            const weatherData = JSON.parse(savedData);
            // Show cached data if it's less than 10 minutes old
            const tenMinutes = 10 * 60 * 1000;
            if (Date.now() - weatherData.timestamp < tenMinutes) {
                lastWeatherData = weatherData;
                showWeather(weatherData);
                return true;
            }
        }
    } catch (err) {
        console.warn('Failed to load saved weather data:', err);
    }
    return false;
}

function updateUnitsToggle() {
    if (unitsToggle) {
        unitsToggle.textContent = currentUnits === 'metric' ? '°F' : '°C';
        unitsToggle.title = `Switch to ${currentUnits === 'metric' ? 'Fahrenheit' : 'Celsius'}`;
    }
}

function handleSearch() {
    const location = locationInput?.value.trim();
    if (location) {
        fetchWeatherByCity(location);
    }
}

function handleCurrentLocation() {
    getCurrentLocation();
}

function handleUnitsToggle() {
    currentUnits = currentUnits === 'metric' ? 'imperial' : 'metric';
    updateUnitsToggle();
    localStorage.setItem('weatherUnits', currentUnits);
    
    // Refresh current weather data with new units
    if (lastWeatherData) {
        if (lastWeatherData.coords) {
            fetchWeatherByCoords(lastWeatherData.coords.lat, lastWeatherData.coords.lon);
        } else if (locationInput?.value.trim()) {
            fetchWeatherByCity(locationInput.value.trim());
        }
    }
}

async function fetchWeatherByCity(city) {
    showLoading();
    
    try {
        const url = `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${currentUnits}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Invalid API key. Please check your OpenWeatherMap API key.');
            } else if (response.status === 404) {
                throw new Error('City not found. Please check the spelling and try again.');
            } else {
                throw new Error(`Weather service error: ${response.status}`);
            }
        }
        
        const data = await response.json();
        lastWeatherData = { ...data, searchType: 'city', searchValue: city };
        showWeather(data);
        
    } catch (err) {
        console.error('Fetch weather by city error:', err);
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
            showError('Network error. Please check your internet connection.');
        } else {
            showError(err.message || 'Error fetching weather data. Please try again.');
        }
    }
}

async function fetchWeatherByCoords(lat, lon) {
    showLoading();
    
    try {
        const url = `${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnits}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Invalid API key. Please check your OpenWeatherMap API key.');
            } else {
                throw new Error(`Weather service error: ${response.status}`);
            }
        }
        
        const data = await response.json();
        lastWeatherData = { ...data, coords: { lat, lon }, searchType: 'coords' };
        showWeather(data);
        
        // Update input field with city name
        if (locationInput && data.name) {
            locationInput.value = data.name;
        }
        
    } catch (err) {
        console.error('Fetch weather by coords error:', err);
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
            showError('Network error. Please check your internet connection.');
        } else {
            showError(err.message || 'Error fetching weather data. Please try again.');
        }
    }
}

function getCurrentLocation() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by this browser.');
        return;
    }
    
    showLoading();
    
    const options = {
        timeout: 10000,
        enableHighAccuracy: true,
        maximumAge: 300000 // 5 minutes
    };
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            fetchWeatherByCoords(latitude, longitude);
        },
        (err) => {
            console.error('Geolocation error:', err);
            let errorMessage = 'Unable to retrieve your location.';
            
            switch (err.code) {
                case err.PERMISSION_DENIED:
                    errorMessage = 'Location access denied. Please enable location services and try again.';
                    break;
                case err.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information unavailable. Please enter a city name.';
                    break;
                case err.TIMEOUT:
                    errorMessage = 'Location request timed out. Please try again or enter a city name.';
                    break;
            }
            
            showError(errorMessage);
        },
        options
    );
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load saved units preference
    const savedUnits = localStorage.getItem('weatherUnits');
    if (savedUnits && (savedUnits === 'metric' || savedUnits === 'imperial')) {
        currentUnits = savedUnits;
    }
    updateUnitsToggle();
    
    // Try to load cached weather data
    const hasCachedData = loadSavedWeatherData();
    
    // Focus on input field if no cached data
    if (!hasCachedData && locationInput) {
        locationInput.focus();
    }
    
    // Load last searched city if available and no cached data
    if (!hasCachedData) {
        try {
            // Try Chrome extension storage first
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.get(['lastCity'], (result) => {
                    if (result.lastCity && locationInput) {
                        locationInput.value = result.lastCity;
                    }
                });
            } else {
                // Fallback to localStorage
                const lastCity = localStorage.getItem('lastCity');
                if (lastCity && locationInput) {
                    locationInput.value = lastCity;
                }
            }
        } catch (err) {
            console.warn('Failed to load last city:', err);
        }
    }
    
    // Save city to storage when searching
    if (typeof chrome !== 'undefined' && chrome.storage) {
        const originalFetchWeatherByCity = fetchWeatherByCity;
        fetchWeatherByCity = async function(city) {
            try {
                chrome.storage.local.set({ lastCity: city });
            } catch (err) {
                console.warn('Failed to save city to Chrome storage:', err);
            }
            return originalFetchWeatherByCity.call(this, city);
        };
    }
});
