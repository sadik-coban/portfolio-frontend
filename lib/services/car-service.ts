import { carApi } from '@/lib/api';

// --- 1. TİP TANIMLARI ---

export interface DashboardFilters {
    brand?: string;
    series?: string;
    min_price?: string;
    max_price?: string;
    min_year?: string;
    max_year?: string;
    min_km?: string;
    max_km?: string;
}

export interface DamageDetails {
    roof_status: string;
    hood_status: string;
    trunk_status: string;
    doors_changed: number;
    doors_painted: number;
    doors_local: number;
    fenders_changed: number;
    fenders_painted: number;
    fenders_local: number;
}

export interface PredictionInput {
    brand: string;
    series: string;
    model: string;
    year: number;
    mileage: number;
    transmission: string;
    fuel: string;
    body_type: string;
    engine_cc_val: number;
    power_hp_val: number;
    torque_nm: number;
    cylinder_count: number;
    kb_drivetrain: string;
    segment_clean: string;
    gb_warranty_status: string;
    is_heavy_damaged: number;
    damage_details: DamageDetails;
}

export interface PredictionResult {
    price: number;
    price_range: {
        min: number;
        max: number;
        margin_percent: number;
    };
    version: string;
    calculated_risk_score: number;
    currency: string;
}

export interface ModelVersion {
    version_id: string;
    date: string;
    description?: string;
}

// --- 2. MAPPING CONSTANTS (İngilizce -> Türkçe Çeviriciler) ---

const MAPPINGS: Record<string, Record<string, string>> = {
    fuel: {
        "Gasoline": "Benzin",
        "Diesel": "Dizel",
        "LPG": "LPG & Benzin",
        "Hybrid": "Benzin & Elektrik",
    },
    transmission: {
        "Automatic": "Otomatik",
        "Manual": "Düz",
        "Semi-Automatic": "Yarı Otomatik"
    },
    body_type: {
        "Sedan": "Sedan",
        "Hatchback": "Hatchback/5",
        "Station Wagon": "Station wagon",
        "Coupe": "Coupe",
        "Cabrio": "Cabrio",
        "SUV": "SUV",
        "MPV": "MPV"
    },
    damage: {
        "Original": "Orjinal",
        "Painted": "Boyalı",
        "Locally Painted": "Lokal Boyalı",
        "Changed": "Değişen"
    },
    warranty: {
        "No Warranty": "Garantisi Yok",
        "Warranty Continues": "Garantisi Var"
    },
    drivetrain: {
        "RWD": "Arkadan İtiş",
        "FWD": "Önden Çekiş",
        "4WD": "4WD (Sürekli)",
        "AWD": "AWD (Elektronik)"
    }
};

// --- 3. SERVİS KATMANI ---

export const carService = {

    // --- DASHBOARD (Ağır Veri) ---
    getDashboardData: async (filters: DashboardFilters) => {
        // Dashboard filtrelerinde 'Tümü' yerine 'All' gelirse veya tam tersi durumlar için temizlik
        const cleanFilters = Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => v != null && v !== '' && v !== 'All' && v !== 'Tümü')
        );

        // Eğer filtrelerde yakıt vb. İngilizce gelirse burada da çevirmek gerekebilir
        // Ancak genellikle Dashboard ID bazlı çalıştığı için kritik olmayabilir.

        const params = new URLSearchParams(cleanFilters as any);
        const response = await carApi.get(`/api/dashboard-data?${params}`);
        return response.data;
    },

    // --- DROPDOWN OPTIMIZATION ---
    getBrands: async () => {
        const response = await carApi.get('/api/options');
        return response.data.brands || [];
    },

    getSeriesByBrand: async (brand: string) => {
        if (!brand || brand === 'Tümü' || brand === 'All') return [];
        const response = await carApi.get(`/api/options?brand=${encodeURIComponent(brand)}`);
        return response.data.series || [];
    },

    getModelsBySeries: async (brand: string, series: string) => {
        if (!brand || !series) return [];
        const response = await carApi.get(
            `/api/options?brand=${encodeURIComponent(brand)}&series=${encodeURIComponent(series)}`
        );
        return response.data.models || [];
    },

    // --- PREDICTION & VERSIONS ---

    getVersions: async (): Promise<ModelVersion[]> => {
        const response = await carApi.get('/versions');
        return response.data;
    },

    getDriftAnalysis: async (refVer: string, currVer: string) => {
        const response = await carApi.get(`/drift/${refVer}/${currVer}`);
        return response.data.results;
    },

    // Fiyat Tahmini Yap (Mapping Uygulanmış Hali)
    predictPrice: async (data: PredictionInput): Promise<PredictionResult> => {
        // 1. En güncel versiyonu bul
        const versions = await carService.getVersions();
        if (!versions || versions.length === 0) {
            throw new Error("Aktif model versiyonu bulunamadı.");
        }
        const latestVersionId = versions[0].version_id;

        // 2. VERİYİ TÜRKÇEYE ÇEVİR (Mapping)
        const mappedData: PredictionInput = {
            ...data,
            fuel: MAPPINGS.fuel[data.fuel] || data.fuel,
            transmission: MAPPINGS.transmission[data.transmission] || data.transmission,
            body_type: MAPPINGS.body_type[data.body_type] || data.body_type,
            gb_warranty_status: MAPPINGS.warranty[data.gb_warranty_status] || data.gb_warranty_status,
            kb_drivetrain: MAPPINGS.drivetrain[data.kb_drivetrain] || data.kb_drivetrain,
            // Hasar Detaylarını Çevir
            damage_details: {
                ...data.damage_details,
                roof_status: MAPPINGS.damage[data.damage_details.roof_status] || data.damage_details.roof_status,
                hood_status: MAPPINGS.damage[data.damage_details.hood_status] || data.damage_details.hood_status,
                trunk_status: MAPPINGS.damage[data.damage_details.trunk_status] || data.damage_details.trunk_status,
            }
        };

        // 3. Çevrilmiş veriyi gönder
        const response = await carApi.post(`/predict/${latestVersionId}`, mappedData);
        return response.data;
    }
};