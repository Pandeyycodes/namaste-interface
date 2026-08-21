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

async function performTranslation() {
    const code = namasteCodeInput.value.trim();
    
    if (!code) {
        showTranslationError('Please enter a NAMASTE code');
        return;
    }
    
    showTranslationLoading();
    
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
async function processDiagnosis() {
    const diagnosisText = document.getElementById('diagnosisText').value.trim();
    const inputLanguage = document.getElementById('inputLanguage').value;
    const resultsDiv = document.getElementById('diagnosisResults');
    
    if (!diagnosisText) {
        showDiagnosisError('Please enter a diagnosis text');
        return;
    }
    
    showDiagnosisLoading();
    
    try {
        const response = await fetch('https://sih-2025-xi-one.vercel.app/nlp/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                diagnosis_text: diagnosisText,
                input_language: inputLanguage,
                doctor_id: 'demo-doctor'
            })
        });
        
        const data = await response.json();
        displayDiagnosisResults(data);
    } catch (error) {
        showDiagnosisError(`Diagnosis processing failed: ${error.message}`);
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

