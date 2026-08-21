import { v4 as uuidv4 } from 'uuid';

export interface MidtransTransaction {
  orderId: string;
  transactionId: string;
  paymentType: 'bank_transfer' | 'qris' | 'gopay' | 'shopeepay';
  grossAmount: number;
  currency: string;
  transactionStatus: 'pending' | 'capture' | 'settlement' | 'deny' | 'cancel' | 'expire' | 'refund';
  fraudStatus?: 'accept' | 'challenge' | 'deny';
  vaNumber?: string;
  bank?: string;
  qrCodeUrl?: string;
  expiryTime: Date;
  createdAt: Date;
  paymentUrl?: string;
}

export interface CreateTransactionRequest {
  orderId: string;
  grossAmount: number;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  paymentType: 'bank_transfer' | 'qris' | 'gopay' | 'shopeepay';
  bank?: 'bca' | 'bni' | 'bri' | 'mandiri' | 'permata';
  itemDetails: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

const mockTransactions = new Map<string, MidtransTransaction>();

function generateVA(bank: string): string {
  const prefixes: Record<string, string> = {
    bca: '014',
    bni: '009',
    bri: '002',
    mandiri: '008',
    permata: '013',
  };
  const prefix = prefixes[bank] || '000';
  const random = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
  return prefix + random;
}

function generateQRCode(): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=MOCK_QRIS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export class MockMidtransService {
  private serverKey: string;
  private isProduction: boolean;

  constructor(serverKey: string = 'MOCK_SERVER_KEY', isProduction: boolean = false) {
    this.serverKey = serverKey;
    this.isProduction = isProduction;
  }

  async createTransaction(request: CreateTransactionRequest): Promise<MidtransTransaction> {
    const transactionId = `MT-${uuidv4().substring(0, 8).toUpperCase()}`;
    const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

    let transaction: MidtransTransaction = {
      orderId: request.orderId,
      transactionId,
      paymentType: request.paymentType,
      grossAmount: request.grossAmount,
      currency: 'IDR',
      transactionStatus: 'pending',
      expiryTime,
      createdAt: new Date(),
    };

    if (request.paymentType === 'bank_transfer' && request.bank) {
      transaction.vaNumber = generateVA(request.bank);
      transaction.bank = request.bank.toUpperCase();
    } else if (request.paymentType === 'qris') {
      transaction.qrCodeUrl = generateQRCode();
    } else if (request.paymentType === 'gopay' || request.paymentType === 'shopeepay') {
      transaction.paymentUrl = `https://simulator.sandbox.midtrans.com/v2/simulation/${request.paymentType}/${transactionId}`;
      transaction.qrCodeUrl = generateQRCode();
    }

    mockTransactions.set(transactionId, transaction);
    mockTransactions.set(request.orderId, transaction);

    return transaction;
  }

  async getTransactionStatus(transactionIdOrOrderId: string): Promise<MidtransTransaction | null> {
    return mockTransactions.get(transactionIdOrOrderId) || null;
  }

  async simulatePayment(transactionIdOrOrderId: string): Promise<MidtransTransaction | null> {
    const transaction = mockTransactions.get(transactionIdOrOrderId);
    if (!transaction) return null;

    transaction.transactionStatus = 'settlement';
    transaction.fraudStatus = 'accept';

    mockTransactions.set(transaction.transactionId, transaction);
    mockTransactions.set(transaction.orderId, transaction);

    return transaction;
  }

  async cancelTransaction(transactionIdOrOrderId: string): Promise<MidtransTransaction | null> {
    const transaction = mockTransactions.get(transactionIdOrOrderId);
    if (!transaction) return null;

    transaction.transactionStatus = 'cancel';

    mockTransactions.set(transaction.transactionId, transaction);
    mockTransactions.set(transaction.orderId, transaction);

    return transaction;
  }

  async expireTransaction(transactionIdOrOrderId: string): Promise<MidtransTransaction | null> {
    const transaction = mockTransactions.get(transactionIdOrOrderId);
    if (!transaction) return null;

    transaction.transactionStatus = 'expire';

    mockTransactions.set(transaction.transactionId, transaction);
    mockTransactions.set(transaction.orderId, transaction);

    return transaction;
  }

  generateSnapToken(): string {
    return `SNAP-${uuidv4().substring(0, 16).toUpperCase()}`;
  }

  getPaymentInstructions(transaction: MidtransTransaction): string[] {
    if (transaction.paymentType === 'bank_transfer' && transaction.vaNumber) {
      return [
        `Transfer ke ${transaction.bank} Virtual Account`,
        `Nomor VA: ${transaction.vaNumber}`,
        `Jumlah: Rp ${transaction.grossAmount.toLocaleString('id-ID')}`,
        `Batas waktu: ${transaction.expiryTime.toLocaleString('id-ID')}`,
        '',
        'Cara Transfer via Mobile Banking:',
        '1. Login ke aplikasi mobile banking Anda',
        '2. Pilih menu Transfer > Virtual Account',
        `3. Masukkan nomor VA: ${transaction.vaNumber}`,
        '4. Konfirmasi jumlah dan detail transfer',
        '5. Masukkan PIN/password untuk konfirmasi',
        '6. Simpan bukti transfer',
      ];
    } else if (transaction.paymentType === 'qris') {
      return [
        'Pembayaran via QRIS',
        '',
        '1. Buka aplikasi e-wallet atau mobile banking Anda',
        '2. Pilih menu Scan QR / QRIS',
        '3. Scan kode QR yang ditampilkan',
        `4. Pastikan jumlah: Rp ${transaction.grossAmount.toLocaleString('id-ID')}`,
        '5. Konfirmasi pembayaran',
        '',
        `Batas waktu: ${transaction.expiryTime.toLocaleString('id-ID')}`,
      ];
    } else if (transaction.paymentType === 'gopay') {
      return [
        'Pembayaran via GoPay',
        '',
        '1. Buka aplikasi Gojek',
        '2. Scan kode QR atau klik link pembayaran',
        `3. Pastikan jumlah: Rp ${transaction.grossAmount.toLocaleString('id-ID')}`,
        '4. Konfirmasi dengan PIN GoPay',
        '',
        `Batas waktu: ${transaction.expiryTime.toLocaleString('id-ID')}`,
      ];
    } else if (transaction.paymentType === 'shopeepay') {
      return [
        'Pembayaran via ShopeePay',
        '',
        '1. Buka aplikasi Shopee',
        '2. Scan kode QR atau klik link pembayaran',
        `3. Pastikan jumlah: Rp ${transaction.grossAmount.toLocaleString('id-ID')}`,
        '4. Konfirmasi dengan PIN ShopeePay',
        '',
        `Batas waktu: ${transaction.expiryTime.toLocaleString('id-ID')}`,
      ];
    }

    return ['Metode pembayaran tidak dikenal'];
  }
}

export const midtransService = new MockMidtransService();
