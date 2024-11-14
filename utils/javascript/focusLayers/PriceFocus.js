import { yearState } from './YearState.js';

export class PriceFocus {
    constructor(map, measureContainer) {
        this.map = map;
        this.measureContainer = measureContainer;
        this.priceRankings = null; // Cache for rankings
        
        // Add listener for year changes
        yearState.addListener((year) => {
            this.updatePriceData();
        });
    }

    apply() {
        this.map.setLayoutProperty('plants-price', 'visibility', 'visible');
        this.updatePriceData();
        this.updateCircleSize();
    }

    updateCircleSize() {
        this.map.setPaintProperty('plants-price', 'circle-radius', [
            'interpolate',
            ['linear'],
            ['get', 'current_price'],
            0, 4, // 0 price, 6 radius
            2000, 6 // 1000 price, 8 radius
        ]);
    }

    updatePriceData() {
        try {
            const currentYear = yearState.year;
            const source = this.map.getSource('plants');
            
            if (!source) {
                console.error('Plants source not found');
                return;
            }

            const data = source._data;
            if (!data || !data.features) {
                console.error('Invalid source data structure');
                return;
            }
            
            // Update rankings if needed
            if (this.lastUpdateYear !== currentYear) {
                this.updateRankings(currentYear, data.features);
            }
            
            // Map features with prices
            data.features = data.features.map(feature => {
                const forsyid = feature.properties.forsyid;
                feature.properties.current_price = window.dataDict?.[forsyid]?.prices?.[currentYear]?.mwh_price ?? null;
                feature.properties.price_rank = this.priceRankings?.[forsyid]?.rank || 0;
                return feature;
            });
            
            source.setData(data);
        } catch (error) {
            console.error('Error updating price data:', error);
        }
    }

    updateRankings(year, features) {
        // Create array of price data
        const priceData = features
            .map(feature => {
                const forsyid = feature.properties.forsyid;
                const price = window.dataDict?.[forsyid]?.prices?.[year]?.mwh_price || 0;
                return { forsyid, price };
            })
            .filter(item => item.price > 0) // Only rank plants with prices
            .sort((a, b) => b.price - a.price); // Sort by price descending

        // Create rankings object
        this.priceRankings = {};
        priceData.forEach((item, index) => {
            this.priceRankings[item.forsyid] = {
                rank: index + 1,
                price: item.price,
                total: priceData.length
            };
        });

        this.lastUpdateYear = year;
    }

    // Helper methods for selections
    getTopNByPrice(n) {
        if (!this.priceRankings) return [];
        
        return Object.entries(this.priceRankings)
            .filter(([_, data]) => data.rank <= n)
            .map(([forsyid, _]) => forsyid);
    }

    getBottomNByPrice(n) {
        if (!this.priceRankings) return [];
        
        const totalRanked = Object.values(this.priceRankings)[0]?.total || 0;
        return Object.entries(this.priceRankings)
            .filter(([_, data]) => data.rank > totalRanked - n)
            .map(([forsyid, _]) => forsyid);
    }

    getPricePercentile(percentile) {
        if (!this.priceRankings) return [];
        
        const totalRanked = Object.values(this.priceRankings)[0]?.total || 0;
        const rankThreshold = Math.ceil(totalRanked * (percentile / 100));
        
        return Object.entries(this.priceRankings)
            .filter(([_, data]) => data.rank <= rankThreshold)
            .map(([forsyid, _]) => forsyid);
    }

    updateCircleStyle() {
        // Update circle color and opacity together in the case statement
        this.map.setPaintProperty('plants-price', 'circle-color', [
            'case',
            ['==', ['get', 'current_price'], null],
            'rgba(0, 0, 0, 0)',  // Completely transparent
            [
                'interpolate',
                ['linear'],
                ['get', 'current_price'],
                VIZ_CONFIG.priceRange.min, VIZ_CONFIG.colors.low,
                VIZ_CONFIG.priceRange.max, VIZ_CONFIG.colors.high
            ]
        ]);

        // Set base opacity to 1 since we're handling transparency in the color
        this.map.setPaintProperty('plants-price', 'circle-opacity', 1);

        // Update circle radius to match default plant styling
        this.map.setPaintProperty('plants-price', 'circle-radius', [
            'case',
            ['==', ['get', 'current_price'], null],
            [
                'interpolate',
                ['linear'],
                ['zoom'],
                5, 4,
                10, 8,
                15, 12,
                20, 16
            ],
            [
                'interpolate',
                ['linear'],
                ['get', 'current_price'],
                VIZ_CONFIG.priceRange.min, VIZ_CONFIG.circle.minRadius,
                VIZ_CONFIG.priceRange.max, VIZ_CONFIG.circle.maxRadius
            ]
        ]);

        // Add stroke properties to match default plant styling
        this.map.setPaintProperty('plants-price', 'circle-stroke-width', 2);
        this.map.setPaintProperty('plants-price', 'circle-stroke-color', 'white');
    }
} 