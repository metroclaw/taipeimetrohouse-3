// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBwE9SqrqKC49KnfmbDBZ92fbO1NOZHIZA",
  authDomain: "taipeimetrohouse-2.firebaseapp.com",
  projectId: "taipeimetrohouse-2",
  storageBucket: "taipeimetrohouse-2.firebasestorage.app",
  messagingSenderId: "90653753409",
  appId: "1:90653753409:web:b675e99516d61f920d46c0",
  measurementId: "G-EZDH90LHWB"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
// Analytics disabled due to permission issues

// ============================================================
// 共用工具函數
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

// 檢查登入狀態
function checkAuth() {
    firebase.auth().onAuthStateChanged(function (user) {
        if (!user) {
            // 未登入，導向登入頁
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
            }
        } else {
            // 已登入，更新使用者資訊
            updateUserInfo(user);
        }
    });
}

// 更新使用者資訊顯示
function updateUserInfo(user) {
    const nameEl = document.getElementById('user-name');
    const emailEl = document.getElementById('user-email');
    const avatarEl = document.getElementById('user-avatar');
    if (nameEl) nameEl.textContent = user.displayName || '使用者';
    if (emailEl) emailEl.textContent = user.email || '';
    if (avatarEl) avatarEl.src = user.photoURL || 'img/profile_placeholder.png';
}

// 登出
function handleSignOut() {
    firebase.auth().signOut().then(() => {
        window.location.href = 'login.html';
    }).catch((error) => {
        showToast('登出失敗', 'error');
    });
}

// ============================================================
// Firestore 資料操作
// ============================================================

const db = firebase.firestore();

// 取得使用者的所有建案
async function getProjects() {
    const uid = getCurrentUserUid();
    if (!uid) return [];
    const snapshot = await db.collection('users').doc(uid).collection('projects').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 取得建案的所有客房
async function getRooms(projectId) {
    const uid = getCurrentUserUid();
    if (!uid) return [];
    const snapshot = await db.collection('users').doc(uid).collection('projects').doc(projectId).collection('rooms').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 取得使用者的所有房客
async function getTenants() {
    const uid = getCurrentUserUid();
    if (!uid) return [];
    const snapshot = await db.collection('users').doc(uid).collection('tenants').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 取得使用者的所有合約
async function getContracts() {
    const uid = getCurrentUserUid();
    if (!uid) return [];
    const snapshot = await db.collection('users').doc(uid).collection('contracts').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 取得租金紀錄
async function getRentRecords() {
    const uid = getCurrentUserUid();
    if (!uid) return [];
    const snapshot = await db.collection('users').doc(uid).collection('rentRecords').orderBy('year', 'desc').orderBy('month', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 取得費用紀錄
async function getUtilityBills() {
    const uid = getCurrentUserUid();
    if (!uid) return [];
    const snapshot = await db.collection('users').doc(uid).collection('utilityBills').orderBy('year', 'desc').orderBy('month', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 取得修繕派工
async function getMaintenanceTasks() {
    const uid = getCurrentUserUid();
    if (!uid) return [];
    const snapshot = await db.collection('users').doc(uid).collection('maintenanceTasks').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 取得證據檔案
async function getEvidenceFiles() {
    const uid = getCurrentUserUid();
    if (!uid) return [];
    const snapshot = await db.collection('users').doc(uid).collection('evidenceFiles').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 取得清潔排程
async function getCleaningSchedules() {
    const uid = getCurrentUserUid();
    if (!uid) return [];
    const snapshot = await db.collection('users').doc(uid).collection('cleaningSchedules').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ============================================================
// 費用計算邏輯
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
        const tenant = tenants.find(t => t.roomId === room.id);
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
// 初始化 - 直接執行，不等待 DOMContentLoaded
// ============================================================
firebase.auth().onAuthStateChanged(function(user) {
    console.log("App auth state:", user ? user.displayName : "null");
    if (!user) {
        // 未登入，導向登入頁
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    } else {
        // 已登入，更新使用者資訊
        updateUserInfo(user);
    }
});
