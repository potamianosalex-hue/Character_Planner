// --- REGISTRIES ---
const FEAT_REGISTRY = {
    "Tough": { apply: (final, char) => { const bonus = 2 * char.level; final.maxHP += bonus; final.traits.push(`• TOUGH: +${bonus} Max HP (+2/level).`); }},
    "Speedy": { apply: (final, char) => { final.speed += 10; final.traits.push("• SPEEDY: Speed +10ft. Dash ignores difficult terrain."); }}
};
const RACE_REGISTRY = {
    "Dwarf": { baseSpeed: 30, apply: (final, char) => { final.maxHP += (1 * char.level); final.traits.push("DWARF: Poison Resistance, Dwarven Toughness (+1 HP/level)."); }},
    "Wood Elf": { baseSpeed: 35, apply: (final, char) => { final.traits.push("WOOD ELF: Speed 35ft, Darkvision 60ft."); }}
};
const BG_REGISTRY = {
    "Farmer": { apply: (final, char) => { final.STR += 1; final.CON += 2; char.feats.push("Tough"); final.traits.push("FARMER: +1 STR, +2 CON bonuses applied."); }},
    "Wayfarer": { apply: (final, char) => { final.DEX += 2; final.WIS += 1; char.feats.push("Speedy"); final.traits.push("WAYFARER: +2 DEX, +1 WIS bonuses applied."); }}
};
const CLASS_REGISTRY = {
    "Barbarian": { hitDie: 12, apply: (final, char) => {
        const dexM = Math.floor((final.DEX - 10) / 2); const conM = Math.floor((final.CON - 10) / 2);
        final.maxHP += 12; final.ac = 10 + dexM + conM;
        final.traits.push(`BARBARIAN: Unarmored Defense (AC = 10 + ${dexM} Dex + ${conM} Con).`);
    }}
};

// --- STATE ---
const defaultState = { level: 1, attributes: { STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8 }, race: null, background: null, class: null, feats: [] };
let character = JSON.parse(JSON.stringify(defaultState));
const costTable = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

function init() {
    const saved = localStorage.getItem('dnd_char_backup');
    if (saved) { try { character = JSON.parse(saved); } catch (e) {} }
    renderPointBuy(); updateUI();
}

function updateUI() {
    let final = { ...character.attributes, maxHP: 0, speed: 30, ac: 0, traits: [] };
    character.feats = [];
    if (character.race) { final.speed = RACE_REGISTRY[character.race].baseSpeed; RACE_REGISTRY[character.race].apply(final, character); }
    if (character.background) BG_REGISTRY[character.background].apply(final, character);
    if (character.class) CLASS_REGISTRY[character.class].apply(final, character);
    else { final.maxHP += 10; final.ac = 10 + Math.floor((final.DEX - 10) / 2); }
    character.feats.forEach(f => { if(FEAT_REGISTRY[f]) FEAT_REGISTRY[f].apply(final, character); });
    final.maxHP += (Math.floor((final.CON - 10) / 2) * character.level);

    document.getElementById('max-hp').innerText = final.maxHP;
    document.getElementById('speed-val').innerText = final.speed;
    document.getElementById('ac-val').innerText = final.ac;
    document.getElementById('traits-box').value = final.traits.join("\n\n");
    document.getElementById('points-left').innerText = 27 - calculatePointsUsed();

    ['STR','DEX','CON','INT','WIS','CHA'].forEach(a => {
        document.getElementById(`score-${a}`).innerText = final[a];
        let mod = Math.floor((final[a] - 10) / 2);
        const modEl = document.getElementById(`mod-${a}`);
        modEl.innerText = (mod >= 0 ? "+" : "") + mod;
        modEl.className = mod > 0 ? "mod-positive" : (mod < 0 ? "mod-negative" : "");
        if(document.getElementById(`buy-${a}`)) document.getElementById(`buy-${a}`).innerText = character.attributes[a];
    });

    document.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('active'));
    if(character.race) document.getElementById(`btn-race-${character.race}`)?.classList.add('active');
    if(character.background) document.getElementById(`btn-bg-${character.background}`)?.classList.add('active');
    if(character.class) document.getElementById(`btn-class-${character.class}`)?.classList.add('active');

    checkRequirements();
    localStorage.setItem('dnd_char_backup', JSON.stringify(character));
}

function toggleAccordion(id) {
    const el = document.getElementById(id);
    const arrow = document.getElementById('accordion-arrow');
    const workspace = document.getElementById('workspace-area');
    if (el.style.display === "block") {
        el.style.display = "none"; arrow.innerText = "▶";
        workspace.style.display = "none";
        document.querySelectorAll('.sub-menu-btn').forEach(b => b.classList.remove('active-nav'));
    } else {
        el.style.display = "block"; arrow.innerText = "▼";
    }
}

function showSection(id) {
    document.getElementById('workspace-area').style.display = "flex";
    document.querySelectorAll('.sub-menu-btn').forEach(b => b.classList.remove('active-nav'));
    document.getElementById('nav-' + id).classList.add('active-nav');
    document.querySelectorAll('.config-panel').forEach(p => p.style.display = 'none');
    document.getElementById(id + '-ui').style.display = 'block';
}

function calculatePointsUsed() { return Object.values(character.attributes).reduce((s, v) => s + costTable[v], 0); }
function adjustAttr(a, c) {
    const n = character.attributes[a] + c;
    if (n >= 8 && n <= 15 && (calculatePointsUsed() - costTable[character.attributes[a]] + costTable[n]) <= 27) {
        character.attributes[a] = n; updateUI();
    }
}
function selectRace(r) { character.race = r; updateUI(); }
function selectBackground(b) { character.background = b; updateUI(); }
function selectClass(c) { character.class = c; updateUI(); }

function checkRequirements() {
    const p = 27 - calculatePointsUsed();
    const s = { attr: p > 0, race: !character.race, bg: !character.background, cl: !character.class };
    document.getElementById('attr-alert').style.display = s.attr ? "inline-block" : "none";
    document.getElementById('race-alert').style.display = s.race ? "inline-block" : "none";
    document.getElementById('bg-alert').style.display = s.bg ? "inline-block" : "none";
    document.getElementById('class-alert').style.display = s.cl ? "inline-block" : "none";
    document.getElementById('lvl1-alert').style.display = (s.attr||s.race||s.bg||s.cl) ? "inline-block" : "none";
}

function renderPointBuy() {
    const c = document.getElementById('point-buy-controls'); c.innerHTML = '';
    Object.keys(character.attributes).forEach(a => {
        c.innerHTML += `<div class="stat-control-row"><strong>${a}</strong><button onclick="adjustAttr('${a}',-1)">-</button><span id="buy-${a}">${character.attributes[a]}</span><button onclick="adjustAttr('${a}',1)">+</button></div>`;
    });
}

async function exportJSON() {
    const str = JSON.stringify(character, null, 2);
    if (window.isSecureContext && 'showSaveFilePicker' in window) {
        try {
            const h = await window.showSaveFilePicker({ suggestedName: 'char.json', types: [{ accept: {'application/json': ['.json']} }] });
            const w = await h.createWritable(); await w.write(str); await w.close(); return;
        } catch (e) {}
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([str], {type: "application/json"})); a.download = 'char.json'; a.click();
}

function importJSON(e) {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = (ev) => {
        try { character = JSON.parse(ev.target.result); renderPointBuy(); updateUI(); } catch (e) {}
    }; r.readAsText(f); e.target.value = "";
}

function resetCharacter() {
    if(confirm("Reset character?")) {
        character = JSON.parse(JSON.stringify(defaultState));
        localStorage.removeItem('dnd_char_backup'); renderPointBuy(); updateUI();
    }
}

init();