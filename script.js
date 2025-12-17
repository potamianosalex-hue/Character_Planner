// --- REGISTRIES --- (Same as before)
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
    "Barbarian": {
        hitDie: 12,
        apply: (final, char) => {
            const dexMod = Math.floor((final.DEX - 10) / 2);
            const conMod = Math.floor((final.CON - 10) / 2);
            final.maxHP += 12;
            final.ac = 10 + dexMod + conMod;
            final.traits.push(`BARBARIAN: Unarmored Defense (AC = 10 + ${dexMod} Dex + ${conMod} Con).`);
        }
    }
};

// --- STATE ---
const defaultState = { level: 1, attributes: { STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8 }, race: null, background: null, class: null, feats: [] };
let character = JSON.parse(JSON.stringify(defaultState));
const costTable = { 8:0, 9:1, 10:2, 11:3, 12:4, 13:5, 14:7, 15:9 };

function init() { renderPointBuy(); updateUI(); }

function checkRequirements() {
    const pointsLeft = 27 - calculatePointsUsed();
    
    const status = {
        attr: pointsLeft > 0,
        race: character.race === null,
        bg: character.background === null,
        class: character.class === null
    };

    // Update individual button dots
    document.getElementById('attr-alert').style.display = status.attr ? "inline-block" : "none";
    document.getElementById('race-alert').style.display = status.race ? "inline-block" : "none";
    document.getElementById('bg-alert').style.display = status.bg ? "inline-block" : "none";
    document.getElementById('class-alert').style.display = status.class ? "inline-block" : "none";

    // Update main Level 1 dot (if ANY are true, show it)
    const anyPending = Object.values(status).some(v => v === true);
    document.getElementById('lvl1-alert').style.display = anyPending ? "inline-block" : "none";
}

function updateUI() {
    let final = { 
        STR: character.attributes.STR, DEX: character.attributes.DEX, CON: character.attributes.CON,
        INT: character.attributes.INT, WIS: character.attributes.WIS, CHA: character.attributes.CHA,
        maxHP: 0, speed: 30, ac: 0, traits: [] 
    };
    character.feats = [];

    if (character.race && RACE_REGISTRY[character.race]) {
        final.speed = RACE_REGISTRY[character.race].baseSpeed;
        RACE_REGISTRY[character.race].apply(final, character);
    }
    if (character.background && BG_REGISTRY[character.background]) {
        BG_REGISTRY[character.background].apply(final, character);
    }
    if (character.class && CLASS_REGISTRY[character.class]) {
        CLASS_REGISTRY[character.class].apply(final, character);
    } else {
        final.maxHP += 10;
        final.ac = 10 + Math.floor((final.DEX - 10) / 2);
    }
    character.feats.forEach(f => { if(FEAT_REGISTRY[f]) FEAT_REGISTRY[f].apply(final, character); });
    
    let conMod = Math.floor((final.CON - 10) / 2);
    final.maxHP += (conMod * character.level);

    // Render Stats
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

    // Handle button highlights
    document.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('active'));
    if(character.race) document.getElementById(`btn-race-${character.race}`)?.classList.add('active');
    if(character.background) document.getElementById(`btn-bg-${character.background}`)?.classList.add('active');
    if(character.class) document.getElementById(`btn-class-${character.class}`)?.classList.add('active');

    checkRequirements();
}

// Logic Utilities
function calculatePointsUsed() { return Object.values(character.attributes).reduce((sum, val) => sum + costTable[val], 0); }
function adjustAttr(attr, change) {
    const cur = character.attributes[attr]; const next = cur + change;
    if (next < 8 || next > 15) return;
    if (calculatePointsUsed() - costTable[cur] + costTable[next] <= 27) { character.attributes[attr] = next; updateUI(); }
}
function selectRace(r) { character.race = r; updateUI(); }
function selectBackground(b) { character.background = b; updateUI(); }
function selectClass(c) { character.class = c; updateUI(); }
function toggleAccordion(id) { const el = document.getElementById(id); el.style.display = (el.style.display === "block") ? "none" : "block"; }
function showSection(id) { document.querySelectorAll('.config-panel').forEach(p => p.style.display = 'none'); document.getElementById(id + '-ui').style.display = 'block'; }
function renderPointBuy() {
    const container = document.getElementById('point-buy-controls'); container.innerHTML = '';
    Object.keys(character.attributes).forEach(attr => {
        container.innerHTML += `<div class="stat-control-row"><strong>${attr}</strong><button onclick="adjustAttr('${attr}', -1)">-</button><span id="buy-${attr}">${character.attributes[attr]}</span><button onclick="adjustAttr('${attr}', 1)">+</button></div>`;
    });
}
async function exportJSON() {
    const jsonStr = JSON.stringify(character, null, 2);
    if (window.isSecureContext && 'showSaveFilePicker' in window) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: 'character.json',
                types: [{ description: 'JSON File', accept: {'application/json': ['.json']} }]
            });
            const writable = await handle.createWritable();
            await writable.write(jsonStr);
            await writable.close();
            return;
        } catch (e) { console.log("Save cancelled or failed"); }
    }

    // Fallback for Firefox/Safari or if the API fails
    const blob = new Blob([jsonStr], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'character.json';
    a.click();
    URL.revokeObjectURL(url);
}
function importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const importedChar = JSON.parse(ev.target.result);
            
            // Basic validation: make sure it's actually a character file
            if (importedChar.attributes && importedChar.level) {
                character = importedChar;
                renderPointBuy(); // Refresh the controls
                updateUI();       // Refresh the sheet
                console.log("Character loaded successfully!");
            } else {
                alert("Invalid character file format.");
            }
        } catch (err) {
            alert("Error reading file. Make sure it's a valid .json file.");
        }
    };
    reader.readAsText(file);
    
    // Clear the input value so the same file can be uploaded twice if needed
    e.target.value = "";
}
function resetCharacter() { if(confirm("Reset?")) { character = JSON.parse(JSON.stringify(defaultState)); renderPointBuy(); updateUI(); } }

init();
