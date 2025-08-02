// Lookup tables for animal calculations
const lookupTables = {
    // Animal Equivalents lookup for cattle
    aeLookup: {
        "Females <1 year": { "High": 0.77, "Moderate": 0.68, "Low": 0.57 },
        "Females 1-2 years": { "High": 1.10, "Moderate": 0.91, "Low": 0.72 },
        "Females 2-3 years": { "High": 1.74, "Moderate": 1.12, "Low": 0.96 },
        "Females 3-4 years": { "High": 1.61, "Moderate": 1.49, "Low": 1.18 },
        "Females 4+ years": { "High": 1.53, "Moderate": 1.28, "Low": 1.08 },
        "Steers <1 year": { "High": 0.80, "Moderate": 0.72, "Low": 0.60 },
        "Steers 1-2 years": { "High": 1.31, "Moderate": 1.03, "Low": 0.78 },
        "Steers 2-3 years": { "High": 1.60, "Moderate": 1.27, "Low": 1.02 },
        "Steers 3-4 years": { "High": 1.52, "Moderate": 1.39, "Low": 1.15 },
        "Bulls": { "High": 1.55, "Moderate": 1.52, "Low": 1.29 }
    },

    // Dry Sheep Equivalents lookup for sheep
    dseLookupSheep: {
        "Weaned Lamb (Gaining 100 g/day) 15kg": 0.8,
        "Weaned Lamb (Gaining 200 g/day) 15kg": 1.3,
        "Weaned Lamb (Gaining 100 g/day) 25kg": 1.1,
        "Weaned Lamb (Gaining 200 g/day) 25kg": 1.7,
        "Adult Dry Sheep (Maintain Weight) 45kg CS2": 0.9,
        "Adult Dry Sheep (Maintain Weight) 50kg CS2": 1.0,
        "Adult Dry Sheep (Maintain Weight) 50kg CS3": 1.0,
        "Adult Dry Sheep (Maintain Weight) 60kg CS3": 1.1,
        "Adult Dry Sheep (Gaining 50 g/day) 45kg": 1.2,
        "Adult Dry Sheep (Gaining 100 g/day) 45kg": 1.5,
        "Pregnant Ewe (Last 6 weeks, Single) 45kg": 1.4,
        "Pregnant Ewe (Last 4 weeks, Single) 45kg CS2": 1.2,
        "Pregnant Ewe (Last 6 weeks, Twins) 45kg": 1.8,
        "Pregnant Ewe (Last 4 weeks, Single) 50kg CS2": 1.5,
        "Pregnant Ewe (Last 6 weeks, Single) 50kg": 1.5,
        "Pregnant Ewe (Last 6 weeks, Twins) 50kg": 1.9,
        "Pregnant Ewe (Last 4 weeks, Single) 60kg CS3": 1.8,
        "Ewe with Single Lamb at Foot 45kg": 2.4,
        "Ewe with Single Lamb at Foot 45kg CS2": 1.8,
        "Ewe with Single Lamb at Foot 50kg": 3.0,
        "Ewe with Single Lamb at Foot 50kg CS3": 2.2,
        "Ewe with Single Lamb at Foot 60kg CS3": 2.6,
        "Ewe with Twin Lambs at Foot 45kg": 2.8,
        "Weaner (Growing at 0 g/day) 25kg": 0.7,
        "Weaner (Growing at 100 g/day) 25kg": 1.0,
        "Weaner (Growing at 0 g/day) 35kg": 0.8,
        "Weaner (Growing > 200 g/day) 35kg": 2.5
    },

    // DSE lookup for goats with weight ranges
    dseLookupGoat: {
        "Dry doe": { dse: 0.8, minWeight: 30, maxWeight: 40 },
        "Breeding doe - During pregnancy": { dse: 1.4, minWeight: 40, maxWeight: 60 },
        "Breeding doe - During lactation – with single kid": { dse: 1.6, minWeight: 40, maxWeight: 60 },
        "Breeding doe - During lactation – with twins": { dse: 2.2, minWeight: 40, maxWeight: 60 },
        "Weaner (Growing at 100g/day)": { dse: 1.0, minWeight: 20, maxWeight: 40 },
        "Buck": { dse: 1.75, minWeight: 60, maxWeight: 80 }
    },

    // Intake rates by productivity level
    intakeRates: {
        "High": { aeIntake: 7.5, dseIntake: 0.89 },
        "Moderate": { aeIntake: 8.0, dseIntake: 0.95 },
        "Low": { aeIntake: 8.5, dseIntake: 1.01 }
    }
};

// Initialize data storage
let appData = {
    paddock: {
        standingDM: 5000,
        area: 10,
        residualDM: 1000,
        productivityLevel: 'Moderate'
    },
    cattle: [],
    sheep: [],
    goats: [],
    totals: {
        totalAE: 0,
        totalDSE: 0,
        sheepDSE: 0,
        goatDSE: 0
    }
};

// Get all sheep class options for the select dropdown
function getAllSheepClasses() {
    return Object.keys(lookupTables.dseLookupSheep).sort();
}

// Get all goat class options for the select dropdown
function getAllGoatClasses() {
    return Object.keys(lookupTables.dseLookupGoat).sort();
}

// Populate sheep class select on page load
function populateSheepClassSelect() {
    const select = document.getElementById('sheepClass');
    const classes = getAllSheepClasses();
    
    select.innerHTML = '';
    classes.forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = className;
        select.appendChild(option);
    });
}

// Populate goat class select on page load
function populateGoatClassSelect() {
    const select = document.getElementById('goatClass');
    const classes = getAllGoatClasses();
    
    select.innerHTML = '';
    classes.forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = className;
        select.appendChild(option);
    });
}