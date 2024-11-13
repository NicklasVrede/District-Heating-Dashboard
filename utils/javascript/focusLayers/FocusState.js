class FocusStateClass {
    constructor() {
        this._focus = 'none';
        this._listeners = new Set();
    }

    get focus() {
        return this._focus;
    }

    set focus(newFocus) {
        this._focus = newFocus;
        this._notifyListeners();
    }

    addListener(callback) {
        this._listeners.add(callback);
    }

    removeListener(callback) {
        this._listeners.delete(callback);
    }

    _notifyListeners() {
        this._listeners.forEach(callback => callback(this._focus));
    }
}

export const focusState = new FocusStateClass(); 