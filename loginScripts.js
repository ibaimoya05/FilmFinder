const db = firebase.firestore();


// Evento para iniciar sesión

document.getElementById("login").addEventListener("click", function () {
    let email = document.getElementById("loginEmail").value;
    let password = document.getElementById("loginPassword").value;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            userCredential.getIdToken().then((token) => {
                localStorage.setItem('userToken', token);
                localStorage.setItem('userId', userCredential.uid);
                window.location.href = 'index.html';
            });
        })
        .catch(() => {
            showAlert('El usuario y la contraseña no coinciden');
        });
});


// Evento para mostrar el formulario de registro
document.getElementById("newUser").addEventListener("click", function () {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("signupForm").style.display = "block";
});

// Evento para registrar un nuevo usuario
document.getElementById("signup").addEventListener("click", async function () {
    let email = document.getElementById("signupEmail").value;
    let password = document.getElementById("signupPassword").value;
    let passwordConfirm = document.getElementById("signupPasswordConfirm").value;
    let nombre = document.getElementById("signupFirstName").value; 
    let apellidos = document.getElementById("signupLastName").value; 

    if (email.length > 0 && email.indexOf("@") > 1) {
        if (password.length > 0) {
            if (password === passwordConfirm) {
                try {
                    // Registrar usuario con Firebase Auth
                    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                    var uid = userCredential.uid
                        // Crear documento en Firestore usando UID del usuario
                        await db.collection('usuarios').doc(uid).set({
                            uid: uid,
                            email: userCredential.email,
                            nombre: nombre,
                            apellidos: apellidos,
                            peliculasFav: []
                        });
                        console.log('Usuario registrado y documento creado en Firestore');
                        showAlert("Usuari registrat amb èxit", "alert-success");
                        document.getElementById("signupForm").style.display = "none";
                        document.getElementById("loginForm").style.display = "block";
                } catch (error) {
                    showAlert("Error registrant l'usuari: " + error.message, "alert-danger");
                }
            } else {
                showAlert("Les contrasenyes no coincideixen", "alert-danger");
            }
        } else {
            showAlert("La contrasenya és obligatòria", "alert-danger");
        }
    } else {
        showAlert("Email incorrecte", "alert-danger");
    }
});

// Mostrar alerta
function showAlert(message, className) {
    const alertDiv = document.getElementById("alert");
    alertDiv.className = `alert ${className}`;
    alertDiv.textContent = message;
    alertDiv.style.display = 'block';
    setTimeout(() => alertDiv.style.display = 'none', 3000);
}
