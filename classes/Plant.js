export class Plant {
    constructor(plantRef, name, address, latitude, longitude, metric1, metric2, forsyid = null, areaElements = []) {
        this.plantRef = plantRef; // Store reference to the actual plant element
        this.name = name;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.metric1 = metric1;
        this.metric2 = metric2;
        this.forsyid = forsyid; // Store reference to the matched area name
        this.areaElements = areaElements; // Store references to the actual area elements
        this.areaCounter = 0; // Initialize area counter
    }

}