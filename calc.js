const SITE = "https://rimueirnarn.pythonanywhere.com/api/char/"

// Handle subinput visibility
const inputs = document.querySelectorAll('input[type="number"]');
inputs.forEach((input) => {
  if (input.id.includes("Base") && !input.id.includes("BaseScale")) {
    input.addEventListener("input", function () {
      const subinput = document.getElementById(this.id + "Sub");
      if (subinput) {
        if (this.value) {
          subinput.classList.add("active");
        } else {
          subinput.classList.remove("active");
        }
      }
    });
  }
});

const statLabels = {
  1: "Character HP",
  2: "Character ATK",
  3: "Character DEF",
  4: "Weapon HP",
  5: "Weapon ATK",
  6: "Weapon DEF",
};

const displayValue = {
  "HP%": "%",
  "ATK%": "%",
  "DEF%": "%",
  "SPD%": "%",
  "Crit Rate": "%",
  "Crit DMG": "%",
  "Effect Rate": "%",
  "Effect RES": "%",
  SPD: "flat",
  "Elemental Proficiency": "flat",
  flat: "flat",
};

// Handle form submission
document
  .getElementById("calculatorForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const resultsContainer = document.getElementById("resultsContainer");
    resultsContainer.innerHTML =
      '<div class="results-container"><p class="loading">🔄 Calculating attributes...</p></div>';

    try {
      // Collect form data
      const formData = new FormData(this);
      const data = {};

      // Helper function to add data entry
      function addDataEntry(
        baseValue,
        baseBase,
        fromLevel,
        toLevel,
        registry,
        display
      ) {
        if (baseValue) {
          const entry = {
            stat: parseFloat(baseValue),
            registry: registry,
            display: display || "flat",
          };

          // if (baseBase) queryParams.push(`base=${baseBase}`);
          // if (fromLevel) queryParams.push(`from_=${fromLevel}`);
          // if (toLevel) queryParams.push(`to=${toLevel}`);

          if (baseBase) entry.base = parseFloat(baseBase);
          if (fromLevel) entry.from_ = parseInt(fromLevel);
          if (toLevel) entry.to = parseInt(toLevel);

          data[registry] = entry;
        }
      }

      // Process character stats
      addDataEntry(
        formData.get("charBaseHP"),
        formData.get("charBaseHPScale"),
        formData.get("charFromLevel"),
        formData.get("charToLevel"),
        "Character Base HP"
      );
      addDataEntry(
        formData.get("charBaseATK"),
        formData.get("charBaseATKScale"),
        formData.get("charFromLevel"),
        formData.get("charToLevel"),
        "Character Base ATK"
      );
      addDataEntry(
        formData.get("charBaseDEF"),
        formData.get("charBaseDEFScale"),
        formData.get("charFromLevel"),
        formData.get("charToLevel"),
        "Character Base DEF"
      );
      addDataEntry(
        formData.get("charBaseSPD"),
        formData.get("charBaseSPDScale"),
        formData.get("charFromLevel"),
        formData.get("charToLevel"),
        "Character Base SPD"
      );

      addDataEntry(
        formData.get("charBaseMP"),
        formData.get("charBaseMPScale"),
        formData.get("charFromLevel"),
        formData.get("charToLevel"),
        "Character Base MP"
      );

      // Process weapon stats
      addDataEntry(
        formData.get("weaponBaseHP"),
        formData.get("weaponBaseHPScale"),
        formData.get("weaponFromLevel"),
        formData.get("weaponToLevel"),
        "Weapon Base HP"
      );
      addDataEntry(
        formData.get("weaponBaseATK"),
        formData.get("weaponBaseATKScale"),
        formData.get("weaponFromLevel"),
        formData.get("weaponToLevel"),
        "Weapon Base ATK"
      );
      addDataEntry(
        formData.get("weaponBaseDEF"),
        formData.get("weaponBaseDEFScale"),
        formData.get("weaponFromLevel"),
        formData.get("weaponToLevel"),
        "Weapon Base DEF"
      );

      // Process weapon primary attribute
      if (formData.get("weaponPrimaryValueBase")) {
        addDataEntry(
          formData.get("weaponPrimaryValueBase"),
          formData.get("weaponPrimaryValueBaseScale"),
          formData.get("weaponFromLevel"),
          formData.get("weaponToLevel"),
          formData.get("weaponPrimaryAttr") || "Primary Attribute",
          displayValue[formData.get("weaponPrimaryAttr") || "flat"]
        );
      }

      if (data.length === 0) {
        throw new Error("Please fill in at least one attribute to calculate.");
      }

      // Build query string
      const globalData = {
        base: formData.get("globalBase"),
        from_: formData.get("globalFrom"),
        to: formData.get("globalTo"),
      };
      const queryParams = [];
      if (globalData.base !== undefined)
        queryParams.push(`base=${globalData.base}`);
      if (globalData.from_ !== undefined)
        queryParams.push(`from_=${globalData.from_}`);
      if (globalData.to !== undefined) queryParams.push(`to=${globalData.to}`);
      const queryString =
        queryParams.length > 0 ? "?" + queryParams.join("&") : "";

      console.debug(data, queryString);
      // Make API call
      const response = await fetch(`${SITE}${queryString}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}\n${(await response.json())[reason]}`);
      }

      const results = await response.json();

      statLabels[7] = `Weapon ${weaponPrimaryAttr}`;
      // Display results
      displayResults(results.data, formData, data, globalData);
    } catch (error) {
      console.error("Calculation error:", error);
      resultsContainer.innerHTML = `
                    <div class="results-container">
                        <div class="error">
                            <strong>⚠️ Calculation Error</strong><br>
                            ${error.message}
                        </div>
                    </div>
                `;
    }
  });

function push(label, value) {
  return `
        <div class="result-item">
          <span class='result-label'>${label}</span>
          <span class='result-value'>${value}</span>
        </div>
        `;
}

function displayResults(results, formData, data, info) {
  const resultsContainer = document.getElementById("resultsContainer");
  const characterName = formData.get("characterName") || "Character";
  const weaponPrimaryAttr =
    formData.get("weaponPrimaryAttr") || "Primary Attribute";

  let html = '<div class="results-container">';
  html +=
    '<div class="success"><strong>✅ Calculation Complete!</strong><br>Results for ' +
    characterName +
    "</div>";

  /*results.forEach((result, index) => {
        const label = statLabels[result.registry] || `Attribute ${result.registry}`;
        const value = typeof result === 'number' ? result.toFixed(2) :
          (result.calculated_value !== undefined ? result.calculated_value.toFixed(2) : 'N/A');

        html += `
                    <div class="result-item">
                        <span class="result-label">${label}</span>
                        <span class="result-value">${value}</span>
                    </div>
                `;
      });*/

  for (let i in results) {
    const result = results[i];
    const d = data[i];
    if (i == weaponPrimaryAttr)
      continue
    const label =
      info.base !== d.base && d.base !== undefined ? `${i} (${d.base})` : i;
    const value =
      typeof result === "number"
        ? d.display == "%"
          ? `${result.toFixed(1)}%`
          : Math.ceil(result)
        : "N/A";

    html += push(label, value);
  }

  html += push("---", "---");

  if (
    results["Character Base HP"] !== undefined &&
    results["Weapon Base HP"] !== undefined
  )
    html += push(
      "Base HP",
      Math.ceil(results["Character Base HP"] + results["Weapon Base HP"])
    );
  if (
    results["Character Base ATK"] !== undefined &&
    results["Weapon Base ATK"] !== undefined
  )
    html += push(
      "Base ATK",
      Math.ceil(results["Character Base ATK"] + results["Weapon Base ATK"])
    );
  if (
    results["Character Base DEF"] !== undefined &&
    results["Weapon Base DEF"] !== undefined
  )
    html += push(
      "Base DEF",
      Math.ceil(results["Character Base DEF"] + results["Weapon Base DEF"])
    );

  if (results[weaponPrimaryAttr]) {
    const result = results[weaponPrimaryAttr]
    const d = data[weaponPrimaryAttr]
    html += push(
      info.base !== d.base && d.base !== undefined ? `${weaponPrimaryAttr} (${d.base})` : weaponPrimaryAttr,
      typeof result === "number"
        ? d.display == "%"
          ? `${result.toFixed(1)}%`
          : Math.ceil(result)
        : "N/A"
    )
  }
  html += "</div>";
  resultsContainer.innerHTML = html;
}
