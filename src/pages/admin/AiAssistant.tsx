import { FormEvent, KeyboardEvent, useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowUp, Loader2, RotateCcw, User, Copy, Check, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
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
  'Bahan baku apa saja yang stoknya menipis atau habis?',
  'Order mana yang progres produksinya paling rendah & mendesak?',
  'Produk apa yang paling banyak terjual dan berapa nilainya?',
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Disalin ke clipboard');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
      title="Salin jawaban"
    >
      {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
    </button>
  );
}

export default function AiAssistant() {
  const { token } = useAuth();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, messages.length]);

  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
    }
  };

  const chat = useMutation({
    mutationFn: (payload: { question: string; history: ChatMessage[] }) =>
      api.aiAssistant.chat(token!, payload),
    onSuccess: (data) => {
      setMessages((current) => [...current, { role: 'assistant', content: data.answer, model: data.model }]);
    },
    onError: (error: Error) => toast.error(error.message || 'Gagal mendapatkan jawaban AI'),
  });

  const submitQuestion = (value: string) => {
    const normalized = value.trim();
    if (!normalized || chat.isPending) return;

    const history = messages.slice(-8).map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, { role: 'user', content: normalized }]);
    setQuestion('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
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

  const handleNewChat = () => {
    setMessages([]);
    setQuestion('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.focus();
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-57px)] w-full bg-background">
        {/* ChatGPT Header Bar */}
        <div className="shrink-0 h-12 border-b border-border/50 px-4 flex items-center justify-between bg-card/50 backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-foreground">
              Asisten AI Bisnis
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-medium border border-emerald-500/20">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Aktif
            </span>
          </div>

          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewChat}
              disabled={chat.isPending}
              className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
              <span>Chat Baru</span>
            </Button>
          )}
        </div>

        {/* Scrollable Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-6">
          {messages.length === 0 ? (
            /* Empty State (ChatGPT Landing) */
            <div className="flex flex-col items-center justify-center min-h-full py-12">
              <div className="max-w-2xl w-full text-center">
                <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-card border border-border/80 shadow-2xs mb-4 p-1.5">
                  <img src="/ouruniform-logo.png" alt="ouruniform.id" className="size-full rounded-xl object-contain" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
                  Ada yang bisa saya bantu tentang data bisnismu?
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mb-8 max-w-md mx-auto">
                  Analisis otomatis data order, kas, stok bahan baku, dan pengeluaran produksi secara real-time.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left max-w-xl mx-auto">
                  {suggestions.map((text) => (
                    <button
                      key={text}
                      type="button"
                      onClick={() => submitQuestion(text)}
                      className="group flex items-center justify-between rounded-xl border border-border/80 bg-card hover:bg-muted/40 p-3.5 text-xs sm:text-[13px] leading-relaxed text-foreground transition-all hover:border-foreground/25 cursor-pointer shadow-2xs"
                    >
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                        {text}
                      </span>
                      <ArrowRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Chat Messages List */
            <div className="max-w-3xl mx-auto w-full py-6 space-y-6">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`}>
                  {message.role === 'user' ? (
                    /* User Bubble - aligned right, clean rounded pill */
                    <div className="flex justify-end pl-12">
                      <div className="rounded-2xl rounded-tr-xs bg-foreground text-background px-4 py-2.5 text-xs sm:text-sm leading-relaxed max-w-xl shadow-2xs font-normal">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ) : (
                    /* Assistant Output - ChatGPT Full Width Style */
                    <div className="flex gap-3 pr-4 sm:pr-8">
                      <div className="shrink-0 mt-0.5">
                        <div className="size-7 rounded-lg bg-card border border-border/80 flex items-center justify-center p-1 shadow-2xs">
                          <img src="/ouruniform-logo.png" alt="ouruniform AI" className="size-full rounded-xs object-contain" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 text-xs sm:text-sm leading-relaxed text-foreground">
                        <div className="ai-markdown-content overflow-hidden">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              table: ({ node, ...props }) => (
                                <div className="my-3 overflow-x-auto rounded-lg border border-border bg-card shadow-2xs">
                                  <table className="w-full text-left text-xs border-collapse" {...props} />
                                </div>
                              ),
                              thead: ({ node, ...props }) => (
                                <thead className="bg-muted/70 text-muted-foreground font-semibold border-b border-border text-[11px] uppercase tracking-wider" {...props} />
                              ),
                              th: ({ node, ...props }) => (
                                <th className="px-3.5 py-2.5 whitespace-nowrap font-semibold" {...props} />
                              ),
                              tr: ({ node, ...props }) => (
                                <tr className="border-b border-border/40 hover:bg-muted/30 transition-colors last:border-0" {...props} />
                              ),
                              td: ({ node, children, ...props }) => {
                                const text = String(children).toLowerCase().trim();
                                if (text === 'menipis') {
                                  return (
                                    <td className="px-3.5 py-2.5 whitespace-nowrap" {...props}>
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                        Menipis
                                      </span>
                                    </td>
                                  );
                                }
                                if (text === 'habis') {
                                  return (
                                    <td className="px-3.5 py-2.5 whitespace-nowrap" {...props}>
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                        Habis
                                      </span>
                                    </td>
                                  );
                                }
                                if (text === 'aman') {
                                  return (
                                    <td className="px-3.5 py-2.5 whitespace-nowrap" {...props}>
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                        Aman
                                      </span>
                                    </td>
                                  );
                                }
                                return <td className="px-3.5 py-2.5 whitespace-nowrap" {...props}>{children}</td>;
                              },
                              p: ({ node, ...props }) => (
                                <p className="my-2.5 leading-relaxed text-foreground" {...props} />
                              ),
                              ul: ({ node, ...props }) => (
                                <ul className="list-disc pl-5 my-2 space-y-1 text-foreground" {...props} />
                              ),
                              ol: ({ node, ...props }) => (
                                <ol className="list-decimal pl-5 my-2 space-y-1 text-foreground" {...props} />
                              ),
                              li: ({ node, ...props }) => (
                                <li className="leading-relaxed" {...props} />
                              ),
                              strong: ({ node, ...props }) => (
                                <strong className="font-semibold text-foreground" {...props} />
                              ),
                              h1: ({ node, ...props }) => (
                                <h1 className="text-base sm:text-lg font-bold mt-4 mb-2 text-foreground" {...props} />
                              ),
                              h2: ({ node, ...props }) => (
                                <h2 className="text-sm sm:text-base font-bold mt-3 mb-1.5 text-foreground" {...props} />
                              ),
                              h3: ({ node, ...props }) => (
                                <h3 className="text-xs sm:text-sm font-semibold mt-2.5 mb-1 text-foreground" {...props} />
                              ),
                              blockquote: ({ node, ...props }) => (
                                <blockquote className="border-l-2 border-primary/50 pl-3 my-2 text-muted-foreground italic" {...props} />
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>

                        {/* Action buttons under response */}
                        <div className="flex items-center gap-2 mt-2 pt-1 text-[11px] text-muted-foreground">
                          <CopyButton text={message.content} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming / Loading State */}
              {chat.isPending && (
                <div className="flex gap-3 pr-8">
                  <div className="shrink-0 mt-0.5">
                    <div className="size-7 rounded-lg bg-card border border-border/80 flex items-center justify-center p-1 shadow-2xs">
                      <img src="/ouruniform-logo.png" alt="ouruniform AI" className="size-full rounded-xs object-contain animate-pulse" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1.5">
                    <div className="flex gap-1 items-center">
                      <span className="size-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="size-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="size-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span>Menganalisis data konveksi...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ChatGPT Pinned Bottom Input Bar */}
        <div className="shrink-0 border-t border-border/50 bg-background/80 backdrop-blur-xs p-3 sm:p-4">
          <div className="max-w-3xl mx-auto w-full">
            <form onSubmit={handleSubmit}>
              <div className="relative flex items-end rounded-2xl border border-border bg-card shadow-xs focus-within:border-foreground/30 focus-within:shadow-md transition-all">
                <Textarea
                  ref={inputRef}
                  value={question}
                  onChange={(event) => {
                    setQuestion(event.target.value);
                    adjustTextareaHeight();
                  }}
                  onKeyDown={handleKeyDown}
                  maxLength={1_000}
                  rows={1}
                  placeholder="Tanya data bisnis (contoh: Tampilkan 5 order dengan nilai tertinggi)..."
                  className="min-h-[48px] max-h-[160px] resize-none border-0 bg-transparent pl-4 pr-12 py-3 text-xs sm:text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60"
                />
                <div className="absolute right-2 bottom-2">
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!question.trim() || chat.isPending}
                    className="size-8 rounded-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-20 transition-opacity"
                    title="Kirim pertanyaan"
                  >
                    {chat.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ArrowUp className="size-4" strokeWidth={2.5} />
                    )}
                  </Button>
                </div>
              </div>
            </form>
            <p className="mt-2 text-center text-[10px] text-muted-foreground/60">
              Jawaban AI diolah otomatis dari database internal. Selalu verifikasi data keuangan penting di halaman laporan.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
