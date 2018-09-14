/* INIT PARTICLES */
/* particlesJS.load(@dom-id, @path-json, @callback (optional)); */
particlesJS.load('particles-js', './particles.json', function () {
    console.log('callback - particles.js config loaded');
});

const updateResultStyle = () => {
    results = document.getElementById("results");
    results.style.minHeight = "100vh";
    results.style.backgroundColor = "#0aa5ff";

    document.getElementById("result-message").innerText = "Great! Here's what we've come up with...";
    document.getElementById("result-display").style.opacity = 1;
    scrollToSection("#results");
}

const validateTimeframe = (value) => {
    return value > 0;
}

const timeframeAlert = () => {
    document.getElementById("timeframe-warning").innerText = "the number of days you choose must be greater than zero";
}

const validateBudget = (value) => {
    return (value > 0) || (value === "");
}

const budgetAlert = () => {
    document.getElementById("budget-warning").innerText = "the budget you choose must be greater than zero";
}

const clearAlerts = () => {
    document.getElementById("timeframe-warning").innerText = '';
    document.getElementById("budget-warning").innerText = '';
}

const scrollToSection = (sectionName) => {
    $('html, body').animate({
        scrollTop: $(sectionName).offset().top
    }, 1000);
}

/* Form parsing and requests */
let excludedItems = [];

function submitForm() {
    clearAlerts();

    let timeframeValid = validateTimeframe(document.getElementById("timeframe").value);
    let budgetValid = validateBudget(document.getElementById("budget").value);

    if (timeframeValid && budgetValid) {
        requestGroceryList();
    } else {
        if (!timeframeValid) { timeframeAlert(); }
        if (!budgetValid) { budgetAlert(); }
    }
}

function requestGroceryList() {
    // Creating request driver and linking to relative url
    const xhr = new XMLHttpRequest();
    const url = "/request?";

    // Parsing form
    const form = document.getElementById("form");
    const zipcode = form.elements["zipcode"];
    const timeframe = form.elements["timeframe"];
    const budget = form.elements["budget"];

    // Ability to exclude an item
    const resultChecks = form.getElementsByClassName("food-exclude");
    for (let i = 0; i < resultChecks.length; i++) {
        let item = resultChecks[i];
        if (item.checked) {
            excludedItems.push(item.name);
        }
    }

    // Ability to un-exclude an item
    const excludedChecks = form.getElementsByClassName("excluded-item");
    for (let i = 0; i < excludedChecks.length; i++) {
        let item = excludedChecks[i];
        if (item.checked) {
            let index = excludedItems.indexOf(item.name);
            if (index > -1) {
                excludedItems.splice(index, 1);
            }
        }
    }
    let excluded = excludedItems.join(',');

    let endpoint = `${url}zipcode=${zipcode.value}&timeframe=${timeframe.value}&budget=${budget.value}`;
    if (excluded.length > 0) {
        endpoint += `&excluded=${excluded}`;
    }

    xhr.responseType = "json";
    xhr.open("GET", endpoint);
    xhr.send();
    xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            console.log(xhr.response);
            renderResults(xhr.response);
        }
    };

    updateResultStyle();
};

/* Results rendering */
function renderResults(res) {
    // Handling falsey response
    if (!res) {
        console.log(res.status);
    }
    // Parsing response
    const zipcode = res["zipcode"];
    const timeframe = res["timeframe"];
    const cost = res["cost"];
    const diff = res["diff"];
    const results = res["results"];
    const nutrition = res["nutrition"];

    let budgetMessage = '';
    if (diff) {
        budgetMessage = ` while staying <b>$${-diff} under</b> your budget`;
    }

    let listedResults = `
            <p>You can optimize your groceries by looking for:</p>
            <ul class="results-list">
            `;
    for (let item in results) {
        if (results[item]["value"] > 0) {
            listedResults += `
                    <li>
                    <input class="food-exclude" type="checkbox" name="${item}" id="${item}">
                    <label for="${item}">${results[item]["value"]} -- ${results[item]["name"]} (#${item})</label>
                    </li>
                    `;
        }
    }
    listedResults += "</ul>"
    let listedNutrition = `
            <p>The total nutrition you get from this grocery list is:</p>
            <ul class="nutrition-list">
            `;
    for (let nutrient in nutrition) {
        listedNutrition += `
                <li>${nutrient}: ${nutrition[nutrient]}    (${Math.round(nutrition[nutrient] / timeframe)} / day)</li>
                `;
    }
    listedNutrition += "</ul>"
    let listedExclusions = `
            <p>This list was made to exclude: (click to include again)</p>
            <ul class="exclusions-list">
            `;
    for (let item of excludedItems) {
        listedExclusions += `
                <li>
                <input class="excluded-item" type="checkbox" name="${item}" id="${item}-excluded">
                <label for="${item}-excluded">${results[item]["name"]}</label>
                </li>
                `;
    }
    listedExclusions += "</ul>"
    // Displaying reponse
    document.getElementById("result-display").innerHTML = `
                <p>For the store near <b>${zipcode}</b> we found a way for you to stock up for <b>${timeframe} days</b>${budgetMessage}!</p>
                ${listedResults}
                <br>
                <p>Total Cost: $${cost}</p>
                <br>
                ${excludedItems.length ? listedExclusions : ''}
                <br>
                <hr>
                ${listedNutrition}
                <hr>
                <h3 class="result-heading">Unhappy with your list? Cross out the items you don't want and we'll try again!</h3>
                <center>
                <input class="submit-button" type="submit" value="re-create list">
                </center>
            `;
};