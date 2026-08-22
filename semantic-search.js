// ---------------------------------------------------------------------------
// Hubble — AI Semantic Search over the NAMASTE ↔ ICD-11 terminology
// ---------------------------------------------------------------------------
// Design principle: the LLM only RANKS existing codes. Every code shown to the
// user is resolved from TRANSLATION_DB (the verified dataset in script.js), so
// the model structurally cannot hallucinate a NAMASTE or ICD-11 code.
//
// ⚠️ DEMO-ONLY KEY. This key ships to every visitor's browser and is readable
// in DevTools. Before any public deployment: move this call behind a serverless
// proxy and rotate the key. Do not commit this file to a public repository.
// ---------------------------------------------------------------------------

const GEMINI_API_KEY = 'GEMINI_API_KEY_HERE';

// Flash-Lite family. Change here if you want a different tier, e.g.
// 'gemini-2.5-flash-lite' | 'gemini-2.0-flash-lite' | 'gemini-flash-latest'
const GEMINI_MODEL = 'gemini-flash-lite-latest';

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// --- Elements --------------------------------------------------------------
const semanticQuery = document.getElementById('semanticQuery');
const semanticSearchBtn = document.getElementById('semanticSearchBtn');
const semanticResults = document.getElementById('semanticResults');
const engineBadge = document.getElementById('engineBadge');

// --- Catalogue -------------------------------------------------------------
// Sourced from TRANSLATION_DB (script.js). Guard in case load order changes.
function getCatalogue() {
    if (typeof TRANSLATION_DB === 'undefined') return [];
    return Object.values(TRANSLATION_DB);
}

// Compact, token-efficient grounding context for the model.
function buildGroundingContext() {
    return getCatalogue().map(e =>
        `${e.namaste_code} | ${e.traditional_term} | ${e.english_translation} | ${e.medical_system} | ${e.category} | TM2:${e.tm2_code} | ICD11:${e.icd_code} ${e.icd_title}`
    ).join('\n');
}

// --- Gemini engine ---------------------------------------------------------
async function semanticSearchWithGemini(query) {
    const prompt = `You are a medical terminology search engine for the Indian NAMASTE (Ayurveda/Siddha/Unani) coding system mapped to WHO ICD-11.

Below is the COMPLETE catalogue of available codes. Each line is:
NAMASTE_CODE | traditional term | english translation | system | category | TM2 code | ICD-11 code and title

--- CATALOGUE ---
${buildGroundingContext()}
--- END CATALOGUE ---

The user's search query (may be in English, Hindi, or any Indian language):
"${query}"

Return the most semantically relevant entries from the catalogue. Rules:
- ONLY use namaste_code values that appear verbatim in the catalogue above. Never invent a code.
- Rank by clinical/semantic relevance to the user's intent, not keyword overlap.
- Return between 1 and 8 results. If nothing is relevant, return an empty array.
- "reason" must be one short clinical sentence (max 18 words) explaining the match, in English.
- "relevance" is a number between 0 and 1.

Respond with ONLY a JSON array, no markdown fence:
[{"namaste_code":"...","relevance":0.95,"reason":"..."}]`;

    const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': GEMINI_API_KEY
        },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.2,
                responseMimeType: 'application/json'
            }
        })
    });

    if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Gemini ${response.status}: ${detail.slice(0, 200)}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');

    // Strip any stray markdown fence before parsing.
    const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const ranked = JSON.parse(cleaned);
    if (!Array.isArray(ranked)) throw new Error('Gemini did not return an array');

    return resolveRanked(ranked);
}

// Join the model's ranking back onto the verified dataset. Any code the model
// returned that is not in the dataset is silently dropped — no hallucinations.
function resolveRanked(ranked) {
    const results = [];
    for (const item of ranked) {
        const entry = TRANSLATION_DB[item.namaste_code];
        if (!entry) continue;
        results.push({
            entry,
            relevance: typeof item.relevance === 'number' ? item.relevance : 0.7,
            reason: item.reason || ''
        });
    }
    return results;
}

// --- Local fallback engine -------------------------------------------------
// Lightweight semantic-ish scoring: token overlap across term / translation /
// category / system / ICD title, with a small synonym expansion layer.
const FALLBACK_SYNONYMS = {
    digestive: ['digestive', 'stomach', 'gastro', 'intestinal', 'bowel', 'dyspepsia', 'peptic', 'acid'],
    acidity: ['acid', 'peptic', 'dyspepsia', 'heartburn', 'amlapitta'],
    breathing: ['respiratory', 'breath', 'dyspnoea', 'dyspnea', 'cough', 'asthma', 'shwasa'],
    heart: ['heart', 'cardiac', 'cardiovascular', 'ischaemic', 'circulation'],
    joint: ['joint', 'arthritis', 'osteoarthritis', 'bone', 'knee', 'sandhivata'],
    sugar: ['diabetes', 'diabetic', 'metabolic', 'prameha', 'glucose'],
    fever: ['fever', 'pyrexia', 'jwara'],
    // Hindi cues
    'साँस': ['respiratory', 'breath', 'dyspnoea', 'cough'],
    'पेट': ['digestive', 'stomach', 'gastro', 'bowel'],
    'बुखार': ['fever', 'pyrexia'],
    'दर्द': ['pain', 'ache', 'headache', 'joint'],
    'मधुमेह': ['diabetes', 'metabolic'],
    'हृदय': ['heart', 'cardiac']
};

const STOPWORDS = new Set([
    'show', 'me', 'the', 'and', 'for', 'with', 'that', 'are', 'any', 'all',
    'related', 'about', 'find', 'give', 'list', 'what', 'which', 'like',
    'conditions', 'condition', 'disorders', 'disorder', 'disease', 'diseases',
    'patients', 'patient', 'problems', 'problem', 'issues', 'from', 'have'
]);

function expandQuery(query) {
    const raw = query.toLowerCase()
        .split(/[\s,./?()-]+/)
        .filter(t => t.length > 2 && !STOPWORDS.has(t));
    const expanded = new Set(raw);
    for (const token of raw) {
        for (const [key, syns] of Object.entries(FALLBACK_SYNONYMS)) {
            if (token.includes(key) || key.includes(token)) {
                syns.forEach(s => expanded.add(s));
            }
        }
    }
    return Array.from(expanded);
}

function semanticSearchLocally(query) {
    const tokens = expandQuery(query);
    if (!tokens.length) return [];

    const scored = getCatalogue().map(entry => {
        const haystack = [
            entry.traditional_term,
            entry.english_translation,
            entry.category,
            entry.medical_system,
            entry.icd_title,
            entry.tm2_title
        ].join(' ').toLowerCase();

        let score = 0;
        const matched = [];
        for (const token of tokens) {
            if (haystack.includes(token)) {
                score += 1;
                matched.push(token);
            }
        }
        return { entry, score, matched };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

    const top = scored.length ? scored[0].score : 1;
    return scored.map(r => ({
        entry: r.entry,
        relevance: Math.min(0.95, 0.55 + (r.score / top) * 0.4),
        reason: `Matched on ${r.matched.slice(0, 3).join(', ')} within ${r.entry.category}.`
    }));
}

// --- Rendering -------------------------------------------------------------
function setEngineBadge(state, label) {
    if (!engineBadge) return;
    engineBadge.className = `engine-badge engine-${state}`;
    const icon = state === 'ai' ? 'fa-wand-magic-sparkles'
        : state === 'local' ? 'fa-database'
        : 'fa-circle-notch';
    engineBadge.innerHTML = `<i class="fas ${icon}"></i> ${label}`;
}

function showSemanticLoading(query) {
    semanticResults.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Understanding &ldquo;${escapeHtml(query)}&rdquo;&hellip;</p>
        </div>
    `;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function renderSemanticResults(results, query, engine) {
    if (!results.length) {
        semanticResults.innerHTML = `
            <div class="demo-placeholder">
                <i class="fas fa-circle-question"></i>
                <p>No terminology matched &ldquo;${escapeHtml(query)}&rdquo;. Try describing the symptom or body system.</p>
            </div>
        `;
        return;
    }

    const cards = results.map(r => {
        const e = r.entry;
        const pct = Math.round(r.relevance * 100);
        return `
            <div class="semantic-card">
                <div class="semantic-card-head">
                    <div class="semantic-term">
                        <h4>${escapeHtml(e.traditional_term)}</h4>
                        <span class="semantic-english">${escapeHtml(e.english_translation)}</span>
                    </div>
                    <div class="semantic-relevance">
                        <span class="semantic-relevance-value">${pct}%</span>
                        <span class="semantic-relevance-label">relevance</span>
                    </div>
                </div>

                <div class="semantic-meta">
                    <span class="semantic-pill system">${escapeHtml(e.medical_system)}</span>
                    <span class="semantic-pill">${escapeHtml(e.category)}</span>
                </div>

                ${r.reason ? `
                <div class="semantic-reason">
                    <i class="fas fa-lightbulb"></i>
                    <span>${escapeHtml(r.reason)}</span>
                </div>` : ''}

                <div class="semantic-codes">
                    <div class="semantic-code namaste">
                        <span class="semantic-code-label">NAMASTE</span>
                        <span class="semantic-code-value">${escapeHtml(e.namaste_code)}</span>
                    </div>
                    <div class="semantic-code tm2">
                        <span class="semantic-code-label">ICD-11 TM2</span>
                        <span class="semantic-code-value">${escapeHtml(e.tm2_code)}</span>
                    </div>
                    <div class="semantic-code icd">
                        <span class="semantic-code-label">ICD-11 Biomedicine</span>
                        <span class="semantic-code-value">${escapeHtml(e.icd_code)}</span>
                        <span class="semantic-code-title">${escapeHtml(e.icd_title)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const engineNote = engine === 'ai'
        ? '<i class="fas fa-wand-magic-sparkles"></i> Ranked by Gemini &middot; codes resolved from verified dataset'
        : '<i class="fas fa-database"></i> Ranked by local fallback engine (AI unavailable)';

    semanticResults.innerHTML = `
        <div class="semantic-results-header">
            <span>${results.length} match${results.length === 1 ? '' : 'es'} for &ldquo;${escapeHtml(query)}&rdquo;</span>
            <span class="semantic-engine-note">${engineNote}</span>
        </div>
        <div class="semantic-cards">${cards}</div>
    `;
}

// --- Controller ------------------------------------------------------------
async function runSemanticSearch() {
    const query = semanticQuery.value.trim();
    if (!query) {
        semanticResults.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Please describe what you are looking for.</p>
            </div>
        `;
        return;
    }

    if (!getCatalogue().length) {
        semanticResults.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Terminology dataset failed to load. Check that script.js is present.</p>
            </div>
        `;
        return;
    }

    showSemanticLoading(query);
    setEngineBadge('checking', 'Querying Gemini&hellip;');

    try {
        const results = await semanticSearchWithGemini(query);
        setEngineBadge('ai', `AI engine active &middot; ${GEMINI_MODEL}`);
        renderSemanticResults(results, query, 'ai');
    } catch (error) {
        // Demo-proof: never show a dead end, drop to the local engine.
        console.warn('Gemini unavailable, using local fallback:', error);
        setEngineBadge('local', 'Local fallback engine');
        renderSemanticResults(semanticSearchLocally(query), query, 'local');
    }
}

// --- Wiring ----------------------------------------------------------------
if (semanticSearchBtn) {
    semanticSearchBtn.addEventListener('click', runSemanticSearch);
}

if (semanticQuery) {
    semanticQuery.addEventListener('keypress', e => {
        if (e.key === 'Enter') runSemanticSearch();
    });
}

document.querySelectorAll('.semantic-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        semanticQuery.value = chip.dataset.query;
        runSemanticSearch();
    });
});

// Initial badge state.
if (engineBadge) {
    setEngineBadge('ai', `AI engine ready &middot; ${GEMINI_MODEL}`);
}
