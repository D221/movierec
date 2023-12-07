const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmZjdkOTYwMmEwN2QzMjU1OTY2Mzc5ZmRmNGM5MmE0ZiIsInN1YiI6IjY1NzFhMjJhYjA0NjA1MDBlMzk0NzZhOSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.2jYOQIpPL3iXcLTObWCY2kWy9O-zL5Ltgya4sTY0WqU'
  }
};

const listId = 634;
const totalPages = 13;
const allMovieDetails = [];
let genreMap = {}; // To store genres for lookup

const languageFlagMap = {
  ja: 'jp', // Example: 'ja' (Japanese) from TMDb to 'jp' for Flag CDN
  // Add more mappings as needed
};


async function fetchGenres() {
  try {
    const response = await fetch(`https://api.themoviedb.org/3/genre/movie/list?language=en-US`, options);
    const data = await response.json();
    // Creating a map of genre IDs and their names
    genreMap = data.genres.reduce((map, genre) => {
      map[genre.id] = genre.name;
      return map;
    }, {});
  } catch (error) {
    console.error('Error fetching genres:', error);
  }
}

// Function to fetch movie details
async function fetchAllPages() {
  await fetchGenres(); // Fetch genres first

  try {
    for (let page = 1; page <= totalPages; page++) {
      const response = await fetch(`https://api.themoviedb.org/3/list/${listId}?language=en-US&page=${page}`, options);
      const data = await response.json();

      // Extracting 'id', 'title', 'release_date', 'poster_path', 'overview', 'genre_ids', and 'original_language' and storing in an array
      const movieDetails = data.items.map(movie => {
        const genres = movie.genre_ids.map(genreId => genreMap[genreId]).join(', '); // Get genre names using genreMap

        // Fetching flag based on original_language
        let languageCode = movie.original_language;
        if (languageFlagMap[languageCode]) {
          languageCode = languageFlagMap[languageCode]; // Use the mapped flag code
        }
        const flagUrl = `https://flagcdn.com/16x12/${languageCode}.png`;

        // Dynamic styles for vote_average
        let voteAverageStyle = '';
        if (movie.vote_average >= 8) {
          voteAverageStyle = 'color: green';
        } else if (movie.vote_average >= 6) {
          voteAverageStyle = 'color: orange';
        } else {
          voteAverageStyle = 'color: red';
        }

        return {
          id: movie.id,
          title: movie.title,
          releaseDate: movie.release_date,
          posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
          overview: movie.overview || 'No overview available',
          genres: genres || 'No genres available',
          flagUrl,
          voteAverage: movie.vote_average.toFixed(1), // Round vote_average to one decimal place
          voteAverageStyle
        };
      });
      allMovieDetails.push(...movieDetails);
    }
    // Display movie details in the HTML list
    const movieDetailsListElement = document.getElementById('movieDetailsList');
    allMovieDetails.forEach(movie => {
      const li = document.createElement('li');
      const img = document.createElement('img');
      img.src = movie.posterPath || 'https://via.placeholder.com/150'; // Placeholder image if no poster available
      img.alt = movie.title;
      img.style.width = '100px'; // Adjust width as needed
      li.appendChild(img);
      
      const flag = document.createElement('img');
      flag.src = movie.flagUrl; // Country flag based on original_language
      flag.alt = movie.original_language;
      li.appendChild(flag);

      const titleAndDate = document.createElement('div');
      titleAndDate.innerHTML = `ID: ${movie.id} - Title: ${movie.title} - Release Date: ${movie.releaseDate}`;
      li.appendChild(titleAndDate);
      
      const genres = document.createElement('div');
      genres.textContent = `Genres: ${movie.genres}`;
      li.appendChild(genres);

      const overview = document.createElement('div');
      overview.textContent = `Overview: ${movie.overview}`;
      li.appendChild(overview);

      const voteAverage = document.createElement('div');
      voteAverage.style.cssText = movie.voteAverageStyle;
      voteAverage.textContent = `Vote Average: ${movie.voteAverage}`;
      li.appendChild(voteAverage);

      movieDetailsListElement.appendChild(li);
    });
  } catch (error) {
    console.error(error);
  }
}

fetchAllPages();