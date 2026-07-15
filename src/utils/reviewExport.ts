import { GoogleReview } from '../types';

export type ExportFormat = 'csv' | 'pdf' | 'excel';

interface ExportOptions {
  reviews: GoogleReview[];
  averageRating: string;
  format: ExportFormat;
}

const buildHeaders = () => [
  'Reviewer',
  'Rating',
  'Review',
  'Reply',
  'Status',
  'Date',
  'Location',
  'Starred',
];

const buildRow = (r: GoogleReview) => [
  r.reviewer_name,
  String(r.rating),
  r.review_text || '',
  r.reply_text || '',
  r.status,
  new Date(r.review_date).toLocaleDateString(),
  r.location_name || '',
  r.starred ? 'Yes' : 'No',
];

const downloadBlob = (content: BlobPart, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const escapeCSV = (value: string) => `"${String(value).replace(/"/g, '""')}"`;

export function exportReviews({ reviews, averageRating, format }: ExportOptions): void {
  if (reviews.length === 0) return;
  const dateStr = new Date().toISOString().slice(0, 10);

  if (format === 'csv') {
    const headers = buildHeaders();
    const rows = reviews.map((r) => buildRow(r).map(escapeCSV).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    downloadBlob(csv, `google-reviews-${dateStr}.csv`, 'text/csv;charset=utf-8;');
    return;
  }

  if (format === 'excel') {
    const headers = buildHeaders();
    const rows = reviews.map((r) => buildRow(r).map(escapeCSV).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    downloadBlob(
      '\uFEFF' + csv,
      `google-reviews-${dateStr}.xls`,
      'application/vnd.ms-excel;charset=utf-8;'
    );
    return;
  }

  if (format === 'pdf') {
    const printContent = generatePDFHtml(reviews, averageRating);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 300);
    }
    return;
  }
}

function generatePDFHtml(reviews: GoogleReview[], averageRating: string): string {
  const repliedCount = reviews.filter((r) => r.status === 'replied').length;
  const pendingCount = reviews.filter((r) => r.status !== 'replied').length;

  return `<!DOCTYPE html>
<html>
<head>
  <title>Google Reviews Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #1a1a1a; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 4px; }
    .subtitle { color: #666; font-size: 12px; margin-bottom: 20px; }
    .stats { display: flex; gap: 16px; margin: 20px 0; }
    .stat { background: #f5f7fa; padding: 16px; border-radius: 8px; flex: 1; text-align: center; border: 1px solid #e5e7eb; }
    .stat-value { font-size: 28px; font-weight: bold; color: #3b82f6; }
    .stat-label { font-size: 12px; color: #666; margin-top: 4px; }
    .review { border: 1px solid #e5e7eb; padding: 16px; margin: 12px 0; border-radius: 8px; page-break-inside: avoid; }
    .review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .reviewer { font-weight: bold; font-size: 14px; }
    .rating { color: #f59e0b; font-size: 14px; }
    .date { color: #666; font-size: 11px; }
    .location { color: #888; font-size: 11px; margin-left: 8px; }
    .review-text { margin: 8px 0; line-height: 1.6; font-size: 13px; }
    .reply { background: #eff6ff; padding: 12px; border-left: 3px solid #3b82f6; margin-top: 10px; border-radius: 4px; }
    .reply-label { font-weight: bold; color: #3b82f6; font-size: 11px; margin-bottom: 4px; }
    .reply-text { font-size: 12px; color: #444; line-height: 1.5; }
    .status-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
    .status-replied { background: #dcfce7; color: #166534; }
    .status-pending { background: #fef9c3; color: #854d0e; }
    .status-new { background: #dbeafe; color: #1e40af; }
    @media print { body { -webkit-print-color-adjust: exact; padding: 0; } }
  </style>
</head>
<body>
  <h1>Google Business Reviews Report</h1>
  <p class="subtitle">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
  <div class="stats">
    <div class="stat"><div class="stat-value">${reviews.length}</div><div class="stat-label">Total Reviews</div></div>
    <div class="stat"><div class="stat-value">${averageRating}</div><div class="stat-label">Average Rating</div></div>
    <div class="stat"><div class="stat-value">${repliedCount}</div><div class="stat-label">Replied</div></div>
    <div class="stat"><div class="stat-value">${pendingCount}</div><div class="stat-label">Pending</div></div>
  </div>
  ${reviews
    .map(
      (r) => `
    <div class="review">
      <div class="review-header">
        <span class="reviewer">${r.reviewer_name}</span>
        <span class="rating">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
      </div>
      <div>
        <span class="date">${new Date(r.review_date).toLocaleDateString()}</span>
        ${r.location_name ? `<span class="location">- ${r.location_name}</span>` : ''}
        <span class="status-badge status-${r.status === 'replied' ? 'replied' : r.status === 'pending_reply' ? 'pending' : 'new'}">${r.status.replace('_', ' ')}</span>
      </div>
      <div class="review-text">${r.review_text || 'No review text provided'}</div>
      ${
        r.reply_text
          ? `<div class="reply"><div class="reply-label">Our Response:</div><div class="reply-text">${r.reply_text}</div></div>`
          : ''
      }
    </div>
  `
    )
    .join('')}
</body>
</html>`;
}
