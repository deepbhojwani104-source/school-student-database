/* =============================================
   EduBase - School Student Database
   Application Logic
   ============================================= */

// ──────────────────────────────────────────────
// State
// ──────────────────────────────────────────────
let students = [];          // All student records
let filteredStudents = [];  // Currently displayed records
let deleteTargetId = null;  // ID of record pending deletion

// ──────────────────────────────────────────────
// Initialization
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  renderTable(students);
  updateStats();

  // Set today's date as default admission date
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('admDate').value = today;

  // Initialize Google Identity Services token client
  setTimeout(initTokenClient, 1000);
});

// ──────────────────────────────────────────────
// Form Submission — Add Student
// ──────────────────────────────────────────────
function addStudent(e) {
  e.preventDefault();
  clearErrors();

  if (!validateForm()) return;

  const student = {
    id: Date.now(),
    sNo: students.length + 1,
    rollNo:      getVal('rollNo'),
    fullName:    getVal('fullName'),
    className:   getVal('className'),
    section:     getVal('section'),
    dob:         getVal('dob'),
    gender:      getVal('gender'),
    fatherName:  getVal('fatherName'),
    motherName:  getVal('motherName'),
    phone:       getVal('phone'),
    email:       getVal('email'),
    address:     getVal('address'),
    bloodGroup:  getVal('bloodGroup'),
    admDate:     getVal('admDate'),
    addedOn:     new Date().toLocaleDateString('en-IN'),
  };

  students.push(student);
  saveToStorage();
  renderTable(students);
  updateStats();
  clearForm();

  showToast('✅ Student added successfully!', 'success');

  // Scroll to table
  document.querySelector('.table-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ──────────────────────────────────────────────
// Validation
// ──────────────────────────────────────────────
function validateForm() {
  let valid = true;

  if (!getVal('fullName').trim()) {
    setError('fullName', 'Full name is required');
    valid = false;
  }

  const rollNo = getVal('rollNo').trim();
  if (!rollNo) {
    setError('rollNo', 'Roll number is required');
    valid = false;
  } else if (students.some(s => s.rollNo.toLowerCase() === rollNo.toLowerCase())) {
    setError('rollNo', 'This roll number already exists');
    valid = false;
  }

  if (!getVal('className')) {
    setError('className', 'Please select a class');
    valid = false;
  }

  if (!getVal('dob')) {
    setError('dob', 'Date of birth is required');
    valid = false;
  }

  if (!getVal('gender')) {
    setError('gender', 'Please select gender');
    valid = false;
  }

  if (!getVal('fatherName').trim()) {
    setError('fatherName', "Father's name is required");
    valid = false;
  }

  const phone = getVal('phone').trim();
  if (!phone) {
    setError('phone', 'Phone number is required');
    valid = false;
  } else if (!/^\d{10}$/.test(phone)) {
    setError('phone', 'Enter a valid 10-digit number');
    valid = false;
  }

  const email = getVal('email').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError('email', 'Enter a valid email address');
    valid = false;
  }

  return valid;
}

function setError(fieldId, msg) {
  const input = document.getElementById(fieldId);
  const err   = document.getElementById('err-' + fieldId);
  if (input) input.classList.add('error');
  if (err)   err.textContent = msg;
}

function clearErrors() {
  document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
  document.querySelectorAll('.err-msg').forEach(el => el.textContent = '');
}

// ──────────────────────────────────────────────
// Render Table
// ──────────────────────────────────────────────
function renderTable(list) {
  filteredStudents = list;
  const tbody      = document.getElementById('tableBody');
  const emptyState = document.getElementById('emptyState');
  const tableWrap  = document.getElementById('tableWrapper');
  const label      = document.getElementById('showingLabel');

  label.textContent = `Showing ${list.length} student${list.length !== 1 ? 's' : ''}`;

  if (list.length === 0) {
    emptyState.style.display = 'flex';
    tableWrap.style.display  = 'none';
    tbody.innerHTML = '';
    return;
  }

  emptyState.style.display = 'none';
  tableWrap.style.display  = 'block';

  tbody.innerHTML = list.map((s, idx) => {
    const initials  = s.fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const gClass    = s.gender === 'Male' ? 'male' : s.gender === 'Female' ? 'female' : 'other';
    return `
      <tr data-id="${s.id}" style="animation: fadeRow 0.35s ease ${idx * 0.04}s both;">
        <td>${idx + 1}</td>
        <td><strong>${escHtml(s.rollNo)}</strong></td>
        <td>
          <div class="name-badge">
            <div class="avatar avatar-${gClass}">${escHtml(initials)}</div>
            <div>
              <div style="font-weight:600;">${escHtml(s.fullName)}</div>
              ${s.email ? `<div style="font-size:0.75rem;color:var(--text3);">${escHtml(s.email)}</div>` : ''}
            </div>
          </div>
        </td>
        <td><span class="class-badge">${escHtml(s.className)}</span></td>
        <td>${s.section ? escHtml(s.section) : '<span style="color:var(--text3)">—</span>'}</td>
        <td><span class="gender-badge gender-${gClass}">${escHtml(s.gender)}</span></td>
        <td>${s.dob ? formatDate(s.dob) : '—'}</td>
        <td>${escHtml(s.fatherName)}</td>
        <td>📞 ${escHtml(s.phone)}</td>
        <td>${s.bloodGroup ? `<span class="blood-badge">${escHtml(s.bloodGroup)}</span>` : '<span style="color:var(--text3)">—</span>'}</td>
        <td>
          <div class="action-btns">
            <button class="btn-icon delete" title="Delete student" onclick="confirmDelete(${s.id}, '${escHtml(s.fullName).replace(/'/g, "\\'")}')">🗑️</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// Animate rows
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeRow {
    from { opacity:0; transform:translateY(8px); }
    to   { opacity:1; transform:translateY(0); }
  }
`;
document.head.appendChild(style);

// ──────────────────────────────────────────────
// Search & Filter
// ──────────────────────────────────────────────
function filterStudents() {
  const query       = document.getElementById('searchInput').value.toLowerCase().trim();
  const classFilter = document.getElementById('filterClass').value;
  const genFilter   = document.getElementById('filterGender').value;

  const filtered = students.filter(s => {
    const matchSearch =
      !query ||
      s.fullName.toLowerCase().includes(query) ||
      s.rollNo.toLowerCase().includes(query) ||
      s.className.toLowerCase().includes(query) ||
      s.fatherName.toLowerCase().includes(query) ||
      s.phone.includes(query);

    const matchClass  = !classFilter || s.className === classFilter;
    const matchGender = !genFilter   || s.gender === genFilter;

    return matchSearch && matchClass && matchGender;
  });

  renderTable(filtered);
}

// ──────────────────────────────────────────────
// Delete Student
// ──────────────────────────────────────────────
function confirmDelete(id, name) {
  deleteTargetId = id;
  document.getElementById('modalDesc').textContent =
    `Are you sure you want to delete the record of "${name}"? This action cannot be undone.`;
  document.getElementById('modalOverlay').classList.add('open');

  document.getElementById('confirmDelete').onclick = () => {
    students = students.filter(s => s.id !== deleteTargetId);
    saveToStorage();
    renderTable(students);
    updateStats();
    closeModal();
    showToast('🗑️ Student record deleted', 'error');
    deleteTargetId = null;
  };
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

// ──────────────────────────────────────────────
// Export to Excel
// ──────────────────────────────────────────────
function exportToExcel() {
  if (students.length === 0) {
    showToast('⚠️ No students to export!', 'info');
    return;
  }

  // Build data rows
  const headers = [
    'S.No', 'Roll No', 'Full Name', 'Class', 'Section', 'Date of Birth',
    'Gender', "Father's Name", "Mother's Name", 'Phone', 'Email',
    'Blood Group', 'Address', 'Admission Date', 'Added On'
  ];

  const rows = students.map((s, i) => [
    i + 1,
    s.rollNo,
    s.fullName,
    s.className,
    s.section,
    s.dob ? formatDate(s.dob) : '',
    s.gender,
    s.fatherName,
    s.motherName,
    s.phone,
    s.email,
    s.bloodGroup,
    s.address,
    s.admDate ? formatDate(s.admDate) : '',
    s.addedOn,
  ]);

  // Create workbook
  const wb = XLSX.utils.book_new();
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Style header row widths
  ws['!cols'] = [
    {wch:6}, {wch:12}, {wch:22}, {wch:20}, {wch:9}, {wch:14},
    {wch:10}, {wch:22}, {wch:22}, {wch:14}, {wch:26},
    {wch:12}, {wch:30}, {wch:16}, {wch:14}
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Students');

  // Filename with date
  const dateStr = new Date().toISOString().slice(0,10);
  XLSX.writeFile(wb, `School_Student_Database_${dateStr}.xlsx`);

  showToast(`📊 Exported ${students.length} student${students.length > 1 ? 's' : ''} to Excel!`, 'success');
}

// ──────────────────────────────────────────────
// Clear Form
// ──────────────────────────────────────────────
function clearForm() {
  document.getElementById('studentForm').reset();
  clearErrors();
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('admDate').value = today;
}

// ──────────────────────────────────────────────
// Stats
// ──────────────────────────────────────────────
function updateStats() {
  animateNumber('stat-total', students.length);
}

function animateNumber(id, target) {
  const el = document.getElementById(id);
  const start = parseInt(el.textContent) || 0;
  if (start === target) return;
  const step = target > start ? 1 : -1;
  let current = start;
  const interval = setInterval(() => {
    current += step;
    el.textContent = current;
    if (current === target) clearInterval(interval);
  }, 40);
}

// ──────────────────────────────────────────────
// LocalStorage Persistence
// ──────────────────────────────────────────────
function saveToStorage() {
  localStorage.setItem('edubase_students', JSON.stringify(students));
}

function loadFromStorage() {
  try {
    const stored = localStorage.getItem('edubase_students');
    if (stored) students = JSON.parse(stored);
  } catch (e) {
    students = [];
  }
}

// ──────────────────────────────────────────────
// Toast Notification
// ──────────────────────────────────────────────
let toastTimer = null;

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className   = `toast ${type} show`;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function getVal(id) {
  return (document.getElementById(id)?.value || '').trim();
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ──────────────────────────────────────────────
// Google Drive Integration (Direct Excel Sync)
// ──────────────────────────────────────────────
const GDRIVE_CLIENT_ID = '25631955555-fkk8i144c7jlva12ohl9kt7eedlspuq8.apps.googleusercontent.com';
const GDRIVE_SCOPES    = 'https://www.googleapis.com/auth/drive';
const EXCEL_FILE_ID    = '1dI8m8Gdw-BtlpHCk6yJsLsFjilMlqw13';

let tokenClient = null;
let accessToken = null;
let pendingAction = null;

function initTokenClient() {
  if (typeof google === 'undefined' || !google.accounts) {
    console.log('Google Identity Services script not ready yet, retrying...');
    return;
  }
  try {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GDRIVE_CLIENT_ID,
      scope: GDRIVE_SCOPES,
      callback: async (response) => {
        if (response.error !== undefined) {
          showToast('❌ Auth error: ' + response.error, 'error');
          return;
        }
        accessToken = response.access_token;
        
        // Execute pending action
        if (pendingAction === 'save') {
          showToast('📤 Saving records to Google Drive Excel...', 'info');
          await saveToDrive();
        } else if (pendingAction === 'load') {
          showToast('📥 Loading records from Google Drive Excel...', 'info');
          await loadFromDrive();
        }
        pendingAction = null;
      },
    });
    console.log('Google Token Client initialized successfully.');
  } catch (err) {
    console.error('Error initializing Google token client:', err);
  }
}

function requestAuth(action) {
  if (!tokenClient) {
    initTokenClient();
  }
  if (!tokenClient) {
    showToast('⚠️ Google Drive library still loading, please wait.', 'info');
    return;
  }
  pendingAction = action;
  
  // If we already have a valid accessToken, just run the action directly
  if (accessToken) {
    if (action === 'save') saveToDrive();
    if (action === 'load') loadFromDrive();
    pendingAction = null;
  } else {
    // Open the Google Sign-In popup
    tokenClient.requestAccessToken({ prompt: 'consent' });
  }
}

function handleDriveSync() {
  if (students.length === 0) {
    showToast('⚠️ Nothing to sync! Add some students first.', 'info');
    return;
  }
  requestAuth('save');
}

function handleDriveLoad() {
  requestAuth('load');
}

function parseExcelDate(val) {
  if (val === undefined || val === null || val === '') return '';
  
  // If it's a number (Excel date code)
  if (typeof val === 'number') {
    const date = new Date((val - 25569) * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  const dateStr = String(val).trim();
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  
  return dateStr;
}

async function saveToDrive() {
  try {
    const headers = [
      'S.No', 'Roll No', 'Full Name', 'Class', 'Section', 'Date of Birth',
      'Gender', "Father's Name", "Mother's Name", 'Phone', 'Email',
      'Blood Group', 'Address', 'Admission Date', 'Added On'
    ];

    const rows = students.map((s, i) => [
      i + 1,
      s.rollNo,
      s.fullName,
      s.className,
      s.section,
      s.dob ? formatDate(s.dob) : '',
      s.gender,
      s.fatherName,
      s.motherName,
      s.phone,
      s.email,
      s.bloodGroup,
      s.address,
      s.admDate ? formatDate(s.admDate) : '',
      s.addedOn,
    ]);

    // Create workbook
    const wb = XLSX.utils.book_new();
    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
      {wch:6}, {wch:12}, {wch:22}, {wch:20}, {wch:9}, {wch:14},
      {wch:10}, {wch:22}, {wch:22}, {wch:14}, {wch:26},
      {wch:12}, {wch:30}, {wch:16}, {wch:14}
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Students');

    // Write to array buffer and create blob
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Patch the specific excel file media content
    const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${EXCEL_FILE_ID}?uploadType=media`;
    const res = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      body: blob
    });

    if (res.ok) {
      showToast('✅ Excel file updated on Google Drive!', 'success');
    } else {
      const errText = await res.text();
      console.error('Drive save error status:', res.status, errText);
      try {
        const errJson = JSON.parse(errText);
        showToast(`❌ Save error (${res.status}): ${errJson.error.message}`, 'error');
      } catch(e) {
        showToast(`❌ Save error (${res.status}): ${errText.slice(0, 100)}`, 'error');
      }
    }
  } catch (err) {
    console.error('saveToDrive error:', err);
    showToast('❌ Failed to save Excel file to Google Drive. Check internet or console.', 'error');
  }
}

async function loadFromDrive() {
  try {
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${EXCEL_FILE_ID}?alt=media`;
    const res = await fetch(downloadUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });

      if (workbook.SheetNames.length === 0) {
        showToast('⚠️ No sheets found in the Excel file.', 'error');
        return;
      }

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (rows.length <= 1) {
        showToast('📂 Excel file is empty or only contains headers.', 'info');
        students = [];
        saveToStorage();
        renderTable(students);
        updateStats();
        return;
      }

      const loadedStudents = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length === 0) continue;
        if (!r[2] && !r[1]) continue; // Needs at least Name or Roll number

        loadedStudents.push({
          id: Date.now() + i,
          sNo: i,
          rollNo: String(r[1] !== undefined ? r[1] : ''),
          fullName: String(r[2] !== undefined ? r[2] : ''),
          className: String(r[3] !== undefined ? r[3] : ''),
          section: String(r[4] !== undefined ? r[4] : ''),
          dob: parseExcelDate(r[5]),
          gender: String(r[6] !== undefined ? r[6] : ''),
          fatherName: String(r[7] !== undefined ? r[7] : ''),
          motherName: String(r[8] !== undefined ? r[8] : ''),
          phone: String(r[9] !== undefined ? r[9] : ''),
          email: String(r[10] !== undefined ? r[10] : ''),
          bloodGroup: String(r[11] !== undefined ? r[11] : ''),
          address: String(r[12] !== undefined ? r[12] : ''),
          admDate: parseExcelDate(r[13]),
          addedOn: String(r[14] !== undefined ? r[14] : new Date().toLocaleDateString('en-IN')),
        });
      }

      students = loadedStudents;
      saveToStorage();
      renderTable(students);
      updateStats();
      showToast(`✅ Loaded ${students.length} students from Google Drive!`, 'success');
    } else {
      const errText = await res.text();
      console.error('Drive load error status:', res.status, errText);
      try {
        const errJson = JSON.parse(errText);
        showToast(`❌ Load error (${res.status}): ${errJson.error.message}`, 'error');
      } catch(e) {
        showToast(`❌ Load error (${res.status}): ${errText.slice(0, 100)}`, 'error');
      }
    }
  } catch (err) {
    console.error('loadFromDrive error:', err);
    showToast('❌ Failed to load Excel data from Google Drive. Check internet or console.', 'error');
  }
}
