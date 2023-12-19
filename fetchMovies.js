const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmZjdkOTYwMmEwN2QzMjU1OTY2Mzc5ZmRmNGM5MmE0ZiIsInN1YiI6IjY1NzFhMjJhYjA0NjA1MDBlMzk0NzZhOSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.2jYOQIpPL3iXcLTObWCY2kWy9O-zL5Ltgya4sTY0WqU'
  }
};
const apiKey = 'ff7d9602a07d3255966379fdf4c92a4f';
const totalPages = 15;
const allMovieDetails = [];
const loadingScreen = document.getElementById('loadingScreen');

// Fetch genres from api and add them to select form
fetch('https://api.themoviedb.org/3/genre/movie/list?language=en', options)
  .then(response => response.json())
  .then(response => {
    const genreSelect = document.getElementById('genre');
    response.genres.forEach(genre => {
      const option = document.createElement('option');
      option.value = genre.name;
      option.textContent = genre.name;
      genreSelect.appendChild(option);
      document.getElementById('genre').value = '';
    });
  })
  .catch(err => console.error(err));


async function fetchTopRatedMovies() {
  try {
    for (let page = 1; page <= totalPages; page++) {
      const response = await fetch(`https://api.themoviedb.org/3/movie/top_rated?language=en-US&page=${page}`, options);
      const data = await response.json();

      // Process data similarly to what you were doing before
      const movieDetails = data.results.map(async movie => {
        const movieDetailsResponse = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${apiKey}`);
        const movieDetailsData = await movieDetailsResponse.json();

        const productionCountries = movieDetailsData.production_countries.map(country => country.iso_3166_1).join(', ');
        const genres = movieDetailsData.genres.map(genre => genre.name).join(', ');

        const countryFlagUrls = [];
        for (const country of movieDetailsData.production_countries) {
          const flagUrl = `https://flagcdn.com/h40/${country.iso_3166_1.toLowerCase()}.png`;
          countryFlagUrls.push(flagUrl);
        }

        // Dynamic styles for vote_average
        let voteAverageStyle = '';
        if (movie.vote_average >= 8) {
          voteAverageStyle = 'color: green';
        } else if (movie.vote_average >= 6) {
          voteAverageStyle = 'color: orange';
        } else {
          voteAverageStyle = 'color: red';
        }

        const formattedBudget = movieDetailsData.budget.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD'
        });

        return {
          id: movie.id,
          imdb_id: movieDetailsData.imdb_id,
          title: movie.title,
          runtime: formatRuntime(movieDetailsData.runtime),
          releaseDate: movie.release_date,
          budget: formattedBudget,
          posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
          backdropPath: movie.backdrop_path ? `https://image.tmdb.org/t/p/w500${movie.backdrop_path}` : null,
          overview: movie.overview || 'No overview available',
          genres: genres || 'No genres available',
          voteAverage: movie.vote_average.toFixed(1), // Round vote_average to one decimal place
          voteAverageStyle,
          productionCountries,
          countryFlagUrls,
          vote_count: movieDetailsData.vote_count,
        };
      });

      for await (const movie of movieDetails) {
        if (movie.vote_count >= 1000)
          allMovieDetails.push(movie);
      }
    }

    return allMovieDetails;
  } catch (error) {
    console.error(error);
    loadingScreen.style.display = 'none';
    return [];
  }
}


document.getElementById('filter-form').addEventListener('submit', function (event) {
  event.preventDefault(); // Prevent the default form submission

  // Get values from the form
  const startYear = parseInt(document.getElementById('start-year').value);
  const endYear = parseInt(document.getElementById('end-year').value);
  const selectedGenre = document.getElementById('genre').value;
  const rating = document.getElementById('rating').value;

  filterMovies(startYear, endYear, selectedGenre, rating);
});
document.getElementById('clear-btn').addEventListener('click', function () {
  // Clear the input fields and reset the select dropdown to its default value
  document.getElementById('start-year').value = '';
  document.getElementById('end-year').value = '';
  document.getElementById('genre').value = '';
  document.getElementById('rating').value = '';
  // Trigger the filter form submission to clear the filtered movies
  document.getElementById('filter-form').dispatchEvent(new Event('submit'));
  displayFilteredMovies(allMovieDetails)
});

function filterMovies(startYear, endYear, selectedGenre, rating) {
  const filteredMovies = allMovieDetails.filter(movie => {
    const movieReleaseYear = new Date(movie.releaseDate).getFullYear();
    const matchesStartYear = isNaN(startYear) || movieReleaseYear >= startYear;
    const matchesEndYear = isNaN(endYear) || movieReleaseYear <= endYear;
    const matchesGenre = selectedGenre === '' || movie.genres.toLowerCase().includes(selectedGenre.toLowerCase());
    const matchesRating = isNaN(rating) || movie.voteAverage >= rating;

    return matchesStartYear && matchesEndYear && matchesGenre && matchesRating;
  });

  displayFilteredMovies(filteredMovies);
}

function formatRuntime(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  const formattedRuntime = `${hours}h ${remainingMinutes}m`;
  return formattedRuntime;
}

// Function to display filtered movies
function displayFilteredMovies(filteredMovies) {
  const movieDetailsListElement = document.getElementById('movieDetailsList');
  // Clear existing movies
  movieDetailsListElement.innerHTML = '';

  // Function to shuffle array using Fisher-Yates algorithm
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  const shuffledMovies = shuffleArray(filteredMovies);

  shuffledMovies.forEach(movie => {
    const card = document.createElement('div');
    card.className = 'card col-xxl-4 col-xl-4 col-lg-4 col-md-6 col-sm-12 p-3';

    const rowDiv = document.createElement('div');
    rowDiv.className = 'row';

    const imgCol1 = document.createElement('div');
    imgCol1.className = 'col-4';

    const img = document.createElement('img');
    img.src = movie.posterPath || 'https://via.placeholder.com/150'; // Placeholder image if no poster available
    img.alt = movie.title;
    img.style.width = '100%'; // Adjust width as needed
    img.addEventListener('click', () => {
      if (movie.id) {
        const tmdbURL = `https://www.imdb.com/title/${movie.imdb_id}`;
        window.open(tmdbURL, '_blank');
      }
    });
    img.style.cursor = 'pointer';
    img.className = "card-img-top"
    imgCol1.appendChild(img);

    const imgCol2 = document.createElement('div');
    imgCol2.className = 'col';

    const backdropImg = document.createElement('img');
    backdropImg.src = movie.backdropPath || 'https://via.placeholder.com/300x150'; // Placeholder image if no backdrop available
    backdropImg.alt = `${movie.title} backdrop`;
    backdropImg.style.width = '100%'; // Adjust width as needed
    backdropImg.className = "card-img-top"
    imgCol2.appendChild(backdropImg);

    rowDiv.appendChild(imgCol1);
    rowDiv.appendChild(imgCol2);

    card.appendChild(rowDiv);
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    const title = document.createElement('h5');
    title.innerHTML = `${movie.title}`;
    title.className = "card-title";
    cardBody.appendChild(title);

    const overview = document.createElement('p');
    overview.innerHTML = `${movie.overview}`;
    overview.className = "list-group-item";
    cardBody.appendChild(overview);

    card.appendChild(cardBody);

    const detailsContainer = document.createElement('ul');
    detailsContainer.className = 'list-group list-group-flush'

    const date = document.createElement('li');
    date.innerHTML = `<b>Release Date:</b> ${movie.releaseDate}`;
    date.className = "list-group-item";
    detailsContainer.appendChild(date);

    const runtime = document.createElement('li');
    runtime.innerHTML = `<b>Runtime:</b> ${movie.runtime}`;
    runtime.className = "list-group-item";
    detailsContainer.appendChild(runtime);

    const genres = document.createElement('li');
    genres.innerHTML = `<b>Genres:</b> ${movie.genres}`;
    genres.className = "list-group-item";
    detailsContainer.appendChild(genres);


    const budget = document.createElement('li');
    budget.innerHTML = `<b>Budget:</b> ${movie.budget || 'Not available'}`;
    budget.className = "list-group-item";
    detailsContainer.appendChild(budget);

    const voteAverage = document.createElement('li');
    voteAverage.style.cssText = movie.voteAverageStyle;
    voteAverage.innerHTML = `<b>User Average:</b> ${movie.voteAverage}`;
    voteAverage.className = "list-group-item";
    detailsContainer.appendChild(voteAverage);

    const productionCountries = document.createElement('li');
    productionCountries.className = "list-group-item";
    productionCountries.innerHTML = "Production Countries:";
    const flagContainer = document.createElement('div');
    flagContainer.id = "movieFlags";

    movie.countryFlagUrls.forEach(flagUrl => {
      const flag = document.createElement('img');
      flag.src = flagUrl;
      flag.alt = 'Country Flag';
      flag.id = "movieFlag"
      flag.className = "mx-1"
      flagContainer.appendChild(flag);
    });

    productionCountries.appendChild(flagContainer);
    detailsContainer.appendChild(productionCountries);

    const IMDbLink = document.createElement('a');
    IMDbLink.className = "card-link";
    IMDbLink.href = `https://www.imdb.com/title/${movie.imdb_id}`;
    IMDbLink.alt = 'IMDb';
    IMDbLink.innerHTML = `IMDb`;
    IMDbLink.target = '_blank';
    cardBody.appendChild(IMDbLink);

    const TMDBLink = document.createElement('a');
    TMDBLink.className = "card-link";
    TMDBLink.href = `https://www.themoviedb.org/movie/${movie.id}`;
    TMDBLink.alt = 'TMDB';
    TMDBLink.innerHTML = `TMDB`;
    TMDBLink.target = '_blank';
    cardBody.appendChild(TMDBLink);

    card.appendChild(detailsContainer);
    movieDetailsListElement.appendChild(card);
  });
}

async function init() {
  try {
    loadingScreen.style.display = 'block';
    const allMovieDetails = await fetchTopRatedMovies();
    displayFilteredMovies(allMovieDetails);
    loadingScreen.style.display = 'none';
  } catch (error) {
    console.error(error);
    loadingScreen.style.display = 'none';
  }
}

init();