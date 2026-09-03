import { FormEvent, KeyboardEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Send, Trash2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
}

const suggestions = [
  'Berapa total omzet, kas diterima, dan piutang saat ini?',
  'Bahan baku apa yang stoknya menipis atau habis?',
  'Order aktif mana yang progres produksinya paling rendah?',
  'Produk apa yang paling banyak terjual dan berapa nilainya?',
];

export default function AiAssistant() {
  const { token } = useAuth();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const chat = useMutation({
    mutationFn: (payload: { question: string; history: ChatMessage[] }) => api.aiAssistant.chat(token!, payload),
    onSuccess: (data) => {
      setMessages((current) => [...current, { role: 'assistant', content: data.answer, model: data.model }]);
    },
    onError: (error: Error) => toast.error(error.message || 'Gagal mendapatkan jawaban'),
  });

  const submitQuestion = (value: string) => {
    const normalized = value.trim();
    if (!normalized || chat.isPending) return;

    const history = messages.slice(-8).map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, { role: 'user', content: normalized }]);
    setQuestion('');
    chat.mutate({ question: normalized, history });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitQuestion(question);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitQuestion(question);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 pb-6 w-full">
        {/* Header - Square UI Leads style */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Asisten AI Bisnis
              </h1>
              <span className="inline-flex items-center rounded-full bg-linear-to-r from-[#6e3ff3]/15 to-[#df3674]/15 px-2.5 py-0.5 text-[10px] font-semibold text-[#6e3ff3] border border-[#6e3ff3]/20">
                Groq Llama 3
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Analisis cerdas data order, pelanggan, stok, pengeluaran, dan performa konveksi.
            </p>
          </div>
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-border bg-card"
              onClick={() => setMessages([])}
              disabled={chat.isPending}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              Hapus Percakapan
            </Button>
          )}
        </div>

        <Card className="overflow-hidden border-border bg-card rounded-xl shadow-xs">
          <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border/60 p-4">
            <CardTitle className="text-sm font-semibold">Tanya Data Bisnis</CardTitle>
            <span className="text-[11px] text-muted-foreground">Snapshot Real-time</span>
          </CardHeader>

          <CardContent className="p-0">
            <div className="min-h-[420px] space-y-4 p-4 sm:p-6">
              {messages.length === 0 ? (
                <div className="mx-auto flex min-h-[360px] max-w-2xl flex-col justify-center text-center">
                  <div className="size-10 rounded-xl bg-linear-to-b from-[#6e3ff3] to-[#aa8ef9] text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <Sparkles className="size-5" />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">Apa yang ingin Anda ketahui?</h2>
                  <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
                    Jawaban diproses otomatis dari data sistem terbaru. Pilih salah satu contoh pertanyaan di bawah atau ketik langsung.
                  </p>
                  <div className="mt-6 grid gap-2.5 sm:grid-cols-2 text-left">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => submitQuestion(suggestion)}
                        className="rounded-lg border border-border bg-card p-3 text-xs leading-relaxed text-foreground transition-all hover:border-foreground/30 hover:bg-muted/40 cursor-pointer"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mx-auto max-w-3xl space-y-4">
                  {messages.map((message, index) => (
                    <div key={`${message.role}-${index}`} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                      <div className={message.role === 'user'
                        ? 'max-w-[85%] rounded-2xl rounded-br-xs bg-foreground text-background px-4 py-3 text-xs sm:text-sm leading-relaxed'
                        : 'max-w-[92%] rounded-2xl rounded-bl-xs border border-border bg-muted/30 px-4 py-3 text-xs sm:text-sm leading-relaxed text-foreground'}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        {message.model && <p className="mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground">Model: {message.model}</p>}
                      </div>
                    </div>
                  ))}
                  {chat.isPending && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Menganalisis data...
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="border-t border-border/60 bg-muted/10 p-3 sm:p-4">
              <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-xl border border-border bg-card p-2 shadow-xs">
                <Textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={1_000}
                  rows={2}
                  placeholder="Contoh: Tampilkan order yang belum lunas dan paling mendesak"
                  className="min-h-[48px] resize-none border-0 px-2 text-xs sm:text-sm shadow-none focus-visible:ring-0 bg-transparent"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="size-9 shrink-0 bg-foreground text-background hover:bg-foreground/90 font-medium" 
                  disabled={!question.trim() || chat.isPending} 
                  title="Kirim pertanyaan"
                >
                  {chat.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="mx-auto mt-2 max-w-3xl text-center text-[10px] text-muted-foreground">
                Jawaban AI dapat keliru. Verifikasi angka penting pada halaman laporan atau detail order.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
