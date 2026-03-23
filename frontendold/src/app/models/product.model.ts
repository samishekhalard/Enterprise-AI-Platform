export interface Product {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  status: 'planned' | 'under_development' | 'production' | 'retired';
  custodian: string;
  productOwner: string;
  productManager: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  factSheet: ProductFactSheet;
  personas: Persona[];
}

export interface ProductFactSheet {
  overview: string;
  targetAudience: string;
  keyFeatures: string[];
  businessValue: string;
  technicalSpecs: string;
  integrations: string[];
  pricing: string;
  supportInfo: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  icon: string;
  productCount: number;
}

export interface Persona {
  id: string;
  code: string;
  name: string;
  type: 'internal' | 'external';
  description: string;
  icon: string;
}

export function createEmptyProduct(): Product {
  return {
    id: generateProductId(),
    name: '',
    description: '',
    icon: '',
    category: '',
    status: 'planned',
    custodian: '',
    productOwner: '',
    productManager: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
    factSheet: {
      overview: '',
      targetAudience: '',
      keyFeatures: [],
      businessValue: '',
      technicalSpecs: '',
      integrations: [],
      pricing: '',
      supportInfo: ''
    },
    personas: []
  };
}

export function createEmptyPersona(): Persona {
  return {
    id: generateProductId(),
    code: '',
    name: '',
    type: 'internal',
    description: '',
    icon: ''
  };
}

export function generateProductId(): string {
  // Generate UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
