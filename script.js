let originalMoviesData = [];
let filteredMoviesData = [];
let selectedTitles = [];
let selectedDirectors = [];
let selectedCountries = [];
let sortOrder = {};

let sortHistory = [];

let appliedFilters = {
    minYear: null,
    maxYear: null,
    minBoxOffice: null,
    maxBoxOffice: null,
    titles: [],
    directors: [],
    countries: []
};

function initFilters() {
    initTitlesFilter();
    initDirectorFilter();
    initCountryFilter();
}

async function fetchMovies() {
    try {
        const response = await fetch("data.json");
        originalMoviesData = await response.json();
        filteredMoviesData = [...originalMoviesData];
        
        const years = originalMoviesData.map(movie => movie.release_year);
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);

        const minInput = document.getElementById('minYear');
        const maxInput = document.getElementById('maxYear');
        
        minInput.min = minYear;
        minInput.max = maxYear;
        minInput.value = minYear;
        
        maxInput.min = minYear;
        maxInput.max = maxYear;
        maxInput.value = maxYear;

        document.getElementById('minValue').textContent = minYear;
        document.getElementById('maxValue').textContent = maxYear;

        initFilters();;

        renderMovies(filteredMoviesData);
    } catch (error) {
        console.error("Ошибка загрузки JSON:", error);
    }
}

function renderMovies(movies) {
    const container = document.getElementById("card-container");
    container.innerHTML = "";

    const columns = [
        { key: "id", label: "ID" },
        { key: "title", label: "Title" },
        { key: "release_year", label: "Release year" },
        { key: "director", label: "Director" },
        { key: "box_office", label: "Box office" },
        { key: "country", label: "Country" },
        { key: null, label: "↺" }
    ];

    const header = document.createElement("div");
    header.classList.add("card", "sticky-header");
    header.innerHTML = columns.map(col => {
        if (!col.key) {
            return `<div onclick="resetSorting()" style="cursor: pointer; 
                    display: flex; align-items: center; justify-content: center;
                    min-width: 40px; padding: 0 8px;">
                <strong style="color: #9747ff;">${col.label}</strong>
            </div>`;
        }

        const sortInfo = sortHistory.find(s => s.key === col.key);
        const baseStyle = "font-size: 10px; color: gray; display: flex; flex-direction: column; line-height: 0.8;";
        
        let arrows = `
            <span style="${baseStyle}">
                <span style="${sortInfo?.direction === 'asc' ? 'color:rgb(213, 213, 213)' : 'opacity: 0.5'}">▲</span>
                <span style="${sortInfo?.direction === 'desc' ? 'color:rgb(213, 213, 213)' : 'opacity: 0.5'}">▼</span>
            </span>
        `;

        return `<div onclick="sortBy('${col.key}')" style="cursor: pointer; display: flex; align-items: center; gap: 4px;">
            <strong>${col.label}</strong>
            ${arrows}
        </div>`;
    }).join("");
    container.appendChild(header);


    movies.forEach(movie => {
        const card = document.createElement("div");
        card.classList.add("card");
        card.innerHTML = columns.map(col => {
            if (!col.key) return '<div></div>';
            if (col.key === "box_office") {
                return `<div>$${Number(movie[col.key]).toLocaleString()}</div>`;
            }
            return `<div>${movie[col.key]}</div>`;
        }).join("");
        container.appendChild(card);
    });
}

function sortBy(key) {
    const existingIndex = sortHistory.findIndex(s => s.key === key);
    if (existingIndex > -1) {
        sortHistory[existingIndex].direction = 
            sortHistory[existingIndex].direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortHistory.push({ key, direction: 'asc' });
    }

    applySorting();
    renderMovies(filteredMoviesData);
}

function applySorting() {
    let sortedData = [...filteredMoviesData];

    sortHistory.forEach(({ key, direction }) => {
        sortedData.sort((a, b) => {
            const valueA = a[key];
            const valueB = b[key];
            
            if (typeof valueA === 'string') {
                return direction === 'asc' 
                    ? valueA.localeCompare(valueB) 
                    : valueB.localeCompare(valueA);
            }
            return direction === 'asc' 
                ? valueA - valueB 
                : valueB - valueA;
        });
    });
    
    filteredMoviesData = sortedData;
}


document.getElementById("minYear").addEventListener("input", function() {
    const max = parseInt(document.getElementById("maxYear").value);
    if (parseInt(this.value) > max) this.value = max;
    document.getElementById("minValue").textContent = this.value;
});

document.getElementById("maxYear").addEventListener("input", function() {
    const min = parseInt(document.getElementById("minYear").value);
    if (parseInt(this.value) < min) this.value = min;
    document.getElementById("maxValue").textContent = this.value;
});

document.getElementById("applyFilter").addEventListener("click", () => {
    const minYear = parseInt(document.getElementById("minYear").value);
    const maxYear = parseInt(document.getElementById("maxYear").value);
    
    const minBoxOffice = parseFloat(document.getElementById("minBoxOffice").value);
    const maxBoxOffice = parseFloat(document.getElementById("maxBoxOffice").value);

    filteredMoviesData = originalMoviesData.filter(movie => {
        const yearValid = movie.release_year >= minYear && movie.release_year <= maxYear;
        
        let boxOfficeValid = true;
        const boxOffice = parseFloat(movie.box_office);
        
        if (!isNaN(minBoxOffice)) boxOfficeValid = boxOffice >= minBoxOffice;
        if (!isNaN(maxBoxOffice)) boxOfficeValid = boxOfficeValid && boxOffice <= maxBoxOffice;
        
        
        return yearValid && boxOfficeValid;
    });

    if(selectedTitles.length > 0) {
        filteredMoviesData = filteredMoviesData.filter(movie => 
          selectedTitles.includes(movie.title)
        );
      }
    
      if(selectedDirectors.length > 0) {
        filteredMoviesData = filteredMoviesData.filter(movie => 
            selectedDirectors.includes(movie.director)
        );
    }

    if(selectedCountries.length > 0) {
        filteredMoviesData = filteredMoviesData.filter(movie => 
            selectedCountries.includes(movie.country)
        );
    }

    appliedFilters = {
        minYear: parseInt(document.getElementById("minYear").value),
        maxYear: parseInt(document.getElementById("maxYear").value),
        minBoxOffice: parseFloat(document.getElementById("minBoxOffice").value),
        maxBoxOffice: parseFloat(document.getElementById("maxBoxOffice").value),
        titles: [...selectedTitles],
        directors: [...selectedDirectors],
        countries: [...selectedCountries]
    };
    filteredMoviesData = applyCurrentFilters();
    applySorting();
    
    renderMovies(filteredMoviesData);
    console.log("apply filter");
    closeFilterPanel();
});

document.getElementById("filter-button").addEventListener("click", () => {
    const filterPanel = document.getElementById("filter-panel");
    
    if (window.matchMedia("(max-width: 1024px)").matches) {
        document.body.classList.add("filter-panel-active");
        setTimeout(() => {
            filterPanel.classList.add("active");
        }, 10); // Небольшая задержка для активации transition
    } else {
        filterPanel.classList.toggle("active");
        const panelWidth = filterPanel.classList.contains("active") ? 250 : 0;
        document.documentElement.style.setProperty("--filter-panel-width", `${panelWidth}px`);

    }
});


document.getElementById("minBoxOffice").addEventListener("input", function() {
    if (this.value < 0) this.value = 0;
});

document.getElementById("maxBoxOffice").addEventListener("input", function() {
    const min = parseFloat(document.getElementById("minBoxOffice").value);
    if (this.value < min) this.value = min;
});

function initTitlesFilter() {
    const titles = [...new Set(originalMoviesData.map(movie => movie.title))];
    const container = document.getElementById('titles-list');
    
    container.innerHTML = titles.map(title => `
        <label class="option-item">
            <input type="checkbox" value="${title}">
            ${title}
        </label>
    `).join('');
    
    updateSelectedCount('title', selectedTitles.length);
}

function initDirectorFilter() {
    const directors = [...new Set(originalMoviesData.map(movie => movie.director))];
    const container = document.getElementById('directors-list');
    
    container.innerHTML = directors.map(director => `
        <label class="option-item">
            <input type="checkbox" value="${director}">
            ${director}
        </label>
    `).join('');
    
    updateSelectedCount('director', selectedDirectors.length);
}

function initCountryFilter() {
    const countries = [...new Set(originalMoviesData.map(movie => movie.country))];
    const container = document.getElementById('countries-list');
    
    container.innerHTML = countries.map(country => `
        <label class="option-item">
            <input type="checkbox" value="${country}">
            ${country}
        </label>
    `).join('');
    
    updateSelectedCount('country', selectedCountries.length);
}

function toggleDropdown(event) {
    event.stopPropagation();
    const parent = event.currentTarget.closest('.multiselect');
    const optionsContainer = parent.querySelector('.options-container');
    
    document.querySelectorAll('.options-container.show').forEach(openContainer => {
        if (openContainer !== optionsContainer) {
            openContainer.classList.remove('show');
        }
    });
    
    optionsContainer.classList.toggle('show');
}


function updateSelectedCount(type, count) {
    let elementId;
    switch(type) {
        case 'title':
            elementId = 'selected-counter';
            break;
        case 'director':
            elementId = 'selected-director-counter';
            break;
        case 'country':
            elementId = 'selected-country-counter';
            break;
        default:
            return;
    }
    const counterElement = document.getElementById(elementId);
    if (counterElement) {
        counterElement.textContent = `Выбрано: ${count}`;
    }
}

function handleMultiSelectChange(e, array, type) {
    if(e.target.tagName === 'INPUT') {
        const value = e.target.value;
        if(e.target.checked) {
            array.push(value);
        } else {
            const index = array.indexOf(value);
            if(index > -1) array.splice(index, 1);
        }
        updateSelectedCount(type, array.length);
        e.stopPropagation();
    }
}

document.getElementById('titles-list').addEventListener('change', (e) => {
    if(e.target.tagName === 'INPUT') {
        const value = e.target.value;
        if(e.target.checked) {
            selectedTitles.push(value);
        } else {
            selectedTitles = selectedTitles.filter(t => t !== value);
        }
        updateSelectedCount('title', selectedTitles.length);
        e.stopPropagation();
    }
});

document.getElementById('directors-list').addEventListener('change', (e) => {
    handleMultiSelectChange(e, selectedDirectors, 'director');
});

document.getElementById('countries-list').addEventListener('change', (e) => {
    handleMultiSelectChange(e, selectedCountries, 'country');
});



document.addEventListener('click', function(e) {
    if (!e.target.closest('.multiselect')) {
        document.querySelectorAll('.options-container.show').forEach(container => {
            container.classList.remove('show');
        });
    }

    const filterPanel = document.getElementById("filter-panel");
    if (!filterPanel.contains(e.target) && 
        e.target.id !== "filter-button" &&
        filterPanel.classList.contains("active")) {
        closeFilterPanel();
    }
});

document.querySelectorAll('.done-button').forEach(button => {
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        const optionsContainer = e.target.closest('.options-container');
        optionsContainer.classList.remove('show');
    });
});


document.addEventListener('DOMContentLoaded', () => {
    fetchMovies().then(() => {
        appliedFilters = {
            minYear: Math.min(...originalMoviesData.map(m => m.release_year)),
            maxYear: Math.max(...originalMoviesData.map(m => m.release_year)),
            titles: [],
            directors: [],
            countries: []
        };
    });
});

function closeFilterPanel() {
    resetUnsavedFilters();

    const filterPanel = document.getElementById("filter-panel");
    
    if (window.matchMedia("(max-width: 1024px)").matches) {
        filterPanel.classList.remove("active");
        setTimeout(() => {
            document.body.classList.remove("filter-panel-active");
        }, 300); // Ждем завершения анимации
    }
    filterPanel.classList.remove("active");
    document.documentElement.style.setProperty("--filter-panel-width", "0px");
}


document.getElementById("close-filter").addEventListener("click", closeFilterPanel);


function resetUnsavedFilters() {
    document.getElementById("minYear").value = appliedFilters.minYear;
    document.getElementById("maxYear").value = appliedFilters.maxYear;
    document.getElementById("minBoxOffice").value = appliedFilters.minBoxOffice || '';
    document.getElementById("maxBoxOffice").value = appliedFilters.maxBoxOffice || '';
    
    document.getElementById("minValue").textContent = appliedFilters.minYear;
    document.getElementById("maxValue").textContent = appliedFilters.maxYear;

    selectedTitles = [...appliedFilters.titles];
    selectedDirectors = [...appliedFilters.directors];
    selectedCountries = [...appliedFilters.countries];

    updateCheckboxes('titles-list', appliedFilters.titles);
    updateCheckboxes('directors-list', appliedFilters.directors);
    updateCheckboxes('countries-list', appliedFilters.countries);
    
    updateSelectedCount('title', appliedFilters.titles.length);
    updateSelectedCount('director', appliedFilters.directors.length);
    updateSelectedCount('country', appliedFilters.countries.length);
}

function updateCheckboxes(containerId, appliedValues) {
    const container = document.getElementById(containerId);
    container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = appliedValues.includes(checkbox.value);
    });
}

function resetSorting() {
    sortHistory = [];
    filteredMoviesData = applyCurrentFilters();
    renderMovies(filteredMoviesData);
}

function applyCurrentFilters() {
    const { minYear, maxYear, minBoxOffice, maxBoxOffice, titles, directors, countries } = appliedFilters;
    
    let filtered = originalMoviesData.filter(movie => {
        const yearValid = movie.release_year >= minYear && movie.release_year <= maxYear;
        let boxOfficeValid = true;
        const boxOffice = parseFloat(movie.box_office);
        
        if (!isNaN(minBoxOffice)) boxOfficeValid = boxOffice >= minBoxOffice;
        if (!isNaN(maxBoxOffice)) boxOfficeValid = boxOfficeValid && boxOffice <= maxBoxOffice;
        
        return yearValid && boxOfficeValid;
    });
    
    if (titles.length > 0) filtered = filtered.filter(movie => titles.includes(movie.title));
    if (directors.length > 0) filtered = filtered.filter(movie => directors.includes(movie.director));
    if (countries.length > 0) filtered = filtered.filter(movie => countries.includes(movie.country));
    
    return filtered;
}