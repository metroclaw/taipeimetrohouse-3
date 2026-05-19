// Firebase Configuration for taipeimetrohouse-2
const firebaseConfig = {
    apiKey: "AIzaSyDgk5qz4mNA09g-3azau9mgWjd8996uvJU",
    authDomain: "taipeimetrohouse-2.firebaseapp.com",
    projectId: "taipeimetrohouse-2",
    storageBucket: "taipeimetrohouse-2.firebasestorage.app",
    messagingSenderId: "90653753409",
    appId: "1:90653753409:web:b675e99516d61f920d46c0",
    measurementId: "G-EZDH90LHWB"
};

// Initialize Firebase (compat mode)
firebase.initializeApp(firebaseConfig);

// Google Sign In
function handleGoogleSignIn() {
    if (!firebase.auth().currentUser) {
        console.log("Start login - redirecting to Google...");
        var provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().languageCode = 'zh-TW';
        firebase.auth().signInWithRedirect(provider);
    } else {
        firebase.auth().signOut();
    }
}

function saveUserInformation(user) {
    console.log("Saving user info for:", user.displayName);
    // Save to Firestore
    firebase.firestore().collection('users').doc(user.uid).set({
        id: user.uid,
        name: user.displayName,
        email: user.email,
        profilePicUrl: user.photoURL || 'img/profile_placeholder.png',
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        position: "訪客"
    }, { merge: true }).then(function () {
        console.log("User info saved, redirecting to dashboard...");
        window.location.href = './dashboard.html';
    }).catch(function (error) {
        console.error("Error saving user:", error);
        // Still redirect even if save fails
        window.location.href = './dashboard.html';
    });
}

function initApp() {
    // Listen for auth state changes
    firebase.auth().onAuthStateChanged(function (user) {
        console.log("Auth state changed:", user ? user.displayName : "null");
        if (user) {
            // User is signed in
            document.getElementById('preloader')?.remove();
            saveUserInformation(user);
        } else {
            // User is signed out
            document.getElementById('preloader')?.remove();
        }
    });

    // Handle redirect result (for signInWithRedirect)
    firebase.auth().getRedirectResult().then(function (result) {
        console.log("Redirect result:", result.user ? result.user.displayName : "no user");
        if (result.user) {
            // Sign in successful, onAuthStateChanged will handle the rest
            console.log("Redirect login successful");
        }
    }).catch(function (error) {
        console.error("Redirect error:", error.code, error.message);
        document.getElementById('preloader')?.remove();
    });

    // Bind sign in button
    var signInBtn = document.getElementById('sign-in-google');
    if (signInBtn) {
        signInBtn.addEventListener('click', handleGoogleSignIn, false);
    }
}

window.onload = function () {
    initApp();
};
