export interface LocationInfo {
  slug: string;
  name: string;
  district: string;
  description: string;
  highlights: string[];
}

export const LOCATIONS_DATA: Record<string, LocationInfo> = {
  theni: {
    slug: 'theni',
    name: 'Theni',
    district: 'Theni',
    description: 'Find the latest job vacancies in Theni town and surrounding hubs. Explore verified private jobs, fresher openings, IT, retail, agriculture, healthcare, and manufacturing opportunities with direct employer contact.',
    highlights: ['Agricultural processing & cardamom trade', 'Textiles & handloom industries', 'Healthcare & clinical services', 'Banking, retail & customer support'],
  },
  cumbum: {
    slug: 'cumbum',
    name: 'Cumbum',
    district: 'Theni',
    description: 'Explore verified job openings in Cumbum valley. Discover agriculture management, grape farming, retail trade, sales, finance, and logistics roles across Cumbum and Gudalur.',
    highlights: ['Agribusiness & horticulture trade', 'Wholesale & retail distribution', 'Banking & financial services', 'Logistics & transport services'],
  },
  periyakulam: {
    slug: 'periyakulam',
    name: 'Periyakulam',
    district: 'Theni',
    description: 'Search active job vacancies in Periyakulam. Find opportunities across educational institutions, agricultural research hubs, horticulture, healthcare, and retail businesses.',
    highlights: ['Educational institutions & coaching centers', 'Horticulture & research farms', 'Local commerce & supply chains', 'Healthcare clinics & pharmacies'],
  },
  bodinayakanur: {
    slug: 'bodinayakanur',
    name: 'Bodinayakanur',
    district: 'Theni',
    description: 'Browse top job opportunities in Bodinayakanur (Bodi) — the Cardamom Capital of India. Connect with spices trading companies, transport agencies, finance firms, and local businesses.',
    highlights: ['Spices & Cardamom export trade', 'Logistics, warehousing & packaging', 'Retail stores & wholesale trade', 'Accounting & office management'],
  },
  uthamapalayam: {
    slug: 'uthamapalayam',
    name: 'Uthamapalayam',
    district: 'Theni',
    description: 'Find active job openings in Uthamapalayam town. Explore private jobs in education, healthcare, banking, retail, and local small & medium enterprises.',
    highlights: ['Colleges, schools & teaching staff', 'Retail showrooms & marketing', 'Micro-finance & cooperative banking', 'Customer service & technical roles'],
  },
  andipatti: {
    slug: 'andipatti',
    name: 'Andipatti',
    district: 'Theni',
    description: 'Discover verified jobs in Andipatti. Search vacancies in textile mills, handloom units, agricultural supply chains, driving, and retail shops.',
    highlights: ['Textile mills & spinning factories', 'Handloom & weaving units', 'Local retail & dealership networks', 'Transport & delivery services'],
  },
  chinnamanur: {
    slug: 'chinnamanur',
    name: 'Chinnamanur',
    district: 'Theni',
    description: 'Explore job openings in Chinnamanur. Find commercial, agricultural trade, banana farming supply chains, sales, and retail positions.',
    highlights: ['Banana trade & agro-warehousing', 'Commercial retail centers', 'Financial & insurance services', 'Field sales & business development'],
  },
  madurai: {
    slug: 'madurai',
    name: 'Madurai',
    district: 'Madurai',
    description: 'Search hundreds of active job openings in Madurai city. Find IT & software roles, hospital healthcare jobs, BPO, automobile, and manufacturing careers.',
    highlights: ['IT parks & software development hubs', 'Multi-specialty hospitals & pharma', 'Automobile & industrial manufacturing', 'BPO & customer support operations'],
  },
  dindigul: {
    slug: 'dindigul',
    name: 'Dindigul',
    district: 'Dindigul',
    description: 'Find top jobs in Dindigul district. Explore opportunities in lock manufacturing, textile spinning, leather processing, banking, and educational institutes.',
    highlights: ['Lock & hardware manufacturing', 'Textile spinning & garment units', 'Leather processing & export firms', 'Agro-processing & dairy industries'],
  },
};

export const CATEGORIES_LIST = [
  { slug: 'freshers', name: 'Fresher & Entry Level', count: '120+' },
  { slug: 'sales', name: 'Sales & Marketing', count: '95+' },
  { slug: 'it', name: 'IT & Software Development', count: '60+' },
  { slug: 'accounts', name: 'Finance, Accounts & Tally', count: '45+' },
  { slug: 'healthcare', name: 'Healthcare, Hospital & Pharma', count: '50+' },
  { slug: 'education', name: 'Teaching & Education', count: '40+' },
  { slug: 'banking', name: 'Banking & Insurance', count: '35+' },
  { slug: 'hospitality', name: 'Hotel & Hospitality', count: '30+' },
  { slug: 'manufacturing', name: 'Manufacturing & Industrial', count: '55+' },
  { slug: 'driving', name: 'Driver & Delivery', count: '40+' },
  { slug: 'security', name: 'Security Guard & Facility', count: '25+' },
  { slug: 'customer-service', name: 'Customer Support & BPO', count: '35+' },
  { slug: 'part-time', name: 'Part-Time Jobs', count: '75+' },
  { slug: 'full-time', name: 'Full-Time Regular', count: '150+' },
  { slug: 'work-from-home', name: 'Work From Home & Remote', count: '30+' },
];
