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
// Analytics disabled due to permission issues
// try { firebase.analytics(); } catch (e) { console.log("Analytics:", e.message); }

// Google Sign In
var googleSignInTask = false;

function handleGoogleSignIn() {
    if (!firebase.auth().currentUser) {
        console.log("Start login");
        var provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().languageCode = 'zh-TW';
        // Use redirect for better compatibility
        firebase.auth().signInWithRedirect(provider);
    } else {
        firebase.auth().signOut();
    }
}

function saveUserInformation(user) {
    // Save to Firestore (v9 compat)
    firebase.firestore().collection('users').doc(getUserUid()).set({
        id: getUserUid(),
        name: user.displayName,
        email: user.email,
        profilePicUrl: user.photoURL || 'img/profile_placeholder.png',
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        position: "訪客"
    }).then(function () {
        window.location.href = './dashboard.html';
    }).catch(function (error) {
        // Fallback to Realtime Database
        try {
            firebase.database().ref('users/' + getUserUid()).set({
                id: getUserUid(),
                name: user.displayName,
                email: user.email,
                profilePicUrl: user.photoURL || 'img/profile_placeholder.png',
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                position: "訪客"
            }).then(function () {
                window.location.href = './dashboard.html';
            }).catch(function (err) {
                alert("登入失敗！");
                console.error('Error writing user data', err);
            });
        } catch (e) {
            alert("登入失敗！");
            console.error('Error writing user data', e);
        }
    });
}

function getUserUid() {
    return firebase.auth().currentUser.uid;
}

function initApp() {
    document.getElementById('sign-in-google').addEventListener('click', handleGoogleSignIn, false);
}

// Preloader - handle redirect result
var preloader = document.querySelector('#preloader');
if (preloader) {
    window.addEventListener('load', function () {
        firebase.auth().getRedirectResult().then(function (result) {
            if (result.credential) {
                var token = result.credential.accessToken;
            }
            var user = result.user;
            if (user) {
                if (result.additionalUserInfo && result.additionalUserInfo.isNewUser == true) {
                    console.log("new user");
                    saveUserInformation(user);
                } else {
                    console.log("existing user, redirecting...");
                    window.location.href = './dashboard.html';
                }
            } else {
                preloader.remove();
            }
        }).catch(function (error) {
            preloader.remove();
            console.error("Auth error:", error);
            if (error.code === 'auth/wrong-password') {
                alert("密碼錯誤");
            } else if (error.code === 'auth/network-request-failed') {
                alert("網路不穩定");
            } else if (error.code === 'auth/user-not-found') {
                alert("找不到使用者");
            } else if (error.code !== 'auth/operation-not-allowed') {
                // Don't alert for operation-not-allowed (Google auth not enabled yet)
                console.log("Auth error code:", error.code, error.message);
            }
        });
    });
}

window.onload = function () {
    initApp();
};
