export type FeaturePreset = {
  id: string;
  label: string;
  category: string;
  icon: string;
  property_types: string[];
  sort_order: number;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type FeaturePresetInput = {
  label: string;
  category: string;
  icon: string;
  property_types: string[];
  sort_order: number;
  is_active: boolean;
};
