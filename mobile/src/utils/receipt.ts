import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export const downloadReceipt = async (data: any, type: 'order' | 'payment') => {
  try {
    const isOrder = type === 'order';
    const id = data.id;
    const amount = isOrder ? data.total_amount : data.amount;
    const date = new Date(data.created_at).toLocaleString();
    const status = data.status.toUpperCase();
    const currency = isOrder ? 'NGN' : data.currency || 'NGN';
    
    // Build line items if it's an order
    let itemsHtml = '';
    if (isOrder && data.items && data.items.length > 0) {
      itemsHtml = `
        <div style="margin-top: 20px;">
          <h3 style="color: #333; font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Items / Services</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr style="border-bottom: 1px solid #eee; text-align: left; color: #666; font-size: 14px;">
              <th style="padding: 8px 0;">Description</th>
              <th style="padding: 8px 0; text-align: right;">Qty</th>
              <th style="padding: 8px 0; text-align: right;">Total</th>
            </tr>
            ${data.items.map((item: any) => `
              <tr style="border-bottom: 1px solid #f9f9f9; font-size: 14px; color: #333;">
                <td style="padding: 12px 0;">Product/Service ID: ${item.product_id}</td>
                <td style="padding: 12px 0; text-align: right;">${item.quantity}</td>
                <td style="padding: 12px 0; text-align: right;">₦${parseFloat(item.line_total).toLocaleString()}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      `;
    }

    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 40px; }
            .header h1 { color: #4f46e5; margin: 0; font-size: 28px; }
            .header p { color: #6b7280; margin-top: 5px; font-size: 14px; }
            .details { background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .details-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
            .details-label { color: #6b7280; font-weight: 500; }
            .details-value { font-weight: bold; color: #111827; }
            .total { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; font-size: 20px; font-weight: bold; }
            .total-label { color: #374151; }
            .total-value { color: #4f46e5; }
            .footer { text-align: center; margin-top: 60px; color: #9ca3af; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ENTERCOM</h1>
            <p>Official Transaction Receipt</p>
          </div>
          
          <div class="details">
            <div class="details-row">
              <span class="details-label">Receipt Type</span>
              <span class="details-value">${isOrder ? 'Order Invoice' : 'Payment Receipt'}</span>
            </div>
            <div class="details-row">
              <span class="details-label">Reference ID</span>
              <span class="details-value" style="font-family: monospace;">${id}</span>
            </div>
            <div class="details-row">
              <span class="details-label">Date</span>
              <span class="details-value">${date}</span>
            </div>
            <div class="details-row">
              <span class="details-label">Status</span>
              <span class="details-value" style="color: ${status === 'COMPLETED' || status === 'PAID' || status === 'SUCCESS' ? '#10b981' : '#f59e0b'};">${status}</span>
            </div>
            ${!isOrder && data.order_id ? `
            <div class="details-row">
              <span class="details-label">Order ID</span>
              <span class="details-value" style="font-family: monospace;">${data.order_id}</span>
            </div>
            ` : ''}
          </div>

          ${itemsHtml}

          <div class="total">
            <span class="total-label">Total Amount</span>
            <span class="total-value">₦${parseFloat(amount || 0).toLocaleString()}</span>
          </div>

          <div class="footer">
            <p>Thank you for doing business with Entercom.</p>
            <p>If you have any questions, please contact support.</p>
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Download Receipt',
        UTI: 'com.adobe.pdf'
      });
    } else {
      Alert.alert('Error', 'Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Error generating receipt:', error);
    Alert.alert('Error', 'Failed to generate receipt. Please try again.');
  }
};
