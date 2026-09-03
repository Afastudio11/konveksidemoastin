import { FormEvent, KeyboardEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Send, Trash2 } from 'lucide-react';
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
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1>Asisten AI</h1>
            <p className="mt-1 text-sm text-slate-500">Tanyakan data order, pelanggan, stok, pengeluaran, dan performa bisnis.</p>
          </div>
          {messages.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setMessages([])} disabled={chat.isPending}>
              <Trash2 className="h-4 w-4" />Hapus Percakapan
            </Button>
          )}
        </div>

        <Card className="overflow-hidden border-slate-200">
          <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-slate-100 p-4">
            <CardTitle className="text-base font-semibold">Tanya Data Bisnis</CardTitle>
            <span className="text-xs text-slate-400">Didukung Groq</span>
          </CardHeader>

          <CardContent className="p-0">
            <div className="min-h-[430px] space-y-4 p-4 sm:p-6">
              {messages.length === 0 ? (
                <div className="mx-auto flex min-h-[380px] max-w-2xl flex-col justify-center">
                  <h2 className="text-lg font-semibold text-slate-950">Apa yang ingin Anda ketahui?</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">Jawaban dibuat dari snapshot data sistem terbaru. Pilih contoh pertanyaan atau tulis pertanyaan sendiri.</p>
                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => submitQuestion(suggestion)}
                        className="rounded-lg border border-slate-200 bg-white p-3 text-left text-sm leading-5 text-slate-700 transition-colors hover:bg-slate-50"
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
                        ? 'max-w-[85%] rounded-lg bg-slate-950 px-4 py-3 text-sm leading-6 text-white'
                        : 'max-w-[92%] rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700'}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        {message.model && <p className="mt-3 border-t border-slate-200 pt-2 text-[10px] text-slate-400">Model: {message.model}</p>}
                      </div>
                    </div>
                  ))}
                  {chat.isPending && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" />Menganalisis data...
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-slate-50/60 p-3 sm:p-4">
              <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-lg border border-slate-200 bg-white p-2">
                <Textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={1_000}
                  rows={2}
                  placeholder="Contoh: Tampilkan order yang belum lunas dan paling mendesak"
                  className="min-h-[52px] resize-none border-0 px-2 shadow-none focus-visible:ring-0"
                />
                <Button type="submit" size="icon" className="h-10 w-10 shrink-0 bg-slate-950 text-white hover:bg-slate-800" disabled={!question.trim() || chat.isPending} title="Kirim pertanyaan">
                  {chat.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-slate-400">Jawaban AI dapat keliru. Verifikasi angka penting pada halaman laporan atau detail order.</p>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
