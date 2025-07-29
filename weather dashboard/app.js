$(document).ready(function () {
  const cities = [];
  const APIKey = "f4d6848eb3a488816cecbd2392d8a108";
  const baseURL = "https://api.openweathermap.org/data/2.5/";
  const units = "imperial";
  const now = dayjs();
  const currentDate = now.format("dddd MMM. D, YYYY");
  $("#today").text(currentDate);

  const icons = [
    { code: "01", day: "fas fa-sun", night: "fas fa-moon" },
    { code: "02", day: "fas fa-cloud-sun", night: "fas fa-cloud-moon" },
    { code: "03", day: "fas fa-cloud", night: "fas fa-cloud" },
    { code: "04", day: "fas fa-cloud-sun", night: "fas fa-cloud-moon" },
    { code: "09", day: "fas fa-cloud-rain", night: "fas fa-cloud-rain" },
    { code: "10", day: "fas fa-cloud-showers-heavy", night: "fas fa-cloud-showers-heavy" },
    { code: "11", day: "fas fa-bolt", night: "fas fa-bolt" },
    { code: "13", day: "fas fa-snowflake", night: "fas fa-snowflake" },
    { code: "50", day: "fas fa-smog", night: "fas fa-smog" },
  ];

  // Init
  init();

  function init() {
    if (window.innerWidth >= 578) {
      $("#search-history").addClass("show");
      $("#collapse-search-history").hide();
    }

    getSearchHistory();

    if (cities.length === 0) {
      getWeather("New York");
    } else {
      getWeather(cities[cities.length - 1]);
      cities.forEach(displayCity);
    }
  }

  function getWeather(city) {
    const responseData = {};

    $.ajax({
      url: baseURL + "weather",
      method: "GET",
      data: { q: city, units, appid: APIKey },
    }).then(function (response) {
      responseData.current = response;
      const coordinates = { lat: response.coord.lat, lon: response.coord.lon };
      getUVindex(coordinates);
      displayCurrentWeather(responseData);
    });

    $.ajax({
      url: baseURL + "forecast",
      method: "GET",
      data: { q: city, units, appid: APIKey },
    }).then(function (response) {
      responseData.forecast = response;
      displayForecast(responseData);
    });
  }

  function getUVindex(coords) {
    $.ajax({
      url: baseURL + "uvi",
      method: "GET",
      data: { lat: coords.lat, lon: coords.lon, appid: APIKey },
    }).then(displayUV);
  }

  function replaceIcon(iconCode) {
    const code = iconCode.slice(0, 2);
    const isDay = dayjs().hour() >= 6 && dayjs().hour() < 18;
    const icon = icons.find(i => i.code === code);
    return icon ? (isDay ? icon.day : icon.night) : "fas fa-question";
  }

  function displayCurrentWeather(data) {
    const weather = data.current.weather[0];

    $("#city").text(data.current.name);
    $("#conditions").text(weather.main);
    $("#temperature").text(`${parseInt(data.current.main.temp)}° F`);
    $("#humidity").text(`${data.current.main.humidity}%`);
    $("#wind-speed").text(`${data.current.wind.speed} mph`);

    const newIcon = replaceIcon(weather.icon);
    $("#icon").removeClass().addClass(`h2 ${newIcon}`);
  }

  function displayUV(data) {
    const $uv = $("#uv-index");
    $uv.text(data.value).removeClass("bg-success bg-warning bg-danger");

    if (data.value < 3) $uv.addClass("bg-success");
    else if (data.value < 6) $uv.addClass("bg-warning");
    else $uv.addClass("bg-danger");
  }

  function displayForecast(data) {
    const forecast = createForecast(data);

    forecast.forEach((day, i) => {
      const date = dayjs(day.dt_txt);
      const icon = replaceIcon(day.weather[0].icon);

      $(`#day-${i + 1}-icon`).removeClass().addClass(`h2 text-info ${icon}`);
      $(`#day-${i + 1}-date`).text(date.format("MMM. D"));
      $(`#day-${i + 1}-year`).text(date.format("YYYY"));
      $(`#day-${i + 1}-conditions`).text(day.weather[0].main);
      $(`#day-${i + 1}-temp`).text(`${parseInt(day.main.temp)}° F`);
      $(`#day-${i + 1}-humidity`).text(`${day.main.humidity}% Humidity`);
    });
  }

  function createForecast(data) {
    const list = data.forecast.list;
    const firstHour = dayjs(list[0].dt_txt).hour();

    if (firstHour === 6) return [10, 18, 26, 34, 38].map(i => list[i]);
    if (firstHour <= 9) return [9, 17, 25, 33, 39].map(i => list[i]);

    const start = list.findIndex(f => dayjs().isBefore(f.dt_txt) && dayjs(f.dt_txt).hour() === 12);
    const result = [];
    for (let i = start; i < list.length; i += 8) result.push(list[i]);
    return result;
  }

  function displayCity(city) {
    $("<li>")
      .addClass("list-group-item search-item")
      .text(city)
      .prependTo("#search-history");
  }

  function saveToHistory(city) {
    getSearchHistory();
    cities.push(city);
    localStorage.setItem("cities", JSON.stringify(cities));
  }

  function getSearchHistory() {
    const stored = localStorage.getItem("cities");
    if (stored) cities.splice(0, cities.length, ...JSON.parse(stored));
  }

  $("#search-form").on("submit", function (e) {
    e.preventDefault();
    const city = $("#search").val().trim();
    if (!city) return;

    getWeather(city);
    displayCity(city);
    saveToHistory(city);
    $("#search").val("");
  });

  $("#search-history").on("click", ".search-item", function () {
    getWeather($(this).text());
  });

  $("#delete-history").on("click", function () {
    $(".search-item").remove();
    cities.length = 0;
    localStorage.setItem("cities", "[]");
  });

  $(window).resize(function () {
    if ($(window).width() >= 578) {
      $("#search-history").addClass("show");
      $("#collapse-search-history").hide();
    } else {
      $("#search-history").removeClass("show");
      $("#collapse-search-history").show();
    }
  });

  // Dark Mode Toggle
  $("#dark-toggle").on("click", function () {
    $("body").toggleClass("dark-mode");
    const icon = $(this).find("i");
    icon.toggleClass("fa-sun fa-moon");

    function updateBackground() {
  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour < 18;
  document.body.classList.toggle("day", isDay);
  document.body.classList.toggle("night", !isDay);
}
updateBackground();
document.getElementById("dark-toggle").addEventListener("click", function () {
  document.body.classList.toggle("dark-mode");
  this.textContent = document.body.classList.contains("dark-mode") ? "☀️ Light Mode" : "🌙 Dark Mode";
});
  });
});
