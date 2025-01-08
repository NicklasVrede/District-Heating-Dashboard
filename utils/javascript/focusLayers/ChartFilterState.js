class ChartFilterStateClass {
    constructor() {
        this._filterState = {
            production: {},
            totalProduction: {},
            price: {}
        };
    }

    get filterState() {
        return this._filterState;
    }

    updateFilter(chartType, datasetIndex, isHidden) {
        if (!this._filterState[chartType]) {
            this._filterState[chartType] = {};
        }
        this._filterState[chartType][datasetIndex] = isHidden;
    }

    getFilterState(chartType) {
        return this._filterState[chartType] || {};
    }

    resetFilters() {
        this._filterState = {
            production: {},
            totalProduction: {},
            price: {}
        };
    }
}

export const chartFilterState = new ChartFilterStateClass(); 