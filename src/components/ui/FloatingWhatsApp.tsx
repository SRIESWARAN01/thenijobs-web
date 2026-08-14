'use client';

export default function FloatingWhatsApp({ number = '919876543210' }: { number?: string }) {
  return (
    <a
      href={`https://wa.me/${number}?text=Hi%2C%20I%20found%20you%20on%20THENIJOBS`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-4 md:bottom-8 md:right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 animate-pulse-glow"
      style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
      aria-label="Chat on WhatsApp"
    >
      <svg viewBox="0 0 32 32" className="w-7 h-7 fill-white">
        <path d="M16 0C7.164 0 0 7.163 0 16c0 2.82.736 5.463 2.022 7.756L0 32l8.494-2.002A15.924 15.924 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm8.07 22.26c-.34.957-1.983 1.826-2.72 1.942-.695.11-1.572.155-2.535-.16-.584-.194-1.334-.452-2.29-.885-4.03-1.743-6.664-5.815-6.864-6.087-.197-.27-1.607-2.136-1.607-4.074 0-1.937 1.016-2.89 1.376-3.282.36-.393.785-.49 1.047-.49.262 0 .524.003.753.014.242.012.566-.092.886.676.337.797 1.143 2.734 1.243 2.932.1.197.165.427.032.687-.131.26-.197.42-.393.647-.197.228-.415.51-.591.686-.197.196-.402.41-.173.804.23.393 1.02 1.683 2.19 2.725 1.505 1.34 2.774 1.753 3.168 1.95.393.197.622.165.852-.098.23-.262.985-1.148 1.247-1.54.263-.394.525-.328.885-.197.36.13 2.29 1.08 2.684 1.278.393.197.656.295.754.46.098.163.098.95-.24 1.907z" />
      </svg>
    </a>
  );
}
