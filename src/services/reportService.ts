import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export const reportService = {
  // Generate HTML for report
  generateReportHTML(data: {
    title: string;
    subtitle?: string;
    sections: Array<{
      heading: string;
      content: string;
    }>;
    footer?: string;
  }) {
    const { title, subtitle, sections, footer } = data;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              padding: 40px;
              color: #333;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 2px solid #4CAF50;
              padding-bottom: 20px;
            }
            h1 {
              color: #4CAF50;
              margin: 0 0 10px 0;
              font-size: 28px;
            }
            .subtitle {
              color: #666;
              font-size: 16px;
              margin: 0;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-heading {
              color: #2c3e50;
              font-size: 20px;
              margin-bottom: 15px;
              border-left: 4px solid #4CAF50;
              padding-left: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #4CAF50;
              color: white;
              font-weight: 600;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .total-row {
              font-weight: bold;
              background-color: #e8f5e9 !important;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            .summary-card {
              background: #f5f5f5;
              padding: 15px;
              border-radius: 8px;
              margin: 10px 0;
            }
            .summary-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .summary-item:last-child {
              border-bottom: none;
            }
            .amount {
              font-weight: bold;
              color: #4CAF50;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
          </div>
          
          ${sections.map(section => `
            <div class="section">
              <h2 class="section-heading">${section.heading}</h2>
              ${section.content}
            </div>
          `).join('')}
          
          ${footer ? `<div class="footer">${footer}</div>` : ''}
        </body>
      </html>
    `;
  },

  // Generate contributions report
  async generateContributionsReport(contributions: any[], summary: any, dateRange?: { start: Date; end: Date }) {
    const dateRangeStr = dateRange 
      ? `From ${dateRange.start.toLocaleDateString()} to ${dateRange.end.toLocaleDateString()}`
      : 'All Time';

    const rows = contributions.map(c => `
      <tr>
        <td>${c.memberName}</td>
        <td>${c.paymentMethod.toUpperCase()}</td>
        <td>${c.date.toLocaleDateString()}</td>
        <td class="amount">${c.amount.toLocaleString()} FCFA</td>
      </tr>
    `).join('');

    const content = `
      <table>
        <thead>
          <tr>
            <th>Member</th>
            <th>Method</th>
            <th>Date</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr class="total-row">
            <td colspan="3">Total</td>
            <td class="amount">${summary.total.toLocaleString()} FCFA</td>
          </tr>
        </tbody>
      </table>
      
      <div class="summary-card">
        <h3>Summary</h3>
        <div class="summary-item">
          <span>Total Contributions:</span>
          <span class="amount">${summary.total.toLocaleString()} FCFA</span>
        </div>
        <div class="summary-item">
          <span>Number of Transactions:</span>
          <span>${summary.count}</span>
        </div>
        <div class="summary-item">
          <span>Average Contribution:</span>
          <span class="amount">${Math.round(summary.average).toLocaleString()} FCFA</span>
        </div>
      </div>
    `;

    const html = this.generateReportHTML({
      title: 'Contributions Report',
      subtitle: dateRangeStr,
      sections: [{ heading: 'Contribution Details', content }],
      footer: `Generated on ${new Date().toLocaleString()} | SCDT Tontine Management`,
    });

    return html;
  },

  // Generate loans report
  async generateLoansReport(loans: any[], summary: any) {
    const rows = loans.map(l => `
      <tr>
        <td>${l.memberName}</td>
        <td>${l.amount.toLocaleString()} FCFA</td>
        <td>${l.remainingBalance.toLocaleString()} FCFA</td>
        <td>${l.status.toUpperCase()}</td>
        <td>${l.dueDate.toLocaleDateString()}</td>
      </tr>
    `).join('');

    const content = `
      <table>
        <thead>
          <tr>
            <th>Member</th>
            <th>Amount</th>
            <th>Balance</th>
            <th>Status</th>
            <th>Due Date</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      
      <div class="summary-card">
        <h3>Loan Summary</h3>
        <div class="summary-item">
          <span>Total Loans:</span>
          <span>${summary.total}</span>
        </div>
        <div class="summary-item">
          <span>Pending:</span>
          <span>${summary.pending}</span>
        </div>
        <div class="summary-item">
          <span>Active:</span>
          <span>${summary.active}</span>
        </div>
        <div class="summary-item">
          <span>Completed:</span>
          <span>${summary.completed}</span>
        </div>
        <div class="summary-item">
          <span>Overdue:</span>
          <span style="color: red;">${summary.overdue}</span>
        </div>
        <div class="summary-item">
          <span>Total Disbursed:</span>
          <span class="amount">${summary.totalAmount.toLocaleString()} FCFA</span>
        </div>
        <div class="summary-item">
          <span>Total Repaid:</span>
          <span class="amount">${summary.totalRepaid.toLocaleString()} FCFA</span>
        </div>
        <div class="summary-item">
          <span>Outstanding Balance:</span>
          <span class="amount">${summary.totalRemaining.toLocaleString()} FCFA</span>
        </div>
        <div class="summary-item">
          <span>Total Penalties:</span>
          <span style="color: red;">${summary.totalPenalties.toLocaleString()} FCFA</span>
        </div>
      </div>
    `;

    const html = this.generateReportHTML({
      title: 'Loans Report',
      sections: [{ heading: 'Loan Details', content }],
      footer: `Generated on ${new Date().toLocaleString()} | SCDT Tontine Management`,
    });

    return html;
  },

  // Generate comprehensive tontine report
  async generateTontineReport(summary: any, members: any[], contributions: any[], loans: any[]) {
    const content = `
      <div class="summary-card">
        <h3>Tontine Overview</h3>
        <div class="summary-item">
          <span>Total Members:</span>
          <span>${summary.totalMembers}</span>
        </div>
        <div class="summary-item">
          <span>Active Members:</span>
          <span>${summary.activeMembers}</span>
        </div>
        <div class="summary-item">
          <span>Total Contributions:</span>
          <span class="amount">${summary.totalContributions.toLocaleString()} FCFA</span>
        </div>
        <div class="summary-item">
          <span>Total Loans Disbursed:</span>
          <span class="amount">${summary.totalLoans.toLocaleString()} FCFA</span>
        </div>
        <div class="summary-item">
          <span>Outstanding Loan Balance:</span>
          <span class="amount">${summary.totalLoanBalance.toLocaleString()} FCFA</span>
        </div>
        <div class="summary-item">
          <span>Available Balance:</span>
          <span class="amount">${summary.availableBalance.toLocaleString()} FCFA</span>
        </div>
        <div class="summary-item">
          <span>Overdue Loans:</span>
          <span style="color: red;">${summary.overdueLoans}</span>
        </div>
      </div>
    `;

    const html = this.generateReportHTML({
      title: 'SCDT Tontine Comprehensive Report',
      subtitle: `Generated on ${new Date().toLocaleDateString()}`,
      sections: [{ heading: 'Financial Summary', content }],
      footer: `Generated on ${new Date().toLocaleString()} | SCDT Tontine Management System`,
    });

    return html;
  },

  // Print report
  async printReport(html: string) {
    try {
      await Print.printAsync({
        html,
        printerUrl: null, // null means use system print dialog
      });
      return true;
    } catch (error) {
      console.error('Error printing report:', error);
      return false;
    }
  },

  // Share report as PDF
  async shareReport(html: string, filename: string = 'report') {
    try {
      const { uri } = await Print.printToFileAsync({ html });
      
      if (Platform.OS === 'android') {
        const permissions = await Sharing.requestPermissionsAsync();
        if (!permissions.granted) {
          throw new Error('Storage permission denied');
        }
      }
      
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Report',
        UTI: 'com.adobe.pdf',
      });
      
      return true;
    } catch (error) {
      console.error('Error sharing report:', error);
      return false;
    }
  },

  // Export data to CSV
  generateCSV(data: any[], filename: string = 'export') {
    if (!data || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(fieldName => {
          const value = row[fieldName];
          // Escape quotes and wrap in quotes if contains comma
          const escaped = String(value || '').replace(/"/g, '""');
          return escaped.includes(',') ? `"${escaped}"` : escaped;
        }).join(',')
      ),
    ].join('\n');

    return csvContent;
  },

  // Download CSV
  async downloadCSV(data: any[], filename: string = 'export.csv') {
    try {
      const csvContent = this.generateCSV(data, filename);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // For web platform
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
      }
      
      // For mobile - save to file and share
      // This would require expo-file-system
      console.log('CSV generated:', csvContent.substring(0, 100) + '...');
      return csvContent;
    } catch (error) {
      console.error('Error generating CSV:', error);
      return null;
    }
  },
};
