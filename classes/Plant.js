export class Plant {
    constructor(name, address, latitude, longitude, metric1, metric2, areaReference = null) {
        this.name = name;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.metric1 = metric1;
        this.metric2 = metric2;
        this.areaReference = areaReference; // Store reference to the matched area
    }
}