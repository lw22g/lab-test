// app.js - Laboratory Management System Logic

// --- Firebase Configuration & Initialization ---
const firebaseConfig = {
  apiKey: "AIzaSyBUvdSrGUj81kSGAJyAd82ziQ93g-NXzdQ",
  authDomain: "lab-test-1c156.firebaseapp.com",
  projectId: "lab-test-1c156",
  storageBucket: "lab-test-1c156.firebasestorage.app",
  messagingSenderId: "728304964313",
  appId: "1:728304964313:web:c01c05f014efa176da24c8",
  measurementId: "G-X5938BG88T"
};

let db = null;

// --- Constants & Configurations ---
const DEFAULT_TEST_TYPES = [
    { name: "Fasting Blood Sugar (FBS)", min: 70, max: 100, unit: "mg/dL", type: "numeric", price: 3000, normalValue: "" },
    { name: "Hemoglobin (Hb)", min: 12.0, max: 16.0, unit: "g/dL", type: "numeric", price: 4000, normalValue: "" },
    { name: "Blood Urea", min: 15, max: 45, unit: "mg/dL", type: "numeric", price: 5000, normalValue: "" },
    { name: "Serum Creatinine", min: 0.6, max: 1.2, unit: "mg/dL", type: "numeric", price: 5000, normalValue: "" },
    { name: "Total Cholesterol", min: 120, max: 200, unit: "mg/dL", type: "numeric", price: 6000, normalValue: "" },
    { name: "Triglycerides", min: 50, max: 150, unit: "mg/dL", type: "numeric", price: 6000, normalValue: "" },
    { name: "White Blood Cells (WBC)", min: 4000, max: 11000, unit: "/cumm", type: "numeric", price: 4000, normalValue: "" },
    { name: "Red Blood Cells (RBC)", min: 4.5, max: 5.9, unit: "million/cumm", type: "numeric", price: 4000, normalValue: "" },
    { name: "Platelets Count", min: 150000, max: 450000, unit: "/cumm", type: "numeric", price: 4000, normalValue: "" }
];

const DEFAULT_LAB_INFO = {
    name: "مختبر النخبة التخصصي للتحليلات الطبية",
    logo: "", // Empty will use default microscope icon
    address: "العراق - بغداد - المنصور - تقاطع الرواد",
    phones: "07701234567 / 07801234567",
    email: "info@clinicallab.com"
};

// --- Application State ---
let state = {
    patients: {},       // Keyed by patientId
    testTypes: [],      // Array of available test configurations
    labInfo: {},        // Laboratory settings (name, logo, address, phones, email)
    editingTestIndex: null, // Index of the test being edited
    currentVisit: {
        patientId: "",
        name: "",
        phone: "",
        gender: "",
        age: "",
        testId: "",
        date: "",
        tests: []       // { name, min, max, type, price, normalValue, unit, value, isAbnormal }
    },
    selectedTestType: null, // Currently selected test type in dropdown
    colorSettings: {},  // Customizable print colors settings
    profiles: []        // Lab test profiles (e.g. LFT, KFT)
};

const DEFAULT_COLOR_SETTINGS = {
    normal: { color: "green", opacity: 15 },
    high: { color: "red", opacity: 15 },
    low: { color: "blue", opacity: 15 }
};

const COLOR_MAP = {
    red: "220, 38, 38",
    yellow: "217, 119, 6",
    blue: "37, 99, 235",
    green: "5, 150, 105"
};

// --- DOM Elements ---
const DOM = {
    // Navigation
    navBtns: document.querySelectorAll('.nav-btn'),
    tabs: document.querySelectorAll('.tab-content'),
    
    // Data Entry Form
    patientSearchInput: document.getElementById('patient-search-input'),
    patientSearchResults: document.getElementById('patient-search-results'),
    patientId: document.getElementById('patient-id'),
    patientName: document.getElementById('patient-name'),
    patientGender: document.getElementById('patient-gender'),
    patientAge: document.getElementById('patient-age'),
    testId: document.getElementById('test-id'),
    testDate: document.getElementById('test-date'),
    testCount: document.getElementById('test-count'),
    btnClearPatient: document.getElementById('btn-clear-patient'),
    patientPhone: document.getElementById('patient-phone'),
    
    // Custom Dropdown Select
    testSelectTrigger: document.getElementById('test-select-trigger'),
    testSelectLabel: document.getElementById('test-select-label'),
    testSelectDropdown: document.getElementById('test-select-dropdown'),
    testSearchFilter: document.getElementById('test-search-filter'),
    testOptionsList: document.getElementById('test-options-list'),
    testResultValue: document.getElementById('test-result-value'),
    testSelectedUnit: document.getElementById('test-selected-unit'),
    btnAddTest: document.getElementById('btn-add-test'),
    currentTestsTable: document.getElementById('current-tests-table'),
    btnSavePrint: document.getElementById('btn-save-print'),
    btnSendWhatsapp: document.getElementById('btn-send-whatsapp'),
    
    // Patient History Tab
    historySearchInput: document.getElementById('history-search-input'),
    historyPatientsTable: document.getElementById('history-patients-table'),
    patientDetailCard: document.getElementById('patient-detail-card'),
    detailPatientName: document.getElementById('detail-patient-name'),
    detailPatientId: document.getElementById('detail-patient-id'),
    detailPatientGender: document.getElementById('detail-patient-gender'),
    detailPatientAge: document.getElementById('detail-patient-age'),
    patientVisitsTimeline: document.getElementById('patient-visits-timeline'),
    btnCloseDetails: document.getElementById('btn-close-details'),
    
    // Settings Tab
    labSettingsForm: document.getElementById('lab-settings-form'),
    settingsLabName: document.getElementById('settings-lab-name'),
    settingsLabLogo: document.getElementById('settings-lab-logo'),
    logoPreviewImg: document.getElementById('logo-preview-img'),
    logoPreviewPlaceholder: document.getElementById('logo-preview-placeholder'),
    settingsLabAddress: document.getElementById('settings-lab-address'),
    settingsLabPhones: document.getElementById('settings-lab-phones'),
    settingsLabEmail: document.getElementById('settings-lab-email'),
    
    addTestTypeForm: document.getElementById('add-test-type-form'),
    newTestName: document.getElementById('new-test-name'),
    newTestMin: document.getElementById('new-test-min'),
    newTestMax: document.getElementById('new-test-max'),
    newTestUnit: document.getElementById('new-test-unit'),
    btnSubmitTestType: document.getElementById('btn-submit-test-type'),
    btnCancelEditTest: document.getElementById('btn-cancel-edit-test'),
    allTestsTable: document.getElementById('all-tests-table'),
    
    // Sidebar dynamic items
    sidebarLabName: document.getElementById('sidebar-lab-name'),
    sidebarLogoContainer: document.getElementById('sidebar-logo-container'),
    
    // Print layout DOM
    printLogo: document.getElementById('print-logo'),
    printLabName: document.getElementById('print-lab-name'),
    printLabAddress: document.getElementById('print-lab-address'),
    printLabPhones: document.getElementById('print-lab-phones'),
    printPatientName: document.getElementById('print-patient-name'),
    printPatientDate: document.getElementById('print-patient-date'),
    printPatientAge: document.getElementById('print-patient-age'),
    printPatientIdVal: document.getElementById('print-patient-id-val'),
    printPatientGender: document.getElementById('print-patient-gender'),
    printPatientTestId: document.getElementById('print-patient-test-id'),
    printResultsTableBody: document.getElementById('print-results-table-body'),
    printLabEmail: document.getElementById('print-lab-email'),
    
    // Alert Notification container
    alertContainer: document.getElementById('alert-container')
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadTestTypes();
    loadPatients();
    loadProfiles();
    initForm();
    initDashboard();
    setupEventListeners();
    syncWithFirebase();
});

// --- Core Helper Functions ---

// Show popup notification alert
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert-message ${type}`;
    
    let iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-times-circle';
    if (type === 'warning') iconClass = 'fa-exclamation-circle';
    
    alertDiv.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <span>${message}</span>
    `;
    
    DOM.alertContainer.appendChild(alertDiv);
    
    // Fade out and remove
    setTimeout(() => {
        alertDiv.style.opacity = '0';
        alertDiv.style.transform = 'translateX(-20px)';
        setTimeout(() => {
            alertDiv.remove();
        }, 300);
    }, 3500);
}

// Generate Date String YYYY-MM-DD
function getTodayDateString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// Load configurations from LocalStorage
function loadSettings() {
    const storedLabInfo = localStorage.getItem('lab_info');
    try {
        if (storedLabInfo) {
            state.labInfo = JSON.parse(storedLabInfo);
        } else {
            state.labInfo = { ...DEFAULT_LAB_INFO };
            localStorage.setItem('lab_info', JSON.stringify(state.labInfo));
        }
    } catch (e) {
        console.error("Error parsing lab_info settings, resetting to default:", e);
        state.labInfo = { ...DEFAULT_LAB_INFO };
    }
    
    // Populate settings form
    DOM.settingsLabName.value = state.labInfo.name || '';
    DOM.settingsLabAddress.value = state.labInfo.address || '';
    DOM.settingsLabPhones.value = state.labInfo.phones || '';
    DOM.settingsLabEmail.value = state.labInfo.email || '';
    
    // Update Sidebar & Print headers
    updateLabUI();
    
    // Load print colors
    loadColorSettings();
}

function updateLabUI() {
    DOM.sidebarLabName.textContent = state.labInfo.name;
    DOM.printLabName.textContent = state.labInfo.name;
    DOM.printLabAddress.textContent = `العنوان: ${state.labInfo.address}`;
    DOM.printLabPhones.textContent = `الهاتف: ${state.labInfo.phones}`;
    if(DOM.printLabEmail) DOM.printLabEmail.textContent = state.labInfo.email || '';
    
    const printLogoPlaceholder = document.getElementById('print-logo-placeholder');
    const watermark = document.getElementById('print-watermark');
    
    if (state.labInfo.logo) {
        // Render logo
        DOM.sidebarLogoContainer.innerHTML = `<img src="${state.labInfo.logo}" alt="Logo">`;
        DOM.logoPreviewImg.src = state.labInfo.logo;
        DOM.logoPreviewImg.classList.remove('hidden');
        DOM.logoPreviewPlaceholder.classList.add('hidden');
        DOM.printLogo.src = state.labInfo.logo;
        DOM.printLogo.style.display = 'block';
        if (printLogoPlaceholder) printLogoPlaceholder.style.display = 'none';
        if (watermark) watermark.style.backgroundImage = `url(${state.labInfo.logo})`;
    } else {
        DOM.sidebarLogoContainer.innerHTML = `<i class="fa-solid fa-microscope logo-icon"></i>`;
        DOM.logoPreviewImg.classList.add('hidden');
        DOM.logoPreviewPlaceholder.classList.remove('hidden');
        DOM.printLogo.style.display = 'none';
        if (printLogoPlaceholder) printLogoPlaceholder.style.display = 'flex';
        if (watermark) watermark.style.backgroundImage = 'none';
    }
}

// Load test types from LocalStorage
function loadTestTypes() {
    const storedTestTypes = localStorage.getItem('lab_test_types');
    try {
        if (storedTestTypes) {
            state.testTypes = JSON.parse(storedTestTypes);
            // Map missing fields for backward compatibility
            state.testTypes = state.testTypes.map(t => {
                return {
                    ...t,
                    type: t.type || "numeric",
                    price: t.price || 5000,
                    normalValue: t.normalValue || ""
                };
            });
        } else {
            state.testTypes = [ ...DEFAULT_TEST_TYPES ];
            localStorage.setItem('lab_test_types', JSON.stringify(state.testTypes));
        }
    } catch (e) {
        console.error("Error parsing lab_test_types, resetting to default:", e);
        state.testTypes = [ ...DEFAULT_TEST_TYPES ];
    }
    
    // Refresh Test list and dropdown selections
    renderTestTypesTable();
    populateTestSelectOptions();
    if (typeof renderProfileTestsCheckboxes === 'function') {
        renderProfileTestsCheckboxes();
    }
}

// Load patients database from LocalStorage
function loadPatients() {
    const storedPatients = localStorage.getItem('lab_patients');
    try {
        if (storedPatients) {
            state.patients = JSON.parse(storedPatients);
        } else {
            state.patients = {};
            localStorage.setItem('lab_patients', JSON.stringify(state.patients));
        }
    } catch (e) {
        console.error("Error parsing lab_patients, resetting to empty:", e);
        state.patients = {};
    }
    
    renderPatientsHistoryTable();
}

// Auto-generate Patient & Visit/Test IDs
function generateNewPatientId() {
    let maxNum = 1000;
    Object.keys(state.patients).forEach(id => {
        const num = parseInt(id.replace('P-', ''));
        if (!isNaN(num) && num > maxNum) {
            maxNum = num;
        }
    });
    return `P-${maxNum + 1}`;
}

function generateNewTestId() {
    let maxNum = 5000;
    // Iterate over all patients and check visits
    Object.values(state.patients).forEach(patient => {
        if (patient.visits) {
            patient.visits.forEach(visit => {
                const num = parseInt(visit.testId.replace('L-', ''));
                if (!isNaN(num) && num > maxNum) {
                    maxNum = num;
                }
            });
        }
    });
    return `L-${maxNum + 1}`;
}

// Initialize active Data Entry visit form
function initForm(existingPatient = null) {
    if (existingPatient) {
        state.currentVisit.patientId = existingPatient.patientId;
        state.currentVisit.name = existingPatient.name;
        state.currentVisit.phone = existingPatient.phone || "";
        state.currentVisit.gender = existingPatient.gender;
        state.currentVisit.age = existingPatient.age;
        
        DOM.patientId.value = existingPatient.patientId;
        DOM.patientName.value = existingPatient.name;
        DOM.patientPhone.value = existingPatient.phone || "";
        DOM.patientGender.value = existingPatient.gender;
        DOM.patientAge.value = existingPatient.age;
        
        showAlert(`تم تحميل بيانات المراجع: ${existingPatient.name}`);
        
        // Show his history timeline at the bottom of the data entry card as helper if returning
        showPatientPastVisits(existingPatient.patientId);
    } else {
        state.currentVisit.patientId = generateNewPatientId();
        state.currentVisit.name = "";
        state.currentVisit.phone = "";
        state.currentVisit.gender = "";
        state.currentVisit.age = "";
        
        DOM.patientId.value = state.currentVisit.patientId;
        DOM.patientName.value = "";
        DOM.patientPhone.value = "";
        DOM.patientGender.value = "";
        DOM.patientAge.value = "";
        
        // Remove patient suggestions if shown
        DOM.patientSearchResults.classList.add('hidden');
    }
    
    state.currentVisit.testId = generateNewTestId();
    state.currentVisit.date = getTodayDateString();
    state.currentVisit.tests = [];
    
    DOM.testId.value = state.currentVisit.testId;
    DOM.testDate.value = state.currentVisit.date;
    DOM.testCount.value = "0";
    DOM.patientSearchInput.value = "";
    
    // Clear Selected Test
    resetTestSelection();
    
    // Refresh Table
    renderCurrentTestsTable();
}

function resetTestSelection() {
    state.selectedTestType = null;
    DOM.testSelectLabel.textContent = "ابحث واختر التحليل...";
    DOM.testResultValue.value = "";
    DOM.testSelectedUnit.textContent = "-";
    
    // Deselect all dropdown list items
    const selectedLi = DOM.testOptionsList.querySelector('li.selected');
    if (selectedLi) selectedLi.classList.remove('selected');
}

// --- Setup Event Listeners ---
function setupEventListeners() {
    // Navigation Tabs Switching
    DOM.navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            DOM.navBtns.forEach(b => b.classList.remove('active'));
            DOM.tabs.forEach(t => t.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`tab-${targetTab}`).classList.add('active');
            
            // Refresh lists if switching
            if (targetTab === 'dashboard') {
                initDashboard();
            } else if (targetTab === 'patients-history') {
                renderPatientsHistoryTable();
                DOM.patientDetailCard.classList.add('hidden');
            } else if (targetTab === 'settings') {
                renderTestTypesTable();
                renderProfilesTable();
                renderProfileTestsCheckboxes();
            }
        });
    });
    
    // Clear / Reset patient form button
    DOM.btnClearPatient.addEventListener('click', () => {
        initForm();
        showAlert("تم إفراغ استمارة التسجيل", "warning");
    });
    
    // Custom Dropdown Open/Close
    DOM.testSelectTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        DOM.testSelectDropdown.classList.toggle('hidden');
        if (!DOM.testSelectDropdown.classList.contains('hidden')) {
            DOM.testSearchFilter.focus();
            filterDropdownOptions();
        }
    });
    
    // Search input inside Custom Dropdown
    DOM.testSearchFilter.addEventListener('input', () => {
        filterDropdownOptions();
    });
    
    // Hide dropdowns when clicking outside
    document.addEventListener('click', () => {
        DOM.testSelectDropdown.classList.add('hidden');
        DOM.patientSearchResults.classList.add('hidden');
    });
    
    // Prevent dropdown closing when clicking inside
    DOM.testSelectDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Add Test to active visit table
    DOM.btnAddTest.addEventListener('click', addTestToCurrentVisit);
    
    // Allow pressing "Enter" on result value input to add test
    DOM.testResultValue.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTestToCurrentVisit();
        }
    });
    
    // Save Visit details & Print Report
    DOM.btnSavePrint.addEventListener('click', printAndSaveCurrentVisit);
    
    // Send Report PDF via WhatsApp
    DOM.btnSendWhatsapp.addEventListener('click', () => {
        openWhatsAppModal(null, null, true);
    });
    
    // Profile selector change listener in Data Entry
    const profileDropdown = document.getElementById('profile-select-dropdown');
    if (profileDropdown) {
        profileDropdown.addEventListener('change', () => {
            const profileName = profileDropdown.value;
            if (!profileName) return;
            
            const profile = state.profiles.find(p => p.name === profileName);
            if (profile) {
                openProfileInputModal(profile);
            }
            profileDropdown.value = "";
        });
    }
    
    // Settings profile form submit
    const profileForm = document.getElementById('add-profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addNewProfile();
        });
    }
    
    // New test type selector change listener (numeric vs text fields visibility)
    const testTypeSelect = document.getElementById('new-test-type');
    if (testTypeSelect) {
        testTypeSelect.addEventListener('change', () => {
            const isText = (testTypeSelect.value === 'text');
            const gMin = document.getElementById('group-new-test-min');
            const gMax = document.getElementById('group-new-test-max');
            const gNormalVal = document.getElementById('group-new-test-normal-val');
            
            if (isText) {
                if (gMin) gMin.classList.add('hidden');
                if (gMax) gMax.classList.add('hidden');
                if (gNormalVal) gNormalVal.classList.remove('hidden');
            } else {
                if (gMin) gMin.classList.remove('hidden');
                if (gMax) gMax.classList.remove('hidden');
                if (gNormalVal) gNormalVal.classList.add('hidden');
            }
        });
    }
    
    // Colors customization settings range sliders text updates
    const normalRange = document.getElementById('opacity-normal-range');
    const highRange = document.getElementById('opacity-high-range');
    const lowRange = document.getElementById('opacity-low-range');
    
    if (normalRange) {
        normalRange.addEventListener('input', () => {
            document.getElementById('opacity-normal-val').textContent = normalRange.value + '%';
        });
    }
    if (highRange) {
        highRange.addEventListener('input', () => {
            document.getElementById('opacity-high-val').textContent = highRange.value + '%';
        });
    }
    if (lowRange) {
        lowRange.addEventListener('input', () => {
            document.getElementById('opacity-low-val').textContent = lowRange.value + '%';
        });
    }
    
    const colorsForm = document.getElementById('print-colors-settings-form');
    if (colorsForm) {
        colorsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveColorSettings();
        });
    }
    
    // Patient Search Autocomplete logic
    DOM.patientSearchInput.addEventListener('input', () => {
        const query = DOM.patientSearchInput.value.trim().toLowerCase();
        if (query.length < 1) {
            DOM.patientSearchResults.classList.add('hidden');
            return;
        }
        
        const suggestions = Object.values(state.patients).filter(patient => 
            patient.name.toLowerCase().includes(query) || 
            patient.patientId.toLowerCase().includes(query)
        );
        
        if (suggestions.length === 0) {
            DOM.patientSearchResults.classList.add('hidden');
            return;
        }
        
        DOM.patientSearchResults.innerHTML = "";
        suggestions.forEach(patient => {
            const item = document.createElement('div');
            item.className = 'search-suggestion-item';
            item.innerHTML = `${patient.name} <span>(رقم: ${patient.patientId} - العمر: ${patient.age})</span>`;
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                initForm(patient);
            });
            DOM.patientSearchResults.appendChild(item);
        });
        
        DOM.patientSearchResults.classList.remove('hidden');
    });
    
    // Lab settings form submit
    DOM.labSettingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveLabSettings();
    });
    
    // Lab settings Logo Uploader Change
    DOM.settingsLabLogo.addEventListener('change', handleLogoUpload);
    
    // Add Test Parameter form submit
    DOM.addTestTypeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addNewTestType();
    });
    
    DOM.btnCancelEditTest.addEventListener('click', cancelEditTestType);
    
    // Patient History search filter
    DOM.historySearchInput.addEventListener('input', () => {
        renderPatientsHistoryTable();
    });
    
    // History Close Details
    DOM.btnCloseDetails.addEventListener('click', () => {
        DOM.patientDetailCard.classList.add('hidden');
    });
}

// --- Searchable Dropdown Logics ---

function populateTestSelectOptions() {
    DOM.testOptionsList.innerHTML = "";
    state.testTypes.forEach((test, idx) => {
        const li = document.createElement('li');
        let rangeStr = "";
        if (test.type === "text") {
            rangeStr = `نصي: ${test.normalValue || 'Negative'}`;
        } else {
            rangeStr = `${test.min} - ${test.max} ${test.unit}`;
        }
        li.textContent = `${test.name} (${rangeStr})`;
        li.dataset.index = idx;
        
        li.addEventListener('click', () => {
            state.selectedTestType = test;
            DOM.testSelectLabel.textContent = test.name;
            DOM.testSelectedUnit.textContent = test.unit || '-';
            
            // Highlight selected
            DOM.testOptionsList.querySelectorAll('li').forEach(el => el.classList.remove('selected'));
            li.classList.add('selected');
            
            DOM.testSelectDropdown.classList.add('hidden');
            DOM.testResultValue.focus();
        });
        
        DOM.testOptionsList.appendChild(li);
    });
}

function filterDropdownOptions() {
    const filter = DOM.testSearchFilter.value.trim().toLowerCase();
    const lis = DOM.testOptionsList.querySelectorAll('li');
    lis.forEach(li => {
        const text = li.textContent.toLowerCase();
        if (text.includes(filter)) {
            li.style.display = 'block';
        } else {
            li.style.display = 'none';
        }
    });
}

// --- Core Features implementations ---

// Add a test to current active list
function addTestToCurrentVisit() {
    if (!state.selectedTestType) {
        showAlert("يرجى اختيار نوع التحليل أولاً", "error");
        return;
    }
    
    const resultValueText = DOM.testResultValue.value.trim();
    if (resultValueText === "") {
        showAlert("يرجى كتابة نتيجة التحليل الفعلي", "error");
        DOM.testResultValue.focus();
        return;
    }
    
    // Check if test was already added
    const isAlreadyAdded = state.currentVisit.tests.some(t => t.name === state.selectedTestType.name);
    if (isAlreadyAdded) {
        showAlert("تمت إضافة هذا الفحص مسبقاً لهذه الزيارة", "warning");
        return;
    }
    
    // Evaluate if the result value is within normal limits
    let isAbnormal = false;
    const type = state.selectedTestType.type || "numeric";
    
    if (type === "numeric") {
        const numericValue = parseFloat(resultValueText);
        if (!isNaN(numericValue)) {
            if (numericValue < state.selectedTestType.min || numericValue > state.selectedTestType.max) {
                isAbnormal = true;
            }
        }
    } else {
        const normalVal = state.selectedTestType.normalValue || "Negative";
        if (resultValueText.toLowerCase().trim() !== normalVal.toLowerCase().trim()) {
            isAbnormal = true;
        }
    }
    
    const testItem = {
        name: state.selectedTestType.name,
        min: state.selectedTestType.min,
        max: state.selectedTestType.max,
        type: type,
        price: state.selectedTestType.price || 0,
        normalValue: state.selectedTestType.normalValue || "",
        unit: state.selectedTestType.unit || "-",
        value: resultValueText,
        isAbnormal: isAbnormal
    };
    
    state.currentVisit.tests.push(testItem);
    DOM.testCount.value = state.currentVisit.tests.length;
    
    showAlert(`تمت إضافة الفحص: ${state.selectedTestType.name}`);
    
    // Reset selection inputs
    resetTestSelection();
    
    // Refresh visit tests table
    renderCurrentTestsTable();
    
    // Focus back on search trigger
    DOM.testSelectTrigger.click();
}

// Render active visit tests list
function renderCurrentTestsTable() {
    const tbody = DOM.currentTestsTable.querySelector('tbody');
    tbody.innerHTML = "";
    
    if (state.currentVisit.tests.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="6" class="text-center">لا توجد تحاليل مضافة بعد. اختر تحليلاً من الأعلى.</td>
            </tr>
        `;
        updateCurrentVisitTotalCost();
        return;
    }
    
    state.currentVisit.tests.forEach((test, index) => {
        const tr = document.createElement('tr');
        
        const statusBadge = test.isAbnormal 
            ? `<span class="status-badge abnormal"><i class="fa-solid fa-arrow-trend-up"></i> غير طبيعي</span>`
            : `<span class="status-badge normal"><i class="fa-solid fa-circle-check"></i> طبيعي</span>`;
            
        let rangeStr = "";
        if (test.type === "text") {
            rangeStr = `نصي (${test.normalValue || 'Negative'})`;
        } else {
            rangeStr = `${test.min} - ${test.max}`;
        }
        
        tr.innerHTML = `
            <td><strong>${test.name}</strong></td>
            <td dir="ltr">${rangeStr}</td>
            <td class="${test.isAbnormal ? 'text-blue' : ''}" style="font-weight: 700;">${test.value}</td>
            <td>${test.unit || '-'}</td>
            <td>${statusBadge}</td>
            <td>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteTestFromCurrentVisit(${index})">
                    <i class="fa-solid fa-trash-can"></i> حذف
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    updateCurrentVisitTotalCost();
}

function updateCurrentVisitTotalCost() {
    const total = state.currentVisit.tests.reduce((sum, t) => sum + (t.price || 0), 0);
    const badge = document.getElementById('current-visit-total-cost');
    if (badge) {
        badge.textContent = total.toLocaleString();
    }
}

// Delete test from current visit list (called via inline onclick)
window.deleteTestFromCurrentVisit = function(index) {
    state.currentVisit.tests.splice(index, 1);
    DOM.testCount.value = state.currentVisit.tests.length;
    renderCurrentTestsTable();
    showAlert("تم حذف التحليل من الزيارة الحالية", "warning");
};

// Handle Settings Lab Logo Upload
function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 1024 * 1024) {
        showAlert("حجم الشعار كبير جداً. يجب أن يكون أقل من 1 ميجابايت", "error");
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Image = e.target.result;
        DOM.logoPreviewImg.src = base64Image;
        DOM.logoPreviewImg.classList.remove('hidden');
        DOM.logoPreviewPlaceholder.classList.add('hidden');
        
        // Temporarily store base64 in state. Save occurs when submit form
        state.labInfo.logo = base64Image;
    };
    reader.readAsDataURL(file);
}

// Save Lab settings
function saveLabSettings() {
    state.labInfo.name = DOM.settingsLabName.value.trim();
    state.labInfo.address = DOM.settingsLabAddress.value.trim();
    state.labInfo.phones = DOM.settingsLabPhones.value.trim();
    state.labInfo.email = DOM.settingsLabEmail.value.trim();
    
    localStorage.setItem('lab_info', JSON.stringify(state.labInfo));
    updateLabUI();
    showAlert("تم حفظ إعدادات المختبر بنجاح");

    // Sync to Firebase
    if (db) {
        db.collection('settings').doc('lab_info').set(state.labInfo)
            .catch(err => console.error("Firebase save lab_info error:", err));
    }
}

// Add or Update custom test definition
function addNewTestType() {
    const name = DOM.newTestName.value.trim();
    const type = document.getElementById('new-test-type').value;
    const priceInput = document.getElementById('new-test-price');
    const price = priceInput ? (parseInt(priceInput.value) || 0) : 0;
    const unit = DOM.newTestUnit.value.trim();
    
    let min = 0;
    let max = 0;
    let normalValue = "";
    
    if (type === 'text') {
        normalValue = document.getElementById('new-test-normal-val').value.trim();
        if (!normalValue) {
            showAlert("يرجى إدخال القيمة الطبيعية للفحص النصي", "error");
            return;
        }
    } else {
        min = parseFloat(DOM.newTestMin.value);
        max = parseFloat(DOM.newTestMax.value);
        if (isNaN(min) || isNaN(max)) {
            showAlert("يرجى إدخال قيم الحد الأدنى والأعلى الطبيعي", "error");
            return;
        }
    }
    
    const isEditing = state.editingTestIndex !== null;
    
    const exists = state.testTypes.some((t, idx) => {
        return t.name.toLowerCase() === name.toLowerCase() && (!isEditing || idx !== state.editingTestIndex);
    });
    
    if (exists) {
        showAlert("هذا التحليل مسجل بالفعل في النظام", "warning");
        return;
    }
    
    const testData = { name, type, min, max, normalValue, unit, price };
    
    if (isEditing) {
        state.testTypes[state.editingTestIndex] = testData;
        showAlert("تم تحديث الفحص بنجاح");
        cancelEditTestType();
    } else {
        state.testTypes.push(testData);
        showAlert("تم إدراج التحليل الجديد بنجاح ويمكنك استخدامه الآن");
        
        DOM.newTestName.value = "";
        DOM.newTestMin.value = "";
        DOM.newTestMax.value = "";
        document.getElementById('new-test-normal-val').value = "";
        DOM.newTestUnit.value = "";
        const priceInputEl = document.getElementById('new-test-price');
        if (priceInputEl) priceInputEl.value = "";
    }
    
    localStorage.setItem('lab_test_types', JSON.stringify(state.testTypes));
    
    // Refresh UI
    renderTestTypesTable();
    populateTestSelectOptions();
    renderProfileTestsCheckboxes();

    // Sync to Firebase
    if (db) {
        db.collection('settings').doc('test_types').set({ list: state.testTypes })
            .catch(err => console.error("Firebase save test_types error:", err));
    }
}

window.editTestType = function(index) {
    const test = state.testTypes[index];
    state.editingTestIndex = index;
    
    DOM.newTestName.value = test.name;
    const typeSelect = document.getElementById('new-test-type');
    typeSelect.value = test.type || 'numeric';
    typeSelect.dispatchEvent(new Event('change'));
    
    if (test.type === 'text') {
        document.getElementById('new-test-normal-val').value = test.normalValue || '';
    } else {
        DOM.newTestMin.value = test.min || '';
        DOM.newTestMax.value = test.max || '';
    }
    
    DOM.newTestUnit.value = test.unit || '';
    const priceInputEl = document.getElementById('new-test-price');
    if (priceInputEl) priceInputEl.value = test.price || 0;
    
    // Change UI state to editing
    DOM.btnSubmitTestType.querySelector('span').textContent = "حفظ التعديلات";
    DOM.btnCancelEditTest.classList.remove('hidden');
    DOM.newTestName.focus();
};

function cancelEditTestType() {
    state.editingTestIndex = null;
    
    DOM.newTestName.value = "";
    DOM.newTestMin.value = "";
    DOM.newTestMax.value = "";
    document.getElementById('new-test-normal-val').value = "";
    DOM.newTestUnit.value = "";
    const priceInputEl = document.getElementById('new-test-price');
    if (priceInputEl) priceInputEl.value = "";
    
    const typeSelect = document.getElementById('new-test-type');
    typeSelect.value = 'numeric';
    typeSelect.dispatchEvent(new Event('change'));
    
    DOM.btnSubmitTestType.querySelector('span').textContent = "إضافة التحليل إلى القائمة";
    DOM.btnCancelEditTest.classList.add('hidden');
}

// Render tests directory table in settings
function renderTestTypesTable() {
    const tbody = DOM.allTestsTable.querySelector('tbody');
    tbody.innerHTML = "";
    
    if (state.testTypes.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="4" class="text-center">لا توجد فحوصات مضافة بالنظام.</td>
            </tr>
        `;
        return;
    }
    
    state.testTypes.forEach((test, idx) => {
        const tr = document.createElement('tr');
        let rangeStr = "";
        if (test.type === "text") {
            rangeStr = `نصي (${test.normalValue || 'Negative'})`;
        } else {
            rangeStr = `${test.min} - ${test.max}`;
        }
        
        tr.innerHTML = `
            <td><strong>${test.name}</strong></td>
            <td dir="ltr">${rangeStr}</td>
            <td>${test.unit || '-'}</td>
            <td style="display: flex; gap: 5px;">
                <button type="button" title="تعديل" class="btn btn-sm btn-outline-primary" onclick="editTestType(${idx})">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button type="button" title="حذف" class="btn btn-sm btn-outline-danger" onclick="deleteTestType(${idx})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Delete test definition (called via inline onclick)
window.deleteTestType = function(index) {
    if (confirm("هل أنت متأكد من حذف هذا التحليل نهائياً من النظام؟ لن يظهر في القوائم بعد الآن.")) {
        state.testTypes.splice(index, 1);
        localStorage.setItem('lab_test_types', JSON.stringify(state.testTypes));
        renderTestTypesTable();
        populateTestSelectOptions();
        showAlert("تم حذف نوع التحليل من النظام", "warning");

        // Sync to Firebase
        if (db) {
            db.collection('settings').doc('test_types').set({ list: state.testTypes })
                .catch(err => console.error("Firebase save test_types error:", err));
        }
    }
};

// --- Save & Printing Operations ---

function printAndSaveCurrentVisit() {
    const patientName = DOM.patientName.value.trim();
    const patientPhone = DOM.patientPhone.value.trim();
    const patientGender = DOM.patientGender.value;
    const patientAge = DOM.patientAge.value.trim();
    
    // Validation
    if (!patientName) {
        showAlert("يرجى إدخال اسم المراجع", "error");
        DOM.patientName.focus();
        return;
    }
    
    if (!patientPhone) {
        showAlert("يرجى إدخال رقم هاتف المراجع للواتساب", "error");
        DOM.patientPhone.focus();
        return;
    }
    
    if (!patientGender) {
        showAlert("يرجى اختيار جنس المراجع", "error");
        DOM.patientGender.focus();
        return;
    }
    
    if (!patientAge) {
        showAlert("يرجى إدخال عمر المراجع", "error");
        DOM.patientAge.focus();
        return;
    }
    
    if (state.currentVisit.tests.length === 0) {
        showAlert("يرجى إضافة فحص طبي واحد على الأقل للمراجع", "error");
        return;
    }
    
    // Save details to Database
    saveActiveVisit();
    
    const patientId = DOM.patientId.value;
    const testId = DOM.testId.value;
    const patient = state.patients[patientId];
    const visit = patient.visits.find(v => v.testId === testId);
    
    // --- Compile Print Layout ---
    compilePrintTemplate(patient, visit);
    
    // Trigger Print
    document.body.classList.add('printing-report');
    window.print();
    setTimeout(() => {
        document.body.classList.remove('printing-report');
    }, 500);
    
    // Show success alert
    showAlert("تم حفظ بيانات المراجع وزيارته، جاري الطباعة...");
    
    // Re-initialize/Reset the form for the next patient
    initForm();
    
    // Refresh history
    renderPatientsHistoryTable();
}

// --- Patient History Logics ---

function renderPatientsHistoryTable() {
    const tbody = DOM.historyPatientsTable.querySelector('tbody');
    tbody.innerHTML = "";
    
    const filter = DOM.historySearchInput.value.trim().toLowerCase();
    const patientList = Object.values(state.patients);
    
    // Filter patients based on search
    const filteredList = patientList.filter(patient => 
        patient.name.toLowerCase().includes(filter) ||
        patient.patientId.toLowerCase().includes(filter)
    );
    
    if (filteredList.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="6" class="text-center">لا توجد سجلات مطابقة للبحث.</td>
            </tr>
        `;
        return;
    }
    
    filteredList.forEach(patient => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${patient.patientId}</strong></td>
            <td>${patient.name}</td>
            <td>${patient.gender}</td>
            <td>${patient.age} سنة</td>
            <td><span class="badge" style="background-color: var(--primary-light); color: var(--primary);">${patient.visits.length} زيارات</span></td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-sm btn-primary" onclick="showPatientPastVisits('${patient.patientId}')">
                        <i class="fa-solid fa-clock-rotate-left"></i> السجل
                    </button>
                    <button class="btn btn-sm btn-success" onclick="startNewVisitForPatient('${patient.patientId}')">
                        <i class="fa-solid fa-plus"></i> زيارة جديدة
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Start new visit for a returning patient (called via inline onclick)
window.startNewVisitForPatient = function(patientId) {
    const patient = state.patients[patientId];
    if (patient) {
        initForm(patient);
        // Switch tab to Data Entry
        DOM.navBtns[0].click(); 
    }
};

// Show patient previous history timeline (both in registry details view and data entry bottom)
window.showPatientPastVisits = function(patientId) {
    const patient = state.patients[patientId];
    if (!patient) return;
    
    // Setup Header info
    DOM.detailPatientName.textContent = patient.name;
    DOM.detailPatientId.textContent = patient.patientId;
    document.getElementById('detail-patient-phone').textContent = patient.phone || "غير مسجل";
    DOM.detailPatientGender.textContent = patient.gender;
    DOM.detailPatientAge.textContent = patient.age;
    
    // Timeline element compilation
    DOM.patientVisitsTimeline.innerHTML = "";
    
    if (!patient.visits || patient.visits.length === 0) {
        DOM.patientVisitsTimeline.innerHTML = "<p class='text-center text-muted'>لا توجد زيارات سابقة مسجلة.</p>";
    } else {
        // Render timeline backwards (most recent visit first)
        const reversedVisits = [ ...patient.visits ].reverse();
        
        reversedVisits.forEach(visit => {
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            
            // Build visit tests subtable
            let testRowsHtml = "";
            visit.tests.forEach(test => {
                const statusBadge = test.isAbnormal 
                    ? `<span class="status-badge abnormal"><i class="fa-solid fa-arrow-trend-up"></i> غير طبيعي</span>`
                    : `<span class="status-badge normal"><i class="fa-solid fa-circle-check"></i> طبيعي</span>`;
                
                let rangeStr = "";
                if (test.type === "text") {
                    rangeStr = `نصي (${test.normalValue || 'Negative'})`;
                } else {
                    rangeStr = `${test.min} - ${test.max}`;
                }
                
                testRowsHtml += `
                    <tr>
                        <td><strong>${test.name}</strong></td>
                        <td dir="ltr">${rangeStr}</td>
                        <td style="font-weight: 700;" class="${test.isAbnormal ? 'text-blue' : ''}">${test.value}</td>
                        <td>${test.unit || '-'}</td>
                        <td>${statusBadge}</td>
                    </tr>
                `;
            });
            
            timelineItem.innerHTML = `
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" class="visit-compare-checkbox hidden" data-visit-id="${visit.testId}">
                            <span class="timeline-title"><i class="fa-solid fa-file-medical"></i> زيارة رقم الفحص: ${visit.testId}</span>
                        </div>
                        <span class="timeline-date"><i class="fa-solid fa-calendar-days"></i> تاريخ الفحص: ${visit.date}</span>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>اسم التحليل</th>
                                    <th>الرنج الطبيعي</th>
                                    <th>الرنج الفعلي</th>
                                    <th>الوحدة</th>
                                    <th>الحالة</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${testRowsHtml}
                            </tbody>
                        </table>
                    </div>
                    <div style="display: flex; justify-content: flex-end; margin-top: 0.5rem; gap: 8px;">
                        <button class="btn btn-sm btn-outline-success" onclick="openWhatsAppModal('${patientId}', '${visit.testId}', false)">
                            <i class="fa-brands fa-whatsapp"></i> إرسال عبر الواتساب
                        </button>
                        <button class="btn btn-sm btn-outline-primary" onclick="reprintPastVisit('${patientId}', '${visit.testId}')">
                            <i class="fa-solid fa-print"></i> إعادة طباعة الفحص
                        </button>
                    </div>
                </div>
            `;
            DOM.patientVisitsTimeline.appendChild(timelineItem);
        });
    }
    
    // Show detail card
    DOM.patientDetailCard.classList.remove('hidden');
    
    // Setup comparison timeline logic
    setupCompareMode(patientId);
    
    // If in history tab, scroll to details
    DOM.patientDetailCard.scrollIntoView({ behavior: 'smooth' });
};

// Reprint a past visit report (called via inline onclick from timeline)
window.reprintPastVisit = function(patientId, testId) {
    const patient = state.patients[patientId];
    if (!patient) return;
    
    const visit = patient.visits.find(v => v.testId === testId);
    if (!visit) return;
    
    // --- Compile Print Layout ---
    compilePrintTemplate(patient, visit);
    
    // Trigger Print
    document.body.classList.add('printing-report');
    window.print();
    setTimeout(() => {
        document.body.classList.remove('printing-report');
    }, 500);
    
    showAlert(`جاري طباعة التقرير المعاد لرقم فحص: ${testId}`);
};

// --- New Custom Helper Functions ---

// Save Active Visit details in local state & LocalStorage
function saveActiveVisit() {
    const patientName = DOM.patientName.value.trim();
    const patientPhone = DOM.patientPhone.value.trim();
    const patientGender = DOM.patientGender.value;
    const patientAge = DOM.patientAge.value.trim();
    const patientId = DOM.patientId.value;
    const testId = DOM.testId.value;
    const date = DOM.testDate.value;
    
    const totalCost = state.currentVisit.tests.reduce((sum, t) => sum + (t.price || 0), 0);
    
    if (!state.patients[patientId]) {
        state.patients[patientId] = {
            patientId: patientId,
            name: patientName,
            phone: patientPhone,
            gender: patientGender,
            age: parseInt(patientAge),
            visits: []
        };
    } else {
        state.patients[patientId].name = patientName;
        state.patients[patientId].phone = patientPhone;
        state.patients[patientId].gender = patientGender;
        state.patients[patientId].age = parseInt(patientAge);
    }
    
    const isAlreadySaved = state.patients[patientId].visits.some(v => v.testId === testId);
    if (!isAlreadySaved) {
        const visitRecord = {
            testId: testId,
            date: date,
            totalCost: totalCost,
            tests: [ ...state.currentVisit.tests ]
        };
        state.patients[patientId].visits.push(visitRecord);
    }
    
    localStorage.setItem('lab_patients', JSON.stringify(state.patients));

    // Sync to Firebase
    if (db) {
        db.collection('patients').doc(patientId).set(state.patients[patientId])
            .catch(err => console.error("Firebase save patient error:", err));
    }
}

// Compile data onto standard printing template HTML
function compilePrintTemplate(patient, visit) {
    DOM.printPatientName.textContent = patient.name;
    DOM.printPatientDate.textContent = visit.date;
    DOM.printPatientAge.textContent = `${patient.age} سنة`;
    DOM.printPatientIdVal.textContent = patient.patientId;
    DOM.printPatientGender.textContent = patient.gender;
    DOM.printPatientTestId.textContent = visit.testId;
    
    DOM.printResultsTableBody.innerHTML = "";
    visit.tests.forEach(test => {
        const tr = document.createElement('tr');
        
        let flag = "طبيعي";
        let flagClass = "flag-normal";
        
        if (test.isAbnormal) {
            const numericValue = parseFloat(test.value);
            if (!isNaN(numericValue)) {
                if (numericValue > test.max) {
                    flag = "مرتفع ⬆";
                    flagClass = "flag-high";
                } else if (numericValue < test.min) {
                    flag = "منخفض ⬇";
                    flagClass = "flag-low";
                } else {
                    flag = "غير طبيعي";
                    flagClass = "flag-abnormal";
                }
            } else {
                flag = "غير طبيعي";
                flagClass = "flag-abnormal";
            }
        }
        
        let resultStyle = "";
        if (test.isAbnormal) {
            const numericValue = parseFloat(test.value);
            if (!isNaN(numericValue)) {
                if (numericValue > test.max) {
                    resultStyle = "color: var(--print-color-high) !important;";
                } else if (numericValue < test.min) {
                    resultStyle = "color: var(--print-color-low) !important;";
                } else {
                    resultStyle = "color: var(--print-color-high) !important;";
                }
            } else {
                resultStyle = "color: var(--print-color-high) !important;";
            }
        } else {
            resultStyle = "color: var(--print-color-normal) !important;";
        }
        
        let rangeStr = "";
        if (test.type === "text") {
            rangeStr = `نصي (${test.normalValue || 'Negative'})`;
        } else {
            rangeStr = `${test.min} - ${test.max}`;
        }
        
        tr.innerHTML = `
            <td style="text-align: right;"><strong>${test.name}</strong></td>
            <td style="text-align: center; font-weight: 700; ${resultStyle}">${test.value}</td>
            <td class="print-flag-cell ${flagClass}" style="text-align: center; font-weight: 700;">${flag}</td>
            <td dir="ltr" style="text-align: center;">${rangeStr}</td>
            <td style="text-align: center;">${test.unit || '-'}</td>
        `;
        DOM.printResultsTableBody.appendChild(tr);
    });
}

// Open modal for WhatsApp Sharing
window.openWhatsAppModal = function(patientId, testId, isNewVisit = false) {
    let patient, visit;
    
    if (isNewVisit) {
        const patientName = DOM.patientName.value.trim();
        const patientPhone = DOM.patientPhone.value.trim();
        const patientGender = DOM.patientGender.value;
        const patientAge = DOM.patientAge.value.trim();
        
        if (!patientName || !patientPhone || !patientGender || !patientAge) {
            showAlert("يرجى ملء جميع بيانات المراجع قبل الإرسال", "error");
            return;
        }
        if (state.currentVisit.tests.length === 0) {
            showAlert("يرجى إضافة فحص واحد على الأقل للمراجع", "error");
            return;
        }
        
        // Save first
        saveActiveVisit();
        
        patient = state.patients[DOM.patientId.value];
        visit = patient.visits.find(v => v.testId === DOM.testId.value);
    } else {
        patient = state.patients[patientId];
        visit = patient.visits.find(v => v.testId === testId);
    }
    
    if (!patient || !visit) {
        showAlert("فشل تحميل بيانات التقرير للإرسال", "error");
        return;
    }
    
    compilePrintTemplate(patient, visit);
    
    const modal = document.getElementById('whatsapp-modal');
    const phoneInput = document.getElementById('whatsapp-phone-input');
    const previewContent = document.getElementById('whatsapp-message-preview');
    
    phoneInput.value = patient.phone || "";
    
    const msg = constructWhatsAppMessage(patient, visit);
    previewContent.textContent = msg;
    
    modal.classList.remove('hidden');
    
    const shareBtn = document.getElementById('btn-whatsapp-share-file');
    // Basic mobile check or navigator.canShare compatibility check
    const isWebShareSupported = navigator.canShare && navigator.canShare({ files: [new File([], 'test.pdf', {type: 'application/pdf'})] });
    if (isWebShareSupported) {
        shareBtn.classList.remove('hidden');
    } else {
        shareBtn.classList.add('hidden');
    }
    
    const btnWeb = document.getElementById('btn-whatsapp-web');
    const btnShare = document.getElementById('btn-whatsapp-share-file');
    const btnCancel = document.getElementById('btn-cancel-whatsapp');
    const btnClose = document.getElementById('btn-close-whatsapp-modal');
    
    btnWeb.onclick = () => {
        const phone = phoneInput.value.trim();
        if (!phone) {
            showAlert("يرجى كتابة رقم الهاتف للواتساب", "error");
            return;
        }
        
        patient.phone = phone;
        state.patients[patient.patientId].phone = phone;
        localStorage.setItem('lab_patients', JSON.stringify(state.patients));
        
        downloadPDFReport(patient, visit);
        sendWhatsAppMessage(phone, msg);
        modal.classList.add('hidden');
    };
    
    btnShare.onclick = () => {
        const phone = phoneInput.value.trim();
        if (!phone) {
            showAlert("يرجى كتابة رقم الهاتف للواتساب", "error");
            return;
        }
        
        patient.phone = phone;
        state.patients[patient.patientId].phone = phone;
        localStorage.setItem('lab_patients', JSON.stringify(state.patients));
        
        sharePDFDirect(patient, visit);
        modal.classList.add('hidden');
    };
    
    btnCancel.onclick = () => modal.classList.add('hidden');
    btnClose.onclick = () => modal.classList.add('hidden');
};

function constructWhatsAppMessage(patient, visit) {
    let msg = `مرحباً أ. ${patient.name}،\n`;
    msg += `مرفق تقرير الفحص الطبي الخاص بك من *${state.labInfo.name}*.\n\n`;
    msg += `📄 *تفاصيل الزيارة:*\n`;
    msg += `- رقم الفحص: ${visit.testId}\n`;
    msg += `- تاريخ الفحص: ${visit.date}\n\n`;
    msg += `🧪 *نتائج التحاليل الرئيسية:*\n`;
    
    visit.tests.forEach(test => {
        let arabicStatus = "طبيعي";
        if (test.isAbnormal) {
            const val = parseFloat(test.value);
            if (!isNaN(val)) {
                arabicStatus = val > test.max ? "مرتفع ⬆" : "منخفض ⬇";
            } else {
                arabicStatus = "غير طبيعي";
            }
        }
        msg += `• *${test.name}*: ${test.value} ${test.unit} (${arabicStatus})\n`;
    });
    
    msg += `\nنتمنى لك دوام الصحة والعافية. ✨`;
    return msg;
}

function downloadPDFReport(patient, visit) {
    const reportElem = document.getElementById('print-report-template');
    reportElem.classList.add('pdf-rendering');
    
    const opt = {
        margin:       [10, 10, 10, 10],
        filename:     `Report_${patient.name.replace(/\s+/g, '_')}_${visit.testId}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().from(reportElem).set(opt).save().then(() => {
        reportElem.classList.remove('pdf-rendering');
        showAlert("جاري تحميل ملف التقرير PDF...");
    }).catch(err => {
        reportElem.classList.remove('pdf-rendering');
        console.error("PDF download error: ", err);
        showAlert("حدث خطأ أثناء تحميل التقرير", "error");
    });
}

function sendWhatsAppMessage(phone, msg) {
    let cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '964' + cleaned.substring(1);
    }
    const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
}

function sharePDFDirect(patient, visit) {
    const reportElem = document.getElementById('print-report-template');
    reportElem.classList.add('pdf-rendering');
    
    const opt = {
        margin:       [10, 10, 10, 10],
        filename:     `Report_${patient.name.replace(/\s+/g, '_')}_${visit.testId}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().from(reportElem).set(opt).outputPdf('blob').then(function(pdfBlob) {
        reportElem.classList.remove('pdf-rendering');
        
        const fileName = `Report_${patient.name.replace(/\s+/g, '_')}_${visit.testId}.pdf`;
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({
                files: [file],
                title: 'تقرير فحص طبي',
                text: `تقرير فحص طبي للمراجع ${patient.name}`
            }).then(() => {
                showAlert("تمت المشاركة عبر الواتساب بنجاح");
            }).catch(err => {
                console.error("Share failed: ", err);
                showAlert("تم إلغاء عملية المشاركة", "warning");
            });
        } else {
            showAlert("مشاركة الملفات غير مدعومة على متصفحك", "error");
        }
    }).catch(err => {
        reportElem.classList.remove('pdf-rendering');
        console.error("PDF Blob generation error: ", err);
        showAlert("حدث خطأ أثناء إنشاء الملف للمشاركة", "error");
    });
}

// Compare mode setup and triggers inside history details card
let isCompareModeActive = false;
function setupCompareMode(patientId) {
    const btnCompareMode = document.getElementById('btn-compare-mode');
    const compBar = document.getElementById('comparison-bar');
    const btnPrintComp = document.getElementById('btn-print-comparison');
    const compareCountSpan = document.getElementById('compare-count');
    
    if (!btnCompareMode) return;
    
    isCompareModeActive = false;
    btnCompareMode.classList.remove('btn-primary');
    btnCompareMode.classList.add('btn-outline-primary');
    btnCompareMode.innerHTML = `<i class="fa-solid fa-code-compare"></i> مقارنة الزيارات`;
    if (compBar) compBar.classList.add('hidden');
    
    document.querySelectorAll('.visit-compare-checkbox').forEach(cb => {
        cb.classList.add('hidden');
        cb.checked = false;
    });
    
    btnCompareMode.onclick = () => {
        isCompareModeActive = !isCompareModeActive;
        
        if (isCompareModeActive) {
            btnCompareMode.classList.remove('btn-outline-primary');
            btnCompareMode.classList.add('btn-primary');
            btnCompareMode.innerHTML = `<i class="fa-solid fa-xmark"></i> إلغاء المقارنة`;
            compBar.classList.remove('hidden');
            
            document.querySelectorAll('.visit-compare-checkbox').forEach(cb => {
                cb.classList.remove('hidden');
            });
        } else {
            btnCompareMode.classList.remove('btn-primary');
            btnCompareMode.classList.add('btn-outline-primary');
            btnCompareMode.innerHTML = `<i class="fa-solid fa-code-compare"></i> مقارنة الزيارات`;
            compBar.classList.add('hidden');
            
            document.querySelectorAll('.visit-compare-checkbox').forEach(cb => {
                cb.classList.add('hidden');
                cb.checked = false;
            });
            
            btnPrintComp.disabled = true;
            compareCountSpan.textContent = "0";
        }
    };
    
    const checkboxes = document.querySelectorAll('.visit-compare-checkbox');
    checkboxes.forEach(cb => {
        cb.onchange = () => {
            const checkedBoxes = document.querySelectorAll('.visit-compare-checkbox:checked');
            const count = checkedBoxes.length;
            compareCountSpan.textContent = count;
            btnPrintComp.disabled = (count < 2);
        };
    });
    
    btnPrintComp.onclick = () => {
        const checkedBoxes = document.querySelectorAll('.visit-compare-checkbox:checked');
        const selectedIds = Array.from(checkedBoxes).map(cb => cb.dataset.visitId);
        printComparisonReport(patientId, selectedIds);
    };
}

// Render dynamic comparison print table layout
function printComparisonReport(patientId, selectedVisitIds) {
    const patient = state.patients[patientId];
    if (!patient) return;
    
    const selectedVisits = patient.visits.filter(v => selectedVisitIds.includes(v.testId));
    if (selectedVisits.length < 2) {
        showAlert("يرجى اختيار زيارتين على الأقل للمقارنة والمطابقة", "error");
        return;
    }
    
    selectedVisits.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    document.getElementById('print-comp-patient-name').textContent = patient.name;
    document.getElementById('print-comp-patient-id-val').textContent = patient.patientId;
    document.getElementById('print-comp-patient-age').textContent = `${patient.age} سنة`;
    document.getElementById('print-comp-patient-gender').textContent = patient.gender;
    
    const datesStr = selectedVisits.map(v => `${v.date} (${v.testId})`).join(' ◀ ');
    document.getElementById('print-comp-visits-dates').textContent = datesStr;
    
    const allTestNames = new Set();
    selectedVisits.forEach(v => {
        v.tests.forEach(t => allTestNames.add(t.name));
    });
    
    const uniqueTestNames = Array.from(allTestNames);
    
    const headerRow = document.getElementById('print-comparison-table-header');
    headerRow.innerHTML = `
        <th style="width: 32%; text-align: right;">اسم الفحص / Test Name</th>
        <th style="width: 18%; text-align: center;">المدى الطبيعي / Normal</th>
        <th style="width: 10%; text-align: center;">الوحدة / Unit</th>
    `;
    
    selectedVisits.forEach(v => {
        const th = document.createElement('th');
        th.style.textAlign = 'center';
        th.innerHTML = `${v.date}<br><small style="font-weight: 500;">${v.testId}</small>`;
        headerRow.appendChild(th);
    });
    
    const tbody = document.getElementById('print-comparison-table-body');
    tbody.innerHTML = "";
    
    uniqueTestNames.forEach(testName => {
        const tr = document.createElement('tr');
        
        let minRange = "-";
        let maxRange = "-";
        let unit = "-";
        
        for (let v of selectedVisits) {
            const found = v.tests.find(t => t.name === testName);
            if (found) {
                minRange = found.min;
                maxRange = found.max;
                unit = found.unit;
                break;
            }
        }
        
        tr.innerHTML = `
            <td style="text-align: right;"><strong>${testName}</strong></td>
            <td dir="ltr" style="text-align: center;">${minRange} - ${maxRange}</td>
            <td style="text-align: center;">${unit}</td>
        `;
        
        selectedVisits.forEach(v => {
            const foundTest = v.tests.find(t => t.name === testName);
            const td = document.createElement('td');
            td.style.textAlign = 'center';
            
            if (foundTest) {
                let flagText = "طبيعي";
                let flagClass = "flag-normal";
                let style = "font-weight: 700;";
                
                if (foundTest.isAbnormal) {
                    const numVal = parseFloat(foundTest.value);
                    if (!isNaN(numVal)) {
                        if (numVal > foundTest.max) {
                            flagText = "مرتفع ⬆";
                            flagClass = "flag-high";
                            style += " color: var(--print-color-high) !important;";
                        } else {
                            flagText = "منخفض ⬇";
                            flagClass = "flag-low";
                            style += " color: var(--print-color-low) !important;";
                        }
                    } else {
                        flagText = "غير طبيعي";
                        flagClass = "flag-abnormal";
                        style += " color: var(--print-color-high) !important;";
                    }
                } else {
                    style += " color: var(--print-color-normal) !important;";
                }
                
                td.innerHTML = `
                    <div style="${style}">${foundTest.value}</div>
                    <div style="font-size: 8pt; margin-top: 3px;"><span class="print-flag-cell ${flagClass}" style="padding: 1px 4px; font-size: 7.5pt;">${flagText}</span></div>
                `;
            } else {
                td.textContent = "-";
                td.style.color = "#94a3b8";
            }
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    });
    
    const printCompLogo = document.getElementById('print-comp-logo');
    const printCompLogoPlaceholder = document.getElementById('print-comp-logo-placeholder');
    const printCompLabName = document.getElementById('print-comp-lab-name');
    const printCompLabAddress = document.getElementById('print-comp-lab-address');
    const printCompLabPhones = document.getElementById('print-comp-lab-phones');
    const printCompLabEmail = document.getElementById('print-comp-lab-email');
    const watermark = document.getElementById('print-comparison-watermark');
    
    printCompLabName.textContent = state.labInfo.name;
    printCompLabAddress.textContent = `العنوان: ${state.labInfo.address}`;
    printCompLabPhones.textContent = `الهاتف: ${state.labInfo.phones}`;
    if (printCompLabEmail) printCompLabEmail.textContent = state.labInfo.email || '';
    
    if (state.labInfo.logo) {
        printCompLogo.src = state.labInfo.logo;
        printCompLogo.style.display = 'block';
        if (printCompLogoPlaceholder) printCompLogoPlaceholder.style.display = 'none';
        if (watermark) watermark.style.backgroundImage = `url(${state.labInfo.logo})`;
    } else {
        printCompLogo.style.display = 'none';
        if (printCompLogoPlaceholder) printCompLogoPlaceholder.style.display = 'flex';
        if (watermark) watermark.style.backgroundImage = 'none';
    }
    
    document.body.classList.add('printing-comparison');
    window.print();
    setTimeout(() => {
        document.body.classList.remove('printing-comparison');
    }, 500);
    
    showAlert(`جاري طباعة تقرير مقارنة لـ ${selectedVisits.length} زيارات...`);
}

// Colors Customization settings load and apply
function loadColorSettings() {
    const stored = localStorage.getItem('lab_color_settings');
    try {
        if (stored) {
            state.colorSettings = JSON.parse(stored);
        } else {
            state.colorSettings = { ...DEFAULT_COLOR_SETTINGS };
            localStorage.setItem('lab_color_settings', JSON.stringify(state.colorSettings));
        }
    } catch (e) {
        console.error("Error parsing lab_color_settings, resetting to default:", e);
        state.colorSettings = { ...DEFAULT_COLOR_SETTINGS };
    }
    
    const cNormal = document.getElementById('color-normal-select');
    const cHigh = document.getElementById('color-high-select');
    const cLow = document.getElementById('color-low-select');
    const oNormal = document.getElementById('opacity-normal-range');
    const oHigh = document.getElementById('opacity-high-range');
    const oLow = document.getElementById('opacity-low-range');
    
    if (cNormal) cNormal.value = state.colorSettings.normal.color;
    if (cHigh) cHigh.value = state.colorSettings.high.color;
    if (cLow) cLow.value = state.colorSettings.low.color;
    
    if (oNormal) {
        oNormal.value = state.colorSettings.normal.opacity;
        document.getElementById('opacity-normal-val').textContent = oNormal.value + '%';
    }
    if (oHigh) {
        oHigh.value = state.colorSettings.high.opacity;
        document.getElementById('opacity-high-val').textContent = oHigh.value + '%';
    }
    if (oLow) {
        oLow.value = state.colorSettings.low.opacity;
        document.getElementById('opacity-low-val').textContent = oLow.value + '%';
    }
    
    applyPrintColors();
}

function saveColorSettings() {
    const cNormal = document.getElementById('color-normal-select').value;
    const cHigh = document.getElementById('color-high-select').value;
    const cLow = document.getElementById('color-low-select').value;
    const oNormal = parseInt(document.getElementById('opacity-normal-range').value);
    const oHigh = parseInt(document.getElementById('opacity-high-range').value);
    const oLow = parseInt(document.getElementById('opacity-low-range').value);
    
    state.colorSettings = {
        normal: { color: cNormal, opacity: oNormal },
        high: { color: cHigh, opacity: oHigh },
        low: { color: cLow, opacity: oLow }
    };
    
    localStorage.setItem('lab_color_settings', JSON.stringify(state.colorSettings));
    applyPrintColors();
    showAlert("تم حفظ إعدادات ألوان الفحوصات وتطبيقها بنجاح!");

    // Sync to Firebase
    if (db) {
        db.collection('settings').doc('color_settings').set(state.colorSettings)
            .catch(err => console.error("Firebase save color_settings error:", err));
    }
}

function applyPrintColors() {
    const settings = state.colorSettings;
    const normalRgb = COLOR_MAP[settings.normal.color] || COLOR_MAP.green;
    const highRgb = COLOR_MAP[settings.high.color] || COLOR_MAP.red;
    const lowRgb = COLOR_MAP[settings.low.color] || COLOR_MAP.blue;

    document.documentElement.style.setProperty('--print-color-normal', `rgb(${normalRgb})`);
    document.documentElement.style.setProperty('--print-bg-normal', `rgba(${normalRgb}, ${settings.normal.opacity / 100})`);

    document.documentElement.style.setProperty('--print-color-high', `rgb(${highRgb})`);
    document.documentElement.style.setProperty('--print-bg-high', `rgba(${highRgb}, ${settings.high.opacity / 100})`);

    document.documentElement.style.setProperty('--print-color-low', `rgb(${lowRgb})`);
    document.documentElement.style.setProperty('--print-bg-low', `rgba(${lowRgb}, ${settings.low.opacity / 100})`);
}

// --- New Features Updates (Dashboard & Profiles) ---

// Load Profiles configurations from LocalStorage
function loadProfiles() {
    const stored = localStorage.getItem('lab_test_profiles');
    try {
        if (stored) {
            state.profiles = JSON.parse(stored);
        } else {
            // Default laboratory panels
            state.profiles = [
                { name: "وظائف الكلى KFT", tests: ["Blood Urea", "Serum Creatinine"] },
                { name: "فحص الدهون Lipid Profile", tests: ["Total Cholesterol", "Triglycerides"] }
            ];
            localStorage.setItem('lab_test_profiles', JSON.stringify(state.profiles));
        }
    } catch (e) {
        console.error("Error parsing lab_test_profiles, resetting to default:", e);
        state.profiles = [
            { name: "وظائف الكلى KFT", tests: ["Blood Urea", "Serum Creatinine"] },
            { name: "فحص الدهون Lipid Profile", tests: ["Total Cholesterol", "Triglycerides"] }
        ];
    }
    populateProfileSelectDropdown();
    renderProfilesTable();
    renderProfileTestsCheckboxes();
}

// Populate profiles checkbox list in settings
function renderProfileTestsCheckboxes() {
    const container = document.getElementById('profile-tests-checkboxes');
    if (!container) return;
    
    container.className = "checkboxes-grid-list";
    container.innerHTML = "";
    state.testTypes.forEach(test => {
        const label = document.createElement('label');
        label.innerHTML = `
            <input type="checkbox" value="${test.name}">
            <span>${test.name}</span>
        `;
        container.appendChild(label);
    });
}

// Render profiles table in settings
function renderProfilesTable() {
    const tbody = document.querySelector('#all-profiles-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    if (state.profiles.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="3" class="text-center">لا توجد مجموعات فحوصات معرفة حالياً.</td>
            </tr>
        `;
        return;
    }
    
    state.profiles.forEach((profile, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${profile.name}</strong></td>
            <td><span style="font-size: 0.85rem; color: var(--text-muted);">${profile.tests.join(', ')}</span></td>
            <td>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteProfile(${idx})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Delete Profile from Settings list
window.deleteProfile = function(idx) {
    if (confirm("هل أنت متأكد من حذف هذه المجموعة؟ لن يظهر خيار إدخالها دفعة واحدة بعد الآن.")) {
        const pName = state.profiles[idx].name;
        state.profiles.splice(idx, 1);
        localStorage.setItem('lab_test_profiles', JSON.stringify(state.profiles));
        
        populateProfileSelectDropdown();
        renderProfilesTable();
        showAlert(`تم حذف مجموعة الفحوصات: ${pName}`, "warning");

        // Sync to Firebase
        if (db) {
            db.collection('settings').doc('profiles').set({ list: state.profiles })
                .catch(err => console.error("Firebase save profiles error:", err));
        }
    }
};

// Add new custom profile panel
function addNewProfile() {
    const profileNameInput = document.getElementById('new-profile-name');
    const profileName = profileNameInput.value.trim();
    if (!profileName) return;
    
    const checkboxes = document.querySelectorAll('#profile-tests-checkboxes input[type="checkbox"]:checked');
    const selectedTests = Array.from(checkboxes).map(cb => cb.value);
    
    if (selectedTests.length === 0) {
        showAlert("يرجى اختيار فحص واحد على الأقل للمجموعة", "error");
        return;
    }
    
    const exists = state.profiles.some(p => p.name.toLowerCase() === profileName.toLowerCase());
    if (exists) {
        showAlert("هذه المجموعة مسجلة بالفعل", "warning");
        return;
    }
    
    const profile = {
        name: profileName,
        tests: selectedTests
    };
    
    state.profiles.push(profile);
    localStorage.setItem('lab_test_profiles', JSON.stringify(state.profiles));
    
    profileNameInput.value = "";
    checkboxes.forEach(cb => cb.checked = false);
    
    populateProfileSelectDropdown();
    renderProfilesTable();
    showAlert(`تم تسجيل مجموعة الفحوصات الجديدة: ${profileName}`);

    // Sync to Firebase
    if (db) {
        db.collection('settings').doc('profiles').set({ list: state.profiles })
            .catch(err => console.error("Firebase save profiles error:", err));
    }
}

// Populate profiles dropdown select in Data Entry visit
function populateProfileSelectDropdown() {
    const select = document.getElementById('profile-select-dropdown');
    if (!select) return;
    
    select.innerHTML = `<option value="" disabled selected>اختر مجموعة الفحوصات...</option>`;
    state.profiles.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.textContent = p.name;
        select.appendChild(opt);
    });
}

// Open modal for entering all results of a selected profile
function openProfileInputModal(profile) {
    const modal = document.getElementById('profile-input-modal');
    const title = document.getElementById('modal-profile-name');
    const container = document.getElementById('profile-inputs-container');
    const form = document.getElementById('profile-results-form');
    
    title.textContent = profile.name;
    container.innerHTML = "";
    
    const profileTests = [];
    profile.tests.forEach(testName => {
        const found = state.testTypes.find(t => t.name === testName);
        if (found) {
            profileTests.push(found);
        }
    });
    
    if (profileTests.length === 0) {
        showAlert("لا توجد فحوصات فعالة معرفة تنتمي لهذه المجموعة حالياً", "error");
        return;
    }
    
    profileTests.forEach(test => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'form-group';
        
        let normalRangeStr = "";
        if (test.type === "text") {
            normalRangeStr = `القيمة الطبيعية: ${test.normalValue || 'Negative'}`;
        } else {
            normalRangeStr = `المدى الطبيعي: ${test.min} - ${test.max} ${test.unit}`;
        }
        
        itemDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                <label style="font-weight: 700; font-size: 0.9rem; color: var(--text-main);">${test.name} <small style="color: var(--text-muted);">(${normalRangeStr})</small></label>
            </div>
            <div class="input-unit-group">
                <input type="text" class="profile-test-input-value" data-test-name="${test.name}" required placeholder="أدخل النتيجة...">
                <span class="unit-badge">${test.unit || '-'}</span>
            </div>
        `;
        container.appendChild(itemDiv);
    });
    
    modal.classList.remove('hidden');
    
    form.onsubmit = (e) => {
        e.preventDefault();
        
        const inputs = container.querySelectorAll('.profile-test-input-value');
        let addedCount = 0;
        
        inputs.forEach(input => {
            const testName = input.dataset.testName;
            const valueText = input.value.trim();
            if (valueText === "") return;
            
            const testConfig = state.testTypes.find(t => t.name === testName);
            if (!testConfig) return;
            
            const exists = state.currentVisit.tests.some(t => t.name === testName);
            if (exists) return;
            
            let isAbnormal = false;
            if (testConfig.type === "text") {
                const normalVal = testConfig.normalValue || "Negative";
                if (valueText.toLowerCase().trim() !== normalVal.toLowerCase().trim()) {
                    isAbnormal = true;
                }
            } else {
                const numVal = parseFloat(valueText);
                if (!isNaN(numVal)) {
                    if (numVal < testConfig.min || numVal > testConfig.max) {
                        isAbnormal = true;
                    }
                }
            }
            
            const testItem = {
                name: testConfig.name,
                min: testConfig.min,
                max: testConfig.max,
                type: testConfig.type || "numeric",
                price: testConfig.price || 0,
                normalValue: testConfig.normalValue || "",
                unit: testConfig.unit || "-",
                value: valueText,
                isAbnormal: isAbnormal
            };
            
            state.currentVisit.tests.push(testItem);
            addedCount++;
        });
        
        DOM.testCount.value = state.currentVisit.tests.length;
        modal.classList.add('hidden');
        renderCurrentTestsTable();
        showAlert(`تمت إضافة ${addedCount} فحوصات بنجاح من مجموعة ${profile.name}`);
    };
    
    document.getElementById('btn-close-profile-modal').onclick = () => modal.classList.add('hidden');
    document.getElementById('btn-cancel-profile-modal').onclick = () => modal.classList.add('hidden');
}

// --- Dashboard & Analytics Logics ---
let charts = {
    popularTests: null,
    earningsTrend: null
};

// Initialize Dashboard analytics values
function initDashboard() {
    const patientsList = Object.values(state.patients);
    const totalPatients = patientsList.length;
    
    let totalVisits = 0;
    let totalPerformedTests = 0;
    
    const todayStr = getTodayDateString();
    
    const testCounts = {};
    const allVisits = [];
    
    patientsList.forEach(patient => {
        if (patient.visits) {
            totalVisits += patient.visits.length;
            patient.visits.forEach(visit => {
                const visitTestsCount = visit.tests ? visit.tests.length : 0;
                totalPerformedTests += visitTestsCount;
                
                allVisits.push({
                    date: visit.date || todayStr,
                    testId: visit.testId || "unknown",
                    testCount: visitTestsCount
                });
                
                if (visit.tests) {
                    visit.tests.forEach(test => {
                        testCounts[test.name] = (testCounts[test.name] || 0) + 1;
                    });
                }
            });
        }
    });
    
    document.getElementById('stat-total-patients').textContent = totalPatients;
    document.getElementById('stat-total-visits').textContent = totalVisits;
    
    const performedBadge = document.getElementById('stat-total-performed');
    if (performedBadge) performedBadge.textContent = totalPerformedTests;
    
    const configuredBadge = document.getElementById('stat-total-configured');
    if (configuredBadge) configuredBadge.textContent = state.testTypes.length;
    
    allVisits.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    renderPopularTestsChart(testCounts);
    renderEarningsTrendChart(allVisits);
}

function renderPopularTestsChart(testCounts) {
    const ctx = document.getElementById('chart-popular-tests');
    if (!ctx) return;
    
    if (typeof Chart === 'undefined') {
        ctx.style.display = 'none';
        const parent = ctx.parentNode;
        parent.style.display = 'flex';
        parent.style.flexDirection = 'column';
        parent.style.alignItems = 'center';
        parent.style.justifyContent = 'center';
        parent.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.9rem; padding: 20px;"><i class="fa-solid fa-wifi-slash" style="font-size: 2.2rem; margin-bottom: 10px; display: block; color: var(--primary);"></i>يتطلب اتصالاً بالإنترنت لتحميل الرسوم البيانية</div>`;
        return;
    }
    
    if (charts.popularTests) {
        charts.popularTests.destroy();
    }
    
    const sorted = Object.entries(testCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
        
    const labels = sorted.map(x => x[0]);
    const data = sorted.map(x => x[1]);
    
    if (labels.length === 0) {
        labels.push("لا توجد تحاليل مدخلة");
        data.push(0);
    }
    
    charts.popularTests = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#1e3a8a',
                    '#0d9488',
                    '#059669',
                    '#f59e0b',
                    '#7c3aed'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: 'Cairo', size: 10 }
                    }
                }
            }
        }
    });
}

function renderEarningsTrendChart(allVisits) {
    const ctx = document.getElementById('chart-earnings-trend');
    if (!ctx) return;
    
    if (typeof Chart === 'undefined') {
        ctx.style.display = 'none';
        const parent = ctx.parentNode;
        parent.style.display = 'flex';
        parent.style.flexDirection = 'column';
        parent.style.alignItems = 'center';
        parent.style.justifyContent = 'center';
        parent.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.9rem; padding: 20px;"><i class="fa-solid fa-wifi-slash" style="font-size: 2.2rem; margin-bottom: 10px; display: block; color: var(--primary);"></i>يتطلب اتصالاً بالإنترنت لتحميل الرسوم البيانية</div>`;
        return;
    }
    
    if (charts.earningsTrend) {
        charts.earningsTrend.destroy();
    }
    
    const lastVisits = allVisits.slice(-7);
    const labels = lastVisits.map(v => `${v.date}\n(${v.testId})`);
    const data = lastVisits.map(v => v.testCount);
    
    if (labels.length === 0) {
        labels.push("لا توجد زيارات");
        data.push(0);
    }
    
    charts.earningsTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'عدد الفحوصات في الزيارة',
                data: data,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                borderWidth: 2,
                fill: true,
                tension: 0.35
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: { family: 'Cairo', size: 9 }
                    }
                },
                x: {
                    ticks: {
                        font: { family: 'Cairo', size: 9 }
                    }
                }
            }
        }
    });
}

async function syncWithFirebase() {
    if (typeof firebase === 'undefined') {
        console.log("Firebase SDK is not loaded. Operating in offline/LocalStorage mode.");
        return;
    }
    
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        
        // Fetch configurations
        const settingsRef = db.collection('settings');
        
        const labInfoDoc = await settingsRef.doc('lab_info').get();
        if (labInfoDoc.exists) {
            state.labInfo = labInfoDoc.data();
            localStorage.setItem('lab_info', JSON.stringify(state.labInfo));
            updateLabUI();
        }
        
        const colorSettingsDoc = await settingsRef.doc('color_settings').get();
        if (colorSettingsDoc.exists) {
            state.colorSettings = colorSettingsDoc.data();
            localStorage.setItem('lab_color_settings', JSON.stringify(state.colorSettings));
            loadColorSettings(); // Re-load and apply colors
        }
        
        const testTypesDoc = await settingsRef.doc('test_types').get();
        if (testTypesDoc.exists) {
            const data = testTypesDoc.data();
            if (data && Array.isArray(data.list)) {
                state.testTypes = data.list;
                localStorage.setItem('lab_test_types', JSON.stringify(state.testTypes));
                renderTestTypesTable();
                populateTestSelectOptions();
            }
        }
        
        const profilesDoc = await settingsRef.doc('profiles').get();
        if (profilesDoc.exists) {
            const data = profilesDoc.data();
            if (data && Array.isArray(data.list)) {
                state.profiles = data.list;
                localStorage.setItem('lab_test_profiles', JSON.stringify(state.profiles));
                populateProfileSelectDropdown();
                renderProfilesTable();
                renderProfileTestsCheckboxes();
            }
        }
        
        // Fetch Patients
        const patientsSnapshot = await db.collection('patients').get();
        if (!patientsSnapshot.empty) {
            const firebasePatients = {};
            patientsSnapshot.forEach(doc => {
                firebasePatients[doc.id] = doc.data();
            });
            // Merge or replace
            state.patients = firebasePatients;
            localStorage.setItem('lab_patients', JSON.stringify(state.patients));
            renderPatientsHistoryTable();
        }
        
        // Re-initialize active form and dashboard analytics with new synced data
        initForm();
        initDashboard();
        showAlert("تم المزامنة مع قاعدة البيانات السحابية بنجاح ✅");
    } catch (e) {
        console.error("Firebase syncing failed:", e);
        showAlert("فشل المزامنة مع السحابة، تم تشغيل النظام بالوضع المحلي ⚠️", "warning");
    }
}
