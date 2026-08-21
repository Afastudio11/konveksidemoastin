import { db } from '../db';
import { messageLogs } from '../db/schema';

export interface WhatsAppMessage {
  to: string;
  message: string;
  type: 'text' | 'image' | 'document';
  mediaUrl?: string;
  filename?: string;
}

export interface WhatsAppTemplate {
  name: string;
  params: Record<string, string>;
}

const MESSAGE_TEMPLATES = {
  orderConfirmation: (params: { customerName: string; trackingCode: string; totalAmount: string }) => `
Halo ${params.customerName}! 👋

Terima kasih atas pesanan Anda di Konveksi Industry.

📦 *Detail Pesanan:*
Kode Tracking: *${params.trackingCode}*
Total: ${params.totalAmount}

Anda dapat melacak status pesanan di:
🔗 https://konveksi.id/track/${params.trackingCode}

Terima kasih! 🙏
- Tim Konveksi Industry
  `.trim(),

  statusUpdate: (params: { customerName: string; trackingCode: string; status: string; statusLabel: string }) => `
Halo ${params.customerName}! 📢

Status pesanan Anda telah diperbarui:

📦 Kode Tracking: *${params.trackingCode}*
📍 Status: *${params.statusLabel}*

Lacak pesanan Anda di:
🔗 https://konveksi.id/track/${params.trackingCode}

- Tim Konveksi Industry
  `.trim(),

  paymentReminder: (params: { customerName: string; trackingCode: string; totalAmount: string; dueDate: string }) => `
Halo ${params.customerName}! 💳

Ini adalah pengingat pembayaran untuk pesanan Anda:

📦 Kode Tracking: *${params.trackingCode}*
💰 Total: ${params.totalAmount}
📅 Jatuh Tempo: ${params.dueDate}

Silakan lakukan pembayaran sebelum tanggal jatuh tempo.

Bayar sekarang:
🔗 https://konveksi.id/pay/${params.trackingCode}

- Tim Konveksi Industry
  `.trim(),

  paymentConfirmation: (params: { customerName: string; trackingCode: string; amount: string; paymentMethod: string }) => `
Halo ${params.customerName}! ✅

Pembayaran Anda telah kami terima:

📦 Kode Tracking: *${params.trackingCode}*
💰 Jumlah: ${params.amount}
💳 Metode: ${params.paymentMethod}

Terima kasih! Pesanan Anda akan segera diproses.

Lacak pesanan:
🔗 https://konveksi.id/track/${params.trackingCode}

- Tim Konveksi Industry
  `.trim(),

  orderCompleted: (params: { customerName: string; trackingCode: string }) => `
Halo ${params.customerName}! 🎉

Pesanan Anda telah selesai dan siap dikirim/diambil!

📦 Kode Tracking: *${params.trackingCode}*

Terima kasih telah mempercayakan pesanan Anda kepada Konveksi Industry.

Kami sangat menghargai feedback Anda:
🔗 https://konveksi.id/review/${params.trackingCode}

- Tim Konveksi Industry
  `.trim(),

  orderShipped: (params: { customerName: string; trackingCode: string; courier: string; resiNumber: string }) => `
Halo ${params.customerName}! 🚚

Pesanan Anda telah dikirim!

📦 Kode Tracking: *${params.trackingCode}*
🚚 Kurir: ${params.courier}
📋 No. Resi: *${params.resiNumber}*

Lacak pengiriman Anda di website kurir atau:
🔗 https://konveksi.id/track/${params.trackingCode}

- Tim Konveksi Industry
  `.trim(),
};

export class MockWhatsAppService {
  private apiKey: string;
  private isEnabled: boolean;
  private baseUrl: string;

  constructor(apiKey: string = 'MOCK_API_KEY') {
    this.apiKey = apiKey;
    this.isEnabled = !!apiKey && apiKey !== 'MOCK_API_KEY';
    this.baseUrl = 'https://api.fonnte.com/send';
  }

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    } else if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }
    
    return cleaned;
  }

  async sendMessage(message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const formattedPhone = this.formatPhoneNumber(message.to);
    
    console.log('[WhatsApp Mock] Sending message to:', formattedPhone);
    console.log('[WhatsApp Mock] Message:', message.message.substring(0, 100) + '...');

    const messageId = `WA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      await db.insert(messageLogs).values({
        messageType: 'whatsapp',
        recipient: formattedPhone,
        content: message.message,
        status: this.isEnabled ? 'sent' : 'mock',
      });
    } catch (error) {
      console.error('[WhatsApp Mock] Failed to log message:', error);
    }

    if (!this.isEnabled) {
      return {
        success: true,
        messageId,
        error: 'Mock mode - message not actually sent',
      };
    }

    return {
      success: true,
      messageId,
    };
  }

  async sendOrderConfirmation(to: string, params: { customerName: string; trackingCode: string; totalAmount: string }) {
    const message = MESSAGE_TEMPLATES.orderConfirmation(params);
    return this.sendMessage({ to, message, type: 'text' });
  }

  async sendStatusUpdate(to: string, params: { customerName: string; trackingCode: string; status: string; statusLabel: string }) {
    const message = MESSAGE_TEMPLATES.statusUpdate(params);
    return this.sendMessage({ to, message, type: 'text' });
  }

  async sendPaymentReminder(to: string, params: { customerName: string; trackingCode: string; totalAmount: string; dueDate: string }) {
    const message = MESSAGE_TEMPLATES.paymentReminder(params);
    return this.sendMessage({ to, message, type: 'text' });
  }

  async sendPaymentConfirmation(to: string, params: { customerName: string; trackingCode: string; amount: string; paymentMethod: string }) {
    const message = MESSAGE_TEMPLATES.paymentConfirmation(params);
    return this.sendMessage({ to, message, type: 'text' });
  }

  async sendOrderCompleted(to: string, params: { customerName: string; trackingCode: string }) {
    const message = MESSAGE_TEMPLATES.orderCompleted(params);
    return this.sendMessage({ to, message, type: 'text' });
  }

  async sendOrderShipped(to: string, params: { customerName: string; trackingCode: string; courier: string; resiNumber: string }) {
    const message = MESSAGE_TEMPLATES.orderShipped(params);
    return this.sendMessage({ to, message, type: 'text' });
  }

  getTemplates() {
    return Object.keys(MESSAGE_TEMPLATES);
  }
}

export const whatsappService = new MockWhatsAppService();
