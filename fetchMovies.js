const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmZjdkOTYwMmEwN2QzMjU1OTY2Mzc5ZmRmNGM5MmE0ZiIsInN1YiI6IjY1NzFhMjJhYjA0NjA1MDBlMzk0NzZhOSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.2jYOQIpPL3iXcLTObWCY2kWy9O-zL5Ltgya4sTY0WqU'
  }
};
const apiKey = 'ff7d9602a07d3255966379fdf4c92a4f';
const listId = 634;
const totalPages = 13;
const allMovieDetails = [];
const loadingScreen = document.getElementById('loadingScreen');

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

// Function to fetch movie details
async function fetchAllPages() {

  try {
    for (let page = 1; page <= totalPages; page++) {
      const response = await fetch(`https://api.themoviedb.org/3/list/${listId}?language=en-US&page=${page}`, options);
      const data = await response.json();

      // Extracting 'id', 'title', 'release_date', 'poster_path', 'overview', 'genre_ids', 'original_language', and 'production_countries' and storing in an array
      const movieDetails = data.items.map(async movie => {
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
          title: movie.title,
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
        };
      });

      for await (const movie of movieDetails) {
        allMovieDetails.push(movie);
      }
    }

    // Display movie details in the HTML list
    displayFilteredMovies(allMovieDetails);
    loadingScreen.style.display = 'none';
  } catch (error) {
    console.error(error);
    loadingScreen.style.display = 'none';
  }
}

document.getElementById('filter-form').addEventListener('submit', function (event) {
  event.preventDefault(); // Prevent the default form submission
  
  // Get values from the form
  const startYear = parseInt(document.getElementById('start-year').value);
  const endYear = parseInt(document.getElementById('end-year').value);
  const selectedGenre = document.getElementById('genre').value;

  // Filter by release date
  if (!isNaN(startYear) && !isNaN(endYear)) {
    filterByReleaseDate(startYear, endYear);
  }

  // Filter by genre
  if (selectedGenre !== '') {
    filterByGenre(selectedGenre);
  }
});
document.getElementById('clear-btn').addEventListener('click', function () {
  // Clear the input fields and reset the select dropdown to its default value
  document.getElementById('start-year').value = '';
  document.getElementById('end-year').value = '';
  document.getElementById('genre').value = '';
  // Trigger the filter form submission to clear the filtered movies
  document.getElementById('filter-form').dispatchEvent(new Event('submit'));
  displayFilteredMovies(allMovieDetails)
});

// Filter movies by release date range
function filterByReleaseDate(startYear, endYear) {
  const filteredMovies = allMovieDetails.filter(movie => {
    const movieReleaseYear = new Date(movie.releaseDate).getFullYear();
    return movieReleaseYear >= startYear && movieReleaseYear <= endYear;
  });

  displayFilteredMovies(filteredMovies);
}

// Filter movies by genre
function filterByGenre(genreName) {
  const filteredMovies = allMovieDetails.filter(movie => {
    return movie.genres.toLowerCase().includes(genreName.toLowerCase());
  });

  displayFilteredMovies(filteredMovies);
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
    const li = document.createElement('li');
    li.classList.add('movie-item'); // Add a class for better styling

    const img = document.createElement('img');
    img.src = movie.posterPath || 'https://via.placeholder.com/150'; // Placeholder image if no poster available
    img.alt = movie.title;
    img.style.width = '100px'; // Adjust width as needed
    img.addEventListener('click', () => {
      if (movie.id) {
        const tmdbURL = `https://www.themoviedb.org/movie/${movie.id}`;
        window.open(tmdbURL, '_blank');
      }
    });
    img.style.cursor = 'pointer';
    img.id = "moviePoster"
    li.appendChild(img);

    const backdropImg = document.createElement('img');
    backdropImg.src = movie.backdropPath || 'https://via.placeholder.com/300x150'; // Placeholder image if no backdrop available
    backdropImg.alt = `${movie.title} backdrop`;
    backdropImg.style.width = '300px'; // Adjust width as needed
    backdropImg.id = "movieBackdrop"
    li.appendChild(backdropImg);

    const detailsContainer = document.createElement('div');
    detailsContainer.classList.add('details-container'); // Add a class for better styling

    const title = document.createElement('div');
    title.innerHTML = `Title: ${movie.title}`;
    title.id = "movieTitle";
    detailsContainer.appendChild(title);

    const date = document.createElement('div');
    date.innerHTML = `Release Date: ${movie.releaseDate}`;
    date.id = "movieDate";
    detailsContainer.appendChild(date);

    const genres = document.createElement('div');
    genres.textContent = `Genres: ${movie.genres}`;
    genres.id = "movieGenres";
    detailsContainer.appendChild(genres);

    const overview = document.createElement('div');
    overview.textContent = `Overview: ${movie.overview}`;
    overview.id = "movieOverview";
    detailsContainer.appendChild(overview);

    const budget = document.createElement('div');
    budget.textContent = `Budget: ${movie.budget || 'Not available'}`;
    budget.id = "movieOverview";
    detailsContainer.appendChild(budget);

    const voteAverage = document.createElement('div');
    voteAverage.style.cssText = movie.voteAverageStyle;
    voteAverage.textContent = `Vote Average: ${movie.voteAverage}`;
    voteAverage.id = "movieVoteAverage";
    detailsContainer.appendChild(voteAverage);

    const productionCountries = document.createElement('div');
    productionCountries.textContent = `Production Countries: `;
    const flagContainer = document.createElement('div');
    flagContainer.id = "movieFlags";

    movie.countryFlagUrls.forEach(flagUrl => {
      const flag = document.createElement('img');
      flag.src = flagUrl;
      flag.alt = 'Country Flag';
      flag.id = "movieFlag"
      flagContainer.appendChild(flag);
    });

    productionCountries.appendChild(flagContainer);
    detailsContainer.appendChild(productionCountries);

    li.appendChild(detailsContainer);
    movieDetailsListElement.appendChild(li);
  });
}

document.getElementById('genre').addEventListener('change', function () {
  const selectedGenre = this.value;

  if (selectedGenre !== '') {
    filterByGenre(selectedGenre);
  } else {
    // If no genre selected, display all movies
    displayFilteredMovies(allMovieDetails);
  }
});

// Call the initial function to fetch all movies
fetchAllPages();
