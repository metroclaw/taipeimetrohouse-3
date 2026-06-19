// ============================================================
// Module 1: Firebase Config & Init
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyDgk5qz4mNA09g-3azau9mgWjd8996uvJU",
  authDomain: "taipeimetrohouse-2.firebaseapp.com",
  projectId: "taipeimetrohouse-2",
  storageBucket: "taipeimetrohouse-2.firebasestorage.app",
  messagingSenderId: "90653753409",
  appId: "1:90653753409:web:b675e99516d61f920d46c0",
  measurementId: "G-EZDH90LHWB"
};

// Initialize Firebase (guard against double-init when login.js also loads)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
// Analytics disabled due to permission issues

// ============================================================
// Module 2: Auth Functions
// ============================================================

// 取得當前使用者 UID
function getCurrentUserUid() {
    const user = firebase.auth().currentUser;
    return user ? user.uid : null;
}

// 取得當前使用者資訊
function getCurrentUser() {
    return firebase.auth().currentUser;
}

// 檢查登入狀態（已整合到 Module 6，此函數保留供相容性使用但不執行）
function checkAuth() {
    // Module 6 已處理 auth 狀態監聽，此函數不再重複註冊
}

// 更新使用者資訊顯示
function updateUserInfo(user) {
    const nameEl = document.getElementById('user-name');
    const emailEl = document.getElementById('user-email');
    const avatarEl = document.getElementById('user-avatar');
    if (nameEl) nameEl.textContent = user.displayName || '使用者';
    if (emailEl) emailEl.textContent = user.email || '';
    if (avatarEl) {
        const photoURL = user.photoURL || '';
        if (avatarEl.tagName === 'IMG') {
            avatarEl.src = photoURL || 'img/profile_placeholder.png';
        } else if (photoURL) {
            avatarEl.innerHTML = `<img src="${photoURL}" alt="${user.displayName || '使用者'}" class="w-full h-full object-cover">`;
        } else {
            avatarEl.innerHTML = '<i class="fas fa-user text-primary text-sm"></i>';
        }
    }
}

function toggleUserMenu(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('user-menu');
    if (menu) menu.classList.toggle('hidden');
}

function closeUserMenu() {
    const menu = document.getElementById('user-menu');
    if (menu) menu.classList.add('hidden');
}

document.addEventListener('click', function(event) {
    const menu = document.getElementById('user-menu');
    const button = document.getElementById('user-menu-button');
    if (!menu || !button) return;
    if (!menu.contains(event.target) && !button.contains(event.target)) closeUserMenu();
});


const ACCOUNT_ROLES = ['管理員', '員工', '房務', '工務', '租客', '訪客'];
const ACCOUNT_STATUSES = ['啟用', '停用'];

async function ensureAccountProfile(user) {
    if (!user) return null;
    const accountRef = db.collection('accounts').doc(user.uid);
    const accountSnap = await accountRef.get();
    let role = '訪客';
    if (!accountSnap.exists) {
        try {
            const firstSnap = await db.collection('accounts').limit(1).get();
            role = firstSnap.empty ? '管理員' : '訪客';
        } catch (e) {
            console.warn('[Accounts] Failed to check first account, defaulting to visitor:', e);
        }
        await accountRef.set({
            uid: user.uid,
            displayName: user.displayName || '未命名使用者',
            email: user.email || '',
            photoURL: user.photoURL || '',
            role,
            status: '啟用',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    } else {
        await accountRef.set({
            uid: user.uid,
            displayName: user.displayName || accountSnap.data().displayName || '未命名使用者',
            email: user.email || accountSnap.data().email || '',
            photoURL: user.photoURL || accountSnap.data().photoURL || '',
            status: accountSnap.data().status || '啟用',
            role: accountSnap.data().role || '訪客',
            projectId: accountSnap.data().projectId || '',
            projectName: accountSnap.data().projectName || '',
            roomId: accountSnap.data().roomId || '',
            roomNumber: accountSnap.data().roomNumber || '',
            phone: accountSnap.data().phone || '',
            messageMode: accountSnap.data().messageMode || '電話簡訊',
            lineId: accountSnap.data().lineId || '',
            mailingAddress: accountSnap.data().mailingAddress || '',
            tenantPaymentContractReminder: accountSnap.data().tenantPaymentContractReminder !== false,
            workOrderReminder: accountSnap.data().workOrderReminder !== false,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }
    const fresh = await accountRef.get();
    return { id: fresh.id, ...fresh.data() };
}

async function getCurrentAccountProfile() {
    const user = getCurrentUser();
    if (!user) return null;
    const doc = await db.collection('accounts').doc(user.uid).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

async function getAllAccounts() {
    const snapshot = await db.collection('accounts').orderBy('createdAt', 'asc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

let __readableUserIdsCache = null;
let __readableUserIdsCacheAt = 0;
const __DATA_SCOPE_CACHE_MS = 15000;
const __projectOwnerUidById = {};

function isEnabledAdminAccount(account) {
    return !!account && account.role === '管理員' && (account.status || '啟用') === '啟用';
}

async function getReadableUserIds(options = {}) {
    const currentUid = getCurrentUserUid();
    if (!currentUid) return [];
    const now = Date.now();
    if (!options.force && __readableUserIdsCache && now - __readableUserIdsCacheAt < __DATA_SCOPE_CACHE_MS) {
        return __readableUserIdsCache.slice();
    }

    let ids = [currentUid];
    try {
        const currentAccount = await getCurrentAccountProfile();
        if (isEnabledAdminAccount(currentAccount)) {
            const accounts = await getAllAccounts();
            ids = accounts
                .filter(a => (a.uid || a.id) && (a.status || '啟用') === '啟用')
                .map(a => a.uid || a.id);
            if (!ids.includes(currentUid)) ids.unshift(currentUid);
        }
    } catch (e) {
        console.warn('[DataScope] Failed to resolve readable users; fallback to current user:', e);
        ids = [currentUid];
    }

    __readableUserIdsCache = Array.from(new Set(ids.filter(Boolean)));
    __readableUserIdsCacheAt = now;
    return __readableUserIdsCache.slice();
}

function getProjectOwnerUid(projectId) {
    return __projectOwnerUidById[projectId] || getCurrentUserUid();
}

async function getUserCollectionDocs(collectionName, orderByFields = []) {
    const userIds = await getReadableUserIds();
    const batches = await Promise.all(userIds.map(async (ownerUid) => {
        let ref = db.collection('users').doc(ownerUid).collection(collectionName);
        orderByFields.forEach(order => {
            if (Array.isArray(order)) ref = ref.orderBy(order[0], order[1]);
            else ref = ref.orderBy(order);
        });
        try {
            const snapshot = await ref.get();
            return snapshot.docs.map(doc => ({ id: doc.id, __ownerUid: ownerUid, ...doc.data() }));
        } catch (e) {
            console.warn(`[DataScope] Failed to read ${collectionName} for ${ownerUid}:`, e);
            return [];
        }
    }));
    return batches.flat();
}

async function updateCurrentAccountProfile(data) {
    const uid = getCurrentUserUid();
    if (!uid) throw new Error('使用者未登入');
    return await db.collection('accounts').doc(uid).set({
        ...data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}

// 登出
function handleSignOut() {
    firebase.auth().signOut().then(() => {
        clearSession();
        window.location.replace('index.html');
    }).catch((error) => {
        showToast('登出失敗', 'error');
    });
}

// ============================================================
// Module 3: Utility Functions
// ============================================================

// 格式化日期
function formatDate(timestamp) {
    if (!timestamp) return '—';
    const d = new Date(timestamp);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

// 格式化金額
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return 'NT$ 0';
    return 'NT$ ' + Number(amount).toLocaleString('zh-TW');
}

// 顯示 Toast 通知
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all duration-300 ${type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 顯示/隱藏 Loading
function showLoading() {
    let loader = document.getElementById('global-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.className = 'fixed inset-0 bg-black/30 z-[9999] flex items-center justify-center';
        loader.innerHTML = '<div class="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>';
        document.body.appendChild(loader);
    }
    loader.classList.remove('hidden');
}

function hideLoading() {
    const loader = document.getElementById('global-loader');
    if (loader) loader.classList.add('hidden');
}

// ============================================================
// Module 4: Firestore Data Access Layer
// ============================================================

const db = firebase.firestore();

// 取得目前帳號可讀取的所有建案。管理員可跨已啟用帳號讀取，避免切換為管理員後只看到自己空白資料夾。
async function getProjects() {
    const projects = await getUserCollectionDocs('projects');
    projects.forEach(project => { __projectOwnerUidById[project.id] = project.__ownerUid; });
    return projects;
}

// 取得建案的所有客房
async function getRooms(projectId) {
    const uid = getProjectOwnerUid(projectId);
    if (!uid) return [];
    const snapshot = await db.collection('users').doc(uid).collection('projects').doc(projectId).collection('rooms').get();
    return snapshot.docs.map(doc => ({ id: doc.id, __ownerUid: uid, projectId, ...doc.data() }));
}

// 取得目前帳號可讀取的所有房客
async function getTenants() {
    return await getUserCollectionDocs('tenants');
}

// 取得目前帳號可讀取的所有合約
async function getContracts() {
    return await getUserCollectionDocs('contracts');
}

// 取得租金紀錄
async function getRentRecords() {
    const records = await getUserCollectionDocs('rentRecords', [['year', 'desc'], ['month', 'desc']]);
    return records.sort((a, b) => (Number(b.year) - Number(a.year)) || (Number(b.month) - Number(a.month)));
}

// 取得費用紀錄
async function getUtilityBills() {
    const bills = await getUserCollectionDocs('utilityBills', [['year', 'desc'], ['month', 'desc']]);
    return bills.sort((a, b) => (Number(b.year) - Number(a.year)) || (Number(b.month) - Number(a.month)));
}

// 取得修繕派工
async function getMaintenanceTasks() {
    const tasks = await getUserCollectionDocs('maintenanceTasks', [['createdAt', 'desc']]);
    return tasks.sort((a, b) => toComparableMillis(b.createdAt) - toComparableMillis(a.createdAt));
}

// 取得證據檔案
async function getEvidenceFiles() {
    const files = await getUserCollectionDocs('evidenceFiles', [['createdAt', 'desc']]);
    return files.sort((a, b) => toComparableMillis(b.createdAt) - toComparableMillis(a.createdAt));
}

// 取得清潔排程
async function getCleaningSchedules() {
    return await getUserCollectionDocs('cleaningSchedules');
}

function toComparableMillis(value) {
    if (!value) return 0;
    if (value.toMillis) return value.toMillis();
    if (value.seconds) return value.seconds * 1000;
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
}

// 通用新增文件
async function addDoc(collection, data) {
    const uid = getCurrentUserUid();
    if (!uid) throw new Error('使用者未登入');
    return await db.collection('users').doc(uid).collection(collection).add(data);
}

// 通用更新文件
async function updateDoc(collection, id, data) {
    const uid = getCurrentUserUid();
    if (!uid) throw new Error('使用者未登入');
    return await db.collection('users').doc(uid).collection(collection).doc(id).update(data);
}

// 通用刪除文件
async function deleteDoc(collection, id) {
    const uid = getCurrentUserUid();
    if (!uid) throw new Error('使用者未登入');
    return await db.collection('users').doc(uid).collection(collection).doc(id).delete();
}


// ============================================================
// Module 4A: System Google Drive Workspace Upload API
// ============================================================
const DRIVE_WORKSPACE_ROOT = 'taipeimetrohouse';
const DRIVE_UPLOAD_ENDPOINT = '/api/drive/upload';
window.RENTALHUB_DRIVE_WORKSPACE_ROOT = DRIVE_WORKSPACE_ROOT;

function getDriveWorkspacePath(feature, parts = []) {
    return [DRIVE_WORKSPACE_ROOT, feature].concat((parts || []).filter(Boolean)).join('/');
}

async function callSystemDriveUploadApi(payload) {
    const user = firebase.auth().currentUser;
    if (!user) throw new Error('使用者未登入，無法上傳檔案');
    const idToken = await user.getIdToken();
    const response = await fetch(DRIVE_UPLOAD_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `系統 Google Drive 上傳 API 失敗 (${response.status})`);
    return data;
}

async function uploadBlobToGoogleDrive(blob, fileName, feature, parts = [], mimeType = 'application/octet-stream', onProgress) {
    if (!blob) throw new Error('缺少要上傳的檔案');
    const safeFileName = fileName || blob.name || `upload-${Date.now()}`;
    const safeMimeType = mimeType || blob.type || 'application/octet-stream';
    const session = await callSystemDriveUploadApi({
        action: 'createSession',
        fileName: safeFileName,
        fileType: safeMimeType,
        fileSize: blob.size || 0,
        feature,
        parts
    });
    if (typeof onProgress === 'function') onProgress(5);
    let uploadedFile = {};
    let uploadReadError = null;
    try {
        const uploadResponse = await fetch(session.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': safeMimeType },
            body: blob
        });
        if (!uploadResponse.ok) {
            const text = await uploadResponse.text().catch(() => '');
            throw new Error(`Google Drive 大型檔案上傳失敗 (${uploadResponse.status}) ${text}`);
        }
        uploadedFile = await uploadResponse.json().catch(() => ({}));
    } catch (error) {
        // Google Drive resumable upload can create the file while the browser cannot
        // read the final response because of CORS/response-body restrictions. Do not
        // immediately fail; ask the backend to locate the just-uploaded file in the
        // known folder by file name and uploaded-by metadata.
        uploadReadError = error;
        console.warn('[Drive] Upload response could not be read; attempting backend finalize lookup:', error);
    }
    if (typeof onProgress === 'function') onProgress(90);
    const finalized = await callSystemDriveUploadApi({
        action: 'finalize',
        driveFileId: uploadedFile.id || '',
        driveFolderId: session.driveFolderId,
        driveWorkspacePath: session.driveWorkspacePath,
        fileName: session.fileName || safeFileName,
        fileType: safeMimeType,
        fileSize: blob.size || 0,
        uploadReadWarning: uploadReadError ? String(uploadReadError.message || uploadReadError) : ''
    });
    if (typeof onProgress === 'function') onProgress(100);
    return finalized;
}

async function uploadFileToProjectDrive(file, feature, parts = [], onProgress) {
    return await uploadBlobToGoogleDrive(file, file.name || `file-${Date.now()}`, feature, parts, file.type || 'application/octet-stream', onProgress);
}

// ============================================================
// Module 5: Business Logic
// ============================================================

function calculateUtilityBill(billData, rooms, tenants) {
    const results = [];

    const totalArea = rooms.reduce((sum, r) => sum + (r.area || 0), 0);
    const totalPeople = tenants.reduce((sum, t) => sum + (t.roommates || 1), 0);
    const totalACUnits = rooms.reduce((sum, r) => sum + (r.acUnits || 1), 0);

    const elecUsage = (billData.elecCurrent || 0) - (billData.elecPrevious || 0);
    const waterUsage = (billData.waterCurrent || 0) - (billData.waterPrevious || 0);
    const gasUsage = (billData.gasCurrent || 0) - (billData.gasPrevious || 0);

    const elecTotal = elecUsage * (billData.elecRate || 5.5);
    const waterTotal = waterUsage * (billData.waterRate || 12);
    const gasTotal = gasUsage * (billData.gasRate || 25);

    for (const room of rooms) {
        const tenant = tenants.find(t =>
            (t.roomId && t.roomId === room.id && (!t.projectId || !room.projectId || t.projectId === room.projectId)) ||
            (room.tenantId && t.id === room.tenantId) ||
            (t.roomNumber && t.roomNumber === room.number) ||
            (t.room && t.room === room.number)
        );
        if (!tenant) continue;

        let elecFee = 0, waterFee = 0, gasFee = 0, tvFee = 0, wifiFee = 0;

        // 水費：依坪數
        if (billData.waterSplit === 'area' && totalArea > 0) {
            waterFee = waterTotal * ((room.area || 0) / totalArea);
        } else if (billData.waterSplit === 'people' && totalPeople > 0) {
            waterFee = waterTotal * ((tenant.roommates || 1) / totalPeople);
        }

        // 電費：依台數
        if (billData.elecSplit === 'ac' && totalACUnits > 0) {
            elecFee = elecTotal * ((room.acUnits || 1) / totalACUnits);
        } else if (billData.elecSplit === 'people' && totalPeople > 0) {
            elecFee = elecTotal * ((tenant.roommates || 1) / totalPeople);
        }

        // 瓦斯：依人數
        if (billData.gasSplit === 'people' && totalPeople > 0) {
            gasFee = gasTotal * ((tenant.roommates || 1) / totalPeople);
        }

        // 第四台、WiFi：均攤
        if (totalPeople > 0) {
            tvFee = (billData.tvFee || 0) / totalPeople;
            wifiFee = (billData.wifiFee || 0) / totalPeople;
        }

        results.push({
            roomId: room.id,
            roomNumber: room.number,
            tenantName: tenant.name,
            area: room.area,
            elecFee: Math.round(elecFee),
            waterFee: Math.round(waterFee),
            gasFee: Math.round(gasFee),
            tvFee: Math.round(tvFee),
            wifiFee: Math.round(wifiFee),
            subtotal: Math.round(elecFee + waterFee + gasFee + tvFee + wifiFee),
            rent: room.rent || 0,
            total: Math.round(elecFee + waterFee + gasFee + tvFee + wifiFee + (room.rent || 0))
        });
    }

    return results;
}

// ============================================================
// ============================================================
// Module 6: Auth State Listener
// ============================================================
// 使用 localStorage 做快速 session 標記，但真正是否導向 login 必須等 Firebase Auth 初始化完成。
// 避免 Google 登入後 dashboard 在 Auth 尚未恢復時被第一個 null 狀態誤導回 login。

var SESSION_KEY = 'tmh2-session';
window.__authInitComplete = false;
window.__authReadyPromise = null;

function onAuthReady(callback) {
    var promise = window.__authReadyPromise || waitForAuthInit();
    return promise.then(function(user) {
        if (typeof callback === 'function') callback(user);
        return user;
    });
}

function getSession() {
    try { return window.localStorage.getItem(SESSION_KEY); } catch (e) { return null; }
}
function setSession(value) {
    try { window.localStorage.setItem(SESSION_KEY, value || 'authenticated'); } catch (e) {}
}
function clearSession() {
    try { window.localStorage.removeItem(SESSION_KEY); } catch (e) {}
}
function isLoginLikePage() {
    var path = window.location.pathname;
    return path.includes('login.html') || path === '/' || path === '' || path.endsWith('/');
}
function waitForAuthInit() {
    if (window.__authReadyPromise) return window.__authReadyPromise;
    window.__authReadyPromise = new Promise(function(resolve) {
        if (firebase.auth().currentUser) {
            resolve(firebase.auth().currentUser);
            return;
        }
        var settled = false;
        var unsubscribe = firebase.auth().onAuthStateChanged(function(user) {
            if (settled) return;
            settled = true;
            unsubscribe();
            resolve(user);
        });
        // 防止 SDK 或網路異常導致永遠等待；逾時後用 currentUser 最終值決定。
        setTimeout(function() {
            if (settled) return;
            settled = true;
            unsubscribe();
            resolve(firebase.auth().currentUser);
        }, 3000);
    });
    return window.__authReadyPromise;
}

(function initAuthGate() {
    var session = getSession();
    var isLoginPage = isLoginLikePage();
    console.log("[Auth] init gate - session:", session, "path:", window.location.pathname);

    if (session && isLoginPage) {
        console.log("[Auth] Session found on login page, redirecting...");
        window.location.replace('dashboard.html');
        return;
    }

    waitForAuthInit().then(function(user) {
        window.__authInitComplete = true;
        console.log("[Auth] init complete:", user ? user.email : "null");
        window.dispatchEvent(new CustomEvent('rentalhub:auth-ready', { detail: { user: user } }));

        if (user) {
            setSession(user.email || user.uid);
            updateUserInfo(user);
            ensureAccountProfile(user).catch(function(e) { console.warn('[Accounts] profile sync failed:', e); });
            if (isLoginPage) {
                window.location.replace('dashboard.html');
            }
            return;
        }

        clearSession();
        if (!isLoginPage) {
            window.location.replace('login.html');
        }
    });
})();

// 持續監聽初始化之後的 Firebase Auth 狀態變化（處理登出、token 過期等）
firebase.auth().onAuthStateChanged(function(user) {
    if (!window.__authInitComplete) return;
    console.log("[Auth] Firebase state:", user ? user.email : "null");

    if (user) {
        setSession(user.email || user.uid);
        updateUserInfo(user);
        ensureAccountProfile(user).catch(function(e) { console.warn('[Accounts] profile sync failed:', e); });
        return;
    }

    clearSession();
    if (!isLoginLikePage()) {
        window.location.replace('login.html');
    }
});
