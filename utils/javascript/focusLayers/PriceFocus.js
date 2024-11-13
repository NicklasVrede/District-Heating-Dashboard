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
        this.map.setLayoutProperty('plants', 'visibility', 'none');
        this.map.setLayoutProperty('plants-price', 'visibility', 'visible');
        this.updatePriceData();
        this.updateCircleSize();
    }

    updateCircleSize() {
        this.map.setPaintProperty('plants-price', 'circle-radius', [
            'interpolate',
            ['linear'],
            ['get', 'current_price'],
            0, 6,
            1000, 8
        ]);
    }

    updatePriceData() {
        try {
            // Use the shared year state instead of current year
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
            
            data.features = data.features.map(feature => {
                const forsyid = feature.properties.forsyid;
                const prices = window.dataDict?.[forsyid]?.prices?.[currentYear];
                feature.properties.current_price = prices?.mwh_price || 0;
                // Add ranking to feature properties
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
} 