'use strict';

const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const { google } = require('googleapis');

admin.initializeApp();

const DRIVE_WORKSPACE_ROOT_SECRET = defineSecret('DRIVE_WORKSPACE_ROOT');
const DRIVE_PUBLIC_READ_SECRET = defineSecret('DRIVE_PUBLIC_READ');
const SYSTEM_OWNER_EMAIL_SECRET = defineSecret('SYSTEM_OWNER_EMAIL');
const SYSTEM_DRIVE_CLIENT_EMAIL_SECRET = defineSecret('SYSTEM_DRIVE_CLIENT_EMAIL');
const SYSTEM_DRIVE_PRIVATE_KEY_SECRET = defineSecret('SYSTEM_DRIVE_PRIVATE_KEY');
const SYSTEM_DRIVE_IMPERSONATE_EMAIL_SECRET = defineSecret('SYSTEM_DRIVE_IMPERSONATE_EMAIL');
const SYSTEM_DRIVE_CLIENT_ID_SECRET = defineSecret('SYSTEM_DRIVE_CLIENT_ID');
const SYSTEM_DRIVE_CLIENT_SECRET_SECRET = defineSecret('SYSTEM_DRIVE_CLIENT_SECRET');
const SYSTEM_DRIVE_REFRESH_TOKEN_SECRET = defineSecret('SYSTEM_DRIVE_REFRESH_TOKEN');
const DRIVE_UPLOAD_FIELDS = 'id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,iconLink';
const ALLOWED_UPLOAD_ROLES = new Set(['管理員', '員工', '房務', '工務']);
const folderCache = new Map();
const DRIVE_SECRETS = [
  DRIVE_WORKSPACE_ROOT_SECRET, DRIVE_PUBLIC_READ_SECRET, SYSTEM_OWNER_EMAIL_SECRET,
  SYSTEM_DRIVE_CLIENT_EMAIL_SECRET, SYSTEM_DRIVE_PRIVATE_KEY_SECRET, SYSTEM_DRIVE_IMPERSONATE_EMAIL_SECRET,
  SYSTEM_DRIVE_CLIENT_ID_SECRET, SYSTEM_DRIVE_CLIENT_SECRET_SECRET, SYSTEM_DRIVE_REFRESH_TOKEN_SECRET
];

function secretValue(secret, fallback = '') {
  try {
    const value = secret.value();
    if (!value || value === '__unset__') return fallback;
    return value;
  } catch (e) {
    return fallback;
  }
}
function getWorkspaceRoot() { return secretValue(DRIVE_WORKSPACE_ROOT_SECRET, 'taipeimetrohouse'); }
function getDrivePublicRead() { return String(secretValue(DRIVE_PUBLIC_READ_SECRET, 'false')).toLowerCase() === 'true'; }

function sendCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Max-Age', '3600');
}

function sendJson(res, status, data) {
  sendCors(res);
  res.status(status).json(data);
}

function cleanSegment(value) {
  return String(value || '')
    .replace(/[\\/\u0000-\u001f]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120) || '未分類';
}

function normalizeParts(parts) {
  if (!Array.isArray(parts)) return [];
  return parts.map(cleanSegment).filter(Boolean);
}

async function verifyFirebaseUser(req) {
  const header = req.get('Authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) throw Object.assign(new Error('Missing Firebase ID token'), { status: 401 });
  const decoded = await admin.auth().verifyIdToken(match[1]);
  const snap = await admin.firestore().collection('accounts').doc(decoded.uid).get();
  const account = snap.exists ? snap.data() : {};
  const role = account.role || (decoded.email === secretValue(SYSTEM_OWNER_EMAIL_SECRET) ? '管理員' : '訪客');
  if (!ALLOWED_UPLOAD_ROLES.has(role)) {
    throw Object.assign(new Error('此角色目前沒有上傳大型檔案權限'), { status: 403 });
  }
  return { uid: decoded.uid, email: decoded.email || '', name: decoded.name || account.displayName || '', role };
}

function getDriveAuth() {
  // Personal Gmail / admin-authorized system Drive mode. Prefer this when present,
  // because it does not require Workspace domain-wide delegation and writes to the
  // Google Drive account that granted the refresh token.
  const clientId = secretValue(SYSTEM_DRIVE_CLIENT_ID_SECRET);
  const clientSecret = secretValue(SYSTEM_DRIVE_CLIENT_SECRET_SECRET);
  const refreshToken = secretValue(SYSTEM_DRIVE_REFRESH_TOKEN_SECRET);
  if (clientId && clientSecret && refreshToken) {
    const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
    oauth2.setCredentials({ refresh_token: refreshToken });
    return oauth2;
  }

  // Service account mode. Only set SYSTEM_DRIVE_IMPERSONATE_EMAIL when Google
  // Workspace domain-wide delegation is configured; consumer Gmail cannot use it.
  const scopes = ['https://www.googleapis.com/auth/drive'];
  const clientEmail = secretValue(SYSTEM_DRIVE_CLIENT_EMAIL_SECRET);
  const privateKey = secretValue(SYSTEM_DRIVE_PRIVATE_KEY_SECRET).replace(/\\n/g, '\n');
  const impersonate = secretValue(SYSTEM_DRIVE_IMPERSONATE_EMAIL_SECRET);
  if (clientEmail && privateKey) {
    return new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes,
      subject: impersonate || undefined
    });
  }

  throw Object.assign(new Error('系統 Google Drive 憑證尚未設定；請在 Firebase Functions 設定 SYSTEM_DRIVE_* secrets'), { status: 503 });
}

function getDriveClient(auth) {
  return google.drive({ version: 'v3', auth });
}

async function findDriveFolder(drive, name, parentId) {
  const escapedName = String(name).replace(/'/g, "\\'");
  const parentQuery = parentId ? ` and '${parentId}' in parents` : " and 'root' in parents";
  const q = `mimeType='application/vnd.google-apps.folder' and trashed=false and name='${escapedName}'${parentQuery}`;
  const result = await drive.files.list({ q, spaces: 'drive', fields: 'files(id,name,webViewLink)', pageSize: 1, supportsAllDrives: true, includeItemsFromAllDrives: true });
  return (result.data.files || [])[0] || null;
}

async function createDriveFolder(drive, name, parentId) {
  const requestBody = { name, mimeType: 'application/vnd.google-apps.folder' };
  if (parentId) requestBody.parents = [parentId];
  const result = await drive.files.create({ requestBody, fields: 'id,name,webViewLink', supportsAllDrives: true });
  return result.data;
}

async function ensureDriveFolderPath(drive, parts) {
  let parentId = '';
  let current = null;
  for (const raw of parts.filter(Boolean)) {
    const part = cleanSegment(raw);
    const key = `${parentId || 'root'}::${part}`;
    if (folderCache.has(key)) {
      current = folderCache.get(key);
      parentId = current.id;
      continue;
    }
    current = await findDriveFolder(drive, part, parentId) || await createDriveFolder(drive, part, parentId || undefined);
    folderCache.set(key, current);
    parentId = current.id;
  }
  return current;
}

async function createResumableSession(auth, drive, payload, actor) {
  const feature = cleanSegment(payload.feature || '未分類');
  const parts = normalizeParts(payload.parts || []);
  const fileName = cleanSegment(payload.fileName || `upload-${Date.now()}`);
  const mimeType = String(payload.fileType || payload.mimeType || 'application/octet-stream');
  const fileSize = Number(payload.fileSize || 0);
  const workspaceRoot = getWorkspaceRoot();
  const folder = await ensureDriveFolderPath(drive, [workspaceRoot, feature].concat(parts));
  const driveWorkspacePath = [workspaceRoot, feature].concat(parts).map(cleanSegment).join('/');
  const metadata = {
    name: fileName,
    parents: [folder.id],
    appProperties: {
      app: 'RentalHub',
      uploadedByUid: actor.uid,
      uploadedByEmail: actor.email,
      driveWorkspacePath
    }
  };
  const headers = await auth.getRequestHeaders();
  const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=${encodeURIComponent(DRIVE_UPLOAD_FIELDS)}&supportsAllDrives=true`, {
    method: 'POST',
    headers: Object.assign({}, headers, {
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': mimeType,
      'X-Upload-Content-Length': String(fileSize || '')
    }),
    body: JSON.stringify(metadata)
  });
  if (!response.ok) {
    const text = await response.text();
    throw Object.assign(new Error(`Google Drive 建立上傳工作階段失敗：${response.status} ${text}`), { status: 502 });
  }
  return {
    provider: 'googleDrive',
    storageOwner: 'systemDrive',
    uploadUrl: response.headers.get('location'),
    driveFolderId: folder.id,
    driveWorkspacePath,
    fileName,
    fileType: mimeType,
    fileSize,
    uploadedByUid: actor.uid,
    uploadedByName: actor.name,
    uploadedByEmail: actor.email,
    publicRead: getDrivePublicRead()
  };
}

async function finalizeDriveFile(drive, payload, actor) {
  const driveFileId = String(payload.driveFileId || payload.id || '').trim();
  if (!driveFileId) throw Object.assign(new Error('Missing driveFileId'), { status: 400 });
  if (getDrivePublicRead()) {
    try {
      await drive.permissions.create({ fileId: driveFileId, requestBody: { role: 'reader', type: 'anyone' }, supportsAllDrives: true });
    } catch (err) {
      console.warn('[Drive] Failed to set anyone-with-link permission:', err.message);
    }
  }
  const file = await drive.files.get({ fileId: driveFileId, fields: DRIVE_UPLOAD_FIELDS, supportsAllDrives: true });
  return {
    provider: 'googleDrive',
    storageOwner: 'systemDrive',
    driveFileId: file.data.id,
    driveFileName: file.data.name,
    driveFolderId: payload.driveFolderId || '',
    driveWorkspacePath: payload.driveWorkspacePath || '',
    fileName: file.data.name,
    fileType: file.data.mimeType || payload.fileType || '',
    fileSize: Number(file.data.size || payload.fileSize || 0),
    webViewLink: file.data.webViewLink || '',
    webContentLink: file.data.webContentLink || '',
    thumbnailLink: file.data.thumbnailLink || '',
    iconLink: file.data.iconLink || '',
    url: file.data.webContentLink || file.data.webViewLink || '',
    uploadedByUid: actor.uid,
    uploadedByName: actor.name,
    uploadedByEmail: actor.email,
    publicRead: getDrivePublicRead()
  };
}

exports.driveUpload = onRequest({ region: 'asia-east1', timeoutSeconds: 540, memory: '1GiB', cors: true, secrets: DRIVE_SECRETS }, async (req, res) => {
  sendCors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }
  try {
    const actor = await verifyFirebaseUser(req);
    const auth = getDriveAuth();
    const drive = getDriveClient(auth);
    const body = req.body || {};
    const action = body.action || 'createSession';
    if (action === 'createSession') {
      const session = await createResumableSession(auth, drive, body, actor);
      sendJson(res, 200, session);
      return;
    }
    if (action === 'finalize') {
      const file = await finalizeDriveFile(drive, body, actor);
      sendJson(res, 200, file);
      return;
    }
    sendJson(res, 400, { error: 'Unknown action' });
  } catch (err) {
    console.error('[driveUpload]', err);
    sendJson(res, err.status || 500, { error: err.message || 'Drive upload failed' });
  }
});
