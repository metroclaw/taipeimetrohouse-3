// Firebase Configuration for taipeimetrohouse-2
var firebaseConfig = {
    apiKey: "AIzaSyDgk5qz4mNA09g-3azau9mgWjd8996uvJU",
    authDomain: "taipeimetrohouse-2.firebaseapp.com",
    projectId: "taipeimetrohouse-2",
    storageBucket: "taipeimetrohouse-2.firebasestorage.app",
    messagingSenderId: "90653753409",
    appId: "1:90653753409:web:b675e99516d61f920d46c0",
    measurementId: "G-EZDH90LHWB"
};

// Initialize Firebase
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
    try {
        firebase.firestore().collection('users').doc(user.uid).set({
            id: user.uid,
            name: user.displayName,
            email: user.email,
            profilePicUrl: user.photoURL || 'img/profile_placeholder.png',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            position: "訪客"
        }, { merge: true }).then(function () {
            console.log("User info saved");
        }).catch(function (error) {
            console.error("Error saving user:", error);
        });
    } catch (e) {
        console.error("Firestore not available:", e);
    }
}

function initLoginPage() {
    console.log("initLoginPage called");

    // Handle redirect result
    firebase.auth().getRedirectResult().then(function (result) {
        console.log("Redirect result:", result.user ? result.user.displayName : "no user");
        if (result.user) {
            console.log("Redirect login successful, saving user...");
            saveUserInformation(result.user);
            setTimeout(function () {
                window.location.href = './dashboard.html';
            }, 500);
        }
    }).catch(function (error) {
        console.error("Redirect error:", error.code, error.message);
    });

    // Listen for auth state changes
    firebase.auth().onAuthStateChanged(function (user) {
        console.log("Login page auth state:", user ? user.displayName : "null");
        if (user) {
            saveUserInformation(user);
            window.location.href = './dashboard.html';
        }
    });

    // Bind sign in button
    var signInBtn = document.getElementById('sign-in-google');
    if (signInBtn) {
        signInBtn.addEventListener('click', handleGoogleSignIn, false);
    } else {
        console.log("Sign in button not found");
    }
}

// Initialize when DOM and Firebase are ready
function tryInit() {
    try {
        if (firebase.auth && firebase.auth()) {
            initLoginPage();
        } else {
            setTimeout(tryInit, 100);
        }
    } catch (e) {
        setTimeout(tryInit, 100);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInit);
} else {
    tryInit();
}
