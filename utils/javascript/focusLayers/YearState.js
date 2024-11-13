class YearStateClass {
    constructor() {
        this._year = new Date().getFullYear().toString();
        this._listeners = new Set();
    }

    get year() {
        return this._year;
    }

    set year(newYear) {
        this._year = newYear;
        this._notifyListeners();
    }

    addListener(callback) {
        this._listeners.add(callback);
    }

    removeListener(callback) {
        this._listeners.delete(callback);
    }

    _notifyListeners() {
        this._listeners.forEach(callback => callback(this._year));
    }
}

export const yearState = new YearStateClass(); 