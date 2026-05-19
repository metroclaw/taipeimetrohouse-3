// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyBbo7Hhxo1T9oWqMSHDC-oXV1Y9RhzYt3M",
    authDomain: "taipeimetrohouse.web.app",
    databaseURL: "https://taipeimetrohouse-default-rtdb.firebaseio.com",
    projectId: "taipeimetrohouse",
    storageBucket: "taipeimetrohouse.appspot.com",
    messagingSenderId: "850324469942",
    appId: "1:850324469942:web:fcc6c2df57dc682d508e17",
    measurementId: "G-NBE4QRRLYG"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

// google sign in need to consider save user information
var googleSignInTask = false;


function handleGoogleSignIn() {
    if (!firebase.auth().currentUser) {
        console.log("Start login")
        sessionStorage.setItem('login_task', true);
        var provider = new firebase.auth.GoogleAuthProvider();
        googleSignInTask = true;
        provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
        firebase.auth().languageCode = 'zh-TW';
        firebase.auth().signInWithRedirect(provider);
    } else {
        firebase.auth().signOut();
    }
    // document.getElementById("sign-in-google").disabled = true
}

function saveUserInformation(user) {
    firebase.database().ref('users/' + getUserUid()).set({
        id: getUserUid(),
        name: user.displayName,
        email: user.email,
        profilePicUrl: user.photoURL || 'img/profile_placeholder.png',
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        position: "訪客"
    }).then(function() {
        window.location.href = './tasks.html';
    }).catch(function(error) {
        alert("登入失敗！");
        console.error('Error writing user data to database', error);
    });
}

function getUserUid() {
    return firebase.auth().currentUser.uid;
}

function initApp() {
    document.getElementById('sign-in-google').addEventListener('click', handleGoogleSignIn, false);
    // if (sessionStorage.getItem('login_task')) {
    //     $("#uploadModal").modal()
    //     sessionStorage.removeItem('login_task');
    //     firebase.auth().getRedirectResult().then(function(result) {
    //         if (result.credential) {
    //             // This gives you a Google Access Token. You can use it to access the Google API.
    //             var token = result.credential.accessToken;
    //             // The signed-in user info.
    //             var user = result.user;
    //             sessionStorage.clear();
    //             if (result.additionalUserInfo.isNewUser == true) {
    //                 console.log("new user")
    //                 saveUserInformation(user);
    //             } else {
    //                 console.log("go to new page")
    //                 $("#uploadModal .close").click()
    //                 window.location.href = './tasks.html';
    //             }
    //         } else {
    //             $("#uploadModal .close").click();
    //             alert("未提供帳戶資訊");
    //         }
    //     }).catch(function(error) {
    //         $("#uploadModal .close").click();
    //         // Handle Errors here.
    //         var errorCode = error.code;
    //         var errorMessage = error.message;
    //         // [START_EXCLUDE]
    //         if (errorCode === 'auth/wrong-password') {
    //             alert("密碼錯誤");
    //             passwordWrong.removeAttribute("hidden");
    //         } else if (errorCode === 'auth/network-request-failed') {
    //             alert("網路不穩定");
    //         } else if (errorCode === 'auth/user-not-found') {
    //             emailWrong.removeAttribute("hidden");
    //         } else {
    //             alert(errorMessage);
    //         }
    //         console.log(error);
    //         // The email of the user's account used.
    //         var email = error.email;
    //         // The firebase.auth.AuthCredential type that was used.
    //         var credential = error.credential;
    //         // ...
    //     });
    // }

}

/**
 * Preloader
 */
let preloader = document.querySelector('#preloader');
if (preloader) {
    window.addEventListener('load', () => {
        firebase.auth()
            .getRedirectResult()
            .then((result) => {
                if (result.credential) {
                    /** @type {firebase.auth.OAuthCredential} */
                    var credential = result.credential;
                    // This gives you a Google Access Token. You can use it to access the Google API.
                    var token = credential.accessToken;
                }
                // The signed-in user info.
                var user = result.user;
                if (user) {
                    if (result.additionalUserInfo.isNewUser == true) {
                        console.log("new user")
                        saveUserInformation(user);
                    } else {
                        console.log("go to new page")
                            // $("#uploadModal .close").click()
                        window.location.href = './tasks.html';
                    }
                } else {
                    firebase.auth().signOut();
                    alert("已將您登出，請再次登入...");
                    preloader.remove();
                }
            }).catch((error) => {
                preloader.remove();
                var errorCode = error.code;
                var errorMessage = error.message;
                if (errorCode === 'auth/wrong-password') {
                    alert("密碼錯誤");
                    passwordWrong.removeAttribute("hidden");
                } else if (errorCode === 'auth/network-request-failed') {
                    alert("網路不穩定");
                } else if (errorCode === 'auth/user-not-found') {
                    emailWrong.removeAttribute("hidden");
                } else {
                    alert(errorMessage);
                }
            });
    });
}

window.onload = function() {
    initApp();
};