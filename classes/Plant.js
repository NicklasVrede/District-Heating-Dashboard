export class Plant {
    constructor(plantRef, name, address, latitude, longitude, metric1, metric2, forsyid = null, areaElements = []) {
        this.plantRef = plantRef;
        this.name = name;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.metric1 = metric1;
        this.metric2 = metric2;
        this.forsyid = forsyid;
        this.areaElements = areaElements;
        this.areaCounter = 0;
        this.selected = false; // Add selected property
    }
}