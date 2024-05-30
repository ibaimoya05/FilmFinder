const db = firebase.firestore();
let currentMovieId = null;

window.onload = function() {
    const userToken = localStorage.getItem('userToken');
    if (!userToken) {
        console.log(`Has d'iniciar seció.`);
        window.location.href = 'login.html';
    } else {
        console.log('User token found:', userToken);
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                console.log('Usuario autenticado:', user.email, user.uid);
            } else {
                console.log('No authenticated user found.');
                localStorage.removeItem('userToken');
                window.location.href = 'login.html';
            }
        });
    }
};

function addToFavorites(movieId) {
    const userToken = localStorage.getItem('userToken');
    if (!userToken) {
        alert('Por favor, inicie sesión primero.');
        return;
    }

    const user = firebase.auth().currentUser;
    const userId = user.uid;

    const userDocRef = db.collection('usuarios').doc(userId);

    userDocRef.get().then((doc) => {
        if (doc.exists) {
            const peliculasFav = doc.data().peliculasFav || [];
            if (!peliculasFav.includes(movieId)) {
                peliculasFav.push(movieId);
                userDocRef.update({ peliculasFav: peliculasFav })
                    .then(() => {
                        showAlert('Película añadida a favoritos!');
                    })
                    .catch((error) => {
                        console.error('Error al añadir película a favoritos:', error);
                    });
            } else {
                showAlert('La película ya está en favoritos.');
            }
        } else {
            userDocRef.set({ peliculasFav: [movieId] })
                .then(() => {
                    showAlert('Película añadida a favoritos!');
                })
                .catch((error) => {
                    console.error('Error al crear el documento del usuario:', error);
                });
        }
    }).catch((error) => {
        console.error('Error al obtener el documento del usuario:', error);
    });
}



const showFavorites = async () => {
    document.getElementById("movieInfo").setAttribute('hidden', true);
    document.getElementById("likeOrDislikeBtns").setAttribute('hidden', true);
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Por favor, inicie sesión primero.');
        return;
    }

    const userId = user.uid;
    const userDocRef = db.collection('usuarios').doc(userId);
    const favoritesList = document.getElementById('favoritesList');
    const favoritesUl = document.getElementById('favoritesUl');
    const genreForm = document.getElementById('genreForm');
        
    genreForm.setAttribute('hidden', true);
    favoritesUl.innerHTML = '';  

    try {
        const doc = await userDocRef.get();
        const peliculasFav = doc.data().peliculasFav;
        if (doc.exists && peliculasFav !== null) {
            for (const movieId of peliculasFav) {
                const movieInfo = await getMovieInfo({ id: movieId });
                const li = document.createElement('li');
                li.classList.add('movie-item');

                const movieImg = document.createElement('img');
                movieImg.src = movieInfo.imagen;
                movieImg.alt = movieInfo.titulo;
                movieImg.classList.add('movie-img');
                li.appendChild(movieImg);

                const movieTitle = document.createElement('p');
                movieTitle.textContent = movieInfo.titulo;
                movieTitle.classList.add('movie-title');
                li.appendChild(movieTitle);

                const deleteBtn = document.createElement('button');
                deleteBtn.classList.add('delete-btn');

                const deleteIcon = document.createElement('i');
                deleteIcon.classList.add('fa-solid', 'fa-trash');
                deleteBtn.appendChild(deleteIcon);

                deleteBtn.onclick = () => removeFromFavorites(movieId);
                li.appendChild(deleteBtn);

                favoritesUl.appendChild(li);
            }
            favoritesList.removeAttribute('hidden');
        } else {
            showAlert('No se encontraron películas favoritas.');
        }
    } catch (error) {
        console.error('Error al obtener las películas favoritas:', error);
    }
};



const removeFromFavorites = async (movieId) => {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Por favor, inicie sesión primero.');
        return;
    }

    const userId = user.uid;
    const userDocRef = db.collection('usuarios').doc(userId);

    try {
        const doc = await userDocRef.get();
        if (doc.exists) {
            const peliculasFav = doc.data().peliculasFav || [];
            const updatedFavs = peliculasFav.filter(id => id !== movieId);
            await userDocRef.update({ peliculasFav: updatedFavs }); 
            showFavorites();
        }
    } catch (error) {
        console.error('Error al eliminar la película de favoritos:', error);
    }
};



// Define getGenres function
const getGenres = async () => {
    try {
        const genresCollection = firebase.firestore().collection('generos'); 
        const genresSnapshot = await genresCollection.get();
        const genres = genresSnapshot.docs.map(doc => {
            const data = doc.data();
            return { id: doc.id, nombre: data.Nombre };
        });
        return genres;
    } catch (error) {
        console.log(error);
    }
};

// Define getMovies function
const getMovies = async () => {
    const selectedGenre = getSelectedGenre();
    try {
        const moviesCollection = firebase.firestore().collection('peliculas');
        const moviesSnapshot = await moviesCollection.get();
        const movies = moviesSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(movie => movie.generos.includes(selectedGenre)); 
        return movies;
    } catch (error) {
        console.log(error);
    }
};

// Define getMovieInfo function
const getMovieInfo = async (movie) => {
    try {
        const movieRef = firebase.firestore().collection('peliculas').doc(movie.id);
        const movieDoc = await movieRef.get();
        if (movieDoc.exists) {
            return { id: movieDoc.id, ...movieDoc.data() };
        } else {
            console.log("No such document!");
        }
    } catch (error) {
        console.log(error);
    }
};

// Define showRandomMovie function
const showRandomMovie = async () => {
    document.getElementById("favoritesList").setAttribute('hidden', true);
    document.getElementById("movieInfo").removeAttribute('hidden');
    document.getElementById("likeOrDislikeBtns").removeAttribute('hidden');
    const movieInfo = document.getElementById('movieInfo');
    if (movieInfo.childNodes.length > 0) {
        clearCurrentMovie();
    }
    const movies = await getMovies();
    if (movies && movies.length > 0) {
        const randomMovie = getRandomMovie(movies);
        const info = await getMovieInfo(randomMovie);
        displayMovie(info);
        currentMovieId = info.id;
    } else {
        console.log("No movies found for the selected genre");
    }
};

// Ensure DOM is fully loaded before running
document.addEventListener('DOMContentLoaded', async () => {
    const genres = await getGenres();
    populateGenreDropdown(genres);
    document.getElementById('playBtn').onclick = showRandomMovie;
    document.getElementById('showFav').onclick = showFavorites;
});

