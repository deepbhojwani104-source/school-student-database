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
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwwdpR2_W3r2ZlqUE9gugDUHRnNPMreXJU48S7K95Bpg8rIyZIMqUQRHj546EX2lwUf/exec';

document.addEventListener('DOMContentLoaded', () => {
  // Check auth state
  if (sessionStorage.getItem('edubase_auth') === 'true') {
    document.getElementById('loginOverlay').classList.add('hidden');
    loadUserStudents();
  } else {
    // If not logged in, clear local table view
    students = [];
    renderTable([]);
    updateStats();
  }

  // Set today's date as default admission date
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('admDate').value = today;
});

// ──────────────────────────────────────────────
// Authentication Logic
// ──────────────────────────────────────────────
const ALLOWED_USERS = [
  { u: 'admin', p: 'admin123' },
  { u: 'teacher1', p: 'teach789' },
  { u: 'teacher2', p: 'teach456' },
  { u: 'principal', p: 'leadSchool' },
  { u: 'staff1', p: 'staff001' },
  { u: 'staff2', p: 'staff002' },
  { u: 'coordinator', p: 'coord2026' },
  { u: 'clerk', p: 'clerkDb' },
  { u: 'registrar', p: 'regEduBase' },
  { u: 'moderator', p: 'modSchool' }
];

function handleLogin(e) {
  e.preventDefault();
  const usernameInput = getVal('login-username').trim();
  const passwordInput = getVal('login-password').trim();

  const userFound = ALLOWED_USERS.find(user => user.u === usernameInput && user.p === passwordInput);

  if (userFound) {
    sessionStorage.setItem('edubase_auth', 'true');
    sessionStorage.setItem('edubase_username', usernameInput);
    document.getElementById('loginOverlay').classList.add('hidden');
    showToast(`🔓 Welcome, ${usernameInput}!`, 'success');
    loadUserStudents();
  } else {
    showToast('❌ Invalid username or password!', 'error');
  }
}

function handleLogout() {
  sessionStorage.removeItem('edubase_auth');
  sessionStorage.removeItem('edubase_username');
  
  // Clear database data
  students = [];
  saveToStorage();
  renderTable([]);
  updateStats();

  // Reset input fields
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';

  // Show overlay
  document.getElementById('loginOverlay').classList.remove('hidden');
  showToast('🚪 Logged out successfully!', 'success');
}

// Load only records matching logged-in user
function loadUserStudents() {
  const username = sessionStorage.getItem('edubase_username');
  if (!username) return;

  showToast('📥 Fetching your records...', 'info');

  fetch(`${WEB_APP_URL}?username=${encodeURIComponent(username)}`)
    .then(res => {
      if (!res.ok) throw new Error('Network error');
      return res.json();
    })
    .then(data => {
      if (Array.isArray(data)) {
        students = data;
        saveToStorage();
        renderTable(students);
        updateStats();
      }
    })
    .catch(err => {
      console.error('Error fetching user data:', err);
      // Fallback to local storage if offline
      loadFromStorage();
      renderTable(students);
      updateStats();
    });
}

// ──────────────────────────────────────────────
// Form Submission — Add Student
// ──────────────────────────────────────────────
function addStudent(e) {
  e.preventDefault();
  clearErrors();

  if (!validateForm()) return;

  const currentUsername = sessionStorage.getItem('edubase_username') || 'anonymous';

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
    addedBy:     currentUsername
  };

  const submitBtn = document.getElementById('submitBtn');
  const submitText = document.getElementById('submitText');
  
  submitBtn.disabled = true;
  submitText.textContent = '⏳ Submitting...';

  // Send to Google Sheets Web App
  fetch(WEB_APP_URL, {
    method: 'POST',
    mode: 'no-cors', // Avoids CORS redirection issues
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(student)
  })
  .then(() => {
    students.push(student);
    saveToStorage();
    renderTable(students);
    updateStats();
    clearForm();
    showToast('✅ Saved successfully to Google Sheet!', 'success');
  })
  .catch(err => {
    console.error('Error submitting data:', err);
    showToast('❌ Submission failed. Check connection.', 'error');
  })
  .finally(() => {
    submitBtn.disabled = false;
    submitText.textContent = '➕ Add Student';
  });

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
    `Are you sure you want to delete the record of "${name}"? This will remove it from your Google Sheet.`;
  document.getElementById('modalOverlay').classList.add('open');

  document.getElementById('confirmDelete').onclick = () => {
    const currentUsername = sessionStorage.getItem('edubase_username') || 'anonymous';
    showToast('🗑️ Deleting from Google Sheet...', 'info');

    // Send POST delete request to Apps Script Web App
    fetch(WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'delete',
        rowIndex: deleteTargetId,
        username: currentUsername
      })
    })
    .then(() => {
      students = students.filter(s => s.id !== deleteTargetId);
      saveToStorage();
      renderTable(students);
      updateStats();
      closeModal();
      showToast('🗑️ Student record deleted successfully!', 'success');
      deleteTargetId = null;
    })
    .catch(err => {
      console.error('Delete error:', err);
      showToast('❌ Failed to delete record.', 'error');
    });
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


