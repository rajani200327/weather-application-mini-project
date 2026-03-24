const API_KEY = "34f0cb4459d68d543eec8ab695184f52";

const cityInput = document.querySelector(".city-input");
const searchBtn = document.querySelector(".search-btn");
const locationBtn = document.querySelector(".location-btn");
const forecastContainer = document.querySelector(".forecast");
const historyList = document.querySelector(".history-list");

let historyCities = JSON.parse(localStorage.getItem("weatherHistory")) || [];

/* CLOCK */

function updateClock() {
  const now = new Date();
  document.getElementById("clock").innerText = now.toLocaleTimeString();
}

updateClock(); // FIX 3: Call immediately so clock shows on load
setInterval(updateClock, 1000);

/* ICON */

function iconURL(icon) {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

/* WEATHER */

function getWeather(city, lat, lon) {

  fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`)
    .then(res => res.json())
    .then(data => {

      const today = data.list[0];
      const todayDate = today.dt_txt.split(" ")[0]; // FIX 7: Track today's date to skip in forecast

      document.getElementById("city-name").innerText = city;
      document.getElementById("temp").innerText = today.main.temp;
      document.getElementById("wind").innerText = today.wind.speed;
      document.getElementById("humidity").innerText = today.main.humidity;
      document.getElementById("weather-icon").src = iconURL(today.weather[0].icon);

      forecastContainer.innerHTML = "";

      const days = [];

      data.list.forEach(item => {
        const date = item.dt_txt.split(" ")[0];

        // FIX 7: Skip today's date in forecast so it shows future days only
        if (date === todayDate) return;

        if (!days.includes(date)) {
          days.push(date);

          if (days.length <= 5) {
            forecastContainer.innerHTML += `
              <div class="forecast-card">
                <h4>${date}</h4>
                <img src="${iconURL(item.weather[0].icon)}" alt="weather icon">
                <p>${item.main.temp}°C</p>
                <p>${item.wind.speed} m/s</p>
                <p>${item.main.humidity}%</p>
              </div>
            `;
          }
        }
      });

      /* AQI */

      fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
        .then(res => res.json())
        .then(aqi => {
          const val = aqi.list[0].main.aqi;
          const text = ["Good", "Fair", "Moderate", "Poor", "Very Poor"];
          document.getElementById("aqi").innerText = val + " - " + text[val - 1];
        })
        .catch(() => { // FIX 6: Handle AQI fetch error
          document.getElementById("aqi").innerText = "AQI data unavailable.";
        });

    })
    .catch(() => { // FIX 6: Handle forecast fetch error
      alert("Failed to load weather data. Please try again.");
    });
}

/* SEARCH */

function searchCity() {
  const city = cityInput.value.trim();
  if (!city) return;

  fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`)
    .then(res => res.json())
    .then(data => {

      // FIX 1: Check if the API returned any results before accessing data[0]
      if (!data || data.length === 0) {
        alert("City not found. Please check the name and try again.");
        return;
      }

      const { lat, lon, name } = data[0];
      addHistory(name);
      getWeather(name, lat, lon);
    })
    .catch(() => { // FIX 6: Handle geocoding fetch error
      alert("Network error. Please check your connection and try again.");
    });
}

/* LOCATION */

function getLocation() {
  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`)
        .then(res => res.json())
        .then(data => {
          const cityName = data[0].name;
          addHistory(cityName); // FIX 4: Save location-based search to history
          getWeather(cityName, lat, lon);
        })
        .catch(() => { // FIX 6: Handle reverse geocoding error
          alert("Failed to get city name from your location.");
        });
    },
    () => { // FIX 5: Geolocation error callback
      alert("Location access denied or unavailable. Please allow location access or search manually.");
    }
  );
}

/* HISTORY */

function renderHistory() {
  historyList.innerHTML = "";
  historyCities.forEach(city => {
    const li = document.createElement("li");
    li.textContent = city;
    li.onclick = () => {
      cityInput.value = city;
      searchCity();
    };
    historyList.appendChild(li);
  });
}

function addHistory(city) {
  if (historyCities.includes(city)) return;
  historyCities.push(city);
  localStorage.setItem("weatherHistory", JSON.stringify(historyCities));
  renderHistory();
}

searchBtn.onclick = searchCity;
locationBtn.onclick = getLocation;

// FIX 2: Allow pressing Enter in the input to trigger search
cityInput.addEventListener("keydown", e => {
  if (e.key === "Enter") searchCity();
});

renderHistory();
