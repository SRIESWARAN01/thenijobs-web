/**
 * Generate a VCF (vCard) file for a company/business and trigger download.
 * When opened on a phone, this will save the contact directly.
 */

interface VCardContact {
  name: string;
  organization?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  address?: string;
  district?: string;
  category?: string;
  logoUrl?: string;
  note?: string;
}

export function generateVCard(contact: VCardContact): string {
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${contact.name}`,
  ];

  if (contact.organization) {
    lines.push(`ORG:${contact.organization}`);
  }

  if (contact.phone) {
    const cleanPhone = String(contact.phone).replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : `+${cleanPhone}`;
    lines.push(`TEL;TYPE=WORK,VOICE:${formattedPhone}`);
  }

  if (contact.whatsapp && contact.whatsapp !== contact.phone) {
    const cleanWA = String(contact.whatsapp).replace(/\D/g, '');
    const formattedWA = cleanWA.length === 10 ? `+91${cleanWA}` : `+${cleanWA}`;
    lines.push(`TEL;TYPE=CELL:${formattedWA}`);
  }

  if (contact.email) {
    lines.push(`EMAIL;TYPE=WORK:${contact.email}`);
  }

  if (contact.website) {
    lines.push(`URL:${contact.website}`);
  }

  if (contact.address || contact.district) {
    const addressParts = [contact.address, contact.district, 'Tamil Nadu', 'India'].filter(Boolean);
    lines.push(`ADR;TYPE=WORK:;;${addressParts.join(', ')}`);
  }

  if (contact.category) {
    lines.push(`TITLE:${contact.category}`);
  }

  if (contact.note) {
    lines.push(`NOTE:${contact.note}`);
  }

  // Add THENIJOBS source
  lines.push('SOURCE:https://thenijobs.in');
  lines.push(`NOTE:Verified Business on THENIJOBS Platform${contact.note ? '. ' + contact.note : ''}`);

  lines.push('END:VCARD');

  return lines.join('\r\n');
}

export function downloadVCard(contact: VCardContact): void {
  const vcfContent = generateVCard(contact);
  const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${contact.name.replace(/\s+/g, '_')}_THENIJOBS.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
