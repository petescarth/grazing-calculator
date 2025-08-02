// Main application logic
let feedBudgetChart;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    populateSheepClassSelect();
    populateGoatClassSelect();
    updateDisplays();
});

function initializeApp() {
    // Set initial values from appData
    document.getElementById('standingDM').value = appData.paddock.standingDM;
    document.getElementById('paddockArea').value = appData.paddock.area;
    document.getElementById('residualDM').value = appData.paddock.residualDM;
    document.getElementById('productivityLevel').value = appData.paddock.productivityLevel;
    
    // Initialize chart
    initializeChart();
}

function setupEventListeners() {
    // Paddock detail inputs
    document.getElementById('standingDM').addEventListener('input', updatePaddockData);
    document.getElementById('paddockArea').addEventListener('input', updatePaddockData);
    document.getElementById('residualDM').addEventListener('input', updatePaddockData);
    document.getElementById('productivityLevel').addEventListener('change', updatePaddockData);
    
    // Animal forms
    document.getElementById('addCattleForm').addEventListener('submit', handleAddCattle);
    document.getElementById('addSheepForm').addEventListener('submit', handleAddSheep);
    document.getElementById('addGoatForm').addEventListener('submit', handleAddGoat);
}

function updatePaddockData() {
    appData.paddock.standingDM = parseFloat(document.getElementById('standingDM').value) || 0;
    appData.paddock.area = parseFloat(document.getElementById('paddockArea').value) || 0;
    appData.paddock.residualDM = parseFloat(document.getElementById('residualDM').value) || 0;
    appData.paddock.productivityLevel = document.getElementById('productivityLevel').value;
    
    updateDisplays();
}

function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    section.classList.toggle('active');
}

// Cattle management
function handleAddCattle(event) {
    event.preventDefault();
    
    const typeName = document.getElementById('cattleTypeName').value.trim();
    const number = parseInt(document.getElementById('cattleNumber').value) || 0;
    const category = document.getElementById('cattleCategory').value;
    const productivity = document.getElementById('cattleProductivity').value;
    
    if (!typeName || number <= 0) {
        alert('Please fill in all required fields');
        return;
    }
    
    const aeRating = lookupTables.aeLookup[category][productivity];
    const totalAE = number * aeRating;
    
    const cattleEntry = {
        id: Date.now(),
        type: typeName,
        category: category,
        number: number,
        productivity: productivity,
        aeRating: aeRating,
        totalAE: totalAE
    };
    
    appData.cattle.push(cattleEntry);
    
    // Clear form
    document.getElementById('addCattleForm').reset();
    document.getElementById('cattleNumber').value = 10; // Reset to default
    
    updateDisplays();
    showSuccessMessage(`Added ${number} ${typeName}`);
}

function removeCattle(id) {
    appData.cattle = appData.cattle.filter(animal => animal.id !== id);
    updateDisplays();
}

function clearCattleData() {
    if (confirm('Are you sure you want to clear all cattle data?')) {
        appData.cattle = [];
        updateDisplays();
    }
}

// Sheep management
function handleAddSheep(event) {
    event.preventDefault();
    
    const typeName = document.getElementById('sheepTypeName').value.trim();
    const number = parseInt(document.getElementById('sheepNumber').value) || 0;
    const sheepClass = document.getElementById('sheepClass').value;
    
    if (!typeName || number <= 0) {
        alert('Please fill in all required fields');
        return;
    }
    
    const dseRating = lookupTables.dseLookupSheep[sheepClass];
    const totalDSE = number * dseRating;
    
    const sheepEntry = {
        id: Date.now(),
        type: typeName,
        class: sheepClass,
        number: number,
        dseRating: dseRating,
        totalDSE: totalDSE
    };
    
    appData.sheep.push(sheepEntry);
    
    // Clear form
    document.getElementById('addSheepForm').reset();
    document.getElementById('sheepNumber').value = 10; // Reset to default
    
    updateDisplays();
    showSuccessMessage(`Added ${number} ${typeName} - ${sheepClass}`);
}

function removeSheep(id) {
    appData.sheep = appData.sheep.filter(animal => animal.id !== id);
    updateDisplays();
}

function clearSheepData() {
    if (confirm('Are you sure you want to clear all sheep data?')) {
        appData.sheep = [];
        updateDisplays();
    }
}

// Goat management
function handleAddGoat(event) {
    event.preventDefault();
    
    const typeName = document.getElementById('goatTypeName').value.trim();
    const number = parseInt(document.getElementById('goatNumber').value) || 0;
    const goatClass = document.getElementById('goatClass').value;
    const weight = parseFloat(document.getElementById('goatWeight').value) || 0;
    
    if (!typeName || number <= 0 || weight <= 0) {
        alert('Please fill in all required fields');
        return;
    }
    
    const dseRating = calculateGoatDSERating(goatClass, weight);
    const totalDSE = number * dseRating;
    
    const goatEntry = {
        id: Date.now(),
        type: typeName,
        class: goatClass,
        number: number,
        weight: weight,
        dseRating: dseRating,
        totalDSE: totalDSE
    };
    
    appData.goats.push(goatEntry);
    
    // Clear form
    document.getElementById('addGoatForm').reset();
    document.getElementById('goatNumber').value = 10; // Reset to default
    document.getElementById('goatWeight').value = 40; // Reset to default
    
    updateDisplays();
    showSuccessMessage(`Added ${number} ${typeName} - ${goatClass}`);
}

function removeGoat(id) {
    appData.goats = appData.goats.filter(animal => animal.id !== id);
    updateDisplays();
}

function clearGoatData() {
    if (confirm('Are you sure you want to clear all goat data?')) {
        appData.goats = [];
        updateDisplays();
    }
}

// Display updates
function updateDisplays() {
    updatePaddockDisplays();
    updateCattleDisplay();
    updateSheepDisplay();
    updateGoatDisplay();
    updateResultsDisplay();
    updateChart();
}

function updatePaddockDisplays() {
    const totalStanding = calculateTotalStandingDM();
    const totalResidual = calculateTotalResidualDM();
    
    document.getElementById('totalStandingDM').textContent = `${totalStanding.toLocaleString()} kg`;
    document.getElementById('totalResidualDM').textContent = `${totalResidual.toLocaleString()} kg`;
}

function updateCattleDisplay() {
    const cattleDisplay = document.getElementById('cattleDisplay');
    const cattleTable = document.getElementById('cattleTable').getElementsByTagName('tbody')[0];
    const totalAEElement = document.getElementById('totalAE');
    
    if (appData.cattle.length > 0) {
        cattleDisplay.style.display = 'block';
        
        // Clear existing rows
        cattleTable.innerHTML = '';
        
        // Add rows for each cattle entry
        appData.cattle.forEach(animal => {
            const row = cattleTable.insertRow();
            row.innerHTML = `
                <td>${animal.type}</td>
                <td>${animal.category}</td>
                <td>${animal.number}</td>
                <td>${animal.productivity}</td>
                <td>${animal.aeRating.toFixed(2)}</td>
                <td>${animal.totalAE.toFixed(2)}</td>
                <td><button class="btn btn-danger" onclick="removeCattle(${animal.id})">Remove</button></td>
            `;
        });
        
        const totalAE = calculateTotalAE();
        totalAEElement.textContent = totalAE.toFixed(2);
    } else {
        cattleDisplay.style.display = 'none';
    }
}

function updateSheepDisplay() {
    const sheepDisplay = document.getElementById('sheepDisplay');
    const sheepTable = document.getElementById('sheepTable').getElementsByTagName('tbody')[0];
    const totalSheepDSEElement = document.getElementById('totalSheepDSE');
    
    if (appData.sheep.length > 0) {
        sheepDisplay.style.display = 'block';
        
        // Clear existing rows
        sheepTable.innerHTML = '';
        
        // Add rows for each sheep entry
        appData.sheep.forEach(animal => {
            const row = sheepTable.insertRow();
            row.innerHTML = `
                <td>${animal.type}</td>
                <td>${animal.class}</td>
                <td>${animal.number}</td>
                <td>${animal.dseRating.toFixed(2)}</td>
                <td>${animal.totalDSE.toFixed(2)}</td>
                <td><button class="btn btn-danger" onclick="removeSheep(${animal.id})">Remove</button></td>
            `;
        });
        
        const totalSheepDSE = calculateSheepDSE();
        totalSheepDSEElement.textContent = totalSheepDSE.toFixed(2);
    } else {
        sheepDisplay.style.display = 'none';
    }
}

function updateGoatDisplay() {
    const goatDisplay = document.getElementById('goatDisplay');
    const goatTable = document.getElementById('goatTable').getElementsByTagName('tbody')[0];
    const totalGoatDSEElement = document.getElementById('totalGoatDSE');
    
    if (appData.goats.length > 0) {
        goatDisplay.style.display = 'block';
        
        // Clear existing rows
        goatTable.innerHTML = '';
        
        // Add rows for each goat entry
        appData.goats.forEach(animal => {
            const row = goatTable.insertRow();
            row.innerHTML = `
                <td>${animal.type}</td>
                <td>${animal.class}</td>
                <td>${animal.number}</td>
                <td>${animal.weight.toFixed(1)}</td>
                <td>${animal.dseRating.toFixed(2)}</td>
                <td>${animal.totalDSE.toFixed(2)}</td>
                <td><button class="btn btn-danger" onclick="removeGoat(${animal.id})">Remove</button></td>
            `;
        });
        
        const totalGoatDSE = calculateGoatDSE();
        totalGoatDSEElement.textContent = totalGoatDSE.toFixed(2);
    } else {
        goatDisplay.style.display = 'none';
    }
}

function updateResultsDisplay() {
    updateTotals();
    
    // Update herd summary
    document.getElementById('displayTotalAE').textContent = appData.totals.totalAE.toFixed(2);
    document.getElementById('displayTotalDSE').textContent = appData.totals.totalDSE.toFixed(2);
    
    // Update DSE breakdown
    const dseBreakdown = document.getElementById('dseBreakdown');
    if (appData.totals.sheepDSE > 0 || appData.totals.goatDSE > 0) {
        dseBreakdown.style.display = 'block';
        document.getElementById('displaySheepDSE').textContent = appData.totals.sheepDSE.toFixed(2);
        document.getElementById('displayGoatDSE').textContent = appData.totals.goatDSE.toFixed(2);
    } else {
        dseBreakdown.style.display = 'none';
    }
    
    // Update grazing budget results
    const dailyDemand = calculateDailyDemand();
    const availableDM = calculateAvailableDM();
    const grazingDays = calculateGrazingDays();
    
    document.getElementById('dailyDemand').textContent = dailyDemand.toFixed(2);
    document.getElementById('availableDM').textContent = availableDM.toLocaleString();
    document.getElementById('grazingDays').textContent = grazingDays.toFixed(1);
}

// Chart management
function initializeChart() {
    const ctx = document.getElementById('feedBudgetChart').getContext('2d');
    
    feedBudgetChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Feed Budget Over Time'
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Days'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Dry Matter (kg)'
                    },
                    beginAtZero: false
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function updateChart() {
    const chartData = generateChartData();
    
    if (feedBudgetChart) {
        feedBudgetChart.data = chartData;
        feedBudgetChart.update();
    }
}

// Utility functions
function showSuccessMessage(message) {
    // Create a temporary success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        font-weight: 500;
    `;
    
    document.body.appendChild(successDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 3000);
}

function formatNumber(number, decimals = 2) {
    return number.toFixed(decimals);
}

function formatLargeNumber(number) {
    return number.toLocaleString();
}