-- Tambahkan permission menu Asisten AI. Aman dijalankan berulang kali.
DO $$ BEGIN
  ALTER TYPE menu_permission ADD VALUE IF NOT EXISTS 'ai_assistant';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
