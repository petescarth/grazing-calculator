// Calculation functions for the forage budget calculator

function calculateTotalStandingDM() {
    return appData.paddock.standingDM * appData.paddock.area;
}

function calculateTotalResidualDM() {
    return appData.paddock.residualDM * appData.paddock.area;
}

function calculateAvailableDM() {
    const totalStanding = calculateTotalStandingDM();
    const totalResidual = calculateTotalResidualDM();
    return Math.max(0, totalStanding - totalResidual);
}

function calculateTotalAE() {
    return appData.cattle.reduce((sum, animal) => sum + animal.totalAE, 0);
}

function calculateTotalDSE() {
    const sheepDSE = appData.sheep.reduce((sum, animal) => sum + animal.totalDSE, 0);
    const goatDSE = appData.goats.reduce((sum, animal) => sum + animal.totalDSE, 0);
    return sheepDSE + goatDSE;
}

function calculateSheepDSE() {
    return appData.sheep.reduce((sum, animal) => sum + animal.totalDSE, 0);
}

function calculateGoatDSE() {
    return appData.goats.reduce((sum, animal) => sum + animal.totalDSE, 0);
}

function calculateDailyDemand() {
    const totalAE = calculateTotalAE();
    const totalDSE = calculateTotalDSE();
    const rates = lookupTables.intakeRates[appData.paddock.productivityLevel];
    
    return (totalAE * rates.aeIntake) + (totalDSE * rates.dseIntake);
}

function calculateGrazingDays() {
    const availableDM = calculateAvailableDM();
    const dailyDemand = calculateDailyDemand();
    
    if (dailyDemand > 0) {
        return availableDM / dailyDemand;
    }
    return 0;
}

function calculateGoatDSERating(goatClass, weight) {
    const goatData = lookupTables.dseLookupGoat[goatClass];
    let dseRating = goatData.dse;
    
    // Adjust for weight if outside standard range
    if (weight < goatData.minWeight) {
        dseRating *= weight / goatData.minWeight;
    } else if (weight > goatData.maxWeight) {
        dseRating *= weight / goatData.maxWeight;
    }
    
    return dseRating;
}

function updateTotals() {
    appData.totals.totalAE = calculateTotalAE();
    appData.totals.totalDSE = calculateTotalDSE();
    appData.totals.sheepDSE = calculateSheepDSE();
    appData.totals.goatDSE = calculateGoatDSE();
}

function generateChartData() {
    const grazingDays = calculateGrazingDays();
    const dailyDemand = calculateDailyDemand();
    const totalStanding = calculateTotalStandingDM();
    const totalResidual = calculateTotalResidualDM();
    
    if (dailyDemand <= 0) {
        return { labels: [], datasets: [] };
    }
    
    const days = Math.min(Math.ceil(grazingDays * 1.5), 100);
    const labels = [];
    const forageRemaining = [];
    const residualTarget = [];
    
    let currentDM = totalStanding;
    
    for (let day = 0; day <= days; day++) {
        labels.push(day);
        forageRemaining.push(Math.max(totalResidual, currentDM));
        residualTarget.push(totalResidual);
        
        if (day < days) {
            currentDM = Math.max(totalResidual, currentDM - dailyDemand);
        }
    }
    
    return {
        labels: labels,
        datasets: [
            {
                label: 'Forage Remaining (kg)',
                data: forageRemaining,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Residual Target (kg)',
                data: residualTarget,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderDash: [5, 5],
                fill: false
            }
        ]
    };
}