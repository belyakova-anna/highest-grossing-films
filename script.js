// Global variables to store movie data and filter states
let originalMoviesData = []; // Original dataset from JSON
let filteredMoviesData = []; // Filtered dataset for display
let selectedTitles = []; // Selected titles in multi-select filter
let selectedDirectors = []; // Selected directors in multi-select filter
let selectedCountries = []; // Selected countries in multi-select filter
let sortHistory = [];  // Array to track sorting history (multi-column sorting)

// Object to store currently applied filter values
let appliedFilters = {
    minYear: null,
    maxYear: null,
    minBoxOffice: null,
    maxBoxOffice: null,
    titles: [],
    directors: [],
    countries: []
};

// Initialize all filter controls
function initFilters() {
    initTitlesFilter();
    initDirectorFilter();
    initCountryFilter();
}

// Fetch movie data from JSON file and initialize application
async function fetchMovies() {
    try {
        const response = await fetch("data.json");
        originalMoviesData = await response.json();
        filteredMoviesData = [...originalMoviesData];
        
        // Set up year range slider values
        const years = originalMoviesData.map(movie => movie.release_year);
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);

        const minInput = document.getElementById('minYear');
        const maxInput = document.getElementById('maxYear');
        
        // Configure slider inputs
        minInput.min = minYear;
        minInput.max = maxYear;
        minInput.value = minYear;
        
        maxInput.min = minYear;
        maxInput.max = maxYear;
        maxInput.value = maxYear;
        
        // Display initial year values
        document.getElementById('minValue').textContent = minYear;
        document.getElementById('maxValue').textContent = maxYear;

        initFilters(); // Initialize filter controls

        renderMovies(filteredMoviesData); // Initial render
    } catch (error) {
        console.error("Error loading JSON:", error);
    }
}

// Render movie data in table format
function renderMovies(movies) {
    const container = document.getElementById("card-container");
    container.innerHTML = "";

    // Table column configuration
    const columns = [
        { key: "id", label: "ID" },
        { key: "title", label: "Title" },
        { key: "release_year", label: "Release year" },
        { key: "director", label: "Director" },
        { key: "box_office", label: "Box office" },
        { key: "country", label: "Country" },
        { key: null, label: "↺" } // Reset sorting column
    ];

    // Create table header
    const header = document.createElement("div");
    header.classList.add("card", "sticky-header");
    header.innerHTML = columns.map(col => {
        // Render reset sorting button
        if (!col.key) {
            return `<div onclick="resetSorting()" style="cursor: pointer; 
                    display: flex; align-items: center; justify-content: center;
                    min-width: 40px; padding: 0 8px;">
                <strong style="color: #9747ff;">${col.label}</strong>
            </div>`;
        }

        // Render sortable column header with arrows
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

    // Render movie rows
    movies.forEach(movie => {
        const card = document.createElement("div");
        card.classList.add("card");
        card.innerHTML = columns.map(col => {
            if (!col.key) return '<div></div>'; // Empty cell for reset column
            if (col.key === "box_office") {
                return `<div>$${Number(movie[col.key]).toLocaleString()}</div>`;
            }
            return `<div>${movie[col.key]}</div>`;
        }).join("");
        container.appendChild(card);
    });
}

// Sorting functionality
function sortBy(key) {
    // Update sorting history
    const existingIndex = sortHistory.findIndex(s => s.key === key);
    if (existingIndex > -1) {
        // Reverse direction if already sorted
        sortHistory[existingIndex].direction = 
            sortHistory[existingIndex].direction === 'asc' ? 'desc' : 'asc';
    } else {
        // Add new sorting criteria
        sortHistory.push({ key, direction: 'asc' });
    }

    applySorting();
    renderMovies(filteredMoviesData);
}

// Apply all sorting criteria from sortHistory
function applySorting() {
    let sortedData = [...filteredMoviesData];

    sortHistory.forEach(({ key, direction }) => {
        sortedData.sort((a, b) => {
            const valueA = a[key];
            const valueB = b[key];
            
            // Handle string comparison
            if (typeof valueA === 'string') {
                return direction === 'asc' 
                    ? valueA.localeCompare(valueB) 
                    : valueB.localeCompare(valueA);
            }
            // Handle numeric comparison
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

// Filter application logic
document.getElementById("applyFilter").addEventListener("click", () => {
    // Get filter values from UI
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

    // Update applied filters
    appliedFilters = {
        minYear: parseInt(document.getElementById("minYear").value),
        maxYear: parseInt(document.getElementById("maxYear").value),
        minBoxOffice: parseFloat(document.getElementById("minBoxOffice").value),
        maxBoxOffice: parseFloat(document.getElementById("maxBoxOffice").value),
        titles: [...selectedTitles],
        directors: [...selectedDirectors],
        countries: [...selectedCountries]
    };

    // Apply filters and sorting
    filteredMoviesData = applyCurrentFilters();
    applySorting();
    
    // Re-render table
    renderMovies(filteredMoviesData);
    closeFilterPanel();
});

// Handle filter button click to show/hide filter panel
document.getElementById("filter-button").addEventListener("click", () => {
    const filterPanel = document.getElementById("filter-panel");
    
    // Mobile view handling
    if (window.matchMedia("(max-width: 1024px)").matches) {
        document.body.classList.add("filter-panel-active");
        setTimeout(() => {
            filterPanel.classList.add("active");
        }, 10);
    } 
    // Desktop view handling
    else {
        filterPanel.classList.toggle("active");
        const panelWidth = filterPanel.classList.contains("active") ? 250 : 0;
        document.documentElement.style.setProperty("--filter-panel-width", `${panelWidth}px`);

    }
});

// Validate minimum box office input
document.getElementById("minBoxOffice").addEventListener("input", function() {
    if (this.value < 0) this.value = 0;
});

// Validate maximum box office input
document.getElementById("maxBoxOffice").addEventListener("input", function() {
    const min = parseFloat(document.getElementById("minBoxOffice").value);
    if (this.value < min) this.value = min;
});

// Initialize title multi-select filter
function initTitlesFilter() {
    // Get unique titles from data
    const titles = [...new Set(originalMoviesData.map(movie => movie.title))];
    const container = document.getElementById('titles-list');
    
    // Create checkbox elements
    container.innerHTML = titles.map(title => `
        <label class="option-item">
            <input type="checkbox" value="${title}">
            ${title}
        </label>
    `).join('');
    // Update selected count display
    updateSelectedCount('title', selectedTitles.length);
}

// Initialize director multi-select filter
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

// Initialize country multi-select filter
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

// Toggle multi-select dropdown visibility
function toggleDropdown(event) {
    event.stopPropagation();
    const parent = event.currentTarget.closest('.multiselect');
    const optionsContainer = parent.querySelector('.options-container');
    
    // Close other open dropdowns
    document.querySelectorAll('.options-container.show').forEach(openContainer => {
        if (openContainer !== optionsContainer) {
            openContainer.classList.remove('show');
        }
    });
    
    // Toggle current dropdown
    optionsContainer.classList.toggle('show');
}

// Update counter display for selected items
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
        counterElement.textContent = `Chosen: ${count}`;
    }
}

// Handle multi-select checkbox changes
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

// Title multi-select change handler
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

// Director multi-select change handler
document.getElementById('directors-list').addEventListener('change', (e) => {
    handleMultiSelectChange(e, selectedDirectors, 'director');
});

// Country multi-select change handler
document.getElementById('countries-list').addEventListener('change', (e) => {
    handleMultiSelectChange(e, selectedCountries, 'country');
});

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.multiselect')) {
        document.querySelectorAll('.options-container.show').forEach(container => {
            container.classList.remove('show');
        });
    }

    // Close filter panel when clicking outside
    const filterPanel = document.getElementById("filter-panel");
    if (!filterPanel.contains(e.target) && 
        e.target.id !== "filter-button" &&
        filterPanel.classList.contains("active")) {
        closeFilterPanel();
    }
});

// Handle done button in multi-select dropdowns
document.querySelectorAll('.done-button').forEach(button => {
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        const optionsContainer = e.target.closest('.options-container');
        optionsContainer.classList.remove('show');
    });
});

// Initialize application when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    fetchMovies().then(() => {
        // Set initial filter values
        appliedFilters = {
            minYear: Math.min(...originalMoviesData.map(m => m.release_year)),
            maxYear: Math.max(...originalMoviesData.map(m => m.release_year)),
            titles: [],
            directors: [],
            countries: []
        };
    });
});

// Filter panel management functions
function closeFilterPanel() {
    resetUnsavedFilters();
    const filterPanel = document.getElementById("filter-panel");
    
    // Handle mobile vs desktop closing
    if (window.matchMedia("(max-width: 1024px)").matches) {
        filterPanel.classList.remove("active");
        setTimeout(() => {
            document.body.classList.remove("filter-panel-active");
        }, 300);
    }
    filterPanel.classList.remove("active");
    document.documentElement.style.setProperty("--filter-panel-width", "0px");
}


document.getElementById("close-filter").addEventListener("click", closeFilterPanel);

// Reset UI filters to last applied state
function resetUnsavedFilters() {
    // Reset year inputs
    document.getElementById("minYear").value = appliedFilters.minYear;
    document.getElementById("maxYear").value = appliedFilters.maxYear;
    
    // Reset box office inputs
    document.getElementById("minBoxOffice").value = appliedFilters.minBoxOffice || '';
    document.getElementById("maxBoxOffice").value = appliedFilters.maxBoxOffice || '';
    
    // Update displayed year values
    document.getElementById("minValue").textContent = appliedFilters.minYear;
    document.getElementById("maxValue").textContent = appliedFilters.maxYear;

    // Reset multi-select filters
    selectedTitles = [...appliedFilters.titles];
    selectedDirectors = [...appliedFilters.directors];
    selectedCountries = [...appliedFilters.countries];

    // Update checkbox states
    updateCheckboxes('titles-list', appliedFilters.titles);
    updateCheckboxes('directors-list', appliedFilters.directors);
    updateCheckboxes('countries-list', appliedFilters.countries);
    
    // Update counter displays
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

// Reset sorting to initial state
function resetSorting() {
    sortHistory = [];
    filteredMoviesData = applyCurrentFilters();
    renderMovies(filteredMoviesData);
}

// Apply current filters to original dataset
function applyCurrentFilters() {
    const { minYear, maxYear, minBoxOffice, maxBoxOffice, titles, directors, countries } = appliedFilters;
    
    let filtered = originalMoviesData.filter(movie => {
        // Year filter
        const yearValid = movie.release_year >= minYear && movie.release_year <= maxYear;
        
        // Box office filter
        let boxOfficeValid = true;
        const boxOffice = parseFloat(movie.box_office);
        
        if (!isNaN(minBoxOffice)) boxOfficeValid = boxOffice >= minBoxOffice;
        if (!isNaN(maxBoxOffice)) boxOfficeValid = boxOfficeValid && boxOffice <= maxBoxOffice;
        
        return yearValid && boxOfficeValid;
    });
    
    // Apply multi-select filters
    if (titles.length > 0) filtered = filtered.filter(movie => titles.includes(movie.title));
    if (directors.length > 0) filtered = filtered.filter(movie => directors.includes(movie.director));
    if (countries.length > 0) filtered = filtered.filter(movie => countries.includes(movie.country));
    
    return filtered;
}