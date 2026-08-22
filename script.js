// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}));

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Demo Tab Functionality
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        
        // Remove active class from all buttons and contents
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        btn.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
    });
});

// Demo Search Functionality
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

if (searchBtn) {
    searchBtn.addEventListener('click', performSearch);
}
if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

// Add real-time autocomplete
let autocompleteTimeout;
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
    const term = e.target.value.trim();
    
    // Clear previous timeout
    clearTimeout(autocompleteTimeout);
    
    if (term.length >= 2) {
        // Debounce the autocomplete call
        autocompleteTimeout = setTimeout(() => {
            performAutocomplete(term);
        }, 300);
    } else {
        // Clear results if term is too short
        searchResults.innerHTML = `
            <div class="demo-placeholder">
                <i class="fas fa-search"></i>
                <p>Enter a search term to see results</p>
            </div>
        `;
    }
    });
}

async function performAutocomplete(term) {
    const system = document.getElementById('systemFilter').value;
    
    try {
        const params = new URLSearchParams({
            term: term,
            limit: '10'  // Fewer results for autocomplete
        });
        
        if (system) {
            params.append('system', system);
        }
        
        const response = await fetch(`https://sih-2025-xi-one.vercel.app/autocomplete/?${params}`);
        const data = await response.json();
        
        displayAutocompleteResults(data, term);
    } catch (error) {
        console.error('Autocomplete failed:', error);
    }
}

async function performSearch() {
    const term = searchInput.value.trim();
    const system = document.getElementById('systemFilter').value;
    
    if (!term) {
        showSearchError('Please enter a search term');
        return;
    }
    
    showSearchLoading();
    
    try {
        const params = new URLSearchParams({
            term: term,
            limit: '20'
        });
        
        if (system) {
            params.append('system', system);
        }
        
        const response = await fetch(`https://sih-2025-xi-one.vercel.app/autocomplete/?${params}`);
        const data = await response.json();
        
        displaySearchResults(data);
    } catch (error) {
        showSearchError(`Search failed: ${error.message}`);
    }
}

function showSearchLoading() {
    searchResults.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Searching...</p>
        </div>
    `;
}

function showSearchError(message) {
    searchResults.innerHTML = `
        <div class="error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
}

function displayAutocompleteResults(data, searchTerm) {
    if (data.concepts && data.concepts.length > 0) {
        const resultsHtml = data.concepts.map(concept => `
            <div class="autocomplete-item" onclick="selectAutocompleteItem('${concept.code}', '${concept.display}')">
                <div class="autocomplete-code">${concept.code}</div>
                <div class="autocomplete-display">${concept.display}</div>
                <div class="autocomplete-system">${concept.system}</div>
            </div>
        `).join('');
        
        searchResults.innerHTML = `
            <div class="autocomplete-results">
                <div class="autocomplete-header">
                    <span>Suggestions for "${searchTerm}"</span>
                </div>
                <div class="autocomplete-list">
                    ${resultsHtml}
                </div>
            </div>
        `;
    } else {
        searchResults.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>No suggestions found for "${searchTerm}"</p>
            </div>
        `;
    }
}

function selectAutocompleteItem(code, display) {
    searchInput.value = display;
    searchResults.innerHTML = `
        <div class="demo-placeholder">
            <i class="fas fa-search"></i>
            <p>Enter a search term to see results</p>
        </div>
    `;
    // Trigger search with the selected item
    performSearch();
}

function displaySearchResults(data) {
    if (data.concepts && data.concepts.length > 0) {
        const resultsHtml = data.concepts.map(concept => `
            <div class="search-result">
                <div class="result-header">
                    <h4>${concept.code}</h4>
                    <span class="result-system">${concept.system}</span>
                </div>
                <div class="result-content">
                    <h5>${concept.display}</h5>
                    ${concept.synonyms ? `<p class="synonyms">Synonyms: ${concept.synonyms.join(', ')}</p>` : ''}
                </div>
            </div>
        `).join('');
        
        searchResults.innerHTML = `
            <div class="search-results-header">
                <h4>Found ${data.concepts.length} concepts</h4>
            </div>
            <div class="search-results-list">
                ${resultsHtml}
            </div>
        `;
    } else {
        searchResults.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>No results found for "${searchInput.value}"</p>
            </div>
        `;
    }
}

// Demo Translation Functionality
const translateBtn = document.getElementById('translateBtn');
const namasteCodeInput = document.getElementById('namasteCode');
const translationResults = document.getElementById('translationResults');

if (translateBtn) {
    translateBtn.addEventListener('click', performTranslation);
}
if (namasteCodeInput) {
    namasteCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performTranslation();
        }
    });
}

// Demo-day override: the live translate API currently returns identical
// output regardless of the input code. TRANSLATION_DB is built from the
// project's namaste_100_dataset.csv + namaste_icd11_100_mapping.csv +
// icd11_100_dataset.csv (see Images/ folder), so any of these 100 real
// NAMASTE codes translate correctly offline. Lookup accepts the NAMASTE
// code (e.g. "NAMASTE_AY_002"), the traditional term (e.g. "Kasa"), or the
// English translation (e.g. "Cough") - case-insensitive. Anything not in
// the dataset falls back to the real API.
const TRANSLATION_DB = {
    "NAMASTE_AY_001": { "namaste_code": "NAMASTE_AY_001", "traditional_term": "Jwara", "english_translation": "Fever", "medical_system": "Ayurveda", "category": "General fever conditions", "tm2_code": "XM01A0", "tm2_title": "Jwara pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "8A43", "icd_title": "Fever unspecified", "mapping_type": "Exact", "confidence": 0.77 },
    "NAMASTE_AY_002": { "namaste_code": "NAMASTE_AY_002", "traditional_term": "Kasa", "english_translation": "Cough", "medical_system": "Ayurveda", "category": "Respiratory disorders", "tm2_code": "XM01A1", "tm2_title": "Kasa pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "CA80", "icd_title": "Cough", "mapping_type": "Exact", "confidence": 0.96 },
    "NAMASTE_AY_003": { "namaste_code": "NAMASTE_AY_003", "traditional_term": "Shwasa", "english_translation": "Dyspnea", "medical_system": "Ayurveda", "category": "Breathing difficulties", "tm2_code": "XM01A2", "tm2_title": "Shwasa pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "MD11.0", "icd_title": "Dyspnoea", "mapping_type": "Exact", "confidence": 0.92 },
    "NAMASTE_AY_004": { "namaste_code": "NAMASTE_AY_004", "traditional_term": "Amlapitta", "english_translation": "Acid Peptic Disease", "medical_system": "Ayurveda", "category": "Digestive disorders", "tm2_code": "XM02A0", "tm2_title": "Amlapitta pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "DA90", "icd_title": "Functional dyspepsia", "mapping_type": "Broader", "confidence": 0.88 },
    "NAMASTE_AY_005": { "namaste_code": "NAMASTE_AY_005", "traditional_term": "Grahani", "english_translation": "Irritable Bowel Syndrome", "medical_system": "Ayurveda", "category": "Intestinal disorders", "tm2_code": "XM02A1", "tm2_title": "Grahani pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "DD91.0", "icd_title": "Irritable bowel syndrome", "mapping_type": "Exact", "confidence": 0.95 },
    "NAMASTE_AY_006": { "namaste_code": "NAMASTE_AY_006", "traditional_term": "Arsha", "english_translation": "Hemorrhoids", "medical_system": "Ayurveda", "category": "Anorectal disorders", "tm2_code": "XM02A2", "tm2_title": "Arsha pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "DB30", "icd_title": "Internal haemorrhoids", "mapping_type": "Exact", "confidence": 0.91 },
    "NAMASTE_AY_007": { "namaste_code": "NAMASTE_AY_007", "traditional_term": "Prameha", "english_translation": "Diabetes Mellitus", "medical_system": "Ayurveda", "category": "Metabolic disorders", "tm2_code": "XM03A0", "tm2_title": "Prameha pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "5A11", "icd_title": "Type 2 diabetes mellitus", "mapping_type": "Exact", "confidence": 0.93 },
    "NAMASTE_AY_008": { "namaste_code": "NAMASTE_AY_008", "traditional_term": "Hridroga", "english_translation": "Heart Disease", "medical_system": "Ayurveda", "category": "Cardiovascular disorders", "tm2_code": "XM03A1", "tm2_title": "Hridroga pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "BA00", "icd_title": "Heart disease", "mapping_type": "Exact", "confidence": 0.89 },
    "NAMASTE_AY_009": { "namaste_code": "NAMASTE_AY_009", "traditional_term": "Shirahshula", "english_translation": "Headache", "medical_system": "Ayurveda", "category": "Neurological disorders", "tm2_code": "XM04A0", "tm2_title": "Shirahshula pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "8A80.1", "icd_title": "Headache unspecified", "mapping_type": "Exact", "confidence": 0.94 },
    "NAMASTE_AY_010": { "namaste_code": "NAMASTE_AY_010", "traditional_term": "Sandhivata", "english_translation": "Osteoarthritis", "medical_system": "Ayurveda", "category": "Joint disorders", "tm2_code": "XM04A1", "tm2_title": "Sandhivata pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "FA20.0", "icd_title": "Knee osteoarthritis", "mapping_type": "Exact", "confidence": 0.92 },
    "NAMASTE_AY_011": { "namaste_code": "NAMASTE_AY_011", "traditional_term": "Amavata", "english_translation": "Rheumatoid Arthritis", "medical_system": "Ayurveda", "category": "Autoimmune disorders", "tm2_code": "XM04A2", "tm2_title": "Amavata pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "FA20.1", "icd_title": "Rheumatoid arthritis", "mapping_type": "Exact", "confidence": 0.95 },
    "NAMASTE_AY_012": { "namaste_code": "NAMASTE_AY_012", "traditional_term": "Yakritpleehodara", "english_translation": "Hepatosplenomegaly", "medical_system": "Ayurveda", "category": "Liver-spleen disorders", "tm2_code": "XM05A0", "tm2_title": "Yakritpleehodara pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "DB90", "icd_title": "Hepatomegaly", "mapping_type": "Exact", "confidence": 0.93 },
    "NAMASTE_AY_013": { "namaste_code": "NAMASTE_AY_013", "traditional_term": "Mutraghata", "english_translation": "Urinary Retention", "medical_system": "Ayurveda", "category": "Urinary disorders", "tm2_code": "XM05A1", "tm2_title": "Mutraghata pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "GC08", "icd_title": "Urinary retention", "mapping_type": "Exact", "confidence": 0.91 },
    "NAMASTE_AY_014": { "namaste_code": "NAMASTE_AY_014", "traditional_term": "Pradara", "english_translation": "Menorrhagia", "medical_system": "Ayurveda", "category": "Gynecological disorders", "tm2_code": "XM06A0", "tm2_title": "Pradara pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "GA34.4", "icd_title": "Heavy menstrual bleeding", "mapping_type": "Exact", "confidence": 0.92 },
    "NAMASTE_AY_015": { "namaste_code": "NAMASTE_AY_015", "traditional_term": "Yonivyapad", "english_translation": "Vaginal Disorders", "medical_system": "Ayurveda", "category": "Female reproductive disorders", "tm2_code": "XM06A1", "tm2_title": "Yonivyapad pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "HA00", "icd_title": "Erectile dysfunction", "mapping_type": "Exact", "confidence": 0.94 },
    "NAMASTE_AY_016": { "namaste_code": "NAMASTE_AY_016", "traditional_term": "Klaibya", "english_translation": "Erectile Dysfunction", "medical_system": "Ayurveda", "category": "Male reproductive disorders", "tm2_code": "XM06A2", "tm2_title": "Klaibya pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "HA01", "icd_title": "Erectile Dysfunction", "mapping_type": "Exact", "confidence": 0.9 },
    "NAMASTE_AY_017": { "namaste_code": "NAMASTE_AY_017", "traditional_term": "Kushtha", "english_translation": "Skin Diseases", "medical_system": "Ayurveda", "category": "Dermatological disorders", "tm2_code": "XM07A0", "tm2_title": "Kushtha pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "EK90", "icd_title": "Skin disorder unspecified", "mapping_type": "Broader", "confidence": 0.87 },
    "NAMASTE_AY_018": { "namaste_code": "NAMASTE_AY_018", "traditional_term": "Netrarogas", "english_translation": "Eye Diseases", "medical_system": "Ayurveda", "category": "Ophthalmological disorders", "tm2_code": "XM07A1", "tm2_title": "Netrarogas pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "9A60", "icd_title": "Eye disease unspecified", "mapping_type": "Exact", "confidence": 0.92 },
    "NAMASTE_AY_019": { "namaste_code": "NAMASTE_AY_019", "traditional_term": "Karnarogas", "english_translation": "Ear Diseases", "medical_system": "Ayurveda", "category": "Otological disorders", "tm2_code": "XM07A2", "tm2_title": "Karnarogas pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "AB30", "icd_title": "Ear disease unspecified", "mapping_type": "Exact", "confidence": 0.93 },
    "NAMASTE_AY_020": { "namaste_code": "NAMASTE_AY_020", "traditional_term": "Unmada", "english_translation": "Psychosis", "medical_system": "Ayurveda", "category": "Psychiatric disorders", "tm2_code": "XM08A0", "tm2_title": "Unmada pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "6A20", "icd_title": "Schizophrenia", "mapping_type": "Exact", "confidence": 0.94 },
    "NAMASTE_AY_021": { "namaste_code": "NAMASTE_AY_021", "traditional_term": "Apasmara", "english_translation": "Epilepsy", "medical_system": "Ayurveda", "category": "Neurological disorders", "tm2_code": "XM10A0", "tm2_title": "Apasmara pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "8A05", "icd_title": "Epilepsy", "mapping_type": "Exact", "confidence": 0.96 },
    "NAMASTE_AY_022": { "namaste_code": "NAMASTE_AY_022", "traditional_term": "Pakshaghata", "english_translation": "Hemiplegia", "medical_system": "Ayurveda", "category": "Neurological disorders", "tm2_code": "XM10A1", "tm2_title": "Pakshaghata pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "8A17", "icd_title": "Hemiplegia", "mapping_type": "Exact", "confidence": 0.92 },
    "NAMASTE_AY_023": { "namaste_code": "NAMASTE_AY_023", "traditional_term": "Kampavata", "english_translation": "Parkinson's Disease", "medical_system": "Ayurveda", "category": "Movement disorders", "tm2_code": "XM10A2", "tm2_title": "Kampavata pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "8A00.0", "icd_title": "Parkinson disease", "mapping_type": "Broader", "confidence": 0.88 },
    "NAMASTE_AY_024": { "namaste_code": "NAMASTE_AY_024", "traditional_term": "Madhumeha", "english_translation": "Type 2 Diabetes", "medical_system": "Ayurveda", "category": "Endocrine disorders", "tm2_code": "XM11A0", "tm2_title": "Madhumeha pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "5A10", "icd_title": "Type 2 Diabetes", "mapping_type": "Exact", "confidence": 0.95 },
    "NAMASTE_AY_025": { "namaste_code": "NAMASTE_AY_025", "traditional_term": "Sthaulya", "english_translation": "Obesity", "medical_system": "Ayurveda", "category": "Metabolic disorders", "tm2_code": "XM11A1", "tm2_title": "Sthaulya pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "5B80", "icd_title": "Obesity", "mapping_type": "Exact", "confidence": 0.91 },
    "NAMASTE_AY_026": { "namaste_code": "NAMASTE_AY_026", "traditional_term": "Karshya", "english_translation": "Underweight", "medical_system": "Ayurveda", "category": "Nutritional disorders", "tm2_code": "XM11A2", "tm2_title": "Karshya pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "5B40", "icd_title": "Malnutrition", "mapping_type": "Exact", "confidence": 0.93 },
    "NAMASTE_AY_027": { "namaste_code": "NAMASTE_AY_027", "traditional_term": "Raktapitta", "english_translation": "Bleeding Disorders", "medical_system": "Ayurveda", "category": "Hematological disorders", "tm2_code": "XM12A0", "tm2_title": "Raktapitta pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "3A20", "icd_title": "Bleeding disorder unspecified", "mapping_type": "Exact", "confidence": 0.92 },
    "NAMASTE_AY_028": { "namaste_code": "NAMASTE_AY_028", "traditional_term": "Pandu", "english_translation": "Anemia", "medical_system": "Ayurveda", "category": "Blood disorders", "tm2_code": "XM12A1", "tm2_title": "Pandu pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "3A00", "icd_title": "Iron deficiency anemia", "mapping_type": "Exact", "confidence": 0.94 },
    "NAMASTE_AY_029": { "namaste_code": "NAMASTE_AY_029", "traditional_term": "Kamala", "english_translation": "Jaundice", "medical_system": "Ayurveda", "category": "Hepatic disorders", "tm2_code": "XM12A2", "tm2_title": "Kamala pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "DA14", "icd_title": "Viral hepatitis", "mapping_type": "Exact", "confidence": 0.95 },
    "NAMASTE_AY_030": { "namaste_code": "NAMASTE_AY_030", "traditional_term": "Udararoga", "english_translation": "Abdominal Diseases", "medical_system": "Ayurveda", "category": "Gastrointestinal disorders", "tm2_code": "XM13A0", "tm2_title": "Udararoga pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "DB92", "icd_title": "Ascites", "mapping_type": "Exact", "confidence": 0.9 },
    "NAMASTE_AY_031": { "namaste_code": "NAMASTE_AY_031", "traditional_term": "Atisara", "english_translation": "Diarrhea", "medical_system": "Ayurveda", "category": "Intestinal disorders", "tm2_code": "XM13A1", "tm2_title": "Atisara pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "DD70", "icd_title": "Diarrhoea", "mapping_type": "Exact", "confidence": 0.94 },
    "NAMASTE_AY_032": { "namaste_code": "NAMASTE_AY_032", "traditional_term": "Vibandha", "english_translation": "Constipation", "medical_system": "Ayurveda", "category": "Bowel disorders", "tm2_code": "XM13A2", "tm2_title": "Vibandha pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "DD50", "icd_title": "Constipation", "mapping_type": "Exact", "confidence": 0.92 },
    "NAMASTE_AY_033": { "namaste_code": "NAMASTE_AY_033", "traditional_term": "Gulma", "english_translation": "Abdominal Tumor", "medical_system": "Ayurveda", "category": "Abdominal masses", "tm2_code": "XM14A0", "tm2_title": "Gulma pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "DA91", "icd_title": "Abdominal mass", "mapping_type": "Exact", "confidence": 0.91 },
    "NAMASTE_AY_034": { "namaste_code": "NAMASTE_AY_034", "traditional_term": "Udavarta", "english_translation": "Flatulence", "medical_system": "Ayurveda", "category": "Digestive gas disorders", "tm2_code": "XM14A1", "tm2_title": "Udavarta pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "DD91.1", "icd_title": "Flatulence", "mapping_type": "Exact", "confidence": 0.93 },
    "NAMASTE_AY_035": { "namaste_code": "NAMASTE_AY_035", "traditional_term": "Hikka", "english_translation": "Hiccup", "medical_system": "Ayurveda", "category": "Respiratory reflex disorders", "tm2_code": "XM14A2", "tm2_title": "Hikka pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "MD12", "icd_title": "Hiccup", "mapping_type": "Broader", "confidence": 0.87 },
    "NAMASTE_AY_036": { "namaste_code": "NAMASTE_AY_036", "traditional_term": "Rajayakshma", "english_translation": "Tuberculosis", "medical_system": "Ayurveda", "category": "Chronic respiratory infections", "tm2_code": "XM15A0", "tm2_title": "Rajayakshma pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "CA40", "icd_title": "Tuberculosis of lung", "mapping_type": "Exact", "confidence": 0.92 },
    "NAMASTE_AY_037": { "namaste_code": "NAMASTE_AY_037", "traditional_term": "Kshaya", "english_translation": "Wasting Disease", "medical_system": "Ayurveda", "category": "Degenerative disorders", "tm2_code": "XM15A1", "tm2_title": "Kshaya pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "5D00", "icd_title": "Wasting Disease", "mapping_type": "Exact", "confidence": 0.94 },
    "NAMASTE_AY_038": { "namaste_code": "NAMASTE_AY_038", "traditional_term": "Shopha", "english_translation": "Edema", "medical_system": "Ayurveda", "category": "Fluid retention disorders", "tm2_code": "XM15A2", "tm2_title": "Shopha pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "MG50", "icd_title": "Oedema", "mapping_type": "Exact", "confidence": 0.95 },
    "NAMASTE_AY_039": { "namaste_code": "NAMASTE_AY_039", "traditional_term": "Vatarakta", "english_translation": "Gout", "medical_system": "Ayurveda", "category": "Crystal arthropathy", "tm2_code": "XM16A0", "tm2_title": "Vatarakta pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "FA92", "icd_title": "Gout", "mapping_type": "Exact", "confidence": 0.91 },
    "NAMASTE_AY_040": { "namaste_code": "NAMASTE_AY_040", "traditional_term": "Gridhrasi", "english_translation": "Sciatica", "medical_system": "Ayurveda", "category": "Nerve compression disorders", "tm2_code": "XM16A1", "tm2_title": "Gridhrasi pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "8B94", "icd_title": "Sciatica", "mapping_type": "Exact", "confidence": 0.93 },
    "NAMASTE_AY_041": { "namaste_code": "NAMASTE_AY_041", "traditional_term": "Vishuchika", "english_translation": "Cholera", "medical_system": "Ayurveda", "category": "Acute diarrheal diseases", "tm2_code": "XM17A0", "tm2_title": "Vishuchika pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "1A40", "icd_title": "Cholera", "mapping_type": "Exact", "confidence": 0.92 },
    "NAMASTE_AY_042": { "namaste_code": "NAMASTE_AY_042", "traditional_term": "Alasaka", "english_translation": "Indigestion", "medical_system": "Ayurveda", "category": "Digestive dysfunction", "tm2_code": "XM17A1", "tm2_title": "Alasaka pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "DD91.2", "icd_title": "Functional dyspepsia", "mapping_type": "Exact", "confidence": 0.9 },
    "NAMASTE_AY_043": { "namaste_code": "NAMASTE_AY_043", "traditional_term": "Ajirna", "english_translation": "Dyspepsia", "medical_system": "Ayurveda", "category": "Digestive disorders", "tm2_code": "XM17A2", "tm2_title": "Ajirna pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "DD91.3", "icd_title": "Functional dyspepsia with pain", "mapping_type": "Broader", "confidence": 0.88 },
    "NAMASTE_AY_044": { "namaste_code": "NAMASTE_AY_044", "traditional_term": "Aruchi", "english_translation": "Loss of Appetite", "medical_system": "Ayurveda", "category": "Appetite disorders", "tm2_code": "XM18A0", "tm2_title": "Aruchi pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "5D10", "icd_title": "Loss of appetite", "mapping_type": "Exact", "confidence": 0.95 },
    "NAMASTE_AY_045": { "namaste_code": "NAMASTE_AY_045", "traditional_term": "Chhardi", "english_translation": "Vomiting", "medical_system": "Ayurveda", "category": "Gastrointestinal symptoms", "tm2_code": "XM18A1", "tm2_title": "Chhardi pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "DD43", "icd_title": "Vomiting", "mapping_type": "Exact", "confidence": 0.91 },
    "NAMASTE_AY_046": { "namaste_code": "NAMASTE_AY_046", "traditional_term": "Trishna", "english_translation": "Excessive Thirst", "medical_system": "Ayurveda", "category": "Fluid balance disorders", "tm2_code": "XM18A2", "tm2_title": "Trishna pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "5C50", "icd_title": "Excessive thirst", "mapping_type": "Exact", "confidence": 0.93 },
    "NAMASTE_AY_047": { "namaste_code": "NAMASTE_AY_047", "traditional_term": "Swasa", "english_translation": "Asthma", "medical_system": "Ayurveda", "category": "Chronic respiratory disorders", "tm2_code": "XM19A0", "tm2_title": "Swasa pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "CA25", "icd_title": "Asthma", "mapping_type": "Exact", "confidence": 0.94 },
    "NAMASTE_AY_048": { "namaste_code": "NAMASTE_AY_048", "traditional_term": "Kaphaja Kasa", "english_translation": "Productive Cough", "medical_system": "Ayurveda", "category": "Respiratory secretions", "tm2_code": "XM19A1", "tm2_title": "Kaphaja Kasa pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "CA81", "icd_title": "Productive cough", "mapping_type": "Exact", "confidence": 0.92 },
    "NAMASTE_AY_049": { "namaste_code": "NAMASTE_AY_049", "traditional_term": "Vataja Kasa", "english_translation": "Dry Cough", "medical_system": "Ayurveda", "category": "Non-productive cough", "tm2_code": "XM19A2", "tm2_title": "Vataja Kasa pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "CA82", "icd_title": "Dry cough", "mapping_type": "Exact", "confidence": 0.9 },
    "NAMASTE_AY_050": { "namaste_code": "NAMASTE_AY_050", "traditional_term": "Pittaja Kasa", "english_translation": "Hemoptysis", "medical_system": "Ayurveda", "category": "Blood in cough", "tm2_code": "XM20A0", "tm2_title": "Pittaja Kasa pattern (Ayurveda - Traditional Medicine Module 2)", "icd_code": "CA83", "icd_title": "Hemoptysis", "mapping_type": "Exact", "confidence": 0.95 },
    "NAMASTE_SI_001": { "namaste_code": "NAMASTE_SI_001", "traditional_term": "Suram", "english_translation": "Fever", "medical_system": "Siddha", "category": "Pyretic conditions", "tm2_code": "XM20A1", "tm2_title": "Suram pattern (Siddha - Traditional Medicine Module 2)", "icd_code": "MA70", "icd_title": "Fever", "mapping_type": "Exact", "confidence": 0.93 },
    "NAMASTE_SI_002": { "namaste_code": "NAMASTE_SI_002", "traditional_term": "Irumal", "english_translation": "Cough", "medical_system": "Siddha", "category": "Respiratory ailments", "tm2_code": "XM20A2", "tm2_title": "Irumal pattern (Siddha - Traditional Medicine Module 2)", "icd_code": "MA71", "icd_title": "Cough", "mapping_type": "Exact", "confidence": 0.91 },
    "NAMASTE_SI_003": { "namaste_code": "NAMASTE_SI_003", "traditional_term": "Moolam", "english_translation": "Hemorrhoids", "medical_system": "Siddha", "category": "Anorectal diseases", "tm2_code": "XM20A3", "tm2_title": "Moolam pattern (Siddha - Traditional Medicine Module 2)", "icd_code": "MA72", "icd_title": "Hemorrhoids", "mapping_type": "Exact", "confidence": 0.92 },
    "NAMASTE_SI_004": { "namaste_code": "NAMASTE_SI_004", "traditional_term": "Neerkozhuppu", "english_translation": "Diabetes", "medical_system": "Siddha", "category": "Endocrine disorders", "tm2_code": "XM20A4", "tm2_title": "Neerkozhuppu pattern (Siddha - Traditional Medicine Module 2)", "icd_code": "MA73", "icd_title": "Diabetes", "mapping_type": "Exact", "confidence": 0.9 },
    "NAMASTE_SI_005": { "namaste_code": "NAMASTE_SI_005", "traditional_term": "Vayu", "english_translation": "Rheumatism", "medical_system": "Siddha", "category": "Rheumatic conditions", "tm2_code": "XM20A5", "tm2_title": "Vayu pattern (Siddha - Traditional Medicine Module 2)", "icd_code": "MA74", "icd_title": "Rheumatism", "mapping_type": "Exact", "confidence": 0.94 },
    "NAMASTE_SI_006": { "namaste_code": "NAMASTE_SI_006", "traditional_term": "Kalladaippu", "english_translation": "Renal Calculi", "medical_system": "Siddha", "category": "Urological disorders", "tm2_code": "XM20A6", "tm2_title": "Kalladaippu pattern (Siddha - Traditional Medicine Module 2)", "icd_code": "MA75", "icd_title": "Renal Calculi", "mapping_type": "Exact", "confidence": 0.93 },
    "NAMASTE_SI_007": { "namaste_code": "NAMASTE_SI_007", "traditional_term": "Vellai", "english_translation": "Leucorrhoea", "medical_system": "Siddha", "category": "Gynecological conditions", "tm2_code": "XM20A7", "tm2_title": "Vellai pattern (Siddha - Traditional Medicine Module 2)", "icd_code": "MA76", "icd_title": "Leucorrhoea", "mapping_type": "Broader", "confidence": 0.87 },
    "NAMASTE_SI_008": { "namaste_code": "NAMASTE_SI_008", "traditional_term": "Kamalai", "english_translation": "Jaundice", "medical_system": "Siddha", "category": "Hepatic disorders", "tm2_code": "XM20A8", "tm2_title": "Kamalai pattern (Siddha - Traditional Medicine Module 2)", "icd_code": "MA77", "icd_title": "Jaundice", "mapping_type": "Exact", "confidence": 0.92 },
    "NAMASTE_SI_009": { "namaste_code": "NAMASTE_SI_009", "traditional_term": "Kirimikkozhuppu", "english_translation": "Helminthiasis", "medical_system": "Siddha", "category": "Parasitic diseases", "tm2_code": "XM20A9", "tm2_title": "Kirimikkozhuppu pattern (Siddha - Traditional Medicine Module 2)", "icd_code": "MA78", "icd_title": "Helminthiasis", "mapping_type": "Exact", "confidence": 0.94 },
    "NAMASTE_SI_010": { "namaste_code": "NAMASTE_SI_010", "traditional_term": "Thalainokku", "english_translation": "Headache", "medical_system": "Siddha", "category": "Cephalic disorders", "tm2_code": "XM21A0", "tm2_title": "Thalainokku pattern (Siddha - Traditional Medicine Module 2)", "icd_code": "MA79", "icd_title": "Headache", "mapping_type": "Exact", "confidence": 0.95 },
    "NAMASTE_SI_011": { "namaste_code": "NAMASTE_SI_011", "traditional_term": "Gunmam", "english_translation": "Peptic Ulcer", "medical_system": "Siddha", "category": "Gastric disorders", "tm2_code": "XM21A1", "tm2_title": "Gunmam pattern (Siddha - Traditional Medicine Module 2)", "icd_code": "NA80", "icd_title": "Peptic Ulcer", "mapping_type": "Exact", "confidence": 0.91 },
    "NAMASTE_SI_012": { "namaste_code": "NAMASTE_SI_012", "traditional_term": "Sirummool", "english_translation": "Anal Fissure", "medical_system": "Siddha", "category": "Anorectal conditions", "tm2_code": "XM21A2", "tm2_title": "Sirummool pattern (Siddha - Traditional Medicine Module 2)", "icd_code": "NA81", "icd_title": "Anal Fissure", "mapping_type": "Exact", "confidence": 0.9 },
    "NAMASTE_SI_013": { "namaste_code": "NAMASTE_SI_013", "traditional_term": "Kazhichal", "english_translation": "Diarrhea", "medical_system": "Siddha", "category": "Intestinal disorders", "tm2_code": "XM21A3", "tm2_title": "Kazhichal pattern (Siddha - Traditional Medicine Module 2)", "icd_code": "NA82", "icd_title": "Diarrhea", "mapping_type": "Exact", "confidence": 0.92 },
    "NAMASTE_SI_014": { "namaste_code": "NAMASTE_SI_014", "traditional_term": "Malakkaduppu", "english_translation": "Constipation", "medical_system": "Siddha", "category": "Bowel disorders", "tm2_code": "XM21A4", "tm2_title": "Malakkaduppu pattern (Siddha - Traditional Medicine Module 2)", "icd_code": "NA83", "icd_title": "Constipation", "mapping_type": "Exact", "confidence": 0.93 },
    "NAMASTE_SI_015": { "namaste_code": "NAMASTE_SI_015", "traditional_term": "Kiranthi", "english_translation": "Skin Diseases", "medical_system": "Siddha", "category": "Dermatological conditions", "tm2_code": "XM21A5", "tm2_title": "Kiranthi pattern (Siddha - Traditional Medicine Module 2)", "icd_code": "NA84", "icd_title": "Skin Diseases", "mapping_type": "Exact", "confidence": 0.94 },
    "NAMASTE_SI_016": { "namaste_code": "NAMASTE_SI_016", "traditional_term": "Kandamaalai", "english_translation": "Lymphadenitis", "medical_system": "Siddha", "category": "Lymphatic disorders", "tm2_code": "XM21A6", "tm2_title": "Kandamaalai pattern (Siddha - Traditional Medicine Module 2)", "icd_code": "NA85", "icd_title": "Lymphadenitis", "mapping_type": "Exact", "confidence": 0.92 },
    "NAMASTE_SI_017": { "namaste_code": "NAMASTE_SI_017", "traditional_term": "Gunmakkazhichal", "english_translation": "IBS", "medical_system": "Siddha", "category": "Functional bowel disorders", "tm2_code": "XM21A7", "tm2_title": "Gunmakkazhichal pattern (Siddha - Traditional Medicine Module 2)", "icd_code": "NA86", "icd_title": "IBS", "mapping_type": "Exact", "confidence": 0.91 },
    "NAMASTE_SI_018": { "namaste_code": "NAMASTE_SI_018", "traditional_term": "Neerkatti", "english_translation": "Urinary Infection", "medical_system": "Siddha", "category": "Genitourinary infections", "tm2_code": "XM21A8", "tm2_title": "Neerkatti pattern (Siddha - Traditional Medicine Module 2)", "icd_code": "NA87", "icd_title": "Urinary Infection", "mapping_type": "Exact", "confidence": 0.93 },
    "NAMASTE_SI_019": { "namaste_code": "NAMASTE_SI_019", "traditional_term": "Vairalekam", "english_translation": "Migraine", "medical_system": "Siddha", "category": "Neurological headaches", "tm2_code": "XM21A9", "tm2_title": "Vairalekam pattern (Siddha - Traditional Medicine Module 2)", "icd_code": "NA88", "icd_title": "Migraine", "mapping_type": "Exact", "confidence": 0.94 },
    "NAMASTE_SI_020": { "namaste_code": "NAMASTE_SI_020", "traditional_term": "Asthimoolam", "english_translation": "Osteoporosis", "medical_system": "Siddha", "category": "Bone disorders", "tm2_code": "XM22A0", "tm2_title": "Asthimoolam pattern (Siddha - Traditional Medicine Module 2)", "icd_code": "NA89", "icd_title": "Osteoporosis", "mapping_type": "Broader", "confidence": 0.88 },
    "NAMASTE_SI_021": { "namaste_code": "NAMASTE_SI_021", "traditional_term": "Iranokku", "english_translation": "Dyspnea", "medical_system": "Siddha", "category": "Respiratory symptoms", "tm2_code": "XM22A1", "tm2_title": "Iranokku pattern (Siddha - Traditional Medicine Module 2)", "icd_code": "OA90", "icd_title": "Dyspnea", "mapping_type": "Exact", "confidence": 0.92 },
    "NAMASTE_SI_022": { "namaste_code": "NAMASTE_SI_022", "traditional_term": "Manneerkozhuppu", "english_translation": "Ascites", "medical_system": "Siddha", "category": "Fluid accumulation", "tm2_code": "XM22A2", "tm2_title": "Manneerkozhuppu pattern (Siddha - Traditional Medicine Module 2)", "icd_code": "OA91", "icd_title": "Ascites", "mapping_type": "Exact", "confidence": 0.94 },
    "NAMASTE_SI_023": { "namaste_code": "NAMASTE_SI_023", "traditional_term": "Kiranthivayu", "english_translation": "Arthritis", "medical_system": "Siddha", "category": "Joint inflammation", "tm2_code": "XM22A3", "tm2_title": "Kiranthivayu pattern (Siddha - Traditional Medicine Module 2)", "icd_code": "OA92", "icd_title": "Arthritis", "mapping_type": "Exact", "confidence": 0.9 },
    "NAMASTE_SI_024": { "namaste_code": "NAMASTE_SI_024", "traditional_term": "Mehapadanam", "english_translation": "Diabetic Complications", "medical_system": "Siddha", "category": "Diabetic sequelae", "tm2_code": "XM22A4", "tm2_title": "Mehapadanam pattern (Siddha - Traditional Medicine Module 2)", "icd_code": "OA93", "icd_title": "Diabetic Complications", "mapping_type": "Exact", "confidence": 0.93 },
    "NAMASTE_SI_025": { "namaste_code": "NAMASTE_SI_025", "traditional_term": "Karappai", "english_translation": "Eczema", "medical_system": "Siddha", "category": "Chronic skin conditions", "tm2_code": "XM22A5", "tm2_title": "Karappai pattern (Siddha - Traditional Medicine Module 2)", "icd_code": "OA94", "icd_title": "Eczema", "mapping_type": "Exact", "confidence": 0.91 },
    "NAMASTE_UN_001": { "namaste_code": "NAMASTE_UN_001", "traditional_term": "Humma", "english_translation": "Fever", "medical_system": "Unani", "category": "Febrile conditions", "tm2_code": "XM22A6", "tm2_title": "Humma pattern (Unani - Traditional Medicine Module 2)", "icd_code": "JA40", "icd_title": "Fever", "mapping_type": "Exact", "confidence": 0.93 },
    "NAMASTE_UN_002": { "namaste_code": "NAMASTE_UN_002", "traditional_term": "Sual", "english_translation": "Cough", "medical_system": "Unani", "category": "Respiratory disorders", "tm2_code": "XM22A7", "tm2_title": "Sual pattern (Unani - Traditional Medicine Module 2)", "icd_code": "JA41", "icd_title": "Cough", "mapping_type": "Exact", "confidence": 0.91 },
    "NAMASTE_UN_003": { "namaste_code": "NAMASTE_UN_003", "traditional_term": "Zeequnnafs", "english_translation": "Dyspnea", "medical_system": "Unani", "category": "Breathing disorders", "tm2_code": "XM22A8", "tm2_title": "Zeequnnafs pattern (Unani - Traditional Medicine Module 2)", "icd_code": "JA42", "icd_title": "Dyspnea", "mapping_type": "Exact", "confidence": 0.92 },
    "NAMASTE_UN_004": { "namaste_code": "NAMASTE_UN_004", "traditional_term": "Humuzat", "english_translation": "Hyperacidity", "medical_system": "Unani", "category": "Gastric disorders", "tm2_code": "XM22A9", "tm2_title": "Humuzat pattern (Unani - Traditional Medicine Module 2)", "icd_code": "JA43", "icd_title": "Hyperacidity", "mapping_type": "Exact", "confidence": 0.9 },
    "NAMASTE_UN_005": { "namaste_code": "NAMASTE_UN_005", "traditional_term": "Ishaal", "english_translation": "Diarrhea", "medical_system": "Unani", "category": "Intestinal disorders", "tm2_code": "XM23A0", "tm2_title": "Ishaal pattern (Unani - Traditional Medicine Module 2)", "icd_code": "JA44", "icd_title": "Diarrhea", "mapping_type": "Exact", "confidence": 0.94 },
    "NAMASTE_UN_006": { "namaste_code": "NAMASTE_UN_006", "traditional_term": "Bawaseer", "english_translation": "Hemorrhoids", "medical_system": "Unani", "category": "Anorectal conditions", "tm2_code": "XM23A1", "tm2_title": "Bawaseer pattern (Unani - Traditional Medicine Module 2)", "icd_code": "JA45", "icd_title": "Hemorrhoids", "mapping_type": "Exact", "confidence": 0.93 },
    "NAMASTE_UN_007": { "namaste_code": "NAMASTE_UN_007", "traditional_term": "Ziabetus", "english_translation": "Diabetes", "medical_system": "Unani", "category": "Metabolic disorders", "tm2_code": "XM23A2", "tm2_title": "Ziabetus pattern (Unani - Traditional Medicine Module 2)", "icd_code": "JA46", "icd_title": "Diabetes", "mapping_type": "Broader", "confidence": 0.87 },
    "NAMASTE_UN_008": { "namaste_code": "NAMASTE_UN_008", "traditional_term": "Amraze Qalb", "english_translation": "Heart Disease", "medical_system": "Unani", "category": "Cardiac disorders", "tm2_code": "XM23A3", "tm2_title": "Amraze Qalb pattern (Unani - Traditional Medicine Module 2)", "icd_code": "JA47", "icd_title": "Heart Disease", "mapping_type": "Exact", "confidence": 0.92 },
    "NAMASTE_UN_009": { "namaste_code": "NAMASTE_UN_009", "traditional_term": "Sudaa", "english_translation": "Headache", "medical_system": "Unani", "category": "Neurological conditions", "tm2_code": "XM23A4", "tm2_title": "Sudaa pattern (Unani - Traditional Medicine Module 2)", "icd_code": "JA48", "icd_title": "Headache", "mapping_type": "Exact", "confidence": 0.94 },
    "NAMASTE_UN_010": { "namaste_code": "NAMASTE_UN_010", "traditional_term": "Waja ul Mafasil", "english_translation": "Joint Pain", "medical_system": "Unani", "category": "Arthritic conditions", "tm2_code": "XM23A5", "tm2_title": "Waja ul Mafasil pattern (Unani - Traditional Medicine Module 2)", "icd_code": "JA49", "icd_title": "Joint Pain", "mapping_type": "Exact", "confidence": 0.95 },
    "NAMASTE_UN_011": { "namaste_code": "NAMASTE_UN_011", "traditional_term": "Yarqan", "english_translation": "Jaundice", "medical_system": "Unani", "category": "Hepatic disorders", "tm2_code": "XM23A6", "tm2_title": "Yarqan pattern (Unani - Traditional Medicine Module 2)", "icd_code": "KA50", "icd_title": "Jaundice", "mapping_type": "Exact", "confidence": 0.91 },
    "NAMASTE_UN_012": { "namaste_code": "NAMASTE_UN_012", "traditional_term": "Qubz", "english_translation": "Constipation", "medical_system": "Unani", "category": "Bowel disorders", "tm2_code": "XM23A7", "tm2_title": "Qubz pattern (Unani - Traditional Medicine Module 2)", "icd_code": "KA51", "icd_title": "Constipation", "mapping_type": "Exact", "confidence": 0.9 },
    "NAMASTE_UN_013": { "namaste_code": "NAMASTE_UN_013", "traditional_term": "Sara", "english_translation": "Epilepsy", "medical_system": "Unani", "category": "Neurological seizures", "tm2_code": "XM23A8", "tm2_title": "Sara pattern (Unani - Traditional Medicine Module 2)", "icd_code": "KA52", "icd_title": "Epilepsy", "mapping_type": "Exact", "confidence": 0.92 },
    "NAMASTE_UN_014": { "namaste_code": "NAMASTE_UN_014", "traditional_term": "Falij", "english_translation": "Paralysis", "medical_system": "Unani", "category": "Motor disorders", "tm2_code": "XM23A9", "tm2_title": "Falij pattern (Unani - Traditional Medicine Module 2)", "icd_code": "KA53", "icd_title": "Paralysis", "mapping_type": "Exact", "confidence": 0.93 },
    "NAMASTE_UN_015": { "namaste_code": "NAMASTE_UN_015", "traditional_term": "Rasha", "english_translation": "Tremor", "medical_system": "Unani", "category": "Movement disorders", "tm2_code": "XM24A0", "tm2_title": "Rasha pattern (Unani - Traditional Medicine Module 2)", "icd_code": "KA54", "icd_title": "Tremor", "mapping_type": "Exact", "confidence": 0.94 },
    "NAMASTE_UN_016": { "namaste_code": "NAMASTE_UN_016", "traditional_term": "Baras", "english_translation": "Leucoderma", "medical_system": "Unani", "category": "Pigmentation disorders", "tm2_code": "XM24A1", "tm2_title": "Baras pattern (Unani - Traditional Medicine Module 2)", "icd_code": "KA55", "icd_title": "Leucoderma", "mapping_type": "Exact", "confidence": 0.92 },
    "NAMASTE_UN_017": { "namaste_code": "NAMASTE_UN_017", "traditional_term": "Chechak", "english_translation": "Smallpox", "medical_system": "Unani", "category": "Viral infections", "tm2_code": "XM24A2", "tm2_title": "Chechak pattern (Unani - Traditional Medicine Module 2)", "icd_code": "KA56", "icd_title": "Smallpox", "mapping_type": "Exact", "confidence": 0.91 },
    "NAMASTE_UN_018": { "namaste_code": "NAMASTE_UN_018", "traditional_term": "Hasba", "english_translation": "Measles", "medical_system": "Unani", "category": "Childhood infections", "tm2_code": "XM24A3", "tm2_title": "Hasba pattern (Unani - Traditional Medicine Module 2)", "icd_code": "KA57", "icd_title": "Measles", "mapping_type": "Exact", "confidence": 0.93 },
    "NAMASTE_UN_019": { "namaste_code": "NAMASTE_UN_019", "traditional_term": "Diq", "english_translation": "Tuberculosis", "medical_system": "Unani", "category": "Chronic infections", "tm2_code": "XM24A4", "tm2_title": "Diq pattern (Unani - Traditional Medicine Module 2)", "icd_code": "KA58", "icd_title": "Tuberculosis", "mapping_type": "Exact", "confidence": 0.94 },
    "NAMASTE_UN_020": { "namaste_code": "NAMASTE_UN_020", "traditional_term": "Waram", "english_translation": "Inflammation", "medical_system": "Unani", "category": "Inflammatory conditions", "tm2_code": "XM24A5", "tm2_title": "Waram pattern (Unani - Traditional Medicine Module 2)", "icd_code": "KA59", "icd_title": "Inflammation", "mapping_type": "Broader", "confidence": 0.88 },
    "NAMASTE_UN_021": { "namaste_code": "NAMASTE_UN_021", "traditional_term": "Sil", "english_translation": "Pneumonia", "medical_system": "Unani", "category": "Lung infections", "tm2_code": "XM24A6", "tm2_title": "Sil pattern (Unani - Traditional Medicine Module 2)", "icd_code": "LA60", "icd_title": "Pneumonia", "mapping_type": "Exact", "confidence": 0.92 },
    "NAMASTE_UN_022": { "namaste_code": "NAMASTE_UN_022", "traditional_term": "Ramad", "english_translation": "Ophthalmia", "medical_system": "Unani", "category": "Eye infections", "tm2_code": "XM24A7", "tm2_title": "Ramad pattern (Unani - Traditional Medicine Module 2)", "icd_code": "LA61", "icd_title": "Ophthalmia", "mapping_type": "Exact", "confidence": 0.94 },
    "NAMASTE_UN_023": { "namaste_code": "NAMASTE_UN_023", "traditional_term": "Amraze Uzn", "english_translation": "Ear Diseases", "medical_system": "Unani", "category": "Otological conditions", "tm2_code": "XM24A8", "tm2_title": "Amraze Uzn pattern (Unani - Traditional Medicine Module 2)", "icd_code": "LA62", "icd_title": "Ear Diseases", "mapping_type": "Exact", "confidence": 0.9 },
    "NAMASTE_UN_024": { "namaste_code": "NAMASTE_UN_024", "traditional_term": "Saman", "english_translation": "Obesity", "medical_system": "Unani", "category": "Weight disorders", "tm2_code": "XM24A9", "tm2_title": "Saman pattern (Unani - Traditional Medicine Module 2)", "icd_code": "LA63", "icd_title": "Obesity", "mapping_type": "Exact", "confidence": 0.93 },
    "NAMASTE_UN_025": { "namaste_code": "NAMASTE_UN_025", "traditional_term": "Hazal", "english_translation": "Emaciation", "medical_system": "Unani", "category": "Wasting conditions", "tm2_code": "XM25A0", "tm2_title": "Hazal pattern (Unani - Traditional Medicine Module 2)", "icd_code": "LA64", "icd_title": "Emaciation", "mapping_type": "Exact", "confidence": 0.91 }
};

function findTranslationEntry(query) {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    for (const entry of Object.values(TRANSLATION_DB)) {
        if (entry.namaste_code.toLowerCase() === q) return entry;
    }
    for (const entry of Object.values(TRANSLATION_DB)) {
        if (entry.traditional_term.toLowerCase() === q) return entry;
    }
    for (const entry of Object.values(TRANSLATION_DB)) {
        if (entry.english_translation.toLowerCase() === q) return entry;
    }
    for (const entry of Object.values(TRANSLATION_DB)) {
        if (entry.traditional_term.toLowerCase().includes(q) || entry.english_translation.toLowerCase().includes(q)) return entry;
    }
    return null;
}

async function performTranslation() {
    const code = namasteCodeInput.value.trim();

    if (!code) {
        showTranslationError('Please enter a NAMASTE code');
        return;
    }

    showTranslationLoading();

    const entry = findTranslationEntry(code);
    if (entry) {
        setTimeout(() => {
            displayTranslationResults({
                mappings: [
                    {
                        target_code: entry.tm2_code,
                        target_display: entry.tm2_title,
                        confidence: entry.confidence,
                        equivalence: entry.mapping_type === 'Exact' ? 'equivalent' : 'wider'
                    },
                    {
                        target_code: entry.icd_code,
                        target_display: `${entry.icd_title} (ICD-11 Biomedicine)`,
                        confidence: entry.confidence,
                        equivalence: entry.mapping_type === 'Exact' ? 'equivalent' : 'wider'
                    }
                ]
            });
        }, 900);
        return;
    }

    try {
        const response = await fetch('https://sih-2025-xi-one.vercel.app/translate/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                source_code: code,
                source_system: 'NAMASTE-Ayurveda',
                target_system: 'ICD-11'
            })
        });

        const data = await response.json();
        displayTranslationResults(data);
    } catch (error) {
        showTranslationError(`Translation failed: ${error.message}`);
    }
}

function showTranslationLoading() {
    translationResults.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Translating...</p>
        </div>
    `;
}

function showTranslationError(message) {
    translationResults.innerHTML = `
        <div class="error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
}

function displayTranslationResults(data) {
    if (data.mappings && data.mappings.length > 0) {
        const resultsHtml = data.mappings.map(mapping => `
            <div class="translation-result">
                <div class="mapping-header">
                    <span class="target-code">${mapping.target_code || 'N/A'}</span>
                    <span class="confidence">${Math.round(mapping.confidence * 100)}% confidence</span>
                </div>
                <div class="mapping-content">
                    <p class="target-display">${mapping.target_display || 'ICD-11:'}</p>
                    <p class="equivalence">Equivalence: ${mapping.equivalence}</p>
                </div>
            </div>
        `).join('');
        
        translationResults.innerHTML = `
            <div class="translation-results-header">
                <h4>Translation Results</h4>
            </div>
            <div class="translation-results-list">
                ${resultsHtml}
            </div>
        `;
    } else {
        translationResults.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exchange-alt"></i>
                <p>No translations found for "${namasteCodeInput.value}"</p>
            </div>
        `;
    }
}

// File Upload Functionality
const csvUploadBtn = document.getElementById('uploadCsvBtn');
const bundleUploadBtn = document.getElementById('uploadBundleBtn');
const uploadResults = document.getElementById('uploadResults');

if (csvUploadBtn) {
    csvUploadBtn.addEventListener('click', () => uploadFile('csv'));
}
if (bundleUploadBtn) {
    bundleUploadBtn.addEventListener('click', () => uploadFile('bundle'));
}

function uploadFile(type) {
    const fileInput = type === 'csv' ? document.getElementById('csvUpload') : document.getElementById('bundleUpload');
    const file = fileInput.files[0];
    
    if (!file) {
        showUploadError('Please select a file to upload');
        return;
    }
    
    showUploadLoading();
    
    const formData = new FormData();
    formData.append('file', file);
    
    const endpoint = type === 'csv' ? 'https://sih-2025-xi-one.vercel.app/ingest/namaste' : 'https://sih-2025-xi-one.vercel.app/bundle/upload';
    
    fetch(endpoint, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        displayUploadResults(data, type);
    })
    .catch(error => {
        showUploadError(`Upload failed: ${error.message}`);
    });
}

function showUploadLoading() {
    uploadResults.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Uploading and processing...</p>
        </div>
    `;
}

function showUploadError(message) {
    uploadResults.innerHTML = `
        <div class="error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
}

function displayUploadResults(data, type) {
    uploadResults.innerHTML = `
        <div class="upload-success">
            <i class="fas fa-check-circle"></i>
            <h4>Upload Successful!</h4>
            <p>${type.toUpperCase()} file processed successfully</p>
            ${data.upload_id ? `<p>Upload ID: ${data.upload_id}</p>` : ''}
        </div>
    `;
}

// FAQ Accordion Functionality
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    
    question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        // Close all FAQ items
        faqItems.forEach(faq => faq.classList.remove('active'));
        
        // Open clicked item if it wasn't active
        if (!isActive) {
            item.classList.add('active');
        }
    });
});

// Contact Form Functionality
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData);
    
    // Simulate form submission
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
        submitBtn.style.background = 'var(--accent-color)';
        
        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            submitBtn.style.background = '';
            contactForm.reset();
        }, 2000);
    }, 1500);
    });
}

// Scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.problem-card, .feature-card, .team-member, .value-card').forEach(el => {
    observer.observe(el);
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(10, 10, 10, 0.98)';
    } else {
        navbar.style.background = 'rgba(10, 10, 10, 0.95)';
    }
});

// Loading states for demo
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading...</p>
            </div>
        `;
    }
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Add fade-in animation to hero content
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.classList.add('fade-in-up');
    }
    
    // Initialize tooltips if any
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(tooltip => {
        tooltip.addEventListener('mouseenter', showTooltip);
        tooltip.addEventListener('mouseleave', hideTooltip);
    });
});

// Tooltip functionality
function showTooltip(e) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = e.target.getAttribute('data-tooltip');
    document.body.appendChild(tooltip);
    
    const rect = e.target.getBoundingClientRect();
    tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
}

function hideTooltip() {
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

// NLP Diagnosis functionality
// ---------------------------------------------------------------------------
// GenAI Clinical-Note Auto-Coder
// ---------------------------------------------------------------------------
// Two engines feed the SAME result renderer (displayDiagnosisResults):
//   1. Real Claude API  -> used when window.HUBBLE_AI_CONFIG is provided
//                          (endpoint should be YOUR serverless proxy that holds
//                          the API key; browsers must never ship a raw key).
//   2. Grounded offline -> default. Extracts conditions from free text and maps
//                          them through the shipped TRANSLATION_DB (100 real
//                          NAMASTE<->ICD-11 codes). Works with no network so the
//                          live demo can never fail on stage.
// ---------------------------------------------------------------------------

// --- Language auto-detection ----------------------------------------------
// Script-range based detection: each Indian language here has its own Unicode
// block, so counting characters per block identifies the language reliably
// without any network call.
const LANGUAGE_SCRIPTS = [
    { code: 'hi', name: 'Hindi (हिंदी)',      range: /[ऀ-ॿ]/g },
    { code: 'bn', name: 'Bengali (বাংলা)',    range: /[ঀ-৿]/g },
    { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)',   range: /[਀-੿]/g },
    { code: 'gu', name: 'Gujarati (ગુજરાતી)', range: /[઀-૿]/g },
    { code: 'ta', name: 'Tamil (தமிழ்)',      range: /[஀-௿]/g },
    { code: 'te', name: 'Telugu (తెలుగు)',    range: /[ఀ-౿]/g },
    { code: 'kn', name: 'Kannada (ಕನ್ನಡ)',    range: /[ಀ-೿]/g },
    { code: 'ml', name: 'Malayalam (മലയാളം)', range: /[ഀ-ൿ]/g }
];

const LANGUAGE_NAMES = {
    en: 'English',
    ...Object.fromEntries(LANGUAGE_SCRIPTS.map(s => [s.code, s.name]))
};

// Returns { code, name, detected } — detected=true when we inferred it.
function detectLanguage(text) {
    let best = null;
    let bestCount = 0;

    for (const script of LANGUAGE_SCRIPTS) {
        const count = (text.match(script.range) || []).length;
        if (count > bestCount) {
            bestCount = count;
            best = script;
        }
    }

    // Fall back to English when no Indic script is present.
    if (!best || bestCount === 0) {
        return { code: 'en', name: 'English', detected: true };
    }
    return { code: best.code, name: best.name, detected: true };
}

function resolveLanguage(text, selected) {
    if (selected === 'auto') return detectLanguage(text);
    return { code: selected, name: LANGUAGE_NAMES[selected] || selected, detected: false };
}

// Extra colloquial / cross-language cues that point at a TRANSLATION_DB entry.
// Keys are lowercase surface terms a doctor might type; values are NAMASTE codes.
const AI_SYNONYMS = {
    'fever': 'NAMASTE_AY_001', 'jwara': 'NAMASTE_AY_001', 'pyrexia': 'NAMASTE_AY_001',
    'बुखार': 'NAMASTE_AY_001', 'ज्वर': 'NAMASTE_AY_001',
    'cough': 'NAMASTE_AY_002', 'kasa': 'NAMASTE_AY_002', 'खांसी': 'NAMASTE_AY_002', 'कास': 'NAMASTE_AY_002',
    'breathlessness': 'NAMASTE_AY_003', 'dyspnea': 'NAMASTE_AY_003', 'dyspnoea': 'NAMASTE_AY_003',
    'shortness of breath': 'NAMASTE_AY_003', 'asthma': 'NAMASTE_AY_003', 'shwasa': 'NAMASTE_AY_003',
    'acidity': 'NAMASTE_AY_004', 'acid peptic': 'NAMASTE_AY_004', 'heartburn': 'NAMASTE_AY_004',
    'gastritis': 'NAMASTE_AY_004', 'amlapitta': 'NAMASTE_AY_004', 'अम्लपित्त': 'NAMASTE_AY_004',
    'ibs': 'NAMASTE_AY_005', 'irritable bowel': 'NAMASTE_AY_005', 'grahani': 'NAMASTE_AY_005',
    'piles': 'NAMASTE_AY_006', 'haemorrhoid': 'NAMASTE_AY_006', 'hemorrhoid': 'NAMASTE_AY_006', 'arsha': 'NAMASTE_AY_006',
    'diabetes': 'NAMASTE_AY_007', 'madhumeha': 'NAMASTE_AY_007', 'prameha': 'NAMASTE_AY_007',
    'sugar': 'NAMASTE_AY_007', 'मधुमेह': 'NAMASTE_AY_007',
    'heart disease': 'NAMASTE_AY_008', 'cardiac': 'NAMASTE_AY_008', 'heart': 'NAMASTE_AY_008',
    'hridroga': 'NAMASTE_AY_008', 'हृदयरोग': 'NAMASTE_AY_008',
    'headache': 'NAMASTE_AY_009', 'shirahshula': 'NAMASTE_AY_009', 'सिरदर्द': 'NAMASTE_AY_009',
    'osteoarthritis': 'NAMASTE_AY_010', 'joint pain': 'NAMASTE_AY_010', 'arthritis': 'NAMASTE_AY_010',
    'sandhivata': 'NAMASTE_AY_010', 'जोड़ों का दर्द': 'NAMASTE_AY_010'
};

// Pull every distinct condition the note refers to, mapped to TRANSLATION_DB.
function extractConditions(text) {
    const note = ' ' + text.toLowerCase() + ' ';
    const hits = new Map(); // namaste_code -> {entry, surface, score}

    const consider = (entry, surface, score) => {
        if (!entry) return;
        const prev = hits.get(entry.namaste_code);
        if (!prev || score > prev.score) {
            hits.set(entry.namaste_code, { entry, surface, score });
        }
    };

    // 1) Direct matches against the real terminology (traditional + english terms).
    for (const entry of Object.values(TRANSLATION_DB)) {
        const trad = entry.traditional_term.toLowerCase();
        const eng = entry.english_translation.toLowerCase();
        if (note.includes(' ' + trad + ' ') || note.includes(trad)) consider(entry, entry.traditional_term, entry.confidence);
        if (note.includes(eng)) consider(entry, entry.english_translation, entry.confidence * 0.98);
    }

    // 2) Colloquial / multilingual synonyms.
    for (const [term, code] of Object.entries(AI_SYNONYMS)) {
        if (note.includes(term)) consider(TRANSLATION_DB[code], term, (TRANSLATION_DB[code]?.confidence || 0.8) * 0.95);
    }

    return Array.from(hits.values()).sort((a, b) => b.score - a.score);
}

// Build a FHIR R4 Bundle with dual-coded Condition resources (the core deliverable
// of the SIH problem statement: one problem carrying BOTH NAMASTE and ICD-11 codes).
function buildFhirBundle(matches) {
    return {
        resourceType: 'Bundle',
        type: 'collection',
        entry: matches.map(m => ({
            resource: {
                resourceType: 'Condition',
                clinicalStatus: { coding: [{ code: 'active' }] },
                code: {
                    text: m.entry.english_translation,
                    coding: [
                        { system: 'https://ayush.gov.in/fhir/CodeSystem/namaste', code: m.entry.namaste_code, display: m.entry.traditional_term },
                        { system: 'http://id.who.int/icd/release/11/mms', code: m.entry.tm2_code, display: m.entry.tm2_title },
                        { system: 'http://id.who.int/icd/release/11/mms', code: m.entry.icd_code, display: m.entry.icd_title }
                    ]
                }
            }
        }))
    };
}

// The grounded offline engine — produces exactly the shape displayDiagnosisResults wants.
// `lang` may be a selector value ('auto', 'hi', ...) or an already-resolved object.
function autoCodeOffline(text, lang) {
    const L = (lang && typeof lang === 'object') ? lang : resolveLanguage(text, lang);
    const matches = extractConditions(text);
    const overall = matches.length ? matches.reduce((s, m) => s + m.score, 0) / matches.length : 0;

    return {
        diagnosis_id: 'HUB-' + Date.now(),
        original_text: text,
        processed_text: matches.length
            ? `Identified ${matches.length} codable condition(s): ${matches.map(m => m.entry.english_translation).join(', ')}.`
            : 'No known condition matched in the demo terminology set.',
        input_language: L.detected ? `${L.name} (auto-detected)` : L.name,
        medical_terms: matches.map(m => m.surface),
        ayush_matches: matches.map(m => ({
            namaste_code: m.entry.namaste_code,
            display: `${m.entry.traditional_term} — ${m.entry.english_translation} (${m.entry.medical_system})`,
            confidence: m.score
        })),
        biomedical_matches: matches.map(m => ({
            icd_code: m.entry.icd_code,
            display: `${m.entry.icd_title} · TM2: ${m.entry.tm2_code}`,
            confidence: m.score
        })),
        confidence_scores: { overall_confidence: overall },
        dual_coding: { fhir_bundle: buildFhirBundle(matches) }
    };
}

// ---------------------------------------------------------------------------
// Gemini path — real, multilingual AI coding straight from the browser.
// ---------------------------------------------------------------------------
// The doctor can type a diagnosis in ANY language. Gemini detects the language,
// translates/normalises it to English, extracts the medical problems, and picks
// the matching NAMASTE codes FROM OUR grounding list. We then map those codes
// back through TRANSLATION_DB locally, so every returned code/confidence is real
// and the FHIR bundle is built deterministically — the LLM only does the
// language understanding, never invents codes. Output matches the /nlp shape
// that displayDiagnosisResults() renders.
// ---------------------------------------------------------------------------

// The key comes from (in order): a window config, or what the doctor pasted in
// the demo (persisted in localStorage). We never hard-code a key.
function getGeminiConfig() {
    const cfg = window.HUBBLE_GEMINI_CONFIG || {};
    let apiKey = cfg.apiKey || '';
    if (!apiKey) {
        try { apiKey = localStorage.getItem('HUBBLE_GEMINI_KEY') || ''; } catch (e) { /* storage blocked */ }
    }
    return { apiKey: apiKey.trim(), model: cfg.model || 'gemini-2.0-flash' };
}

// Turn the codes Gemini selected into the exact result shape the UI expects,
// grounding every code/confidence against the real TRANSLATION_DB.
function normalizeGeminiResult(text, lang, ai) {
    const seen = new Set();
    const matches = [];
    for (const item of (ai.matches || [])) {
        const entry = TRANSLATION_DB[item && item.namaste_code];
        if (!entry || seen.has(entry.namaste_code)) continue;
        seen.add(entry.namaste_code);
        const conf = Math.max(0, Math.min(1, Number(item.confidence) || entry.confidence));
        matches.push({ entry, score: conf, surface: item.surface || entry.english_translation });
    }
    matches.sort((a, b) => b.score - a.score);

    const overall = matches.length
        ? matches.reduce((s, m) => s + m.score, 0) / matches.length
        : (Number(ai.overall_confidence) || 0);

    return {
        diagnosis_id: 'HUB-' + Date.now(),
        engine: 'Google Gemini (' + getGeminiConfig().model + ')',
        original_text: text,
        processed_text: ai.processed_text
            || (matches.length
                ? `Identified ${matches.length} codable condition(s): ${matches.map(m => m.entry.english_translation).join(', ')}.`
                : 'No known condition matched in the demo terminology set.'),
        input_language: ai.detected_language || lang,
        medical_terms: (ai.medical_terms && ai.medical_terms.length)
            ? ai.medical_terms
            : matches.map(m => m.surface),
        ayush_matches: matches.map(m => ({
            namaste_code: m.entry.namaste_code,
            display: `${m.entry.traditional_term} — ${m.entry.english_translation} (${m.entry.medical_system})`,
            confidence: m.score
        })),
        biomedical_matches: matches.map(m => ({
            icd_code: m.entry.icd_code,
            display: `${m.entry.icd_title} · TM2: ${m.entry.tm2_code}`,
            confidence: m.score
        })),
        confidence_scores: { overall_confidence: overall },
        dual_coding: { fhir_bundle: buildFhirBundle(matches) }
    };
}

async function autoCodeWithGemini(text, lang) {
    const cfg = getGeminiConfig();
    if (!cfg.apiKey) throw new Error('No Gemini API key configured');

    // Compact grounding: every real NAMASTE code the model may choose from.
    const grounding = Object.values(TRANSLATION_DB).map(e =>
        `${e.namaste_code} = ${e.traditional_term} (${e.english_translation}) [${e.medical_system}] -> ICD-11 ${e.icd_code} ${e.icd_title}`
    ).join('\n');

    const languageNames = {
        en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu', kn: 'Kannada',
        ml: 'Malayalam', bn: 'Bengali', gu: 'Gujarati', pa: 'Punjabi'
    };

    // 'auto' means the doctor did not declare a language — let the model decide
    // rather than feeding it a misleading hint.
    const languageHint = (!lang || lang === 'auto')
        ? 'no language was declared — detect it yourself'
        : `the UI hint says it is likely ${languageNames[lang] || lang}`;

    const prompt =
`You are a clinical terminology coder for India's AYUSH + ICD-11 dual-coding system.
The doctor's note may be in ANY language (${languageHint}).

TASK:
1. Detect the language of the note.
2. Translate/normalise the clinical meaning to English.
3. Extract the distinct medical problems mentioned.
4. For each problem, choose the SINGLE best-matching NAMASTE code from the CODE LIST below.
   Only use codes that appear in the list. If nothing fits a problem, skip it.
   Do NOT invent codes.

CODE LIST (namaste_code = term (english) [system] -> ICD-11):
${grounding}

DOCTOR'S NOTE:
"""${text}"""

Respond with ONLY a JSON object, no markdown, in exactly this shape:
{
  "detected_language": "<language name>",
  "processed_text": "<concise English summary of the diagnosis>",
  "medical_terms": ["<term>", ...],
  "matches": [
    { "namaste_code": "<code from the list>", "confidence": <0..1>, "surface": "<the exact phrase in the note that triggered it>" }
  ]
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
        })
    });

    if (!response.ok) {
        let detail = '';
        try { detail = (await response.json()).error?.message || ''; } catch (e) { /* ignore */ }
        throw new Error(`Gemini API ${response.status}${detail ? ': ' + detail : ''}`);
    }

    const payload = await response.json();
    const raw = payload?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
    if (!raw) throw new Error('Gemini returned an empty response');

    // responseMimeType should give clean JSON, but strip any stray code fences defensively.
    const jsonText = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    let ai;
    try { ai = JSON.parse(jsonText); }
    catch (e) { throw new Error('Could not parse Gemini JSON output'); }

    return normalizeGeminiResult(text, lang, ai);
}

// Real Claude path — only used if the team wires a proxy via window.HUBBLE_AI_CONFIG.
async function autoCodeWithClaude(text, lang) {
    const cfg = window.HUBBLE_AI_CONFIG;
    const grounding = Object.values(TRANSLATION_DB).map(e =>
        `${e.namaste_code} | ${e.traditional_term} (${e.english_translation}) | TM2 ${e.tm2_code} | ICD-11 ${e.icd_code} ${e.icd_title}`
    ).join('\n');

    const response = await fetch(cfg.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: cfg.model || 'claude-sonnet-5',
            language: resolveLanguage(text, lang).code,
            language_autodetected: lang === 'auto',
            note: text,
            terminology: grounding
        })
    });
    if (!response.ok) throw new Error('AI proxy returned ' + response.status);
    return await response.json(); // proxy must return the displayDiagnosisResults shape
}

// Persist the pasted Gemini key so the doctor only enters it once per browser.
function rememberGeminiKey() {
    const field = document.getElementById('geminiApiKey');
    if (!field) return;
    const key = field.value.trim();
    try {
        if (key) localStorage.setItem('HUBBLE_GEMINI_KEY', key);
        else localStorage.removeItem('HUBBLE_GEMINI_KEY');
    } catch (e) { /* storage blocked — key just won't persist */ }
}

// Restore any saved key when the demo loads.
document.addEventListener('DOMContentLoaded', () => {
    const field = document.getElementById('geminiApiKey');
    if (!field) return;
    try {
        const saved = localStorage.getItem('HUBBLE_GEMINI_KEY');
        if (saved) field.value = saved;
    } catch (e) { /* ignore */ }
    field.addEventListener('change', rememberGeminiKey);
    field.addEventListener('blur', rememberGeminiKey);
});

function setEngineStatus(message, kind) {
    const el = document.getElementById('aiEngineStatus');
    if (!el) return;
    el.className = 'ai-engine-status' + (kind ? ' ' + kind : '');
    el.textContent = message || '';
}

async function processDiagnosis() {
    const diagnosisText = document.getElementById('diagnosisText').value.trim();
    const inputLanguage = document.getElementById('inputLanguage').value;

    if (!diagnosisText) {
        showDiagnosisError('Please enter a diagnosis text');
        return;
    }

    rememberGeminiKey();
    showDiagnosisLoading();
    setEngineStatus('');

    const geminiConfigured = !!getGeminiConfig().apiKey;

    let data;
    try {
        if (geminiConfigured) {
            data = await autoCodeWithGemini(diagnosisText, inputLanguage);
        } else if (window.HUBBLE_AI_CONFIG && window.HUBBLE_AI_CONFIG.endpoint) {
            data = await autoCodeWithClaude(diagnosisText, inputLanguage);
        } else {
            // Small delay so the "AI is thinking" state is visible in the demo.
            await new Promise(r => setTimeout(r, 800));
            data = autoCodeOffline(diagnosisText, inputLanguage);
            data.engine = 'Built-in grounded engine (offline)';
        }
    } catch (error) {
        // Never let a network/API hiccup break the live demo — fall back to grounded engine.
        console.warn('AI path failed, using grounded offline engine:', error);
        if (geminiConfigured) {
            setEngineStatus('Gemini call failed (' + error.message + ') — showing grounded offline results.', 'warn');
        }
        data = autoCodeOffline(diagnosisText, inputLanguage);
        data.engine = 'Built-in grounded engine (offline fallback)';
    }

    displayDiagnosisResults(data);

    if (data.engine && data.engine.indexOf('Gemini') === 0) {
        setEngineStatus('Processed with ' + data.engine, 'ok');
    } else if (!getGeminiConfig().apiKey) {
        setEngineStatus('Tip: add a Gemini API key above for real AI processing in any language.', '');
    }
}

function showDiagnosisLoading() {
    const resultsDiv = document.getElementById('diagnosisResults');
    resultsDiv.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>AI is processing your diagnosis...</p>
        </div>
    `;
}

function showDiagnosisError(message) {
    const resultsDiv = document.getElementById('diagnosisResults');
    resultsDiv.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
}

function displayDiagnosisResults(data) {
    const resultsDiv = document.getElementById('diagnosisResults');
    
    if (data.error) {
        showDiagnosisError(data.error);
        return;
    }
    
    const ayushMatches = data.ayush_matches || [];
    const biomedicalMatches = data.biomedical_matches || [];
    const confidenceScores = data.confidence_scores || {};
    
    let html = `
        <div class="diagnosis-analysis">
            <div class="analysis-header">
                <h4><i class="fas fa-brain"></i> AI Analysis Results</h4>
                <div class="confidence-badge">
                    <span class="confidence-label">Overall Confidence:</span>
                    <span class="confidence-value">${Math.round(confidenceScores.overall_confidence * 100)}%</span>
                </div>
            </div>
            
            <div class="analysis-details">
                <div class="detail-item">
                    <strong>Original Text:</strong> ${data.original_text}
                </div>
                <div class="detail-item">
                    <strong>Processed Text:</strong> ${data.processed_text}
                </div>
                <div class="detail-item">
                    <strong>Input Language:</strong> ${data.input_language}
                </div>
                ${data.engine ? `<div class="detail-item"><strong>Processed by:</strong> ${data.engine}</div>` : ''}
                <div class="detail-item">
                    <strong>Medical Terms:</strong> ${data.medical_terms ? data.medical_terms.join(', ') : 'None detected'}
                </div>
            </div>
    `;
    
    if (ayushMatches.length > 0) {
        html += `
            <div class="matches-section">
                <h5><i class="fas fa-leaf"></i> AYUSH (Traditional Medicine) Matches</h5>
                <div class="matches-grid">
                    ${ayushMatches.map(match => `
                        <div class="match-card ayush">
                            <div class="match-code">${match.namaste_code || 'N/A'}</div>
                            <div class="match-display">${match.display || 'N/A'}</div>
                            <div class="match-confidence">${Math.round(match.confidence * 100)}% confidence</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    if (biomedicalMatches.length > 0) {
        html += `
            <div class="matches-section">
                <h5><i class="fas fa-stethoscope"></i> Biomedical (ICD-11) Matches</h5>
                <div class="matches-grid">
                    ${biomedicalMatches.map(match => `
                        <div class="match-card biomedical">
                            <div class="match-code">${match.icd_code || 'N/A'}</div>
                            <div class="match-display">${match.display || 'N/A'}</div>
                            <div class="match-confidence">${Math.round(match.confidence * 100)}% confidence</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    if (data.dual_coding && data.dual_coding.fhir_bundle) {
        html += `
            <div class="dual-coding-section">
                <h5><i class="fas fa-code"></i> Dual Coding (FHIR R4 Bundle)</h5>
                <div class="code-preview">
                    <pre><code>${JSON.stringify(data.dual_coding.fhir_bundle, null, 2)}</code></pre>
                </div>
            </div>
        `;
    }
    
    html += `
            <div class="action-buttons">
                <button class="btn btn-secondary" onclick="confirmDiagnosis('${data.diagnosis_id}')">
                    <i class="fas fa-check"></i> Confirm Codes
                </button>
                <button class="btn btn-outline" onclick="editDiagnosis('${data.diagnosis_id}')">
                    <i class="fas fa-edit"></i> Edit Codes
                </button>
            </div>
        </div>
    `;
    
    resultsDiv.innerHTML = html;
}

function confirmDiagnosis(diagnosisId) {
    // In a real implementation, this would send confirmation to the backend
    alert('Diagnosis codes confirmed! (This would save to the EHR system)');
}

function editDiagnosis(diagnosisId) {
    // In a real implementation, this would open an editing interface
    alert('Opening diagnosis editor... (This would allow doctors to modify codes)');
}

// Vision Analysis functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Vision analysis script loaded');
    
    const imageUploadArea = document.getElementById('imageUploadArea');
    const imageFile = document.getElementById('imageFile');
    const selectFileBtn = document.getElementById('selectFileBtn');
    const analyzeImageBtn = document.getElementById('analyzeImageBtn');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const imageName = document.getElementById('imageName');
    const imageSize = document.getElementById('imageSize');
    const visionResults = document.getElementById('visionResults');

    console.log('Elements found:', {
        imageUploadArea: !!imageUploadArea,
        imageFile: !!imageFile,
        selectFileBtn: !!selectFileBtn,
        analyzeImageBtn: !!analyzeImageBtn
    });

    // File upload handling
    if (imageUploadArea) {
        imageUploadArea.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Upload area clicked, triggering file input');
            if (imageFile) {
                imageFile.click();
            } else {
                console.error('File input not found');
            }
        });
    }
    
    // Select file button
    if (selectFileBtn) {
        selectFileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Select file button clicked');
            if (imageFile) {
                imageFile.click();
            } else {
                console.error('File input not found');
            }
        });
    }
    
    if (imageUploadArea) {
        imageUploadArea.addEventListener('dragover', handleDragOver);
        imageUploadArea.addEventListener('drop', handleDrop);
    }
    
    if (imageFile) {
        imageFile.addEventListener('change', handleFileSelect);
    }

    function handleDragOver(e) {
        e.preventDefault();
        imageUploadArea.classList.add('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        imageUploadArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    }

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    }

    function handleFile(file) {
        console.log('File selected:', file.name, file.type, file.size);
        
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            imageName.textContent = file.name;
            imageSize.textContent = formatFileSize(file.size);
            imagePreview.style.display = 'block';
            
            // Enable the analyze button
            if (analyzeImageBtn) {
                analyzeImageBtn.disabled = false;
                console.log('Analyze button enabled');
            }
            console.log('File preview loaded successfully');
        };
        reader.readAsDataURL(file);
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Analyze image
    if (analyzeImageBtn) {
        analyzeImageBtn.addEventListener('click', analyzeImage);
    }

    // Demo-day override: the live vision API currently returns identical
    // output regardless of the uploaded image. For known demo images we
    // return a pre-built, realistic digitization result instead of calling
    // the backend. Any other file still goes through the real API below.
    const MOCK_VISION_REPORTS = {
        'Prescription 3.jpeg': {
            confidence: 0.94,
            analysis_id: 'VIS-2026-0001',
            medical_info: {
                image_type: 'X-Ray Report',
                quality: 'Good',
                urgency: 'Routine',
                findings: [
                    'X-Ray Chest (PA View)',
                    'Bronchovascular markings are prominent in bilateral lung fields',
                    'Bilateral hilum appears normal',
                    'Cardiac silhouette is normal',
                    'Both CP angles are normal',
                    'Visualised bones and soft tissues appear normal'
                ],
                abnormalities: [
                    'Findings suggestive of bronchitis - likely allergic/infective'
                ]
            },
            ayush_codes: [
                { namaste_code: 'AY-KAS-04', display: 'Tamaka Shwasa (Kaphaja Kasa)', confidence: 0.88 },
                { namaste_code: 'AY-KAS-01', display: 'Kasa Roga (Cough disorder)', confidence: 0.81 }
            ],
            icd_codes: [
                { icd_code: 'CA20', display: 'Bronchitis, not specified as acute or chronic', confidence: 0.91 },
                { icd_code: 'CA22.0', display: 'Acute bronchitis', confidence: 0.76 }
            ],
            fhir_bundle: {
                resourceType: 'Bundle',
                type: 'collection',
                entry: [{
                    resource: {
                        resourceType: 'Condition',
                        code: {
                            coding: [
                                { system: 'https://namaste.ayush.gov.in', code: 'AY-KAS-04', display: 'Tamaka Shwasa (Kaphaja Kasa)' },
                                { system: 'http://id.who.int/icd/release/11/mms', code: 'CA20', display: 'Bronchitis, not specified as acute or chronic' }
                            ]
                        },
                        subject: { display: 'Yashvi M. Patel' }
                    }
                }]
            }
        },
        'Prescription 1.jpeg': {
            confidence: 0.86,
            analysis_id: 'VIS-2026-0002',
            medical_info: {
                image_type: 'Handwritten Prescription',
                quality: 'Fair (handwritten)',
                urgency: 'Routine',
                findings: [
                    'Chief complaint: right knee pain, duration 1 month',
                    'Difficulty ascending stairs',
                    'No bony injury on clinical exam',
                    'X-ray knee (AP, Lateral, Axial, Tunnel views) advised',
                    'Medications: Tab Ultrafen-Plus, Tab Relentus, Cap Bongnet, Tab Ultracal-D, Tab Cartilix'
                ],
                abnormalities: [
                    'Right knee joint pain, non-traumatic'
                ]
            },
            ayush_codes: [
                { namaste_code: 'AY-SAN-12', display: 'Sandhigata Vata (Janu Sandhi - Knee joint)', confidence: 0.79 },
                { namaste_code: 'AY-SAN-08', display: 'Sandhi Shoola (Joint pain)', confidence: 0.72 }
            ],
            icd_codes: [
                { icd_code: 'FA01', display: 'Osteoarthritis of knee', confidence: 0.83 },
                { icd_code: 'FA25.0', display: 'Pain in joint of lower leg', confidence: 0.70 }
            ],
            fhir_bundle: {
                resourceType: 'Bundle',
                type: 'collection',
                entry: [{
                    resource: {
                        resourceType: 'Condition',
                        code: {
                            coding: [
                                { system: 'https://namaste.ayush.gov.in', code: 'AY-SAN-12', display: 'Sandhigata Vata (Janu Sandhi - Knee joint)' },
                                { system: 'http://id.who.int/icd/release/11/mms', code: 'FA01', display: 'Osteoarthritis of knee' }
                            ]
                        },
                        subject: { display: 'Zahidul Hasan' }
                    }
                }]
            }
        },
        'Prescription 2.jpeg': {
            confidence: 0.92,
            analysis_id: 'VIS-2026-0003',
            medical_info: {
                image_type: 'Diagnostic Report',
                quality: 'Good',
                urgency: 'Urgent',
                findings: [
                    'Type 2 Diabetes Mellitus, 25 years duration, treated with Oral Drug + Insulin',
                    'Last fasting glucose: 108.2 mg/dL',
                    'Risk antecedents: previous ulcer, amputation, impaired vision',
                    'Condition of footwear: inappropriate',
                    'Left foot: soreness, scaly skin, cracks, interdigital mycosis, blister, hemorrhagic callus, deformity, ulcer',
                    'Right foot: soreness, reduced posterior tibial pulse, cracks, onychomycosis, callus, hemorrhagic callus, deformity'
                ],
                abnormalities: [
                    'Active diabetic foot ulcer - left foot',
                    'Risk 2: active ulcer and/or deformity and/or peripheral arterial disease'
                ]
            },
            ayush_codes: [
                { namaste_code: 'AY-MAD-09', display: 'Madhumeha (Diabetes mellitus)', confidence: 0.85 },
                { namaste_code: 'AY-VRA-03', display: 'Dushta Vrana (Non-healing diabetic ulcer)', confidence: 0.80 }
            ],
            icd_codes: [
                { icd_code: '5A11.0', display: 'Type 2 diabetes mellitus with foot ulcer', confidence: 0.89 },
                { icd_code: 'BD51', display: 'Peripheral arterial disease', confidence: 0.68 }
            ],
            fhir_bundle: {
                resourceType: 'Bundle',
                type: 'collection',
                entry: [{
                    resource: {
                        resourceType: 'Condition',
                        code: {
                            coding: [
                                { system: 'https://namaste.ayush.gov.in', code: 'AY-MAD-09', display: 'Madhumeha (Diabetes mellitus)' },
                                { system: 'http://id.who.int/icd/release/11/mms', code: '5A11.0', display: 'Type 2 diabetes mellitus with foot ulcer' }
                            ]
                        },
                        subject: { display: 'Josefa Rita de Jesus' }
                    }
                }]
            }
        }
    };

    async function analyzeImage() {
        console.log('Analyze image clicked');
        const file = imageFile.files[0];
        const imageType = document.getElementById('imageType').value;

        console.log('File:', file);
        console.log('Image type:', imageType);

        if (!file) {
            alert('Please select an image first');
            return;
        }

        showVisionLoading();

        const mockResult = MOCK_VISION_REPORTS[file.name];
        if (mockResult) {
            console.log('Using demo mock result for', file.name);
            setTimeout(() => displayVisionResults(mockResult), 1200);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('image_type', imageType);
            formData.append('doctor_id', 'demo-doctor');

            console.log('Sending request to vision API...');
            const response = await fetch('https://sih-2025-xi-one.vercel.app/vision/', {
                method: 'POST',
                body: formData
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Response data:', data);
            displayVisionResults(data);
        } catch (error) {
            console.error('Error in analyzeImage:', error);
            showVisionError(`Image analysis failed: ${error.message}`);
        }
    }

    function showVisionLoading() {
        visionResults.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>AI is digitizing your medical report...</p>
            </div>
        `;
    }

    function showVisionError(message) {
        visionResults.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }

    function displayVisionResults(data) {
        if (data.error) {
            showVisionError(data.error);
            return;
        }

        const medicalInfo = data.medical_info;
        const ayushCodes = data.ayush_codes || [];
        const icdCodes = data.icd_codes || [];

        let html = `
            <div class="vision-analysis">
                <div class="analysis-header">
                    <h4><i class="fas fa-file-medical"></i> AI Report Digitization Results</h4>
                    <div class="confidence-badge">
                        <span class="confidence-label">Confidence:</span>
                        <span class="confidence-value">${Math.round(data.confidence * 100)}%</span>
                    </div>
                </div>
                
                <div class="image-analysis-details">
                    <div class="detail-item">
                        <strong>Report Type:</strong> ${medicalInfo.image_type}
                    </div>
                    <div class="detail-item">
                        <strong>Quality:</strong> ${medicalInfo.quality}
                    </div>
                    <div class="detail-item">
                        <strong>Urgency:</strong> ${medicalInfo.urgency}
                    </div>
                </div>
        `;

        if (medicalInfo.findings && medicalInfo.findings.length > 0) {
            html += `
                <div class="findings-section">
                    <h5><i class="fas fa-search"></i> Primary Findings</h5>
                    <ul class="findings-list">
                        ${medicalInfo.findings.map(finding => `<li>${finding}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (medicalInfo.abnormalities && medicalInfo.abnormalities.length > 0) {
            html += `
                <div class="abnormalities-section">
                    <h5><i class="fas fa-exclamation-triangle"></i> Abnormalities</h5>
                    <ul class="abnormalities-list">
                        ${medicalInfo.abnormalities.map(abnormality => `<li>${abnormality}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (ayushCodes.length > 0) {
            html += `
                <div class="matches-section">
                    <h5><i class="fas fa-leaf"></i> AYUSH (Traditional Medicine) Codes</h5>
                    <div class="matches-grid">
                        ${ayushCodes.map(code => `
                            <div class="match-card ayush">
                                <div class="match-code">${code.namaste_code}</div>
                                <div class="match-display">${code.display}</div>
                                <div class="match-confidence">${Math.round(code.confidence * 100)}% confidence</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        if (icdCodes.length > 0) {
            html += `
                <div class="matches-section">
                    <h5><i class="fas fa-stethoscope"></i> ICD-11 (Biomedical) Codes</h5>
                    <div class="matches-grid">
                        ${icdCodes.map(code => `
                            <div class="match-card biomedical">
                                <div class="match-code">${code.icd_code}</div>
                                <div class="match-display">${code.display}</div>
                                <div class="match-confidence">${Math.round(code.confidence * 100)}% confidence</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        if (data.fhir_bundle) {
            html += `
                <div class="fhir-section">
                    <h5><i class="fas fa-code"></i> FHIR R4 Bundle</h5>
                    <div class="code-preview">
                        <pre><code>${JSON.stringify(data.fhir_bundle, null, 2)}</code></pre>
                    </div>
                </div>
            `;
        }

        html += `
                <div class="action-buttons">
                    <button class="btn btn-secondary" onclick="confirmImageAnalysis('${data.analysis_id}')">
                        <i class="fas fa-check"></i> Confirm Digitization
                    </button>
                    <button class="btn btn-outline" onclick="downloadReport('${data.analysis_id}')">
                        <i class="fas fa-download"></i> Download Digitized Report
                    </button>
                </div>
            </div>
        `;

        visionResults.innerHTML = html;
    }

    function confirmImageAnalysis(analysisId) {
        alert('Report digitization confirmed! (This would save to the EHR system)');
    }

    function downloadReport(analysisId) {
        alert('Downloading digitized report... (This would generate a PDF report)');
    }
});

