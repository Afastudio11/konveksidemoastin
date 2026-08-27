import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, CheckCircle, Clock, FileText } from "lucide-react";
import Header from "@/components/Header";

const API_BASE = "/api";

interface OrderPaymentInfo {
  trackingCode: string;
  totalAmount: string;
  dpAmount: string;
  remainingAmount: string;
  paymentStatus: string;
}

const formatCurrency = (amount: string | number) => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
};

export default function Payment() {
  const { trackingCode: paramTrackingCode } = useParams();
  const { toast } = useToast();
  
  const [trackingCode, setTrackingCode] = useState(paramTrackingCode || "");
  const [isSearching, setIsSearching] = useState(false);
  const [orderInfo, setOrderInfo] = useState<OrderPaymentInfo | null>(null);

  const searchOrder = useCallback(async (code: string) => {
    const requestedCode = code.trim().toUpperCase();
    if (!requestedCode) {
      toast({ title: "Masukkan kode tracking", variant: "destructive" });
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`${API_BASE}/payments/status/${requestedCode}`);
      if (!res.ok) {
        throw new Error("Order tidak ditemukan");
      }
      const data = await res.json();
      setOrderInfo(data.order);
    } catch (error) {
      toast({
        title: "Order tidak ditemukan",
        description: "Pastikan kode tracking sudah benar",
        variant: "destructive",
      });
      setOrderInfo(null);
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  useEffect(() => {
    if (paramTrackingCode) {
      setTrackingCode(paramTrackingCode);
      void searchOrder(paramTrackingCode);
    }
  }, [paramTrackingCode, searchOrder]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
      <Header />

      <main className="container mx-auto px-4 py-12 pt-28">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">PEMBAYARAN</h1>
            <p className="text-blue-200">Cek status pembayaran pesanan Anda</p>
          </div>

          {!orderInfo ? (
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  Cari Pesanan
                </CardTitle>
                <CardDescription>
                  Masukkan kode tracking untuk melihat status pembayaran
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Masukkan kode tracking (contoh: TRK-ABC123)"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && searchOrder(trackingCode)}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => searchOrder(trackingCode)}
                    disabled={isSearching}
                    className="bg-[#CCFF00] text-blue-900 hover:bg-[#b8e600]"
                  >
                    {isSearching ? "Mencari..." : "Cari"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card className="bg-white/95 backdrop-blur">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Order #{orderInfo.trackingCode}</CardTitle>
                      <CardDescription>
                        {orderInfo.paymentStatus === "paid" ? (
                          <span className="text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Lunas
                          </span>
                        ) : (
                          <span className="text-yellow-600 font-medium flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Menunggu Pembayaran
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOrderInfo(null);
                        setTrackingCode("");
                      }}
                    >
                      Ganti Order
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Total</p>
                      <p className="font-semibold text-lg">{formatCurrency(orderInfo.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Terbayar</p>
                      <p className="font-semibold text-lg text-green-600">{formatCurrency(orderInfo.dpAmount || "0")}</p>
                    </div>
                    {Number(orderInfo.remainingAmount) > 0 && (
                      <div className="col-span-2 p-3 bg-yellow-50 rounded-lg">
                        <p className="text-gray-500 text-sm">Sisa Pembayaran</p>
                        <p className="font-bold text-xl text-yellow-700">{formatCurrency(orderInfo.remainingAmount)}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link to={`/track/${orderInfo.trackingCode}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        Lacak Pesanan
                      </Button>
                    </Link>
                    <a 
                      href={`${API_BASE}/invoice/public/${orderInfo.trackingCode}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full">
                        <FileText className="mr-2 h-4 w-4" />
                        Download Invoice
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>

              {orderInfo.paymentStatus !== "paid" && Number(orderInfo.remainingAmount) > 0 && (
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-6 text-center">
                    <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-yellow-800 mb-2">Menunggu Pembayaran</h3>
                    <p className="text-yellow-600 mb-4">Silakan hubungi admin untuk melakukan pembayaran.</p>
                    <a 
                      href="https://wa.me/6285754777068" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <Button className="bg-green-600 hover:bg-green-700 text-white">
                        Hubungi Admin via WhatsApp
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              )}

              {orderInfo.paymentStatus === "paid" && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-green-800 mb-2">Pembayaran Lunas</h3>
                    <p className="text-green-600">Terima kasih! Pesanan Anda sedang dalam proses produksi.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
