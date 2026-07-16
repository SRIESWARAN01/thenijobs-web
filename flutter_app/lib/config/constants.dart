/// Application-wide constants matching the web app's constants.ts

// ===== LAUNCH LOCATION SCOPE =====
const String launchState = 'Tamil Nadu';
const String launchDistrict = 'Theni';

const List<String> theniLocations = [
  'Theni', 'Uthamapalayam', 'Cumbum', 'Chinnamanur',
  'Bodinayakanur', 'Periyakulam', 'Andipatti', 'Devaram',
  'Kombai', 'Veerapandi', 'Gudalur', 'Thevaram',
];

const List<String> tnDistricts = [
  'Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem',
  'Tirunelveli', 'Erode', 'Vellore', 'Thoothukudi', 'Dindigul',
  'Thanjavur', 'Ranipet', 'Sivaganga', 'Virudhunagar', 'Namakkal',
  'Theni', 'Villupuram', 'Nagapattinam', 'Kancheepuram', 'Tiruppur',
  'Krishnagiri', 'Dharmapuri', 'Pudukkottai', 'Ramanathapuram',
  'Karur', 'Cuddalore', 'Ariyalur', 'Perambalur', 'Nilgiris',
  'Tiruvannamalai', 'Tiruvarur', 'Tirupathur', 'Chengalpattu',
  'Mayiladuthurai', 'Kallakurichi', 'Tenkasi',
];

// ===== JOB CATEGORIES =====
const List<String> jobCategories = [
  'IT & Software', 'Healthcare', 'Education', 'Agriculture',
  'Construction', 'Manufacturing', 'Retail', 'Finance',
  'Hospitality', 'Transportation', 'Textile', 'Automobile',
  'Real Estate', 'Media', 'Government', 'BPO',
  'Sales & Marketing', 'Accounting', 'Legal', 'HR',
];

// ===== SKILLS =====
const List<String> skillsList = [
  'Python', 'Java', 'JavaScript', 'TypeScript', 'React', 'Angular', 'Node.js',
  'SQL', 'MongoDB', 'AWS', 'HTML/CSS', 'Flutter', 'Android', 'iOS',
  'Data Entry', 'MS Office', 'Tally', 'AutoCAD',
  'Communication', 'Leadership', 'Teamwork', 'Problem Solving',
  'Time Management', 'Customer Service', 'Sales', 'Negotiation',
  'Accounting', 'Marketing', 'Content Writing', 'Graphic Design',
  'Welding', 'Electrical', 'Plumbing', 'Carpentry', 'Driving',
  'Machine Operation', 'Quality Control', 'Packaging',
  'Tamil Typing', 'English Typing', 'Tailoring', 'Embroidery',
  'Agriculture Management', 'Silk Weaving', 'Logistics',
];

// ===== EXPERIENCE LEVELS =====
const List<String> experienceLevels = [
  'Fresher', '1-2 Years', '3-5 Years', '5-10 Years', '10+ Years',
];

// ===== SALARY RANGES (INR per month) =====
class SalaryRange {
  final String label;
  final int min;
  final int max;
  const SalaryRange({required this.label, required this.min, required this.max});
}

const List<SalaryRange> salaryRanges = [
  SalaryRange(label: '₹5,000 - ₹10,000', min: 5000, max: 10000),
  SalaryRange(label: '₹10,000 - ₹15,000', min: 10000, max: 15000),
  SalaryRange(label: '₹15,000 - ₹20,000', min: 15000, max: 20000),
  SalaryRange(label: '₹20,000 - ₹30,000', min: 20000, max: 30000),
  SalaryRange(label: '₹30,000 - ₹50,000', min: 30000, max: 50000),
  SalaryRange(label: '₹50,000 - ₹75,000', min: 50000, max: 75000),
  SalaryRange(label: '₹75,000 - ₹1,00,000', min: 75000, max: 100000),
  SalaryRange(label: '₹1,00,000+', min: 100000, max: 999999),
];

// ===== BUSINESS CATEGORIES =====
const List<String> businessCategories = [
  'Agriculture', 'Construction', 'Manufacturing', 'Textile',
  'IT & Software', 'Education', 'Healthcare', 'Retail',
  'Transportation', 'Real Estate', 'Finance', 'Hospitality',
  'Food & Beverage', 'Automobile', 'Media & Entertainment',
];

// ===== SHOP PRODUCT CATEGORIES =====
const List<String> shopProductCategories = [
  'All', 'Local Products', 'Clothing & Textiles', 'Food & Beverages',
  'Electronics', 'Home & Garden', 'Health & Beauty', 'Agriculture',
  'Handicrafts', 'Others',
];

// ===== API BASE URL =====
/// Use your deployed Next.js server URL for API calls.
/// In development, point to your local dev server.
const String apiBaseUrl = 'https://thenijobs.vercel.app';
const String devApiBaseUrl = 'http://localhost:3000';

// ===== WHATSAPP =====
const String whatsappBusinessNumber = '917094826586';
const String shopName = 'THENIJOBS Store';

// ===== RAZORPAY =====
/// Only the publishable key goes in the client app.
/// The secret key stays server-side.
const String razorpayKeyId = 'rzp_live_T6VwhPg3G9Efc4';
